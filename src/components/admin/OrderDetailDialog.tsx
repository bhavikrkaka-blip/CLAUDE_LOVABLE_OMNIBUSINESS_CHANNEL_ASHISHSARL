import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, MapPin, Phone, CreditCard, Tag, Truck, User } from "lucide-react";

interface OrderItem {
  id: string;
  product_id: string | null;
  product_name: string;
  product_price: number;
  quantity: number;
}

interface Order {
  id: string;
  user_id: string | null;
  status: string;
  total_amount: number;
  payment_method: string | null;
  payment_status: string;
  shipping_address: string | null;
  shipping_city: string | null;
  shipping_phone: string | null;
  notes: string | null;
  created_at: string;
  shipping_fee?: number;
  coupon_discount?: number;
  order_items?: OrderItem[];
  // joined
  delivery_zones?: { name: string; estimated_days: string | null } | null;
  coupons?: { code: string } | null;
}

interface OrderDetailDialogProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusColor: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  confirmed: "default",
  processing: "default",
  shipped: "default",
  delivered: "default",
  cancelled: "destructive",
};

const fmtCFA = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " FCFA";
const fmtDate = (d: string) => new Date(d).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });

const OrderDetailDialog = ({ order, open, onOpenChange }: OrderDetailDialogProps) => {
  if (!order) return null;

  const subtotal = (order.order_items ?? []).reduce((s, i) => s + i.product_price * i.quantity, 0);
  const shippingFee = order.shipping_fee ?? 0;
  const couponDiscount = order.coupon_discount ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Order #{order.id.slice(0, 8).toUpperCase()}</span>
            <Badge variant={statusColor[order.status] ?? "outline"} className="ml-2">
              {order.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <Package className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-muted-foreground">Order Date</p>
                <p className="font-medium">{fmtDate(order.created_at)}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CreditCard className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-muted-foreground">Payment</p>
                <p className="font-medium">{order.payment_method?.replace(/_/g, " ") ?? "—"}</p>
                <Badge variant={order.payment_status === "paid" ? "default" : "secondary"} className="text-xs mt-0.5">
                  {order.payment_status}
                </Badge>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-muted-foreground">Delivery Address</p>
                <p className="font-medium">{order.shipping_address ?? "—"}</p>
                <p className="text-muted-foreground">{order.shipping_city ?? ""}</p>
                {order.delivery_zones && (
                  <p className="text-xs text-blue-600 mt-0.5">
                    Zone: {order.delivery_zones.name} • {order.delivery_zones.estimated_days}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Phone className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-muted-foreground">Contact Phone</p>
                <p className="font-medium">{order.shipping_phone ?? "—"}</p>
              </div>
            </div>
            {order.user_id === null && (
              <div className="flex items-start gap-2 col-span-2">
                <User className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-muted-foreground">Guest Order</p>
                  <Badge variant="outline">Guest</Badge>
                </div>
              </div>
            )}
          </div>

          {order.notes && (
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <p className="text-muted-foreground font-medium mb-1">Notes</p>
              <p>{order.notes}</p>
            </div>
          )}

          <Separator />

          {/* Items */}
          <div>
            <h3 className="font-semibold mb-3">Order Items</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(order.order_items ?? []).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.product_name}</TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    <TableCell className="text-right">{fmtCFA(item.product_price)}</TableCell>
                    <TableCell className="text-right font-medium">{fmtCFA(item.product_price * item.quantity)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <Separator />

          {/* Totals */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{fmtCFA(subtotal)}</span>
            </div>
            {shippingFee > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Truck className="h-3.5 w-3.5" /> Shipping
                </span>
                <span>{fmtCFA(shippingFee)}</span>
              </div>
            )}
            {couponDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <span className="flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5" />
                  {order.coupons?.code ? `Coupon: ${order.coupons.code}` : "Discount"}
                </span>
                <span>-{fmtCFA(couponDiscount)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">{fmtCFA(order.total_amount)}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailDialog;
