import { useAdminStats } from "@/hooks/useAdminOrders";
import { 
  ShoppingCart, 
  Package, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle,
  Eye,
  TrendingUp,
  Truck
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const AdminStats = () => {
  const { data: stats, isLoading } = useAdminStats();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR").format(price) + " FCFA";
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Orders",
      value: stats?.totalOrders || 0,
      icon: ShoppingCart,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Today's Orders",
      value: stats?.todayOrders || 0,
      icon: TrendingUp,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Pending",
      value: stats?.pendingOrders || 0,
      icon: Clock,
      color: "text-muted-foreground",
      bgColor: "bg-muted",
    },
    {
      label: "Confirmed",
      value: stats?.confirmedOrders || 0,
      icon: CheckCircle,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Shipped",
      value: stats?.shippedOrders || 0,
      icon: Truck,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Delivered",
      value: stats?.deliveredOrders || 0,
      icon: Package,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Cancelled",
      value: stats?.cancelledOrders || 0,
      icon: XCircle,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      label: "Total Revenue",
      value: formatPrice(stats?.totalRevenue || 0),
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100",
      isPrice: true,
    },
    {
      label: "Pending Payments",
      value: formatPrice(stats?.pendingPayments || 0),
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
      isPrice: true,
    },
    {
      label: "Total Products",
      value: stats?.totalProducts || 0,
      icon: Package,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      label: "Product Views",
      value: stats?.totalViews || 0,
      icon: Eye,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {statCards.map((stat) => (
        <div key={stat.label} className="bg-background rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
              <p className={`font-bold ${stat.isPrice ? 'text-sm' : 'text-xl'}`}>
                {stat.value}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminStats;
