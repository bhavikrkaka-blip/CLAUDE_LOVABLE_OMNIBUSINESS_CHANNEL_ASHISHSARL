import { useLikedProducts } from "@/hooks/useLikedProducts";
import { getProxiedImageUrl } from "@/lib/imageProxy";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import LikeButton from "@/components/customer/LikeButton";
import AddToCartButton from "@/components/customer/AddToCartButton";

const CustomerFavorites = () => {
  const { data: likedProducts, isLoading } = useLikedProducts();

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

  if (!likedProducts || likedProducts.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No favorites yet</h3>
          <p className="text-muted-foreground mb-6">
            Save products you love by clicking the heart icon
          </p>
          <Button asChild>
            <Link to="/products">Browse Products</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {likedProducts.map((item) => (
        <Card key={item.id} className="overflow-hidden">
          <div className="relative">
            <Link to={`/products/${item.product_id}`}>
              <div className="aspect-square bg-muted">
                {item.product?.images?.[0] ? (
                  <img
                    src={getProxiedImageUrl(item.product.images[0])}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Heart className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
            </Link>
            <LikeButton
              productId={item.product_id}
              className="absolute top-2 right-2 bg-background/80 hover:bg-background"
            />
          </div>
          <CardContent className="p-4">
            <Link to={`/products/${item.product_id}`}>
              <h3 className="font-medium truncate hover:text-primary transition-colors">
                {item.product?.name}
              </h3>
            </Link>
            <p className="text-sm text-muted-foreground">{item.product?.brand}</p>
            <div className="flex items-center justify-between mt-3">
              <div>
                <p className="font-semibold text-primary">
                  {formatPrice(item.product?.price || 0)}
                </p>
                {item.product?.original_price && (
                  <p className="text-xs text-muted-foreground line-through">
                    {formatPrice(item.product.original_price)}
                  </p>
                )}
              </div>
              {item.product?.in_stock === false && (
                <Badge variant="secondary">Out of Stock</Badge>
              )}
            </div>
            <AddToCartButton
              productId={item.product_id}
              productName={item.product?.name || ""}
              inStock={item.product?.in_stock}
              className="w-full mt-3"
              size="sm"
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default CustomerFavorites;
