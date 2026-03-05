import { useOrders } from "@/hooks/useOrders";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, ShoppingBag } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  processing: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const paymentStatusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  refunded: "bg-gray-100 text-gray-800",
};

const CustomerOrders = () => {
  const { data: orders, isLoading } = useOrders();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR").format(price) + " FCFA";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
          <p className="text-muted-foreground mb-6">
            When you make purchases, they'll appear here
          </p>
          <Button asChild>
            <Link to="/products">Start Shopping</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <Card key={order.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-lg">
                  Order #{order.id.slice(0, 8).toUpperCase()}
                </CardTitle>
                <CardDescription>
                  {format(new Date(order.created_at), "PPP")}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={statusColors[order.status] || ""}>{order.status}</Badge>
                <Badge className={paymentStatusColors[order.payment_status] || ""}>
                  {order.payment_status}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {order.order_items?.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span>{item.product_name}</span>
                    <span className="text-muted-foreground">× {item.quantity}</span>
                  </div>
                  <span className="font-medium">{formatPrice(item.product_price * item.quantity)}</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-3 border-t font-semibold">
                <span>Total</span>
                <span className="text-primary">{formatPrice(order.total_amount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default CustomerOrders;
