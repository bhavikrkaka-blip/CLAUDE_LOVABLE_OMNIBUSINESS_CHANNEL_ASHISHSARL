import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DollarSign, TrendingUp, ShoppingCart, Receipt, CalendarIcon, Loader2,
} from "lucide-react";

const fmtCFA = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " FCFA";
const fmtNum = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n));

type DatePreset = "today" | "7days" | "custom";

interface ItemSold {
  product_id: string;
  product_name: string;
  qty: number;
  revenue: number;
  cost: number;
  profit: number;
}

const SalesSummary = () => {
  const [preset, setPreset] = useState<DatePreset>("today");
  const [customFrom, setCustomFrom] = useState<Date>();
  const [customTo, setCustomTo] = useState<Date>();
  const [loading, setLoading] = useState(true);

  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [totalUnits, setTotalUnits] = useState(0);
  const [items, setItems] = useState<ItemSold[]>([]);

  const getRange = useCallback(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    switch (preset) {
      case "today":
        return { from: today, to: today };
      case "7days":
        return { from: format(subDays(new Date(), 6), "yyyy-MM-dd"), to: today };
      case "custom":
        return {
          from: customFrom ? format(customFrom, "yyyy-MM-dd") : today,
          to: customTo ? format(customTo, "yyyy-MM-dd") : today,
        };
    }
  }, [preset, customFrom, customTo]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const range = getRange();

    // Get active sales in range
    const { data: sales } = await supabase
      .from("sales")
      .select("id, total_amount, total_cost, gross_profit")
      .gte("sale_date", range.from)
      .lte("sale_date", range.to)
      .eq("status", "active");

    const rev = sales?.reduce((s, r) => s + Number(r.total_amount), 0) ?? 0;
    const cost = sales?.reduce((s, r) => s + Number(r.total_cost), 0) ?? 0;
    const profit = sales?.reduce((s, r) => s + Number(r.gross_profit), 0) ?? 0;

    setTotalRevenue(rev);
    setTotalCost(cost);
    setTotalProfit(profit);

    if (!sales?.length) {
      setTotalUnits(0);
      setItems([]);
      setLoading(false);
      return;
    }

    const saleIds = sales.map((s) => s.id);
    const { data: saleItems } = await supabase
      .from("sale_items")
      .select("product_id, quantity, selling_price, cost_price, products(name)")
      .in("sale_id", saleIds);

    const units = saleItems?.reduce((s, r) => s + r.quantity, 0) ?? 0;
    setTotalUnits(units);

    // Group by product
    const grouped = new Map<string, ItemSold>();
    saleItems?.forEach((r) => {
      const cur = grouped.get(r.product_id) ?? {
        product_id: r.product_id,
        product_name: (r as any).products?.name ?? "Unknown",
        qty: 0,
        revenue: 0,
        cost: 0,
        profit: 0,
      };
      cur.qty += r.quantity;
      cur.revenue += r.quantity * Number(r.selling_price);
      cur.cost += r.quantity * Number(r.cost_price);
      cur.profit = cur.revenue - cur.cost;
      grouped.set(r.product_id, cur);
    });

    setItems(
      Array.from(grouped.values()).sort((a, b) => b.qty - a.qty)
    );
    setLoading(false);
  }, [getRange]);

  useEffect(() => {
    if (preset === "custom" && (!customFrom || !customTo)) return;
    fetchData();
  }, [preset, customFrom, customTo, fetchData]);

  const presetLabel = () => {
    switch (preset) {
      case "today": return "Today";
      case "7days": return "Last 7 Days";
      case "custom":
        return customFrom && customTo
          ? `${format(customFrom, "dd/MM")} – ${format(customTo, "dd/MM")}`
          : "Custom";
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Sales Summary</h1>

      {/* Date Filter */}
      <div className="flex flex-wrap items-center gap-2">
        {(["today", "7days", "custom"] as DatePreset[]).map((key) => (
          <Button
            key={key}
            size="sm"
            variant={preset === key ? "default" : "outline"}
            onClick={() => setPreset(key)}
          >
            {key === "today" ? "Today" : key === "7days" ? "Last 7 Days" : "Custom"}
          </Button>
        ))}

        {preset === "custom" && (
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn("w-[130px] justify-start text-left", !customFrom && "text-muted-foreground")}
                >
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  {customFrom ? format(customFrom, "dd/MM/yyyy") : "From"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={customFrom}
                  onSelect={setCustomFrom}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            <span className="text-muted-foreground">–</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn("w-[130px] justify-start text-left", !customTo && "text-muted-foreground")}
                >
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  {customTo ? format(customTo, "dd/MM/yyyy") : "To"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={customTo}
                  onSelect={setCustomTo}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        )}

        {loading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard icon={DollarSign} label={`${presetLabel()} Revenue`} value={fmtCFA(totalRevenue)} />
        <KPICard icon={Receipt} label={`${presetLabel()} Cost`} value={fmtCFA(totalCost)} />
        <KPICard
          icon={TrendingUp}
          label={`${presetLabel()} Profit`}
          value={fmtCFA(totalProfit)}
          valueColor={totalProfit > 0 ? "text-green-600" : totalProfit < 0 ? "text-red-600" : undefined}
        />
        <KPICard icon={ShoppingCart} label="Units Sold" value={fmtNum(totalUnits)} />
      </div>

      {/* Items Sold Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Items Sold ({presetLabel()})</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-muted-foreground text-sm">No sales data for this period.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Qty Sold</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Profit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.product_id}>
                      <TableCell className="font-medium text-sm">{item.product_name}</TableCell>
                      <TableCell className="text-right">{fmtNum(item.qty)}</TableCell>
                      <TableCell className="text-right text-sm">{fmtCFA(item.revenue)}</TableCell>
                      <TableCell
                        className={cn(
                          "text-right text-sm font-medium",
                          item.profit > 0 ? "text-green-600" : item.profit < 0 ? "text-red-600" : ""
                        )}
                      >
                        {fmtCFA(item.profit)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Totals row */}
                  <TableRow className="border-t-2 font-bold">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right">{fmtNum(totalUnits)}</TableCell>
                    <TableCell className="text-right">{fmtCFA(totalRevenue)}</TableCell>
                    <TableCell
                      className={cn(
                        "text-right",
                        totalProfit > 0 ? "text-green-600" : totalProfit < 0 ? "text-red-600" : ""
                      )}
                    >
                      {fmtCFA(totalProfit)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
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

export default SalesSummary;
