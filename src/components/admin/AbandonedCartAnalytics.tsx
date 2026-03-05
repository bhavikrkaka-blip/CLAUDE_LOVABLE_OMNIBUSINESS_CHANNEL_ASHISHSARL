import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, TrendingDown, Users, DollarSign } from "lucide-react";

interface AbandonedCartRow {
  session_id: string;
  product_id: string;
  product_name: string | null;
  product_image: string | null;
  quantity: number;
  added_at: string;
  converted: boolean;
  potential_value: number;
}

interface Summary {
  totalAbandoned: number;
  totalSessions: number;
  potentialRevenue: number;
  abandonRate: number;
}

const fmtCFA = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " FCFA";
const fmtDate = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

const AbandonedCartAnalytics = () => {
  const [rows, setRows] = useState<AbandonedCartRow[]>([]);
  const [summary, setSummary] = useState<Summary>({ totalAbandoned: 0, totalSessions: 0, potentialRevenue: 0, abandonRate: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Get cart_events that were NOT converted in last 30 days
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: cartData } = await (supabase as any)
          .from("cart_events")
          .select("session_id, product_id, quantity, added_at, converted, products(name, images, price)")
          .eq("converted", false)
          .gte("added_at", thirtyDaysAgo)
          .order("added_at", { ascending: false })
          .limit(200);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: allSessions } = await (supabase as any)
          .from("cart_events")
          .select("session_id")
          .gte("added_at", thirtyDaysAgo);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: convertedSessions } = await (supabase as any)
          .from("cart_events")
          .select("session_id")
          .eq("converted", true)
          .gte("added_at", thirtyDaysAgo);

        const totalSessions = new Set(allSessions?.map(r => r.session_id) ?? []).size;
        const convertedCount = new Set(convertedSessions?.map(r => r.session_id) ?? []).size;
        const abandonedSessions = totalSessions - convertedCount;
        const abandonRate = totalSessions > 0 ? (abandonedSessions / totalSessions) * 100 : 0;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mappedRows: AbandonedCartRow[] = (cartData ?? []).map((r: any) => ({
          session_id: r.session_id,
          product_id: r.product_id,
          product_name: r.products?.name ?? "Unknown",
          product_image: r.products?.images?.[0] ?? null,
          quantity: r.quantity,
          added_at: r.added_at,
          converted: r.converted,
          potential_value: (r.products?.price ?? 0) * r.quantity,
        }));

        const potentialRevenue = mappedRows.reduce((s, r) => s + r.potential_value, 0);

        setRows(mappedRows);
        setSummary({ totalAbandoned: mappedRows.length, totalSessions, potentialRevenue, abandonRate });
      } catch (err) {
        console.error("Failed to fetch abandoned cart data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Group by product to show top abandoned products
  const byProduct = Object.values(
    rows.reduce((acc, r) => {
      const key = r.product_id;
      if (!acc[key]) acc[key] = { name: r.product_name, image: r.product_image, count: 0, value: 0 };
      acc[key].count += r.quantity;
      acc[key].value += r.potential_value;
      return acc;
    }, {} as Record<string, { name: string | null; image: string | null; count: number; value: number }>)
  ).sort((a, b) => b.count - a.count).slice(0, 10);

  if (loading) {
    return <div className="flex items-center justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 flex items-start gap-3">
          <ShoppingCart className="h-8 w-8 text-orange-500 flex-shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Abandoned Items</p>
            <p className="text-2xl font-bold">{summary.totalAbandoned}</p>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-start gap-3">
          <Users className="h-8 w-8 text-blue-500 flex-shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Total Sessions</p>
            <p className="text-2xl font-bold">{summary.totalSessions}</p>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-start gap-3">
          <TrendingDown className="h-8 w-8 text-red-500 flex-shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Abandon Rate</p>
            <p className="text-2xl font-bold text-red-500">{summary.abandonRate.toFixed(1)}%</p>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-start gap-3">
          <DollarSign className="h-8 w-8 text-green-500 flex-shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Potential Revenue</p>
            <p className="text-xl font-bold">{fmtCFA(summary.potentialRevenue)}</p>
          </div>
        </CardContent></Card>
      </div>

      {/* Top Abandoned Products */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Top Abandoned Products (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {byProduct.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">No abandoned cart data in the last 30 days.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Times Abandoned</TableHead>
                    <TableHead className="text-right">Potential Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {byProduct.map((p, i) => (
                    <TableRow key={i}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {p.image && (
                            <img src={p.image} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
                          )}
                          <span className="font-medium text-sm">{p.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">{p.count}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{fmtCFA(p.value)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Abandoned Carts */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Recent Abandoned Items</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">No abandoned carts found.</p>
          ) : (
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead className="text-right">Added At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.slice(0, 50).map((r, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {r.product_image && (
                            <img src={r.product_image} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                          )}
                          <span className="text-sm font-medium truncate max-w-[200px]">{r.product_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{r.quantity}</TableCell>
                      <TableCell className="text-right">{fmtCFA(r.potential_value)}</TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">{fmtDate(r.added_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AbandonedCartAnalytics;
