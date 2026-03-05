import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useProduct, useProducts, Product } from "@/hooks/useProducts";
import { getProxiedImageUrl } from "@/lib/imageProxy";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { useTrackClick } from "@/hooks/useAnalytics";
import { trackFBViewContent } from "@/components/analytics/FacebookPixel";
import { 
  ArrowLeft, 
  Package, 
  Phone, 
  MessageCircle, 
  Check,
  ChevronRight,
  Truck,
  Shield,
  Clock,
  Loader2
} from "lucide-react";
import AddToCartButton from "@/components/customer/AddToCartButton";
import LikeButton from "@/components/customer/LikeButton";

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("fr-FR").format(price) + " FCFA";
};

const categories = [
  { id: "CLIMATISEUR", labelEn: "Air Conditioners", labelFr: "Climatiseurs" },
  { id: "CONGELATEUR", labelEn: "Freezers", labelFr: "Congélateurs" },
  { id: "FRIGO", labelEn: "Refrigerators", labelFr: "Réfrigérateurs" },
  { id: "MACHINE A LAVER", labelEn: "Washing Machines", labelFr: "Machines à laver" },
  { id: "TELEVISEUR", labelEn: "Televisions", labelFr: "Téléviseurs" },
  { id: "VENTILATEUR", labelEn: "Fans", labelFr: "Ventilateurs" },
  { id: "MICRO ONDE", labelEn: "Microwaves", labelFr: "Micro-ondes" },
  { id: "CUISINIERE", labelEn: "Stoves", labelFr: "Cuisinières" },
  { id: "REGULATEUR", labelEn: "Regulators", labelFr: "Régulateurs" },
  { id: "FER A REPASSER", labelEn: "Irons", labelFr: "Fers à repasser" },
  { id: "AIR COOLER", labelEn: "Air Coolers", labelFr: "Refroidisseurs d'air" },
  { id: "DISPENSEUR EAU", labelEn: "Water Dispensers", labelFr: "Distributeurs d'eau" },
  { id: "ROBOT MIXEUR", labelEn: "Blenders", labelFr: "Robots mixeurs" },
  { id: "CHAUFFE-EAU", labelEn: "Water Heaters", labelFr: "Chauffe-eau" },
];

const ProductDetail = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { toast } = useToast();
  const trackClick = useTrackClick();
  
  const { data: product, isLoading, error } = useProduct(productId || "");
  const { data: allProducts } = useProducts();
  
  const [inquiryForm, setInquiryForm] = useState({
    name: "",
    phone: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Track product view and Facebook event
  useEffect(() => {
    if (product && !isLoading) {
      trackFBViewContent({
        content_name: product.name,
        content_ids: [product.id],
        content_type: "product",
        value: product.price,
      });
    }
  }, [product, isLoading]);

  // Helper to get image URL
  const getImageUrl = (prod: Product | undefined) => getProxiedImageUrl(prod?.images?.[0]);
  
  // Helper to get product name based on language
  const getProductName = (prod: Product) => {
    return language === "fr" && prod.name_fr ? prod.name_fr : prod.name;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <div className="container mx-auto px-4 py-16">
            <div className="grid lg:grid-cols-2 gap-8">
              <Skeleton className="aspect-square rounded-2xl" />
              <div className="space-y-4">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product || error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <div className="container mx-auto px-4 py-16 text-center">
            <Package className="w-24 h-24 mx-auto text-muted-foreground/50 mb-6" />
            <h1 className="text-2xl font-bold text-foreground mb-4">
              {language === "fr" ? "Produit non trouvé" : "Product not found"}
            </h1>
            <p className="text-muted-foreground mb-8">
              {language === "fr" 
                ? "Le produit que vous recherchez n'existe pas ou a été supprimé."
                : "The product you're looking for doesn't exist or has been removed."}
            </p>
            <Button onClick={() => navigate("/products")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {language === "fr" ? "Retour au catalogue" : "Back to catalog"}
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Get related products from same brand
  const relatedProducts = allProducts
    ?.filter(p => p.brand === product.brand && p.id !== product.id)
    .slice(0, 4) || [];

  const categoryLabel = categories.find(c => c.id === product.category)?.[language === "fr" ? "labelFr" : "labelEn"] || product.category;
  const imageUrl = getImageUrl(product);
  const productName = getProductName(product);
  const productFeatures = language === "fr" && product.features_fr?.length ? product.features_fr : product.features;

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    await new Promise(resolve => setTimeout(resolve, 1000));

    const message = encodeURIComponent(
      `${language === "fr" ? "Bonjour! Je suis intéressé(e) par" : "Hello! I'm interested in"}:\n\n` +
      `📦 ${productName}\n` +
      `💰 ${formatPrice(product.price)}\n` +
      `📋 ID: ${product.id.slice(0, 8)}\n\n` +
      `${language === "fr" ? "Nom" : "Name"}: ${inquiryForm.name}\n` +
      `${language === "fr" ? "Téléphone" : "Phone"}: ${inquiryForm.phone}\n` +
      `${inquiryForm.message ? `\n${language === "fr" ? "Message" : "Message"}: ${inquiryForm.message}` : ""}`
    );

    window.open(`https://wa.me/237673750693?text=${message}`, "_blank");

    toast({
      title: language === "fr" ? "Demande envoyée!" : "Inquiry sent!",
      description: language === "fr" 
        ? "Nous vous répondrons dans les plus brefs délais."
        : "We'll get back to you as soon as possible.",
    });

    setInquiryForm({ name: "", phone: "", message: "" });
    setIsSubmitting(false);
  };

  const handleDirectWhatsApp = () => {
    const message = encodeURIComponent(
      `${language === "fr" ? "Bonjour! Je suis intéressé(e) par ce produit" : "Hello! I'm interested in this product"}:\n\n` +
      `📦 ${productName}\n` +
      `💰 ${formatPrice(product.price)}\n` +
      `📋 ID: ${product.id.slice(0, 8)}`
    );
    window.open(`https://wa.me/237673750693?text=${message}`, "_blank");
  };

  const handleCall = () => {
    window.location.href = "tel:+237673750693";
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20">
        {/* Breadcrumb */}
        <div className="bg-muted/30 border-b">
          <div className="container mx-auto px-4 py-3">
            <nav className="flex items-center text-sm text-muted-foreground">
              <Link to="/" className="hover:text-primary transition-colors">
                {language === "fr" ? "Accueil" : "Home"}
              </Link>
              <ChevronRight className="w-4 h-4 mx-2" />
              <Link to="/products" className="hover:text-primary transition-colors">
                {language === "fr" ? "Catalogue" : "Catalog"}
              </Link>
              <ChevronRight className="w-4 h-4 mx-2" />
              <span className="text-foreground font-medium truncate max-w-[200px]">
                {productName}
              </span>
            </nav>
          </div>
        </div>

        {/* Product Detail Section */}
        <section className="py-8 md:py-12">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
              {/* Product Image Gallery */}
              <div className="space-y-4">
                {/* Main Image */}
                <div className="aspect-square bg-gradient-to-br from-muted to-muted/50 rounded-2xl overflow-hidden relative">
                  {imageUrl ? (
                    <img 
                      src={imageUrl} 
                      alt={productName}
                      className="w-full h-full object-contain p-4"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`absolute inset-0 flex items-center justify-center ${imageUrl ? 'hidden' : ''}`}>
                    <Package className="w-32 h-32 text-muted-foreground/30" />
                  </div>
                  <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground">
                    {product.brand}
                  </Badge>
                  {product.in_stock && (
                    <Badge className="absolute top-4 right-4 bg-accent text-accent-foreground">
                      <Check className="w-3 h-3 mr-1" />
                      {language === "fr" ? "En stock" : "In stock"}
                    </Badge>
                  )}
                </div>

                {/* Thumbnails - show if multiple images exist */}
                {product.images && product.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-3">
                    {product.images.slice(0, 4).map((img, index) => (
                      <div key={index} className="aspect-square bg-muted rounded-lg cursor-pointer border-2 border-primary/50 hover:border-primary overflow-hidden">
                        <img 
                          src={getProxiedImageUrl(img)} 
                          alt={`${productName} ${index + 1}`}
                          className="w-full h-full object-contain p-2"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="space-y-6">
                {/* Category & Brand */}
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline">{categoryLabel}</Badge>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">{product.brand}</span>
                </div>

                {/* Product Name */}
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">
                  {productName}
                </h1>

                {/* Description */}
                {(language === "fr" ? product.description_fr : product.description) && (
                  <p className="text-muted-foreground">
                    {language === "fr" ? product.description_fr : product.description}
                  </p>
                )}

                {/* Price */}
                <div className="bg-primary/5 rounded-xl p-6 border border-primary/20">
                  <p className="text-sm text-muted-foreground mb-1">
                    {language === "fr" ? "Prix" : "Price"}
                  </p>
                  <div className="flex items-baseline gap-3">
                    <p className="text-3xl md:text-4xl font-bold text-primary">
                      {formatPrice(product.price)}
                    </p>
                    {product.original_price && (
                      <p className="text-lg text-muted-foreground line-through">
                        {formatPrice(product.original_price)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Features */}
                {productFeatures && productFeatures.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-foreground mb-3">
                      {language === "fr" ? "Caractéristiques" : "Features"}
                    </h3>
                    <ul className="space-y-2">
                      {productFeatures.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-muted-foreground">
                          <Check className="w-4 h-4 text-primary shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Trust Badges */}
                <div className="grid grid-cols-3 gap-3 py-4 border-y">
                  <div className="text-center">
                    <Truck className="w-6 h-6 mx-auto text-primary mb-1" />
                    <p className="text-xs text-muted-foreground">
                      {language === "fr" ? "Livraison rapide" : "Fast delivery"}
                    </p>
                  </div>
                  <div className="text-center">
                    <Shield className="w-6 h-6 mx-auto text-primary mb-1" />
                    <p className="text-xs text-muted-foreground">
                      {language === "fr" ? "Garantie" : "Warranty"}
                    </p>
                  </div>
                  <div className="text-center">
                    <Clock className="w-6 h-6 mx-auto text-primary mb-1" />
                    <p className="text-xs text-muted-foreground">
                      {language === "fr" ? "Support 24/7" : "24/7 Support"}
                    </p>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col gap-3">
                  <div className="flex gap-3">
                    <AddToCartButton
                      productId={product.id}
                      productName={productName}
                      productPrice={product.price}
                      inStock={product.in_stock ?? true}
                      className="flex-1"
                      size="lg"
                    />
                    <LikeButton
                      productId={product.id}
                      size="lg"
                      variant="outline"
                      className="px-4"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      size="lg" 
                      className="flex-1 btn-red"
                      onClick={() => {
                        trackClick.mutate({
                          elementId: `whatsapp-order-${product.id}`,
                          elementType: "button",
                          elementLabel: "WhatsApp Order",
                        });
                        handleDirectWhatsApp();
                      }}
                    >
                      <MessageCircle className="w-5 h-5 mr-2" />
                      {language === "fr" ? "Commander via WhatsApp" : "Order via WhatsApp"}
                    </Button>
                    <Button 
                      size="lg" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => {
                        trackClick.mutate({
                          elementId: `call-${product.id}`,
                          elementType: "button",
                          elementLabel: "Call Button",
                        });
                        handleCall();
                      }}
                    >
                      <Phone className="w-5 h-5 mr-2" />
                      {language === "fr" ? "Appeler" : "Call"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Inquiry Form Section */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <Card className="border-2">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">
                    {language === "fr" ? "Demande de renseignements" : "Product Inquiry"}
                  </CardTitle>
                  <p className="text-muted-foreground">
                    {language === "fr" 
                      ? "Remplissez ce formulaire et nous vous contacterons rapidement"
                      : "Fill out this form and we'll get back to you quickly"}
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleInquirySubmit} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">
                          {language === "fr" ? "Votre nom" : "Your name"} *
                        </label>
                        <Input
                          type="text"
                          required
                          value={inquiryForm.name}
                          onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })}
                          placeholder={language === "fr" ? "Jean Dupont" : "John Doe"}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">
                          {language === "fr" ? "Téléphone" : "Phone"} *
                        </label>
                        <Input
                          type="tel"
                          required
                          value={inquiryForm.phone}
                          onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })}
                          placeholder="+237 6XX XXX XXX"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">
                        {language === "fr" ? "Message (optionnel)" : "Message (optional)"}
                      </label>
                      <Textarea
                        value={inquiryForm.message}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
                        placeholder={language === "fr" 
                          ? "Questions ou demandes spéciales..."
                          : "Questions or special requests..."}
                        rows={3}
                      />
                    </div>

                    {/* Product Summary */}
                    <div className="bg-muted/50 rounded-lg p-4 flex items-center gap-4">
                      <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                        {imageUrl ? (
                          <img 
                            src={imageUrl} 
                            alt={productName}
                            className="w-full h-full object-contain p-1"
                          />
                        ) : (
                          <Package className="w-8 h-8 text-muted-foreground/50" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{productName}</p>
                        <p className="text-sm text-muted-foreground">{product.brand}</p>
                      </div>
                      <p className="font-bold text-primary shrink-0">{formatPrice(product.price)}</p>
                    </div>

                    <Button 
                      type="submit" 
                      size="lg" 
                      className="w-full btn-red"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {language === "fr" ? "Envoi en cours..." : "Sending..."}
                        </span>
                      ) : (
                        <>
                          <MessageCircle className="w-5 h-5 mr-2" />
                          {language === "fr" ? "Envoyer la demande" : "Send Inquiry"}
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="py-12">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-foreground">
                  {language === "fr" ? `Autres produits ${product.brand}` : `More from ${product.brand}`}
                </h2>
                <Link to={`/products?brand=${product.brand}`}>
                  <Button variant="ghost" className="text-primary">
                    {language === "fr" ? "Voir tout" : "View all"}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {relatedProducts.map((relatedProduct) => (
                  <Link key={relatedProduct.id} to={`/products/${relatedProduct.id}`}>
                    <Card className="group h-full overflow-hidden hover:border-primary/50 hover:shadow-md transition-all">
                      <div className="aspect-square bg-muted relative overflow-hidden">
                        {relatedProduct.images?.[0] ? (
                          <img 
                            src={getProxiedImageUrl(relatedProduct.images[0])} 
                            alt={getProductName(relatedProduct)}
                            className="w-full h-full object-contain p-2"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`absolute inset-0 flex items-center justify-center ${relatedProduct.images?.[0] ? 'hidden' : ''}`}>
                          <Package className="w-12 h-12 text-muted-foreground/30" />
                        </div>
                      </div>
                      <CardContent className="p-3">
                        <h3 className="font-medium text-sm text-foreground line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                          {getProductName(relatedProduct)}
                        </h3>
                        <p className="text-primary font-bold text-sm">
                          {formatPrice(relatedProduct.price)}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Back to Catalog */}
        <section className="pb-12">
          <div className="container mx-auto px-4 text-center">
            <Button variant="outline" size="lg" onClick={() => navigate("/products")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {language === "fr" ? "Retour au catalogue" : "Back to catalog"}
            </Button>
          </div>
        </section>
      </main>

      <Footer />
      <FloatingWhatsApp />
    </div>
  );
};

export default ProductDetail;
