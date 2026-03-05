import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Eye, Printer, Pencil, XCircle, Loader2 } from "lucide-react";

interface SaleRow {
  id: string;
  invoice_number: string;
  sale_date: string;
  store_id: string;
  customer_name: string | null;
  total_amount: number;
  total_cost: number;
  gross_profit: number;
  payment_method: string;
  narration: string | null;
  status: string;
  replaced_by_sale_id: string | null;
  created_at: string;
  store_name?: string;
}

interface SaleItem {
  id: string;
  product_id: string;
  quantity: number;
  selling_price: number;
  cost_price: number;
  product_name?: string;
}

const AdminSales = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [sales, setSales] = useState<SaleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<Record<string, string>>({});
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // View dialog
  const [viewSale, setViewSale] = useState<SaleRow | null>(null);
  const [viewItems, setViewItems] = useState<SaleItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // Cancel confirm
  const [cancelSale, setCancelSale] = useState<SaleRow | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchData();
    checkSuperAdmin();
  }, []);

  const checkSuperAdmin = async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "super_admin")
      .maybeSingle();
    setIsSuperAdmin(!!data);
  };

  const fetchData = async () => {
    setLoading(true);
    const [{ data: salesData }, { data: locData }] = await Promise.all([
      supabase.from("sales").select("*").order("sale_date", { ascending: false }).limit(200),
      supabase.from("locations").select("id, name").eq("type", "store"),
    ]);

    const locMap: Record<string, string> = {};
    locData?.forEach((l) => (locMap[l.id] = l.name));
    setLocations(locMap);

    setSales(
      (salesData ?? []).map((s: any) => ({
        ...s,
        store_name: locMap[s.store_id] ?? "—",
      }))
    );
    setLoading(false);
  };

  const openView = async (sale: SaleRow) => {
    setViewSale(sale);
    setLoadingItems(true);
    const { data: items } = await supabase
      .from("sale_items")
      .select("id, product_id, quantity, selling_price, cost_price")
      .eq("sale_id", sale.id);

    if (items && items.length > 0) {
      const productIds = items.map((i) => i.product_id);
      const { data: products } = await supabase
        .from("products")
        .select("id, name")
        .in("id", productIds);
      const nameMap: Record<string, string> = {};
      products?.forEach((p) => (nameMap[p.id] = p.name));
      setViewItems(items.map((i) => ({ ...i, product_name: nameMap[i.product_id] ?? i.product_id })));
    } else {
      setViewItems([]);
    }
    setLoadingItems(false);
  };

  const handlePrint = (sale: SaleRow) => {
    openView(sale);
    setTimeout(() => window.print(), 600);
  };

  const callEditEndpoint = async (action: "cancel" | "prepare_edit", saleId: string) => {
    const { data: session } = await supabase.auth.getSession();
    const token = session?.session?.access_token;
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-sale-edit`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ action, sale_id: saleId }),
      }
    );
    return res.json();
  };

  const handleCancel = async () => {
    if (!cancelSale) return;
    setProcessing(true);
    try {
      const result = await callEditEndpoint("cancel", cancelSale.id);
      if (result.error) throw new Error(result.error);
      toast({ title: "Sale cancelled", description: "Stock has been reversed." });
      setCancelSale(null);
      fetchData();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const handleEdit = async (sale: SaleRow) => {
    setProcessing(true);
    try {
      const result = await callEditEndpoint("prepare_edit", sale.id);
      if (result.error) throw new Error(result.error);
      // Navigate to POS with prefilled data
      navigate("/pos", {
        state: {
          editMode: true,
          oldSaleId: result.old_sale_id,
          storeId: result.store_id,
          customerName: result.customer_name,
          narration: result.narration,
          paymentMethod: result.payment_method,
          items: result.items,
        },
      });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const paymentLabel = (m: string) => {
    const map: Record<string, string> = { cash: "Cash", card: "Card", transfer: "Transfer", mobile_money: "Mobile Money" };
    return map[m] ?? m;
  };

  const statusBadge = (status: string) => {
    if (status === "active") return <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">Active</Badge>;
    if (status === "edited") return <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">Edited</Badge>;
    if (status === "cancelled") return <Badge variant="outline" className="text-destructive border-destructive/30 bg-destructive/10">Cancelled</Badge>;
    return <Badge variant="outline">{status}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Sales History</h1>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
        </Button>
      </div>

      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Store</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : sales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No sales found
                </TableCell>
              </TableRow>
            ) : (
              sales.map((sale) => (
                <TableRow key={sale.id} className={sale.status !== "active" ? "opacity-60" : ""}>
                  <TableCell className="font-mono text-xs">{sale.invoice_number}</TableCell>
                  <TableCell>{sale.sale_date}</TableCell>
                  <TableCell>{sale.store_name}</TableCell>
                  <TableCell className="text-muted-foreground">{sale.customer_name || "—"}</TableCell>
                  <TableCell className="text-right font-medium">
                    {Number(sale.total_amount).toLocaleString()} CFA
                  </TableCell>
                  <TableCell>{paymentLabel(sale.payment_method)}</TableCell>
                  <TableCell>{statusBadge(sale.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openView(sale)} title="View">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handlePrint(sale)} title="Print">
                        <Printer className="h-4 w-4" />
                      </Button>
                      {isSuperAdmin && sale.status === "active" && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(sale)}
                            title="Edit"
                            disabled={processing}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setCancelSale(sale)}
                            title="Cancel"
                            disabled={processing}
                          >
                            <XCircle className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* View Dialog */}
      <Dialog open={!!viewSale} onOpenChange={(o) => !o && setViewSale(null)}>
        <DialogContent className="max-w-lg print:shadow-none">
          <DialogHeader>
            <DialogTitle>Sale Details</DialogTitle>
          </DialogHeader>
          {viewSale && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Invoice:</span> {viewSale.invoice_number}</div>
                <div><span className="text-muted-foreground">Date:</span> {viewSale.sale_date}</div>
                <div><span className="text-muted-foreground">Store:</span> {viewSale.store_name}</div>
                <div><span className="text-muted-foreground">Payment:</span> {paymentLabel(viewSale.payment_method)}</div>
                <div><span className="text-muted-foreground">Status:</span> {statusBadge(viewSale.status)}</div>
                {viewSale.customer_name && (
                  <div className="col-span-2"><span className="text-muted-foreground">Customer:</span> {viewSale.customer_name}</div>
                )}
                {viewSale.narration && (
                  <div className="col-span-2"><span className="text-muted-foreground">Narration:</span> {viewSale.narration}</div>
                )}
              </div>

              {loadingItems ? (
                <div className="text-center py-4"><Loader2 className="h-4 w-4 animate-spin mx-auto" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {viewItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.product_name}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">{Number(item.selling_price).toLocaleString()}</TableCell>
                        <TableCell className="text-right">{(item.quantity * Number(item.selling_price)).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              <div className="border-t pt-2 space-y-1 text-right">
                <div><span className="text-muted-foreground">Total:</span> <span className="font-bold">{Number(viewSale.total_amount).toLocaleString()} CFA</span></div>
                <div><span className="text-muted-foreground">Cost:</span> {Number(viewSale.total_cost).toLocaleString()} CFA</div>
                <div><span className="text-muted-foreground">Profit:</span> <span className="font-medium">{Number(viewSale.gross_profit).toLocaleString()} CFA</span></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation */}
      <AlertDialog open={!!cancelSale} onOpenChange={(o) => !o && setCancelSale(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Sale?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reverse all stock movements for invoice <strong>{cancelSale?.invoice_number}</strong> and mark it as cancelled. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>No, keep it</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} disabled={processing} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {processing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Yes, cancel sale
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminSales;
