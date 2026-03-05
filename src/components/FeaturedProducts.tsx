import { useState, useEffect, useMemo } from "react";
import { ArrowRight, Sparkles, Filter, X, ArrowUpDown, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useProducts, Product } from "@/hooks/useProducts";
import { getProxiedImageUrl } from "@/lib/imageProxy";
import { useLanguage } from "@/i18n/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import SearchAutocomplete from "@/components/SearchAutocomplete";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AddToCartButton from "@/components/customer/AddToCartButton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("fr-FR").format(price) + " FCFA";
};

type SortOption = "default" | "price-low" | "price-high" | "name-asc" | "name-desc";

const FeaturedProducts = () => {
  const { data: products, isLoading } = useProducts();
  const { language } = useLanguage();
  const [heroIndex, setHeroIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("default");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000000]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Get price range from products
  const { minPrice, maxPrice } = useMemo(() => {
    if (!products || products.length === 0) return { minPrice: 0, maxPrice: 5000000 };
    const prices = products.map(p => p.price);
    return {
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
    };
  }, [products]);

  // Initialize price range when products load
  useEffect(() => {
    if (products && products.length > 0) {
      setPriceRange([minPrice, maxPrice]);
    }
  }, [minPrice, maxPrice, products]);

  // Get unique categories and brands from products
  const categories = useMemo(() => {
    if (!products) return [];
    const cats = [...new Set(products.map(p => p.category))];
    return cats.sort();
  }, [products]);

  const brands = useMemo(() => {
    if (!products) return [];
    const brandList = [...new Set(products.map(p => p.brand))];
    return brandList.sort();
  }, [products]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    
    let result = products.filter((product) => {
      const name = language === "fr" && product.name_fr ? product.name_fr : product.name;
      const matchesSearch = 
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesBrand = selectedBrand === "all" || product.brand === selectedBrand;
      const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
      const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
      
      return matchesSearch && matchesBrand && matchesCategory && matchesPrice && product.in_stock;
    });

    // Sort products
    switch (sortBy) {
      case "price-low":
        result = [...result].sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        result = [...result].sort((a, b) => b.price - a.price);
        break;
      case "name-asc":
        result = [...result].sort((a, b) => {
          const nameA = language === "fr" && a.name_fr ? a.name_fr : a.name;
          const nameB = language === "fr" && b.name_fr ? b.name_fr : b.name;
          return nameA.localeCompare(nameB);
        });
        break;
      case "name-desc":
        result = [...result].sort((a, b) => {
          const nameA = language === "fr" && a.name_fr ? a.name_fr : a.name;
          const nameB = language === "fr" && b.name_fr ? b.name_fr : b.name;
          return nameB.localeCompare(nameA);
        });
        break;
      default:
        break;
    }

    return result;
  }, [products, searchQuery, selectedBrand, selectedCategory, priceRange, sortBy, language]);

  // Get featured products for hero display
  const featuredProducts = filteredProducts.slice(0, 9);
  const heroProduct = featuredProducts[heroIndex] || featuredProducts[0];
  const gridProducts = filteredProducts.slice(0, 8);

  // Auto-shuffle hero product every 5 seconds
  useEffect(() => {
    if (featuredProducts.length <= 1) return;
    
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % Math.min(featuredProducts.length, 6));
    }, 5000);

    return () => clearInterval(interval);
  }, [featuredProducts.length]);

  // Reset hero index when filters change
  useEffect(() => {
    setHeroIndex(0);
  }, [searchQuery, selectedCategory, selectedBrand, priceRange, sortBy]);

  const getProductName = (product: Product) => {
    return language === "fr" && product.name_fr ? product.name_fr : product.name;
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedBrand("all");
    setSelectedCategory("all");
    setSortBy("default");
    setPriceRange([minPrice, maxPrice]);
  };

  const hasActiveFilters = searchQuery || selectedBrand !== "all" || selectedCategory !== "all" || 
    sortBy !== "default" || priceRange[0] !== minPrice || priceRange[1] !== maxPrice;

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Price Range */}
      <div>
        <h3 className="font-semibold text-foreground mb-3">
          {language === "fr" ? "Fourchette de prix" : "Price Range"}
        </h3>
        <div className="space-y-4">
          <Slider
            value={priceRange}
            onValueChange={(value) => setPriceRange(value as [number, number])}
            min={minPrice}
            max={maxPrice}
            step={10000}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{formatPrice(priceRange[0])}</span>
            <span>{formatPrice(priceRange[1])}</span>
          </div>
        </div>
      </div>

      {/* Brands */}
      <div>
        <h3 className="font-semibold text-foreground mb-3">
          {language === "fr" ? "Marques" : "Brands"}
        </h3>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedBrand === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedBrand("all")}
            className="text-xs"
          >
            {language === "fr" ? "Toutes" : "All"}
          </Button>
          {brands.slice(0, 10).map((brand) => (
            <Button
              key={brand}
              variant={selectedBrand === brand ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedBrand(brand)}
              className="text-xs"
            >
              {brand}
            </Button>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div>
        <h3 className="font-semibold text-foreground mb-3">
          {language === "fr" ? "Catégories" : "Categories"}
        </h3>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("all")}
            className="text-xs"
          >
            {language === "fr" ? "Toutes" : "All"}
          </Button>
          {categories.slice(0, 10).map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className="text-xs capitalize"
            >
              {cat.toLowerCase().replace(/_/g, " ")}
            </Button>
          ))}
        </div>
      </div>

      {hasActiveFilters && (
        <Button variant="ghost" onClick={clearFilters} className="w-full text-muted-foreground">
          <X className="w-4 h-4 mr-2" />
          {language === "fr" ? "Effacer les filtres" : "Clear filters"}
        </Button>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <div className="h-8 w-48 mx-auto mb-4 rounded-full bg-muted animate-pulse" />
            <div className="h-12 w-64 mx-auto rounded-lg bg-muted animate-pulse" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="neu-product-card p-4">
                <Skeleton className="aspect-square rounded-xl mb-4" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-6 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="featured" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 animate-fade-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 shadow-neu-raised-sm bg-background">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-primary text-sm font-medium">
              {language === "fr" ? "Tendances 2026" : "Trending 2026"}
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground mb-4">
            {language === "fr" ? "Produits Populaires" : "Trending Products"}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {language === "fr" 
              ? "Découvrez notre sélection des meilleures ventes" 
              : "Discover our selection of bestsellers"}
          </p>
        </div>

        {/* Search and Filter Bar - Neumorphic */}
        <div className="flex flex-col md:flex-row gap-4 mb-10">
          {/* Search with Autocomplete */}
          <div className="flex-1 max-w-xl">
            <SearchAutocomplete
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={language === "fr" ? "Rechercher un produit..." : "Search products..."}
              className="w-full"
              inputClassName="neu-input text-base"
            />
          </div>

          {/* Filter Button (Mobile) */}
          <div className="md:hidden">
            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetTrigger asChild>
                <button className="neu-button w-full">
                  <Filter className="w-4 h-4" />
                  {language === "fr" ? "Filtres" : "Filters"}
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">!</Badge>
                  )}
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px] flex flex-col bg-background">
                <SheetHeader>
                  <SheetTitle>{language === "fr" ? "Filtres" : "Filters"}</SheetTitle>
                </SheetHeader>
                <div className="mt-6 flex-1 overflow-y-auto">
                  <FilterContent />
                </div>
                <div className="pt-4 border-t mt-4">
                  <button 
                    onClick={() => setIsFilterOpen(false)} 
                    className="neu-button-filled w-full"
                  >
                    {language === "fr" ? "Appliquer les filtres" : "Apply Filters"}
                  </button>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Sort Dropdown */}
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger className="w-[180px] neu-input h-auto py-3">
              <ArrowUpDown className="w-4 h-4 mr-2" />
              <SelectValue placeholder={language === "fr" ? "Trier par" : "Sort by"} />
            </SelectTrigger>
            <SelectContent className="bg-background shadow-neu-raised border-0">
              <SelectItem value="default">
                {language === "fr" ? "Par défaut" : "Default"}
              </SelectItem>
              <SelectItem value="price-low">
                {language === "fr" ? "Prix croissant" : "Price: Low to High"}
              </SelectItem>
              <SelectItem value="price-high">
                {language === "fr" ? "Prix décroissant" : "Price: High to Low"}
              </SelectItem>
              <SelectItem value="name-asc">
                {language === "fr" ? "Nom A-Z" : "Name A-Z"}
              </SelectItem>
              <SelectItem value="name-desc">
                {language === "fr" ? "Nom Z-A" : "Name Z-A"}
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Quick Category Pills (Desktop) - Neumorphic */}
          <div className="hidden md:flex flex-wrap gap-2 items-center">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                selectedCategory === "all" 
                  ? "shadow-neu-inset-sm text-primary" 
                  : "shadow-neu-raised-sm hover:shadow-neu-raised text-foreground"
              }`}
            >
              {language === "fr" ? "Tout" : "All"}
            </button>
            {categories.slice(0, 4).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-all duration-200 ${
                  selectedCategory === cat 
                    ? "shadow-neu-inset-sm text-primary" 
                    : "shadow-neu-raised-sm hover:shadow-neu-raised text-foreground"
                }`}
              >
                {cat.toLowerCase().replace(/_/g, " ").slice(0, 12)}
              </button>
            ))}
            {hasActiveFilters && (
              <button 
                onClick={clearFilters}
                className="neu-icon-button w-10 h-10 text-muted-foreground hover:text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Results Count */}
        <p className="text-sm text-muted-foreground mb-8">
          {filteredProducts.length} {language === "fr" ? "produits trouvés" : "products found"}
        </p>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">
              {language === "fr" ? "Aucun produit trouvé" : "No products found"}
            </p>
            <button onClick={clearFilters} className="neu-button text-primary">
              {language === "fr" ? "Effacer les filtres" : "Clear filters"}
            </button>
          </div>
        ) : (
          <>
            {/* Product Grid - Neumorphic Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
              {gridProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="neu-product-card animate-fade-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <Link to={`/products/${product.id}`} className="block">
                    <div className="aspect-square overflow-hidden rounded-t-2xl">
                      <img
                        src={getProxiedImageUrl(product.images?.[0]) || "/placeholder.svg"}
                        alt={getProductName(product)}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  </Link>

                  {product.is_new && (
                    <div className="absolute top-3 left-3 px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full">
                      {language === "fr" ? "Nouveau" : "New"}
                    </div>
                  )}

                  <div className="p-4">
                    <p className="text-muted-foreground text-xs mb-1 truncate uppercase tracking-wide">
                      {product.brand}
                    </p>
                    <h4 className="font-serif font-semibold text-foreground line-clamp-2 mb-3 min-h-[2.5rem]">
                      {getProductName(product)}
                    </h4>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-foreground">
                          {formatPrice(product.price)}
                        </span>
                        {product.original_price && (
                          <span className="block text-xs text-muted-foreground line-through">
                            {formatPrice(product.original_price)}
                          </span>
                        )}
                      </div>
                      <button className="neu-icon-button w-10 h-10 text-primary hover:text-accent">
                        <AddToCartButton
                          productId={product.id}
                          productName={getProductName(product)}
                          inStock={product.in_stock}
                          size="sm"
                          showText={false}
                          className="bg-transparent shadow-none hover:bg-transparent p-0"
                        />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* View All CTA */}
        <div className="text-center mt-14">
          <Link
            to="/products"
            className="neu-button-filled group text-lg px-10 py-5"
          >
            {language === "fr" ? "Voir Tous les Articles" : "View All Products"}
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
