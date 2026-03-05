import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Flame } from "lucide-react";
import { useFeaturedProducts } from "@/hooks/useFeaturedProducts";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";
import { getProxiedImageUrl } from "@/lib/imageProxy";
import { Button } from "@/components/ui/button";

const PromoBanner = () => {
  const { language } = useLanguage();
  const { data: featuredProducts, isLoading } = useFeaturedProducts("promo_banner");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const products = featuredProducts?.map((fp) => fp.product).filter(Boolean) || [];

  const nextSlide = useCallback(() => {
    if (products.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % products.length);
  }, [products.length]);

  const prevSlide = useCallback(() => {
    if (products.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
  }, [products.length]);

  // Auto-scroll
  useEffect(() => {
    if (isPaused || products.length <= 1) return;

    const timer = setInterval(nextSlide, 4000);
    return () => clearInterval(timer);
  }, [isPaused, products.length, nextSlide]);

  if (isLoading) {
    return (
      <section className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 py-4">
        <div className="container mx-auto px-4">
          <div className="h-24 bg-muted animate-pulse rounded-xl" />
        </div>
      </section>
    );
  }

  if (!products.length) {
    return null;
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("fr-FR").format(price) + " FCFA";
  };

  const calculateDiscount = (price: number, originalPrice?: number | null) => {
    if (!originalPrice) return null;
    return Math.round((1 - price / originalPrice) * 100);
  };

  return (
    <section 
      className="relative bg-gradient-to-r from-primary/15 via-background to-primary/15 py-6 overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Animated background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="flex items-center gap-1">
            <Flame className="w-6 h-6 text-primary animate-bounce" style={{ animationDuration: '1s' }} />
            <Flame className="w-4 h-4 text-accent animate-bounce" style={{ animationDuration: '1.2s', animationDelay: '0.1s' }} />
          </div>
          <h2 className="text-lg md:text-xl font-bold uppercase tracking-wider text-primary">
            {language === "fr" ? "Offres Spéciales" : "Hot Deals"}
          </h2>
          <div className="flex items-center gap-1">
            <Flame className="w-4 h-4 text-accent animate-bounce" style={{ animationDuration: '1.2s', animationDelay: '0.1s' }} />
            <Flame className="w-6 h-6 text-primary animate-bounce" style={{ animationDuration: '1s' }} />
          </div>
        </div>

        {/* Carousel */}
        <div className="relative flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-0 z-10 h-10 w-10 rounded-full bg-background/90 shadow-lg hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-110"
            onClick={prevSlide}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <div className="flex-1 overflow-hidden mx-12 md:mx-14">
            <div
              className="flex transition-transform duration-700 ease-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {products.map((product) => {
                const discount = calculateDiscount(product.price, product.original_price);
                const name = language === "fr" && product.name_fr ? product.name_fr : product.name;

                return (
                  <Link
                    key={product.id}
                    to={`/products/${product.id}`}
                    className="w-full flex-shrink-0 flex items-center justify-center gap-5 md:gap-8 px-4 group"
                  >
                    {/* Larger product image with hover effects */}
                    <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden bg-background shadow-lg flex-shrink-0 group-hover:shadow-xl transition-all duration-500">
                      <img
                        src={getProxiedImageUrl(product.images?.[0]) || "/placeholder.svg"}
                        alt={name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      {/* Shine effect on hover */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 -translate-x-full group-hover:translate-x-full" style={{ transitionDuration: '700ms' }} />
                      
                      {discount && (
                        <div className="absolute top-1 right-1 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded-lg shadow-md animate-pulse">
                          -{discount}%
                        </div>
                      )}
                    </div>

                    {/* Product info */}
                    <div className="flex flex-col items-start min-w-0 gap-1">
                      <span className="text-xs md:text-sm text-muted-foreground font-medium">{product.brand}</span>
                      <span className="font-bold text-base md:text-lg truncate max-w-[180px] md:max-w-[280px] group-hover:text-primary transition-colors duration-300">
                        {name}
                      </span>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-primary font-bold text-lg md:text-xl">
                          {formatPrice(product.price)}
                        </span>
                        {product.original_price && (
                          <span className="text-sm text-muted-foreground line-through">
                            {formatPrice(product.original_price)}
                          </span>
                        )}
                      </div>
                      {/* CTA hint */}
                      <span className="text-xs text-primary/70 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {language === "fr" ? "Voir le produit →" : "View product →"}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 z-10 h-10 w-10 rounded-full bg-background/90 shadow-lg hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-110"
            onClick={nextSlide}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Dots Indicator */}
        <div className="flex items-center justify-center gap-2 mt-4">
          {products.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-500",
                idx === currentIndex
                  ? "bg-primary w-6 shadow-md"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PromoBanner;
