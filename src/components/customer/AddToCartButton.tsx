import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Loader2, Check } from "lucide-react";
import { useAddToCart } from "@/hooks/useCart";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { useTrackClick, useTrackCartAbandonment } from "@/hooks/useAnalytics";
import { trackFBAddToCart } from "@/components/analytics/FacebookPixel";
import CustomerAuthDialog from "./CustomerAuthDialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AddToCartButtonProps {
  productId: string;
  productName: string;
  productPrice?: number;
  inStock?: boolean | null;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showText?: boolean;
}

const AddToCartButton: React.FC<AddToCartButtonProps> = ({
  productId,
  productName,
  productPrice = 0,
  inStock = true,
  variant = "default",
  size = "default",
  className,
  showText = true,
}) => {
  const { user } = useCustomerAuth();
  const addToCart = useAddToCart();
  const trackClick = useTrackClick();
  const trackAbandonment = useTrackCartAbandonment();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const handleClick = async () => {
    // Track the click
    trackClick.mutate({
      elementId: `add-to-cart-${productId}`,
      elementType: "button",
      elementLabel: `Add to Cart: ${productName}`,
    });

    if (!user) {
      setAuthDialogOpen(true);
      return;
    }

    if (!inStock) {
      toast.error("This product is out of stock");
      return;
    }

    try {
      await addToCart.mutateAsync({ productId });
      setJustAdded(true);
      toast.success(`${productName} added to cart`);
      
      // Track cart abandonment (will be marked as converted if order completes)
      trackAbandonment.mutate({ productId, quantity: 1 });
      
      // Track Facebook Add to Cart event
      trackFBAddToCart({
        content_name: productName,
        content_ids: [productId],
        content_type: "product",
        value: productPrice,
      });
      
      setTimeout(() => setJustAdded(false), 2000);
    } catch (error: any) {
      if (error?.message?.includes("not found in database")) {
        toast.error("This product needs to be migrated to the database first. Please contact admin.");
      } else {
        toast.error("Failed to add to cart");
      }
      console.error("Add to cart error:", error);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={cn(className, justAdded && "bg-green-600 hover:bg-green-600")}
        onClick={handleClick}
        disabled={addToCart.isPending || !inStock}
      >
        {addToCart.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : justAdded ? (
          <Check className="h-4 w-4" />
        ) : (
          <ShoppingCart className="h-4 w-4" />
        )}
        {showText && (
          <span className="ml-2">
            {!inStock ? "Out of Stock" : justAdded ? "Added!" : "Add to Cart"}
          </span>
        )}
      </Button>
      <CustomerAuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </>
  );
};

export default AddToCartButton;
