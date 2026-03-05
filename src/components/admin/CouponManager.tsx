/**
 * CouponManager — admin UI for creating and managing discount codes.
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Ticket, Loader2, Copy } from "lucide-react";
import { format } from "date-fns";

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_percent: number | null;
  discount_amount: number | null;
  min_order_amount: number;
  max_uses: number | null;
  uses_count: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
}

const CouponManager = () => {
  const qc = useQueryClient();
  const [editCoupon, setEditCoupon] = useState<Partial<Coupon> | null>(null);
  const [discountType, setDiscountType] = useState<"percent" | "amount">("percent");

  const { data: coupons = [], isLoading } = useQuery<Coupon[]>({
    queryKey: ["coupons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Coupon[];
    },
  });

  const upsert = useMutation({
    mutationFn: async (c: Partial<Coupon> & { code: string }) => {
      const payload: Record<string, unknown> = {
        code: c.code.toUpperCase().trim(),
        description: c.description || null,
        discount_percent: discountType === "percent" ? (c.discount_percent ?? null) : null,
        discount_amount: discountType === "amount" ? (c.discount_amount ?? null) : null,
        min_order_amount: c.min_order_amount ?? 0,
        max_uses: c.max_uses || null,
        valid_from: c.valid_from ?? new Date().toISOString(),
        valid_until: c.valid_until || null,
        is_active: c.is_active ?? true,
      };
      if (c.id) {
        const { error } = await supabase.from("coupons").update(payload).eq("id", c.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("coupons").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["coupons"] });
      setEditCoupon(null);
      toast.success("Coupon saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteCoupon = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("coupons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["coupons"] });
      toast.success("Coupon deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const generateCode = () => {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
    setEditCoupon((prev) => ({ ...prev, code }));
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Copied: ${code}`);
  };

  const openNew = () => {
    setDiscountType("percent");
    setEditCoupon({
      code: "",
      description: "",
      discount_percent: 10,
      discount_amount: null,
      min_order_amount: 0,
      max_uses: null,
      valid_from: new Date().toISOString().slice(0, 16),
      valid_until: null,
      is_active: true,
    });
  };

  const openEdit = (c: Coupon) => {
    setDiscountType(c.discount_amount != null ? "amount" : "percent");
    setEditCoupon(c);
  };

  const isCouponValid = (c: Coupon) => {
    if (!c.is_active) return false;
    if (c.max_uses != null && c.uses_count >= c.max_uses) return false;
    if (c.valid_until && new Date(c.valid_until) < new Date()) return false;
    return true;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5 text-primary" />
                Discount Coupons
              </CardTitle>
              <CardDescription>
                Create unique codes customers enter at checkout for a discount.
              </CardDescription>
            </div>
            <Button size="sm" onClick={openNew}>
              <Plus className="h-4 w-4 mr-1" />
              New Coupon
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : coupons.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No coupons yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Uses</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm">{c.code}</span>
                        <button onClick={() => copyCode(c.code)} className="text-muted-foreground hover:text-foreground">
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {c.description && (
                        <p className="text-xs text-muted-foreground">{c.description}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      {c.discount_percent != null
                        ? `${c.discount_percent}%`
                        : c.discount_amount != null
                        ? `${c.discount_amount.toLocaleString()} FCFA`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {c.uses_count}{c.max_uses != null ? ` / ${c.max_uses}` : " / ∞"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {c.valid_until ? format(new Date(c.valid_until), "dd/MM/yy") : "Never"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={isCouponValid(c) ? "default" : "secondary"}>
                        {isCouponValid(c) ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => deleteCoupon.mutate(c.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editCoupon} onOpenChange={(v) => !v && setEditCoupon(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editCoupon?.id ? "Edit Coupon" : "New Coupon"}</DialogTitle>
          </DialogHeader>
          {editCoupon && (
            <div className="space-y-4">
              <div>
                <Label>Coupon Code *</Label>
                <div className="flex gap-2">
                  <Input
                    value={editCoupon.code ?? ""}
                    onChange={(e) => setEditCoupon({ ...editCoupon, code: e.target.value.toUpperCase() })}
                    placeholder="SUMMER20"
                    className="font-mono uppercase"
                  />
                  <Button variant="outline" size="sm" onClick={generateCode} type="button">
                    Generate
                  </Button>
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={editCoupon.description ?? ""}
                  onChange={(e) => setEditCoupon({ ...editCoupon, description: e.target.value })}
                  placeholder="e.g. Summer 2026 sale"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Discount Type</Label>
                  <Select value={discountType} onValueChange={(v) => setDiscountType(v as "percent" | "amount")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">Percentage (%)</SelectItem>
                      <SelectItem value="amount">Fixed (FCFA)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{discountType === "percent" ? "%" : "FCFA"} Off</Label>
                  <Input
                    type="number"
                    min={0}
                    value={discountType === "percent"
                      ? (editCoupon.discount_percent ?? "")
                      : (editCoupon.discount_amount ?? "")}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value) || 0;
                      setEditCoupon(discountType === "percent"
                        ? { ...editCoupon, discount_percent: v, discount_amount: null }
                        : { ...editCoupon, discount_amount: v, discount_percent: null });
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Min Order (FCFA)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={editCoupon.min_order_amount ?? 0}
                    onChange={(e) => setEditCoupon({ ...editCoupon, min_order_amount: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Max Uses (blank = ∞)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={editCoupon.max_uses ?? ""}
                    onChange={(e) => setEditCoupon({ ...editCoupon, max_uses: parseInt(e.target.value) || null })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Valid From</Label>
                  <Input
                    type="datetime-local"
                    value={editCoupon.valid_from?.slice(0, 16) ?? ""}
                    onChange={(e) => setEditCoupon({ ...editCoupon, valid_from: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Valid Until (blank = forever)</Label>
                  <Input
                    type="datetime-local"
                    value={editCoupon.valid_until?.slice(0, 16) ?? ""}
                    onChange={(e) => setEditCoupon({ ...editCoupon, valid_until: e.target.value || null })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={editCoupon.is_active ?? true}
                  onCheckedChange={(v) => setEditCoupon({ ...editCoupon, is_active: v })}
                />
                <Label>Active</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCoupon(null)}>Cancel</Button>
            <Button
              disabled={upsert.isPending || !editCoupon?.code}
              onClick={() => editCoupon?.code && upsert.mutate(editCoupon as Partial<Coupon> & { code: string })}
            >
              {upsert.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CouponManager;
