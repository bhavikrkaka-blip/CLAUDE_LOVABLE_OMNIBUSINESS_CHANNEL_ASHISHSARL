import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign, TrendingUp, Package, BarChart3, ShoppingCart,
  AlertTriangle, Archive, Loader2, CalendarIcon, MapPin,
} from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

// ── Types ──────────────────────────────────────────────
interface KPIs {
  periodSales: number;
  periodProfit: number;
  inventoryValue: number;
  periodMargin: number;
  unitsSold: number;
}

interface StorePerformance {
  store_id: string;
  store_name: string;
  total_sales: number;
  total_profit: number;
  margin: number;
}

interface TopProduct {
  product_id: string;
  product_name: string;
  qty_sold: number;
  revenue: number;
  cost: number;
  profit: number;
  margin: number;
}

interface DeadStockItem {
  product_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  cost_price: number;
  location_name: string;
}

interface LowStockItem {
  product_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  reorder_level: number;
  location_name: string;
}

interface StockValueByLocation {
  location_id: string;
  location_name: string;
  location_type: string;
  total_value: number;
  total_items: number;
}

type DatePreset = "today" | "7days" | "30days" | "month" | "custom";

const fmtCFA = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " FCFA";
const fmtNum = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n));

const marginColor = (m: number) =>
  m > 20 ? "text-green-600" : m >= 10 ? "text-yellow-600" : "text-red-600";

const DEAD_STOCK_VALUE_THRESHOLD = 500_000; // FCFA

// ── Component ──────────────────────────────────────────
const AdminERPDashboard = () => {
  const { user } = useAuth();

  // Filters
  const [datePreset, setDatePreset] = useState<DatePreset>("month");
  const [customFrom, setCustomFrom] = useState<Date>();
  const [customTo, setCustomTo] = useState<Date>();
  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
  const [selectedStore, setSelectedStore] = useState("all");

  // Data
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<KPIs>({ periodSales: 0, periodProfit: 0, inventoryValue: 0, periodMargin: 0, unitsSold: 0 });
  const [storePerf, setStorePerf] = useState<StorePerformance[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [deadStock, setDeadStock] = useState<DeadStockItem[]>([]);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [stockByLocation, setStockByLocation] = useState<StockValueByLocation[]>([]);

  const getDateRange = useCallback((): { from: string; to: string } => {
    const today = new Date();
    const todayStr = format(today, "yyyy-MM-dd");
    switch (datePreset) {
      case "today":
        return { from: todayStr, to: todayStr };
      case "7days":
        return { from: format(subDays(today, 6), "yyyy-MM-dd"), to: todayStr };
      case "30days":
        return { from: format(subDays(today, 29), "yyyy-MM-dd"), to: todayStr };
      case "month":
        return { from: format(startOfMonth(today), "yyyy-MM-dd"), to: todayStr };
      case "custom":
        return {
          from: customFrom ? format(customFrom, "yyyy-MM-dd") : todayStr,
          to: customTo ? format(customTo, "yyyy-MM-dd") : todayStr,
        };
      default:
        return { from: format(startOfMonth(today), "yyyy-MM-dd"), to: todayStr };
    }
  }, [datePreset, customFrom, customTo]);

  // Load stores once
  useEffect(() => {
    const loadStores = async () => {
      const { data } = await supabase.from("locations").select("id, name").eq("type", "store");
      setStores(data ?? []);
    };
    loadStores();
  }, []);

  // Refetch on filter change
  useEffect(() => {
    if (datePreset === "custom" && (!customFrom || !customTo)) return;
    fetchAll();
  }, [datePreset, customFrom, customTo, selectedStore]);

  const fetchAll = async () => {
    setLoading(true);
    const range = getDateRange();
    await Promise.all([
      fetchKPIs(range),
      fetchStorePerformance(range),
      fetchTopProducts(range),
      fetchDeadStock(),
      fetchLowStock(),
      fetchStockByLocation(),
    ]);
    setLoading(false);
  };

  const fetchKPIs = async (range: { from: string; to: string }) => {
    let q = supabase.from("sales").select("id, total_amount, gross_profit").gte("sale_date", range.from).lte("sale_date", range.to).eq("status", "active");
    if (selectedStore !== "all") q = q.eq("store_id", selectedStore);
    const { data: salesData } = await q;

    const periodSales = salesData?.reduce((s, r) => s + Number(r.total_amount), 0) ?? 0;
    const periodProfit = salesData?.reduce((s, r) => s + Number(r.gross_profit), 0) ?? 0;

    // Fetch units sold from sale_items for matching sales
    let unitsSold = 0;
    if (salesData?.length) {
      const saleIds = salesData.map(s => s.id);
      const { data: itemsData } = await supabase
        .from("sale_items")
        .select("quantity")
        .in("sale_id", saleIds);
      unitsSold = itemsData?.reduce((s, r) => s + r.quantity, 0) ?? 0;
    }

    const { data: invData } = await supabase
      .from("inventory")
      .select("quantity, products(cost_price)");

    const inventoryValue = invData?.reduce((s, r) => {
      const cost = Number((r as any).products?.cost_price ?? 0);
      return s + r.quantity * cost;
    }, 0) ?? 0;

    const periodMargin = periodSales > 0 ? (periodProfit / periodSales) * 100 : 0;
    setKpis({ periodSales, periodProfit, inventoryValue, periodMargin, unitsSold });
  };

  const fetchStorePerformance = async (range: { from: string; to: string }) => {
    let q2 = supabase.from("sales").select("store_id, total_amount, gross_profit").gte("sale_date", range.from).lte("sale_date", range.to).eq("status", "active");
    if (selectedStore !== "all") q2 = q2.eq("store_id", selectedStore);
    const { data: salesData } = await q2;

    const locMap = new Map(stores.map(l => [l.id, l.name]));
    // Also fetch in case stores haven't loaded yet
    if (stores.length === 0) {
      const { data: locs } = await supabase.from("locations").select("id, name").eq("type", "store");
      locs?.forEach(l => locMap.set(l.id, l.name));
    }

    const grouped = new Map<string, { sales: number; profit: number }>();
    salesData?.forEach(r => {
      const cur = grouped.get(r.store_id) ?? { sales: 0, profit: 0 };
      cur.sales += Number(r.total_amount);
      cur.profit += Number(r.gross_profit);
      grouped.set(r.store_id, cur);
    });

    setStorePerf(
      Array.from(grouped.entries()).map(([id, v]) => ({
        store_id: id,
        store_name: locMap.get(id) ?? id,
        total_sales: v.sales,
        total_profit: v.profit,
        margin: v.sales > 0 ? (v.profit / v.sales) * 100 : 0,
      }))
    );
  };

  const fetchTopProducts = async (range: { from: string; to: string }) => {
    let q3 = supabase.from("sales").select("id").gte("sale_date", range.from).lte("sale_date", range.to).eq("status", "active");
    if (selectedStore !== "all") q3 = q3.eq("store_id", selectedStore);
    const { data: periodSales } = await q3;
    if (!periodSales?.length) { setTopProducts([]); return; }

    const saleIds = periodSales.map(s => s.id);
    const { data: items } = await supabase
      .from("sale_items")
      .select("product_id, quantity, selling_price, cost_price, products(name)")
      .in("sale_id", saleIds);

    const grouped = new Map<string, { name: string; qty: number; revenue: number; cost: number }>();
    items?.forEach(r => {
      const cur = grouped.get(r.product_id) ?? { name: (r as any).products?.name ?? "Unknown", qty: 0, revenue: 0, cost: 0 };
      cur.qty += r.quantity;
      cur.revenue += r.quantity * Number(r.selling_price);
      cur.cost += r.quantity * Number(r.cost_price);
      grouped.set(r.product_id, cur);
    });

    const sorted = Array.from(grouped.entries())
      .map(([id, v]) => {
        const profit = v.revenue - v.cost;
        return {
          product_id: id, product_name: v.name, qty_sold: v.qty,
          revenue: v.revenue, cost: v.cost, profit,
          margin: v.revenue > 0 ? (profit / v.revenue) * 100 : 0,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    setTopProducts(sorted);
  };

  const fetchDeadStock = async () => {
    const thirtyDaysAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");

    const { data: invData } = await supabase
      .from("inventory")
      .select("product_id, quantity, location_id, products(name, sku, cost_price), locations(name)")
      .gt("quantity", 0);

    const { data: recentSales } = await supabase.from("sales").select("id").gte("sale_date", thirtyDaysAgo);

    let soldProductIds = new Set<string>();
    if (recentSales?.length) {
      const saleIds = recentSales.map(s => s.id);
      const { data: saleItems } = await supabase.from("sale_items").select("product_id").in("sale_id", saleIds);
      soldProductIds = new Set(saleItems?.map(i => i.product_id) ?? []);
    }

    setDeadStock(
      invData?.filter(r => !soldProductIds.has(r.product_id)).map(r => ({
        product_id: r.product_id,
        product_name: (r as any).products?.name ?? "Unknown",
        sku: (r as any).products?.sku ?? "",
        quantity: r.quantity,
        cost_price: Number((r as any).products?.cost_price ?? 0),
        location_name: (r as any).locations?.name ?? "Unknown",
      })) ?? []
    );
  };

  const fetchLowStock = async () => {
    const { data } = await supabase
      .from("inventory")
      .select("product_id, quantity, location_id, products(name, sku, reorder_level), locations(name)");

    setLowStock(
      data?.filter(r => r.quantity <= ((r as any).products?.reorder_level ?? 0)).map(r => ({
        product_id: r.product_id,
        product_name: (r as any).products?.name ?? "Unknown",
        sku: (r as any).products?.sku ?? "",
        quantity: r.quantity,
        reorder_level: (r as any).products?.reorder_level ?? 0,
        location_name: (r as any).locations?.name ?? "Unknown",
      })) ?? []
    );
  };

  const fetchStockByLocation = async () => {
    const { data: locs } = await supabase.from("locations").select("id, name, type");
    const { data: invData } = await supabase
      .from("inventory")
      .select("quantity, location_id, products(cost_price)");

    const locMap = new Map(locs?.map(l => [l.id, { name: l.name, type: l.type }]) ?? []);
    const grouped = new Map<string, { value: number; items: number }>();

    invData?.forEach(r => {
      const cost = Number((r as any).products?.cost_price ?? 0);
      const cur = grouped.get(r.location_id) ?? { value: 0, items: 0 };
      cur.value += r.quantity * cost;
      cur.items += r.quantity;
      grouped.set(r.location_id, cur);
    });

    setStockByLocation(
      Array.from(grouped.entries()).map(([id, v]) => ({
        location_id: id,
        location_name: locMap.get(id)?.name ?? id,
        location_type: locMap.get(id)?.type ?? "unknown",
        total_value: v.value,
        total_items: v.items,
      })).sort((a, b) => b.total_value - a.total_value)
    );
  };

  const deadStockValue = deadStock.reduce((s, d) => s + d.quantity * d.cost_price, 0);
  const warnings: string[] = [];
  if (lowStock.length > 10) warnings.push(`⚠️ ${lowStock.length} low stock items need attention`);
  if (deadStockValue > DEAD_STOCK_VALUE_THRESHOLD) warnings.push(`📦 Dead stock value: ${fmtCFA(deadStockValue)} exceeds threshold`);
  if (kpis.periodMargin > 0 && kpis.periodMargin < 15) warnings.push(`📉 Period margin at ${kpis.periodMargin.toFixed(1)}% — below 15% target`);

  

  const dateLabel = () => {
    switch (datePreset) {
      case "today": return "Today";
      case "7days": return "Last 7 Days";
      case "30days": return "Last 30 Days";
      case "month": return "This Month";
      case "custom": return customFrom && customTo ? `${format(customFrom, "dd/MM")} – ${format(customTo, "dd/MM")}` : "Custom";
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">ERP Dashboard</h1>
        {/* Warning Strip */}
        {warnings.length > 0 && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 flex flex-wrap gap-4">
            {warnings.map((w, i) => (
              <span key={i} className="text-sm font-medium text-destructive">{w}</span>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Presets */}
          <div className="flex gap-1 flex-wrap">
            {([
              ["today", "Today"],
              ["7days", "7 Days"],
              ["30days", "30 Days"],
              ["month", "This Month"],
              ["custom", "Custom"],
            ] as [DatePreset, string][]).map(([key, label]) => (
              <Button
                key={key}
                size="sm"
                variant={datePreset === key ? "default" : "outline"}
                onClick={() => setDatePreset(key)}
              >
                {label}
              </Button>
            ))}
          </div>

          {/* Custom Date Pickers */}
          {datePreset === "custom" && (
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("w-[130px] justify-start text-left", !customFrom && "text-muted-foreground")}>
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    {customFrom ? format(customFrom, "dd/MM/yyyy") : "From"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={customFrom} onSelect={setCustomFrom} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
              <span className="text-muted-foreground">–</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("w-[130px] justify-start text-left", !customTo && "text-muted-foreground")}>
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    {customTo ? format(customTo, "dd/MM/yyyy") : "To"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={customTo} onSelect={setCustomTo} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Store Filter */}
          <Select value={selectedStore} onValueChange={setSelectedStore}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="All Stores" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stores</SelectItem>
              {stores.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {loading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <KPICard icon={DollarSign} label={`${dateLabel()} Sales`} value={fmtCFA(kpis.periodSales)} />
          <KPICard icon={TrendingUp} label={`${dateLabel()} Profit`} value={fmtCFA(kpis.periodProfit)} />
          <KPICard icon={ShoppingCart} label={`Units Sold (${dateLabel()})`} value={fmtNum(kpis.unitsSold)} />
          <KPICard icon={Package} label="Inventory Value" value={fmtCFA(kpis.inventoryValue)} />
          <KPICard
            icon={BarChart3}
            label="Period Margin"
            value={`${kpis.periodMargin.toFixed(1)}%`}
            valueColor={marginColor(kpis.periodMargin)}
          />
        </div>

        {/* Store Performance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Store Performance ({dateLabel()})</CardTitle>
          </CardHeader>
          <CardContent>
            {storePerf.length === 0 ? (
              <p className="text-muted-foreground text-sm">No sales data for this period.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Store</TableHead>
                      <TableHead className="text-right">Sales</TableHead>
                      <TableHead className="text-right">Profit</TableHead>
                      <TableHead className="text-right">Margin %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {storePerf.map(s => (
                      <TableRow key={s.store_id}>
                        <TableCell className="font-medium">{s.store_name}</TableCell>
                        <TableCell className="text-right">{fmtNum(s.total_sales)}</TableCell>
                        <TableCell className="text-right">{fmtNum(s.total_profit)}</TableCell>
                        <TableCell className="text-right">
                          <span className={cn("font-medium", marginColor(s.margin))}>{s.margin.toFixed(1)}%</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sales by Store Chart */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Sales by Store ({dateLabel()})</CardTitle>
          </CardHeader>
          <CardContent>
            {storePerf.length === 0 ? (
              <p className="text-muted-foreground text-sm">No sales data for this period.</p>
            ) : (
              <ChartContainer
                config={{
                  sales: { label: "Total Sales", color: "hsl(var(--primary))" },
                }}
                className="h-[300px] w-full"
              >
                <BarChart data={storePerf} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis
                    dataKey="store_name"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => fmtNum(v)}
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    width={80}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => fmtCFA(Number(value))}
                      />
                    }
                  />
                  <Bar
                    dataKey="total_sales"
                    name="sales"
                    fill="var(--color-sales)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Top 10 Products */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Top 10 Products ({dateLabel()})</CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <p className="text-muted-foreground text-sm">No sales data for this period.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                      <TableHead className="text-right">Profit</TableHead>
                      <TableHead className="text-right">Margin %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topProducts.map((p, i) => (
                      <TableRow key={p.product_id}>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell className="font-medium max-w-[200px] truncate">{p.product_name}</TableCell>
                        <TableCell className="text-right">{p.qty_sold}</TableCell>
                        <TableCell className="text-right">{fmtNum(p.revenue)}</TableCell>
                        <TableCell className="text-right">{fmtNum(p.cost)}</TableCell>
                        <TableCell className="text-right font-medium">{fmtNum(p.profit)}</TableCell>
                        <TableCell className="text-right">
                          <span className={cn("font-medium", marginColor(p.margin))}>{p.margin.toFixed(1)}%</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stock Value by Location */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              Stock Value by Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stockByLocation.length === 0 ? (
              <p className="text-muted-foreground text-sm">No inventory data.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Location</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Items</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockByLocation.map(loc => (
                      <TableRow key={loc.location_id}>
                        <TableCell className="font-medium">{loc.location_name}</TableCell>
                        <TableCell>
                          <Badge variant={loc.location_type === "warehouse" ? "secondary" : "outline"}>
                            {loc.location_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{fmtNum(loc.total_items)}</TableCell>
                        <TableCell className="text-right font-medium">{fmtCFA(loc.total_value)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="border-t-2">
                      <TableCell colSpan={2} className="font-bold">Total</TableCell>
                      <TableCell className="text-right font-bold">{fmtNum(stockByLocation.reduce((s, l) => s + l.total_items, 0))}</TableCell>
                      <TableCell className="text-right font-bold">{fmtCFA(stockByLocation.reduce((s, l) => s + l.total_value, 0))}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock & Dead Stock */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Low Stock */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Low Stock ({lowStock.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lowStock.length === 0 ? (
                <p className="text-muted-foreground text-sm">All stock levels are healthy.</p>
              ) : (
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead className="text-right">Stock</TableHead>
                        <TableHead className="text-right">Reorder</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lowStock.map((item, i) => (
                        <TableRow key={`low-${item.product_id}-${i}`}>
                          <TableCell>
                            <div className="font-medium text-sm">{item.product_name}</div>
                            <div className="text-xs text-muted-foreground">{item.sku}</div>
                          </TableCell>
                          <TableCell className="text-sm">{item.location_name}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={item.quantity === 0 ? "destructive" : "secondary"}>{item.quantity}</Badge>
                          </TableCell>
                          <TableCell className="text-right text-sm">{item.reorder_level}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dead Stock */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Archive className="h-5 w-5 text-destructive" />
                Dead Stock ({deadStock.length}) — {fmtCFA(deadStockValue)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {deadStock.length === 0 ? (
                <p className="text-muted-foreground text-sm">No dead stock detected.</p>
              ) : (
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deadStock.map((item, i) => (
                        <TableRow key={`dead-${item.product_id}-${i}`}>
                          <TableCell>
                            <div className="font-medium text-sm">{item.product_name}</div>
                            <div className="text-xs text-muted-foreground">{item.sku}</div>
                          </TableCell>
                          <TableCell className="text-sm">{item.location_name}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right text-sm">{fmtCFA(item.quantity * item.cost_price)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
    </div>
  );
};

const KPICard = ({ icon: Icon, label, value, valueColor }: { icon: any; label: string; value: string; valueColor?: string }) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className={cn("text-lg font-bold", valueColor)}>{value}</p>
    </CardContent>
  </Card>
);

export default AdminERPDashboard;
