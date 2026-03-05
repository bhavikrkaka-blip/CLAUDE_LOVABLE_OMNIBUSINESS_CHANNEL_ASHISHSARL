import { useState } from "react";
import { useProducts } from "@/hooks/useProducts";
import { getProxiedImageUrl } from "@/lib/imageProxy";
import {
  useAllFeaturedProducts,
  useAddFeaturedProduct,
  useRemoveFeaturedProduct,
} from "@/hooks/useFeaturedProducts";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, X, Loader2, Flame, GripVertical, Package } from "lucide-react";

const MAX_FEATURED = 5;

const FeaturedProductsManager = () => {
  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: featuredProducts, isLoading: featuredLoading } = useAllFeaturedProducts("promo_banner");
  const addFeatured = useAddFeaturedProduct();
  const removeFeatured = useRemoveFeaturedProduct();

  const [selectedProductId, setSelectedProductId] = useState<string>("");

  const isLoading = productsLoading || featuredLoading;

  // Products not already featured
  const availableProducts = products?.filter(
    (p) => !featuredProducts?.some((fp) => fp.product_id === p.id)
  );

  const handleAdd = async () => {
    if (!selectedProductId) {
      toast.error("Please select a product");
      return;
    }

    if ((featuredProducts?.length || 0) >= MAX_FEATURED) {
      toast.error(`Maximum ${MAX_FEATURED} products allowed`);
      return;
    }

    try {
      await addFeatured.mutateAsync({
        product_id: selectedProductId,
        placement: "promo_banner",
        display_order: featuredProducts?.length || 0,
      });
      setSelectedProductId("");
      toast.success("Product added to promo banner");
    } catch (error) {
      toast.error("Failed to add product");
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await removeFeatured.mutateAsync(id);
      toast.success("Product removed from promo banner");
    } catch (error) {
      toast.error("Failed to remove product");
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR").format(price) + " FCFA";
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-primary" />
          <CardTitle>Promo Banner Products</CardTitle>
        </div>
        <CardDescription>
          Select up to {MAX_FEATURED} products to showcase in the homepage promo banner.
          These will auto-scroll to highlight your best deals.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Product */}
        <div className="flex gap-2">
          <Select value={selectedProductId} onValueChange={setSelectedProductId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select a product to feature..." />
            </SelectTrigger>
            <SelectContent>
              {availableProducts?.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{product.name}</span>
                    <span className="text-muted-foreground">- {formatPrice(product.price)}</span>
                    {product.original_price && (
                      <Badge variant="destructive" className="text-xs">
                        -{Math.round((1 - product.price / product.original_price) * 100)}%
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleAdd}
            disabled={addFeatured.isPending || (featuredProducts?.length || 0) >= MAX_FEATURED}
          >
            {addFeatured.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </>
            )}
          </Button>
        </div>

        {/* Slots info */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {featuredProducts?.length || 0} of {MAX_FEATURED} slots used
          </span>
          <div className="flex gap-1">
            {Array.from({ length: MAX_FEATURED }).map((_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full ${
                  i < (featuredProducts?.length || 0)
                    ? "bg-primary"
                    : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Featured Products List */}
        <div className="space-y-2">
          {featuredProducts?.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <Package className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No products featured yet</p>
              <p className="text-sm text-muted-foreground">Add products above to display in the promo banner</p>
            </div>
          ) : (
            featuredProducts?.map((fp, index) => (
              <div
                key={fp.id}
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg group"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
                  {index + 1}
                </span>
                {fp.product?.images?.[0] ? (
                  <img
                    src={getProxiedImageUrl(fp.product.images[0])}
                    alt={fp.product.name}
                    className="w-12 h-12 rounded object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                    <Package className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{fp.product?.name}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-primary font-semibold">
                      {formatPrice(fp.product?.price || 0)}
                    </span>
                    {fp.product?.original_price && (
                      <Badge variant="destructive" className="text-xs">
                        -{Math.round((1 - (fp.product.price / fp.product.original_price)) * 100)}% OFF
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemove(fp.id)}
                  disabled={removeFeatured.isPending}
                >
                  <X className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FeaturedProductsManager;
