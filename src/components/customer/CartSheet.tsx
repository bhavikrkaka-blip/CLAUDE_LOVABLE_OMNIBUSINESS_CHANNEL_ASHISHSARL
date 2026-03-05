import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Plus, Minus, Trash2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useCart, useCartTotal, useUpdateCartQuantity, useRemoveFromCart } from "@/hooks/useCart";
import { getProxiedImageUrl } from "@/lib/imageProxy";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import CustomerAuthDialog from "./CustomerAuthDialog";

const CartSheet: React.FC = () => {
  const { user } = useCustomerAuth();
  const { data: cartItems, isLoading } = useCart();
  const { itemCount, total } = useCartTotal();
  const updateQuantity = useUpdateCartQuantity();
  const removeFromCart = useRemoveFromCart();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR").format(price) + " FCFA";
  };

  if (!user) {
    return (
      <>
        <Button variant="ghost" size="icon" className="relative" onClick={() => setAuthDialogOpen(true)}>
          <ShoppingCart className="h-5 w-5" />
        </Button>
        <CustomerAuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
      </>
    );
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {itemCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
              {itemCount > 99 ? "99+" : itemCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>Shopping Cart</SheetTitle>
          <SheetDescription>
            {itemCount === 0
              ? "Your cart is empty"
              : `${itemCount} item${itemCount > 1 ? "s" : ""} in your cart`}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : cartItems?.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Your cart is empty</p>
              <Button asChild className="mt-4">
                <Link to="/products">Browse Products</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems?.map((item) => (
                <div key={item.id} className="flex gap-4 border-b pb-4">
                  <div className="w-20 h-20 rounded bg-muted flex-shrink-0 overflow-hidden">
                    {item.product?.images?.[0] ? (
                      <img
                        src={getProxiedImageUrl(item.product.images[0])}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingCart className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.product?.name}</p>
                    <p className="text-sm text-muted-foreground">{item.product?.brand}</p>
                    <p className="text-sm font-semibold text-primary">
                      {formatPrice(item.product?.price || 0)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity.mutate({ itemId: item.id, quantity: item.quantity - 1 })}
                        disabled={updateQuantity.isPending}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity.mutate({ itemId: item.id, quantity: item.quantity + 1 })}
                        disabled={updateQuantity.isPending}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 ml-auto text-destructive"
                        onClick={() => removeFromCart.mutate(item.id)}
                        disabled={removeFromCart.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cartItems && cartItems.length > 0 && (
          <div className="border-t pt-4 space-y-4">
            <div className="flex items-center justify-between text-lg font-semibold">
              <span>Total</span>
              <span className="text-primary">{formatPrice(total)}</span>
            </div>
            <Button asChild className="w-full">
              <Link to="/checkout">Proceed to Checkout</Link>
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartSheet;
