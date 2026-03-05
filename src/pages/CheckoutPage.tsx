import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCart, useCartTotal, useClearCart } from "@/hooks/useCart";
import { useCreateOrder } from "@/hooks/useOrders";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { useMarkCartConverted, useTrackClick } from "@/hooks/useAnalytics";
import { trackFBPurchase, trackFBInitiateCheckout } from "@/components/analytics/FacebookPixel";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, ShoppingBag, Phone, Tag, CheckCircle, XCircle, Truck } from "lucide-react";
import { toast } from "sonner";

interface DeliveryZone {
  id: string;
  name: string;
  cities: string[];
  base_fee: number;
  estimated_days: string;
}

interface AppliedCoupon {
  id: string;
  code: string;
  description: string | null;
  discount_percent: number | null;
  discount_amount: number | null;
}

const checkoutSchema = z.object({
  guestName: z.string().optional(),
  guestEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  shippingPhone: z.string().min(9, "Phone number is required"),
  shippingAddress: z.string().min(5, "Address is required"),
  shippingCity: z.string().min(2, "City is required"),
  paymentMethod: z.enum(["orange_money", "mtn_money", "cash_on_delivery"]),
  notes: z.string().optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { user, profile } = useCustomerAuth();
  const { data: cartItems, isLoading: isCartLoading } = useCart();
  const { total } = useCartTotal();
  const createOrder = useCreateOrder();
  const clearCart = useClearCart();
  const markConverted = useMarkCartConverted();
  const trackClick = useTrackClick();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [matchedZone, setMatchedZone] = useState<DeliveryZone | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");

  // Computed values
  const shippingFee = matchedZone?.base_fee ?? 0;
  const couponDiscount = (() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discount_percent) {
      return Math.round((total * Number(appliedCoupon.discount_percent)) / 100);
    }
    return appliedCoupon.discount_amount ?? 0;
  })();
  const orderTotal = Math.max(0, total + shippingFee - couponDiscount);

  // Load delivery zones
  useEffect(() => {
    supabase.from("delivery_zones").select("*").eq("is_active", true).then(({ data }) => {
      setDeliveryZones(data ?? []);
    });
  }, []);

  // Match delivery zone when city changes
  const matchZoneForCity = useCallback((city: string) => {
    if (!city.trim() || deliveryZones.length === 0) {
      setMatchedZone(null);
      return;
    }
    const normalised = city.trim().toLowerCase();
    // Try explicit city match first
    const explicit = deliveryZones.find(z =>
      z.cities.some(c => c.toLowerCase() === normalised)
    );
    if (explicit) { setMatchedZone(explicit); return; }
    // Partial match
    const partial = deliveryZones.find(z =>
      z.cities.some(c => normalised.includes(c.toLowerCase()) || c.toLowerCase().includes(normalised))
    );
    if (partial) { setMatchedZone(partial); return; }
    // Fallback zone (empty cities array)
    const fallback = deliveryZones.find(z => z.cities.length === 0);
    setMatchedZone(fallback ?? null);
  }, [deliveryZones]);

  // Track initiate checkout
  useEffect(() => {
    if (cartItems && cartItems.length > 0) {
      trackFBInitiateCheckout({
        content_ids: cartItems.map((item) => item.product_id),
        value: total,
        num_items: cartItems.length,
      });
    }
  }, [cartItems, total]);

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      guestName: "",
      guestEmail: "",
      shippingPhone: profile?.phone || "",
      shippingAddress: profile?.address || "",
      shippingCity: profile?.city || "",
      paymentMethod: "cash_on_delivery",
      notes: "",
    },
  });

  // Watch city for zone matching
  const watchedCity = form.watch("shippingCity");
  useEffect(() => {
    matchZoneForCity(watchedCity || "");
  }, [watchedCity, matchZoneForCity]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError("");
    try {
      const { data, error } = await supabase.rpc("validate_coupon" as any, {
        p_code: couponCode.trim().toUpperCase(),
        p_order_amount: total,
      });
      if (error) throw error;
      if (data && data.length > 0) {
        setAppliedCoupon(data[0] as AppliedCoupon);
        toast.success("Coupon applied!");
      } else {
        setCouponError("Coupon not valid or not applicable to this order");
      }
    } catch (err: any) {
      setCouponError(err.message || "Invalid coupon");
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("fr-FR").format(price) + " FCFA";

  const onSubmit = async (data: CheckoutFormData) => {
    if (!cartItems || cartItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    trackClick.mutate({
      elementId: "place-order-button",
      elementType: "button",
      elementLabel: "Place Order",
    });

    setIsSubmitting(true);
    try {
      const orderItems = cartItems.map((item) => ({
        productId: item.product_id,
        productName: item.product?.name || "Unknown Product",
        productPrice: item.product?.price || 0,
        quantity: item.quantity,
      }));

      const order = await createOrder.mutateAsync({
        items: orderItems,
        shippingAddress: data.shippingAddress,
        shippingCity: data.shippingCity,
        shippingPhone: data.shippingPhone,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        shippingFee,
        deliveryZoneId: matchedZone?.id,
        couponId: appliedCoupon?.id,
        couponDiscount,
        guestName: data.guestName,
        guestEmail: data.guestEmail,
      });

      // Mark cart items as converted
      for (const item of cartItems) {
        markConverted.mutate({ productId: item.product_id, orderId: order?.id || "" });
      }

      trackFBPurchase({
        content_ids: cartItems.map((item) => item.product_id),
        content_type: "product",
        value: orderTotal,
        num_items: cartItems.length,
      });

      await clearCart.mutateAsync();
      toast.success("Order placed successfully!");
      navigate(user ? "/my-account/orders" : "/");
    } catch (error) {
      toast.error("Failed to place order");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCartLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12 text-center">
          <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
          <p className="text-muted-foreground mb-6">Add some products to checkout</p>
          <Button onClick={() => navigate("/products")}>Browse Products</Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                {/* Guest info (only when not logged in) */}
                {!user && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Contact Information</CardTitle>
                      <CardDescription>No account needed — we just need your contact details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField control={form.control} name="guestName" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl><Input placeholder="Your name" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="guestEmail" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email (Optional)</FormLabel>
                          <FormControl><Input type="email" placeholder="your@email.com" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </CardContent>
                  </Card>
                )}

                {/* Shipping Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Shipping Information</CardTitle>
                    <CardDescription>Where should we deliver your order?</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField control={form.control} name="shippingPhone" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl><Input placeholder="+237 6XX XXX XXX" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="shippingAddress" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Delivery Address</FormLabel>
                        <FormControl><Input placeholder="Street, building, apartment" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="shippingCity" render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl><Input placeholder="Douala, Yaoundé, etc." {...field} /></FormControl>
                        <FormMessage />
                        {/* Show matched zone */}
                        {matchedZone && (
                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            <Truck className="h-4 w-4 text-primary" />
                            <span>
                              Zone: <strong>{matchedZone.name}</strong> —{" "}
                              {matchedZone.base_fee === 0 ? "Free delivery" : formatPrice(matchedZone.base_fee)} •{" "}
                              {matchedZone.estimated_days}
                            </span>
                          </div>
                        )}
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="notes" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Order Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Special delivery instructions..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </CardContent>
                </Card>

                {/* Coupon Code */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Tag className="h-5 w-5" />
                      Coupon Code
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {appliedCoupon ? (
                      <div className="flex items-center justify-between bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="font-medium text-green-700 dark:text-green-400">{appliedCoupon.code}</p>
                            {appliedCoupon.description && (
                              <p className="text-xs text-green-600">{appliedCoupon.description}</p>
                            )}
                            <p className="text-xs text-green-600 font-semibold">
                              Saving: {formatPrice(couponDiscount)}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={removeCoupon} className="text-red-500 hover:text-red-600">
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter coupon code"
                            value={couponCode}
                            onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(""); }}
                            className="uppercase"
                            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleApplyCoupon())}
                          />
                          <Button type="button" variant="outline" onClick={handleApplyCoupon} disabled={couponLoading || !couponCode.trim()}>
                            {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                          </Button>
                        </div>
                        {couponError && (
                          <p className="text-sm text-destructive flex items-center gap-1">
                            <XCircle className="h-4 w-4" /> {couponError}
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Payment Method */}
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Method</CardTitle>
                    <CardDescription>Select how you want to pay</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormField control={form.control} name="paymentMethod" render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="space-y-3">
                            <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
                              <RadioGroupItem value="orange_money" id="orange_money" />
                              <Label htmlFor="orange_money" className="flex-1 cursor-pointer">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold">OM</div>
                                  <div>
                                    <p className="font-medium">Orange Money</p>
                                    <p className="text-sm text-muted-foreground">Pay with Orange Money mobile wallet</p>
                                  </div>
                                </div>
                              </Label>
                            </div>
                            <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
                              <RadioGroupItem value="mtn_money" id="mtn_money" />
                              <Label htmlFor="mtn_money" className="flex-1 cursor-pointer">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center text-black font-bold">MM</div>
                                  <div>
                                    <p className="font-medium">MTN Mobile Money</p>
                                    <p className="text-sm text-muted-foreground">Pay with MTN MoMo mobile wallet</p>
                                  </div>
                                </div>
                              </Label>
                            </div>
                            <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
                              <RadioGroupItem value="cash_on_delivery" id="cash_on_delivery" />
                              <Label htmlFor="cash_on_delivery" className="flex-1 cursor-pointer">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                                    <Phone className="h-5 w-5" />
                                  </div>
                                  <div>
                                    <p className="font-medium">Cash on Delivery</p>
                                    <p className="text-sm text-muted-foreground">Pay when you receive your order</p>
                                  </div>
                                </div>
                              </Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </CardContent>
                </Card>

                <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Place Order — {formatPrice(orderTotal)}
                </Button>
              </form>
            </Form>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
                <CardDescription>{cartItems.length} item(s)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-16 h-16 rounded bg-muted flex-shrink-0 overflow-hidden">
                      {item.product?.images?.[0] ? (
                        <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                      ) : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.product?.name}</p>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                      <p className="text-sm font-semibold">{formatPrice((item.product?.price || 0) * item.quantity)}</p>
                    </div>
                  </div>
                ))}

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <Truck className="h-3.5 w-3.5" /> Delivery
                      {matchedZone && <Badge variant="outline" className="text-xs ml-1">{matchedZone.name}</Badge>}
                    </span>
                    <span className={shippingFee === 0 ? "text-green-600" : ""}>
                      {shippingFee === 0 ? (matchedZone ? "Free" : "Enter city") : formatPrice(shippingFee)}
                    </span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span className="flex items-center gap-1">
                        <Tag className="h-3.5 w-3.5" /> {appliedCoupon.code}
                      </span>
                      <span>-{formatPrice(couponDiscount)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">{formatPrice(orderTotal)}</span>
                  </div>
                  {matchedZone && (
                    <p className="text-xs text-muted-foreground text-center">
                      Estimated delivery: {matchedZone.estimated_days}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CheckoutPage;
