import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Printer, BarChart3 } from "lucide-react";
import { format } from "date-fns";

interface ZReportData {
  date: string;
  storeName: string;
  storeId: string;
  openingTime: string;
  closingTime: string;
  totalSales: number;
  totalProfit: number;
  totalTransactions: number;
  unitsSold: number;
  avgTransaction: number;
  cashSales: number;
  cardSales: number;
  mobileSales: number;
  topProducts: { name: string; qty: number; revenue: number }[];
  categoryBreakdown: { category: string; revenue: number; count: number }[];
}

const fmtCFA = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " FCFA";

const DailyZReport = () => {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
  const [selectedStore, setSelectedStore] = useState("all");
  const [report, setReport] = useState<ZReportData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from("locations").select("id, name").eq("type", "store").then(({ data }) => {
      setStores(data ?? []);
    });
  }, []);

  const generateReport = async () => {
    setLoading(true);
    try {
      // Fetch sales for date
      let q = supabase.from("sales")
        .select("id, total_amount, gross_profit, payment_method, created_at, store_id, locations(name)")
        .eq("sale_date", date)
        .eq("status", "active");
      if (selectedStore !== "all") q = q.eq("store_id", selectedStore);
      const { data: sales } = await q;

      if (!sales || sales.length === 0) {
        setReport({
          date, storeName: selectedStore === "all" ? "All Stores" : (stores.find(s => s.id === selectedStore)?.name ?? ""),
          storeId: selectedStore, openingTime: "—", closingTime: "—",
          totalSales: 0, totalProfit: 0, totalTransactions: 0, unitsSold: 0, avgTransaction: 0,
          cashSales: 0, cardSales: 0, mobileSales: 0, topProducts: [], categoryBreakdown: [],
        });
        return;
      }

      const saleIds = sales.map(s => s.id);
      const { data: items } = await supabase
        .from("sale_items")
        .select("product_id, quantity, selling_price, cost_price, products(name, category)")
        .in("sale_id", saleIds);

      // Compute payment breakdown
      const cashSales = sales.filter(s => s.payment_method === "cash").reduce((s, r) => s + Number(r.total_amount), 0);
      const cardSales = sales.filter(s => s.payment_method === "card").reduce((s, r) => s + Number(r.total_amount), 0);
      const mobileSales = sales.filter(s => ["orange_money", "mtn_money", "mobile_money"].includes(s.payment_method ?? "")).reduce((s, r) => s + Number(r.total_amount), 0);

      const totalSales = sales.reduce((s, r) => s + Number(r.total_amount), 0);
      const totalProfit = sales.reduce((s, r) => s + Number(r.gross_profit), 0);
      const unitsSold = items?.reduce((s, r) => s + r.quantity, 0) ?? 0;

      // Sort times
      const times = sales.map(s => s.created_at).sort();
      const openingTime = times[0] ? format(new Date(times[0]), "HH:mm") : "—";
      const closingTime = times[times.length - 1] ? format(new Date(times[times.length - 1]), "HH:mm") : "—";

      // Top products
      const prodMap = new Map<string, { name: string; qty: number; revenue: number }>();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items?.forEach((r: any) => {
        const cur = prodMap.get(r.product_id) ?? { name: r.products?.name ?? "Unknown", qty: 0, revenue: 0 };
        cur.qty += r.quantity;
        cur.revenue += r.quantity * Number(r.selling_price);
        prodMap.set(r.product_id, cur);
      });
      const topProducts = Array.from(prodMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

      // Category breakdown
      const catMap = new Map<string, { revenue: number; count: number }>();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items?.forEach((r: any) => {
        const cat = r.products?.category ?? "Other";
        const cur = catMap.get(cat) ?? { revenue: 0, count: 0 };
        cur.revenue += r.quantity * Number(r.selling_price);
        cur.count += r.quantity;
        catMap.set(cat, cur);
      });
      const categoryBreakdown = Array.from(catMap.entries()).map(([category, v]) => ({ category, ...v })).sort((a, b) => b.revenue - a.revenue);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const storeName = selectedStore === "all" ? "All Stores" : ((sales[0] as any).locations?.name ?? stores.find(s => s.id === selectedStore)?.name ?? "");

      setReport({
        date, storeName, storeId: selectedStore,
        openingTime, closingTime,
        totalSales, totalProfit, totalTransactions: sales.length, unitsSold,
        avgTransaction: sales.length > 0 ? totalSales / sales.length : 0,
        cashSales, cardSales, mobileSales,
        topProducts, categoryBreakdown,
      });
    } catch (err) {
      console.error("Z-Report error:", err);
    } finally {
      setLoading(false);
    }
  };

  const printReport = () => {
    if (!report) return;
    const html = `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8"/>
<title>Z-Report ${report.date}</title>
<style>
  @page { size: A4; margin: 15mm; }
  body { font-family: Arial, sans-serif; font-size: 12px; color: #000; }
  h1 { font-size: 18px; text-align: center; }
  h2 { font-size: 14px; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-top: 16px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
  th { background: #f5f5f5; padding: 5px; font-size: 11px; text-align: left; border-bottom: 2px solid #333; }
  td { padding: 4px 5px; font-size: 11px; border-bottom: 1px solid #eee; }
  .right { text-align: right; }
  .bold { font-weight: bold; }
  .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 16px; }
  .kpi-box { border: 1px solid #ddd; padding: 8px; border-radius: 4px; text-align: center; }
  .kpi-label { font-size: 10px; color: #666; }
  .kpi-value { font-size: 14px; font-weight: bold; }
</style>
</head><body>
<h1>ASHISH SARL — Rapport Z Journalier</h1>
<div style="text-align:center; font-size:11px; margin-bottom:12px;">
  Magasin: ${report.storeName} | Date: ${report.date} | ${report.openingTime} – ${report.closingTime}
</div>
<div class="kpi-grid">
  <div class="kpi-box"><div class="kpi-label">Ventes Totales</div><div class="kpi-value">${fmtCFA(report.totalSales)}</div></div>
  <div class="kpi-box"><div class="kpi-label">Bénéfice Brut</div><div class="kpi-value">${fmtCFA(report.totalProfit)}</div></div>
  <div class="kpi-box"><div class="kpi-label">Transactions</div><div class="kpi-value">${report.totalTransactions}</div></div>
  <div class="kpi-box"><div class="kpi-label">Unités vendues</div><div class="kpi-value">${report.unitsSold}</div></div>
  <div class="kpi-box"><div class="kpi-label">Panier Moyen</div><div class="kpi-value">${fmtCFA(report.avgTransaction)}</div></div>
  <div class="kpi-box"><div class="kpi-label">Marge</div><div class="kpi-value">${report.totalSales > 0 ? ((report.totalProfit / report.totalSales) * 100).toFixed(1) : 0}%</div></div>
</div>
<h2>Paiements</h2>
<table><tr><td>Espèces</td><td class="right">${fmtCFA(report.cashSales)}</td></tr>
<tr><td>Mobile Money</td><td class="right">${fmtCFA(report.mobileSales)}</td></tr>
<tr><td>Carte</td><td class="right">${fmtCFA(report.cardSales)}</td></tr>
<tr class="bold"><td>Total</td><td class="right">${fmtCFA(report.totalSales)}</td></tr></table>
<h2>Top Produits</h2>
<table><thead><tr><th>Produit</th><th class="right">Qté</th><th class="right">CA</th></tr></thead><tbody>
${report.topProducts.map(p => `<tr><td>${p.name}</td><td class="right">${p.qty}</td><td class="right">${fmtCFA(p.revenue)}</td></tr>`).join("")}
</tbody></table>
<h2>Par Catégorie</h2>
<table><thead><tr><th>Catégorie</th><th class="right">Qté</th><th class="right">CA</th></tr></thead><tbody>
${report.categoryBreakdown.map(c => `<tr><td>${c.category}</td><td class="right">${c.count}</td><td class="right">${fmtCFA(c.revenue)}</td></tr>`).join("")}
</tbody></table>
<div style="text-align:center; font-size:10px; margin-top:20px; border-top:1px solid #ccc; padding-top:8px;">
  Imprimé le ${format(new Date(), "dd/MM/yyyy HH:mm")} | ASHISH SARL
</div>
</body></html>`;
    const win = window.open("", "_blank", "width=800,height=600");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <BarChart3 className="h-5 w-5" /> Daily Z-Report
        </h2>
        {report && (
          <Button variant="outline" onClick={printReport}>
            <Printer className="h-4 w-4 mr-2" /> Print Report
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-[180px]" />
            </div>
            <div className="space-y-1">
              <Label>Store</Label>
              <Select value={selectedStore} onValueChange={setSelectedStore}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Stores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stores</SelectItem>
                  {stores.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={generateReport} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Generate Z-Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {report && (
        <>
          {/* Header Info */}
          <div className="bg-muted/30 rounded-lg p-4 text-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><p className="text-muted-foreground">Store</p><p className="font-semibold">{report.storeName}</p></div>
              <div><p className="text-muted-foreground">Date</p><p className="font-semibold">{report.date}</p></div>
              <div><p className="text-muted-foreground">First Sale</p><p className="font-semibold">{report.openingTime}</p></div>
              <div><p className="text-muted-foreground">Last Sale</p><p className="font-semibold">{report.closingTime}</p></div>
            </div>
          </div>

          {/* KPI Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: "Total Sales", value: fmtCFA(report.totalSales), color: "text-green-600" },
              { label: "Gross Profit", value: fmtCFA(report.totalProfit), color: "text-blue-600" },
              { label: "Transactions", value: String(report.totalTransactions), color: "" },
              { label: "Units Sold", value: String(report.unitsSold), color: "" },
              { label: "Avg Transaction", value: fmtCFA(report.avgTransaction), color: "" },
              { label: "Margin", value: `${report.totalSales > 0 ? ((report.totalProfit / report.totalSales) * 100).toFixed(1) : 0}%`, color: "text-primary" },
            ].map(kpi => (
              <Card key={kpi.label}><CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <p className={`text-lg font-bold ${kpi.color}`}>{kpi.value}</p>
              </CardContent></Card>
            ))}
          </div>

          {/* Payment Breakdown */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Payment Methods</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <p className="text-muted-foreground">Cash</p>
                  <p className="font-bold">{fmtCFA(report.cashSales)}</p>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <p className="text-muted-foreground">Mobile Money</p>
                  <p className="font-bold">{fmtCFA(report.mobileSales)}</p>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <p className="text-muted-foreground">Card</p>
                  <p className="font-bold">{fmtCFA(report.cardSales)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Top Products</CardTitle></CardHeader>
            <CardContent>
              {report.topProducts.length === 0 ? (
                <p className="text-muted-foreground text-sm">No sales data.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.topProducts.map((p, i) => (
                      <TableRow key={i}>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell className="text-right">{p.qty}</TableCell>
                        <TableCell className="text-right">{fmtCFA(p.revenue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Sales by Category</CardTitle></CardHeader>
            <CardContent>
              {report.categoryBreakdown.length === 0 ? (
                <p className="text-muted-foreground text-sm">No sales data.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Units</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.categoryBreakdown.map((c, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{c.category}</TableCell>
                        <TableCell className="text-right">{c.count}</TableCell>
                        <TableCell className="text-right">{fmtCFA(c.revenue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {!report && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Select a date and click Generate Z-Report</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DailyZReport;
