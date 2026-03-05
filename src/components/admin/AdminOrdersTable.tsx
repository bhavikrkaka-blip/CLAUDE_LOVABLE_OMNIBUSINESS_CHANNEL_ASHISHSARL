import { useState } from "react";
import { useAdminOrders, useUpdateOrderStatus, useUpdatePaymentStatus } from "@/hooks/useAdminOrders";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Truck,
  Eye,
  Package,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import OrderDetailDialog from "@/components/admin/OrderDetailDialog";

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
  updated_at: string;
  shipping_fee?: number;
  coupon_discount?: number;
  order_items?: Array<{
    id: string;
    product_id: string | null;
    product_name: string;
    product_price: number;
    quantity: number;
  }>;
  delivery_zones?: { name: string; estimated_days: string } | null;
  coupons?: { code: string } | null;
  customer_email?: string;
  customer_name?: string;
  customer_phone?: string;
}

const AdminOrdersTable = () => {
  const { data: orders, isLoading } = useAdminOrders();
  const updateStatus = useUpdateOrderStatus();
  const updatePayment = useUpdatePaymentStatus();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR").format(price) + " FCFA";
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      confirmed: "default",
      processing: "default",
      shipped: "outline",
      delivered: "default",
      cancelled: "destructive",
    };
    const labels: Record<string, string> = {
      pending: "Pending",
      confirmed: "Confirmed",
      processing: "Processing",
      shipped: "Shipped",
      delivered: "Delivered",
      cancelled: "Cancelled",
    };
    return <Badge variant={variants[status] || "secondary"}>{labels[status] || status}</Badge>;
  };

  const getPaymentBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      paid: "default",
      failed: "destructive",
    };
    const labels: Record<string, string> = {
      pending: "Pending",
      paid: "Paid",
      failed: "Failed",
    };
    return <Badge variant={variants[status] || "secondary"}>{labels[status] || status}</Badge>;
  };

  const handleStatusUpdate = async (order: Order, newStatus: string, sendEmail = false) => {
    try {
      await updateStatus.mutateAsync({
        orderId: order.id,
        status: newStatus,
        sendEmail,
        customerEmail: order.customer_email,
        customerName: order.customer_name,
        orderTotal: order.total_amount,
      });
      toast.success(`Order ${newStatus}${sendEmail ? " and email sent" : ""}`);
    } catch (error) {
      toast.error("Failed to update order status");
    }
  };

  const handlePaymentUpdate = async (orderId: string, newStatus: string) => {
    try {
      await updatePayment.mutateAsync({
        orderId,
        paymentStatus: newStatus,
      });
      toast.success(`Payment marked as ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update payment status");
    }
  };

  const getPaymentMethodLabel = (method: string | null) => {
    const labels: Record<string, string> = {
      orange_money: "Orange Money",
      mtn_momo: "MTN MoMo",
      cash_on_delivery: "Cash on Delivery",
    };
    return labels[method || ""] || method || "Unknown";
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!orders?.length) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No orders yet</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-background rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders?.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs">
                    {order.id.slice(0, 8)}...
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{order.customer_name || "Guest"}</span>
                      <span className="text-xs text-muted-foreground">{order.shipping_phone}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {order.order_items?.length || 0} items
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatPrice(order.total_amount)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {getPaymentBadge(order.payment_status)}
                      <span className="text-xs text-muted-foreground">
                        {getPaymentMethodLabel(order.payment_method)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(order.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedOrder(order)}
                      title="View order details"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          {updateStatus.isPending || updatePayment.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MoreHorizontal className="h-4 w-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Order Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem onClick={() => setSelectedOrder(order)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-xs">Update Status</DropdownMenuLabel>
                        
                        {order.status === "pending" && (
                          <>
                            <DropdownMenuItem 
                              onClick={() => handleStatusUpdate(order, "confirmed", true)}
                            >
                              <CheckCircle className="h-4 w-4 mr-2 text-primary" />
                              Confirm & Notify
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleStatusUpdate(order, "cancelled", true)}
                              className="text-destructive"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancel & Notify
                            </DropdownMenuItem>
                          </>
                        )}
                        
                        {order.status === "confirmed" && (
                          <>
                            <DropdownMenuItem 
                              onClick={() => handleStatusUpdate(order, "processing", true)}
                            >
                              <Package className="h-4 w-4 mr-2" />
                              Start Processing
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleStatusUpdate(order, "shipped", true)}
                            >
                              <Truck className="h-4 w-4 mr-2" />
                              Mark as Shipped
                            </DropdownMenuItem>
                          </>
                        )}
                        
                        {order.status === "processing" && (
                          <DropdownMenuItem 
                            onClick={() => handleStatusUpdate(order, "shipped", true)}
                          >
                            <Truck className="h-4 w-4 mr-2" />
                            Mark as Shipped
                          </DropdownMenuItem>
                        )}
                        
                        {order.status === "shipped" && (
                          <DropdownMenuItem 
                            onClick={() => handleStatusUpdate(order, "delivered", true)}
                          >
                            <CheckCircle className="h-4 w-4 mr-2 text-primary" />
                            Mark as Delivered
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-xs">Payment</DropdownMenuLabel>
                        
                        {order.payment_status === "pending" && (
                          <DropdownMenuItem 
                            onClick={() => handlePaymentUpdate(order.id, "paid")}
                          >
                            <CheckCircle className="h-4 w-4 mr-2 text-primary" />
                            Confirm Payment
                          </DropdownMenuItem>
                        )}
                        
                        {order.payment_status === "paid" && (
                          <DropdownMenuItem 
                            onClick={() => handlePaymentUpdate(order.id, "pending")}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Revert Payment
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Order Detail Dialog */}
      <OrderDetailDialog
        order={selectedOrder}
        open={!!selectedOrder}
        onOpenChange={(o) => !o && setSelectedOrder(null)}
      />
    </>
  );
};

export default AdminOrdersTable;
