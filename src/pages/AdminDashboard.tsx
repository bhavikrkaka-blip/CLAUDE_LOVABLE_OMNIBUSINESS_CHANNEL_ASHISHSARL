import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProducts, useDeleteProduct } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LogOut,
  Plus,
  Pencil,
  Trash2,
  Search,
  Package,
  Loader2,
  Home,
  Upload,
  FileSpreadsheet,
  ShoppingCart,
  BarChart3,
  Image,
  Facebook,
  Flame,
  Wand2,
  FileText,
  Truck,
  Tag,
  Ticket,
  ShoppingBag,
  FileBarChart2,
  Users,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import ProductFormDialog from "@/components/admin/ProductFormDialog";
import BulkImportDialog from "@/components/admin/BulkImportDialog";
import AdminStats from "@/components/admin/AdminStats";
import AdminOrdersTable from "@/components/admin/AdminOrdersTable";
import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";
import BannerManager from "@/components/admin/BannerManager";
import FacebookIntegration from "@/components/admin/FacebookIntegration";
import FeaturedProductsManager from "@/components/admin/FeaturedProductsManager";
import BlogManager from "@/components/admin/BlogManager";
import AIImageStudio from "@/components/admin/AIImageStudio";
import DeliveryZoneManager from "@/components/admin/DeliveryZoneManager";
import PromotionScheduler from "@/components/admin/PromotionScheduler";
import CouponManager from "@/components/admin/CouponManager";
import AbandonedCartAnalytics from "@/components/admin/AbandonedCartAnalytics";
import DailyZReport from "@/components/admin/DailyZReport";
import CustomerLookup from "@/components/admin/CustomerLookup";
import type { Product } from "@/hooks/useProducts";
import { products as staticProducts } from "@/data/products";
import { supabase } from "@/integrations/supabase/client";
import { getProxiedImageUrl } from "@/lib/imageProxy";

const AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: products, isLoading } = useProducts();
  const deleteProduct = useDeleteProduct();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [activeTab, setActiveTab] = useState("orders");

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin/login");
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct.mutateAsync(id);
      toast.success("Product deleted successfully");
    } catch (error) {
      toast.error("Failed to delete product");
    }
  };

  const handleMigrateProducts = async () => {
    if (isMigrating) return;
    
    setIsMigrating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error("Not authenticated");
        return;
      }

      const productsToMigrate = staticProducts.map((p) => ({
        name: p.name,
        name_fr: p.name,
        brand: p.brand,
        category: p.category,
        price: p.price,
        description: p.description,
        description_fr: p.description,
        features: p.features || [],
        features_fr: p.features || [],
        images: p.imageUrl ? [p.imageUrl] : [],
        in_stock: p.inStock,
        is_new: false,
      }));

      const response = await supabase.functions.invoke("migrate-products", {
        body: { products: productsToMigrate },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data;
      toast.success(`Migration complete! ${result.inserted} of ${result.total} products migrated.`);
      
      window.location.reload();
    } catch (error) {
      console.error("Migration error:", error);
      toast.error("Failed to migrate products: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setIsMigrating(false);
    }
  };

  const filteredProducts = products?.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR").format(price) + " FCFA";
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <img src="/logo.png" alt="Logo" className="h-10" />
              </Link>
              <div>
                <h1 className="text-xl font-bold">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to="/">
                  <Home className="h-4 w-4 mr-2" />
                  View Site
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="mb-8">
          <AdminStats />
        </div>

        {/* Tabs for Orders, Products, Analytics, Banners, Facebook */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex flex-wrap w-full max-w-4xl h-auto gap-1">
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="banners" className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              Banners
            </TabsTrigger>
            <TabsTrigger value="featured" className="flex items-center gap-2">
              <Flame className="h-4 w-4" />
              Promo Banner
            </TabsTrigger>
            <TabsTrigger value="facebook" className="flex items-center gap-2">
              <Facebook className="h-4 w-4" />
              Facebook
            </TabsTrigger>
            <TabsTrigger value="ai-studio" className="flex items-center gap-2">
              <Wand2 className="h-4 w-4" />
              AI Studio
            </TabsTrigger>
            <TabsTrigger value="blog" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Blog
            </TabsTrigger>
            <TabsTrigger value="delivery" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Delivery Zones
            </TabsTrigger>
            <TabsTrigger value="promotions" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Promotions
            </TabsTrigger>
            <TabsTrigger value="coupons" className="flex items-center gap-2">
              <Ticket className="h-4 w-4" />
              Coupons
            </TabsTrigger>
            <TabsTrigger value="abandoned" className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              Abandoned Carts
            </TabsTrigger>
            <TabsTrigger value="zreport" className="flex items-center gap-2">
              <FileBarChart2 className="h-4 w-4" />
              Z-Report
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Customer Lookup
            </TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Order Management</h2>
            </div>
            <AdminOrdersTable />
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                {products?.length === 0 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" disabled={isMigrating}>
                        {isMigrating ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Migrating...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Import {staticProducts.length} Products
                          </>
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Import Products from Static Data</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will import {staticProducts.length} products from your existing product catalog into the database.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleMigrateProducts}>
                          Import Products
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                <Button variant="outline" onClick={() => setIsBulkImportOpen(true)}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Bulk Import
                </Button>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </div>
            </div>

            {/* Products Table */}
            <div className="bg-background rounded-lg border overflow-hidden">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredProducts?.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No products found</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setIsCreateDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add your first product
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Image</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Brand</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts?.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            {product.images?.[0] ? (
                              <img
                                src={getProxiedImageUrl(product.images[0])}
                                alt={product.name}
                                className="w-12 h-12 object-cover rounded"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                                <Package className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-medium max-w-[200px] truncate">
                            {product.name}
                          </TableCell>
                          <TableCell>{product.brand}</TableCell>
                          <TableCell>{product.category}</TableCell>
                          <TableCell>{formatPrice(product.price)}</TableCell>
                          <TableCell>
                            <Badge variant={product.in_stock ? "default" : "secondary"}>
                              {product.in_stock ? "In Stock" : "Out of Stock"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setEditingProduct(product)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Product</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{product.name}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(product.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <AnalyticsDashboard />
          </TabsContent>

          {/* Banners Tab */}
          <TabsContent value="banners" className="space-y-4">
            <BannerManager />
          </TabsContent>

          {/* Featured/Promo Banner Tab */}
          <TabsContent value="featured" className="space-y-4">
            <FeaturedProductsManager />
          </TabsContent>

          {/* Facebook Tab */}
          <TabsContent value="facebook" className="space-y-4">
            <FacebookIntegration />
          </TabsContent>

          {/* AI Studio Tab */}
          <TabsContent value="ai-studio" className="space-y-4">
            <AIImageStudio />
          </TabsContent>

          {/* Blog Tab */}
          <TabsContent value="blog" className="space-y-4">
            <BlogManager />
          </TabsContent>

          {/* Delivery Zones Tab */}
          <TabsContent value="delivery" className="space-y-4">
            <DeliveryZoneManager />
          </TabsContent>

          {/* Promotions Tab */}
          <TabsContent value="promotions" className="space-y-4">
            <PromotionScheduler />
          </TabsContent>

          {/* Coupons Tab */}
          <TabsContent value="coupons" className="space-y-4">
            <CouponManager />
          </TabsContent>

          {/* Abandoned Carts Tab */}
          <TabsContent value="abandoned" className="space-y-4">
            <AbandonedCartAnalytics />
          </TabsContent>

          {/* Daily Z-Report Tab */}
          <TabsContent value="zreport" className="space-y-4">
            <DailyZReport />
          </TabsContent>

          {/* Customer Lookup Tab */}
          <TabsContent value="customers" className="space-y-4">
            <CustomerLookup onSelect={() => {}} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Create Product Dialog */}
      <ProductFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />

      {/* Edit Product Dialog */}
      <ProductFormDialog
        open={!!editingProduct}
        onOpenChange={(open) => !open && setEditingProduct(null)}
        product={editingProduct || undefined}
      />

      {/* Bulk Import Dialog */}
      <BulkImportDialog
        open={isBulkImportOpen}
        onOpenChange={setIsBulkImportOpen}
      />
    </div>
  );
};

export default AdminDashboard;
