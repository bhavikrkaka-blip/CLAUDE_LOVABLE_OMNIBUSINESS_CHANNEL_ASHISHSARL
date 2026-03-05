/**
 * PromotionScheduler — create and manage time-boxed promotional discounts.
 * Promotions can be store-wide, per-category, or per-product.
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Pencil, Trash2, Tag, Loader2, CalendarRange } from "lucide-react";
import { format, isPast, isFuture, isWithinInterval } from "date-fns";

interface Promotion {
  id: string;
  name: string;
  description: string | null;
  product_ids: string[] | null;
  category: string | null;
  discount_percent: number | null;
  discount_amount: number | null;
  min_order_amount: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

const statusBadge = (promo: Promotion) => {
  if (!promo.is_active) return <Badge variant="secondary">Disabled</Badge>;
  const now = new Date();
  const start = new Date(promo.start_date);
  const end = new Date(promo.end_date);
  if (isFuture(start)) return <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>;
  if (isPast(end)) return <Badge variant="destructive">Expired</Badge>;
  if (isWithinInterval(now, { start, end }))
    return <Badge className="bg-green-100 text-green-800">Live ✓</Badge>;
  return <Badge variant="outline">Unknown</Badge>;
};

const emptyPromo = (): Omit<Promotion, "id" | "created_at"> => ({
  name: "",
  description: null,
  product_ids: null,
  category: null,
  discount_percent: 10,
  discount_amount: null,
  min_order_amount: 0,
  start_date: new Date().toISOString().slice(0, 16),
  end_date: new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 16),
  is_active: true,
});

const PromotionScheduler = () => {
  const qc = useQueryClient();
  const [editPromo, setEditPromo] = useState<Partial<Promotion> | null>(null);
  const [discountType, setDiscountType] = useState<"percent" | "amount">("percent");

  const { data: promos = [], isLoading } = useQuery<Promotion[]>({
    queryKey: ["promotions"],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("promotions")
        .select("*")
        .order("start_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Promotion[];
    },
  });

  const upsert = useMutation({
    mutationFn: async (promo: Partial<Promotion> & { name: string }) => {
      const payload: Record<string, unknown> = {
        name: promo.name,
        description: promo.description || null,
        category: promo.category || null,
        product_ids: null,
        discount_percent: discountType === "percent" ? (promo.discount_percent ?? null) : null,
        discount_amount: discountType === "amount" ? (promo.discount_amount ?? null) : null,
        min_order_amount: promo.min_order_amount ?? 0,
        start_date: promo.start_date,
        end_date: promo.end_date,
        is_active: promo.is_active ?? true,
      };
      if (promo.id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any).from("promotions").update(payload).eq("id", promo.id);
        if (error) throw error;
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any).from("promotions").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["promotions"] });
      setEditPromo(null);
      toast.success("Promotion saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deletePromo = useMutation({
    mutationFn: async (id: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from("promotions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["promotions"] });
      toast.success("Promotion deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openNew = () => {
    const p = emptyPromo();
    setEditPromo(p);
    setDiscountType("percent");
  };

  const openEdit = (p: Promotion) => {
    setEditPromo(p);
    setDiscountType(p.discount_amount != null ? "amount" : "percent");
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarRange className="h-5 w-5 text-primary" />
                Promotion Scheduler
              </CardTitle>
              <CardDescription>
                Create time-limited discounts — store-wide, per category, or per product.
              </CardDescription>
            </div>
            <Button size="sm" onClick={openNew}>
              <Plus className="h-4 w-4 mr-1" />
              New Promotion
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : promos.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No promotions yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {promos.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>
                      {p.discount_percent != null
                        ? `${p.discount_percent}%`
                        : p.discount_amount != null
                        ? `${p.discount_amount.toLocaleString()} FCFA`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {p.category
                        ? <Badge variant="outline">{p.category}</Badge>
                        : <Badge variant="outline">Store-wide</Badge>}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(p.start_date), "dd/MM/yy")} →{" "}
                      {format(new Date(p.end_date), "dd/MM/yy")}
                    </TableCell>
                    <TableCell>{statusBadge(p)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => deletePromo.mutate(p.id)}
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
      <Dialog open={!!editPromo} onOpenChange={(v) => !v && setEditPromo(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              {editPromo?.id ? "Edit Promotion" : "New Promotion"}
            </DialogTitle>
          </DialogHeader>
          {editPromo && (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              <div>
                <Label>Name *</Label>
                <Input
                  value={editPromo.name ?? ""}
                  onChange={(e) => setEditPromo({ ...editPromo, name: e.target.value })}
                  placeholder="e.g. Summer Sale 2026"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={editPromo.description ?? ""}
                  onChange={(e) => setEditPromo({ ...editPromo, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Discount Type</Label>
                  <Select value={discountType} onValueChange={(v) => setDiscountType(v as "percent" | "amount")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">Percentage (%)</SelectItem>
                      <SelectItem value="amount">Fixed Amount (FCFA)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{discountType === "percent" ? "Discount %" : "Discount FCFA"}</Label>
                  <Input
                    type="number"
                    min={0}
                    max={discountType === "percent" ? 100 : undefined}
                    value={discountType === "percent"
                      ? (editPromo.discount_percent ?? "")
                      : (editPromo.discount_amount ?? "")}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value) || 0;
                      setEditPromo(discountType === "percent"
                        ? { ...editPromo, discount_percent: v, discount_amount: null }
                        : { ...editPromo, discount_amount: v, discount_percent: null });
                    }}
                  />
                </div>
              </div>
              <div>
                <Label>Category (leave empty = store-wide)</Label>
                <Input
                  value={editPromo.category ?? ""}
                  onChange={(e) => setEditPromo({ ...editPromo, category: e.target.value || null })}
                  placeholder="e.g. Electronics"
                />
              </div>
              <div>
                <Label>Min Order Amount (FCFA)</Label>
                <Input
                  type="number"
                  min={0}
                  value={editPromo.min_order_amount ?? 0}
                  onChange={(e) => setEditPromo({ ...editPromo, min_order_amount: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="datetime-local"
                    value={editPromo.start_date?.slice(0, 16) ?? ""}
                    onChange={(e) => setEditPromo({ ...editPromo, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="datetime-local"
                    value={editPromo.end_date?.slice(0, 16) ?? ""}
                    onChange={(e) => setEditPromo({ ...editPromo, end_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={editPromo.is_active ?? true}
                  onCheckedChange={(v) => setEditPromo({ ...editPromo, is_active: v })}
                />
                <Label>Active</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPromo(null)}>Cancel</Button>
            <Button
              disabled={upsert.isPending || !editPromo?.name}
              onClick={() => editPromo?.name && upsert.mutate(editPromo as Partial<Promotion> & { name: string })}
            >
              {upsert.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Promotion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PromotionScheduler;
