import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart, Loader2 } from "lucide-react";
import { useToggleLike, useLikedProducts } from "@/hooks/useLikedProducts";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import CustomerAuthDialog from "./CustomerAuthDialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  productId: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

const LikeButton: React.FC<LikeButtonProps> = ({
  productId,
  variant = "ghost",
  size = "icon",
  className,
}) => {
  const { user } = useCustomerAuth();
  const { data: likedProducts } = useLikedProducts();
  const toggleLike = useToggleLike();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  const isLiked = likedProducts?.some((lp) => lp.product_id === productId) ?? false;

  const handleClick = async () => {
    if (!user) {
      setAuthDialogOpen(true);
      return;
    }

    try {
      const result = await toggleLike.mutateAsync(productId);
      toast.success(result.liked ? "Added to favorites" : "Removed from favorites");
    } catch (error) {
      toast.error("Failed to update favorites");
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={cn(className)}
        onClick={handleClick}
        disabled={toggleLike.isPending}
      >
        {toggleLike.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Heart
            className={cn(
              "h-4 w-4 transition-colors",
              isLiked ? "fill-red-500 text-red-500" : ""
            )}
          />
        )}
      </Button>
      <CustomerAuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
    </>
  );
};

export default LikeButton;
