import { useClickAnalytics, useVisitorAnalytics, useProductAnalytics } from "@/hooks/useAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  MousePointer,
  Users,
  Smartphone,
  Monitor,
  Tablet,
  TrendingUp,
  ShoppingCart,
  Eye,
  XCircle,
} from "lucide-react";

const COLORS = ["#dc2626", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899"];

const AnalyticsDashboard = () => {
  const { data: clickData, isLoading: clicksLoading } = useClickAnalytics(30);
  const { data: visitorData, isLoading: visitorsLoading } = useVisitorAnalytics(30);
  const { data: productData, isLoading: productsLoading } = useProductAnalytics();

  const isLoading = clicksLoading || visitorsLoading || productsLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  const sourceChartData = Object.entries(visitorData?.bySource || {}).map(
    ([name, value]) => ({ name, value })
  );

  const deviceChartData = Object.entries(visitorData?.byDevice || {}).map(
    ([name, value]) => ({ name, value })
  );

  const topElementsData = clickData?.topElements.slice(0, 10).map((el: any) => ({
    name: el.element_label || el.element_id,
    clicks: el.count,
    type: el.element_type,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Visitors</p>
                <p className="text-2xl font-bold">{visitorData?.totalVisitors || 0}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Today: {visitorData?.todayVisitors || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <MousePointer className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Clicks</p>
                <p className="text-2xl font-bold">{clickData?.totalClicks || 0}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <Eye className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Product Views</p>
                <p className="text-2xl font-bold">{productData?.totalViews || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100">
                <XCircle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cart Abandonment</p>
                <p className="text-2xl font-bold">{productData?.totalAbandoned || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="clicks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="clicks">Click Heatmap</TabsTrigger>
          <TabsTrigger value="traffic">Traffic Sources</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="products">Product Performance</TabsTrigger>
        </TabsList>

        {/* Click Heatmap */}
        <TabsContent value="clicks">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MousePointer className="h-5 w-5" />
                Most Clicked Elements
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topElementsData.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No click data yet. Clicks will appear here as visitors interact with your site.
                </p>
              ) : (
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topElementsData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={150} />
                      <Tooltip />
                      <Bar dataKey="clicks" fill="#dc2626" radius={4} />
                    </BarChart>
                  </ResponsiveContainer>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {clickData?.topElements.slice(0, 10).map((el: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded flex items-center justify-center text-white font-bold"
                            style={{
                              backgroundColor: COLORS[idx % COLORS.length],
                              opacity: 1 - idx * 0.08,
                            }}
                          >
                            {idx + 1}
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {el.element_label || el.element_id}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {el.element_type}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary">{el.count} clicks</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Traffic Sources */}
        <TabsContent value="traffic">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Traffic Sources
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sourceChartData.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No traffic data yet. Data will appear as visitors arrive.
                </p>
              ) : (
                <div className="flex flex-col lg:flex-row gap-8">
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={sourceChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) =>
                            `${name} (${(percent * 100).toFixed(0)}%)`
                          }
                        >
                          {sourceChartData.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-3">
                    {sourceChartData.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                          />
                          <span className="font-medium capitalize">{item.name}</span>
                        </div>
                        <span className="font-bold">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Devices */}
        <TabsContent value="devices">
          <Card>
            <CardHeader>
              <CardTitle>Device Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { key: "desktop", icon: Monitor, color: "bg-blue-100 text-blue-600" },
                  { key: "mobile", icon: Smartphone, color: "bg-green-100 text-green-600" },
                  { key: "tablet", icon: Tablet, color: "bg-purple-100 text-purple-600" },
                ].map(({ key, icon: Icon, color }) => (
                  <Card key={key}>
                    <CardContent className="p-6 text-center">
                      <div
                        className={`w-16 h-16 rounded-full ${color} flex items-center justify-center mx-auto mb-4`}
                      >
                        <Icon className="h-8 w-8" />
                      </div>
                      <p className="text-3xl font-bold">
                        {visitorData?.byDevice?.[key] || 0}
                      </p>
                      <p className="text-muted-foreground capitalize">{key}</p>
                      <p className="text-sm text-muted-foreground">
                        {visitorData?.totalVisitors
                          ? (
                              ((visitorData.byDevice?.[key] || 0) /
                                visitorData.totalVisitors) *
                              100
                            ).toFixed(1)
                          : 0}
                        %
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="mt-6">
                <h4 className="font-medium mb-4">Browser Distribution</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(visitorData?.byBrowser || {}).map(
                    ([browser, count], idx) => (
                      <div
                        key={browser}
                        className="p-3 border rounded-lg text-center"
                      >
                        <p className="font-bold text-xl">{count as number}</p>
                        <p className="text-sm text-muted-foreground">{browser}</p>
                      </div>
                    )
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Product Performance */}
        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Product Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 border rounded-lg text-center">
                  <p className="text-3xl font-bold text-green-600">
                    {productData?.totalPurchases || 0}
                  </p>
                  <p className="text-muted-foreground">Total Purchases</p>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <p className="text-3xl font-bold text-blue-600">
                    {productData?.totalCartAdds || 0}
                  </p>
                  <p className="text-muted-foreground">Added to Cart</p>
                </div>
                <div className="p-4 border rounded-lg text-center">
                  <p className="text-3xl font-bold text-yellow-600">
                    {productData?.totalAbandoned || 0}
                  </p>
                  <p className="text-muted-foreground">Cart Abandonment</p>
                </div>
              </div>

              {productData?.topViewed && productData.topViewed.length > 0 && (
                <div>
                  <h4 className="font-medium mb-4">Top Viewed Products</h4>
                  <div className="space-y-2">
                    {productData.topViewed.slice(0, 5).map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                            {idx + 1}
                          </span>
                          <span className="text-sm">Product ID: {item.productId}</span>
                        </div>
                        <Badge>{item.views} views</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;
