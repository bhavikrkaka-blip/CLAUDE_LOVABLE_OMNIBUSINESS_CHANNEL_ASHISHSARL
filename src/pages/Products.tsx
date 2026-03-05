import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { useProducts, Product } from "@/hooks/useProducts";
import { getProxiedImageUrl } from "@/lib/imageProxy";
import SearchAutocomplete from "@/components/SearchAutocomplete";
import { useLanguage } from "@/i18n/LanguageContext";
import { Filter, X, ChevronRight, Package, ArrowUpDown } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const Products = () => {
  const { language } = useLanguage();
  const { data: products, isLoading } = useProducts();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"default" | "price-low" | "price-high" | "name-asc" | "name-desc">("default");

  // Get unique brands from products
  const brands = useMemo(() => {
    if (!products) return [];
    return [...new Set(products.map(p => p.brand))].sort();
  }, [products]);

  // Get unique categories from products
  const productCategories = useMemo(() => {
    if (!products) return [];
    return [...new Set(products.map(p => p.category))].sort();
  }, [products]);

  // Calculate price range from products
  const { minPrice, maxPrice } = useMemo(() => {
    if (!products || products.length === 0) return { minPrice: 0, maxPrice: 5000000 };
    const prices = products.map(p => p.price);
    return {
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices)
    };
  }, [products]);

  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000000]);

  // Initialize price range when products load
  useEffect(() => {
    if (products && products.length > 0) {
      setPriceRange([minPrice, maxPrice]);
    }
  }, [minPrice, maxPrice, products]);

  const getProductName = (product: Product) => {
    return language === "fr" && product.name_fr ? product.name_fr : product.name;
  };

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    
    let result = products.filter((product) => {
      const name = getProductName(product);
      const matchesSearch = 
        name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesBrand = selectedBrand === "all" || product.brand === selectedBrand;
      const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
      const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
      
      return matchesSearch && matchesBrand && matchesCategory && matchesPrice;
    });

    // Apply sorting
    switch (sortBy) {
      case "price-low":
        result = [...result].sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        result = [...result].sort((a, b) => b.price - a.price);
        break;
      case "name-asc":
        result = [...result].sort((a, b) => getProductName(a).localeCompare(getProductName(b)));
        break;
      case "name-desc":
        result = [...result].sort((a, b) => getProductName(b).localeCompare(getProductName(a)));
        break;
    }

    return result;
  }, [products, searchQuery, selectedBrand, selectedCategory, priceRange, sortBy, language]);

  const getCategoryLabel = (catId: string) => {
    const cat = categories.find(c => c.id === catId);
    if (!cat) return catId.toLowerCase().replace(/_/g, " ");
    return language === "fr" ? cat.labelFr : cat.labelEn;
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedBrand("all");
    setSelectedCategory("all");
    setPriceRange([minPrice, maxPrice]);
    setSortBy("default");
  };

  const hasActiveFilters = searchQuery || selectedBrand !== "all" || selectedCategory !== "all" || priceRange[0] !== minPrice || priceRange[1] !== maxPrice || sortBy !== "default";

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Sort */}
      <div>
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4" />
          {language === "fr" ? "Trier par" : "Sort by"}
        </h3>
        <Select value={sortBy} onValueChange={(value: typeof sortBy) => setSortBy(value)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">{language === "fr" ? "Par défaut" : "Default"}</SelectItem>
            <SelectItem value="price-low">{language === "fr" ? "Prix: Bas à Élevé" : "Price: Low to High"}</SelectItem>
            <SelectItem value="price-high">{language === "fr" ? "Prix: Élevé à Bas" : "Price: High to Low"}</SelectItem>
            <SelectItem value="name-asc">{language === "fr" ? "Nom: A-Z" : "Name: A-Z"}</SelectItem>
            <SelectItem value="name-desc">{language === "fr" ? "Nom: Z-A" : "Name: Z-A"}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="font-semibold text-foreground mb-3">
          {language === "fr" ? "Fourchette de prix" : "Price Range"}
        </h3>
        <div className="px-2">
          <Slider
            value={priceRange}
            onValueChange={(value) => setPriceRange(value as [number, number])}
            min={minPrice}
            max={maxPrice}
            step={10000}
            className="mb-4"
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
          {brands.slice(0, 15).map((brand) => (
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
          {productCategories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className="text-xs"
            >
              {getCategoryLabel(cat)}
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
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <section className="bg-gradient-to-b from-muted/50 to-background py-12 md:py-16">
            <div className="container mx-auto px-4">
              <div className="max-w-3xl mx-auto text-center">
                <Skeleton className="h-12 w-64 mx-auto mb-4" />
                <Skeleton className="h-6 w-96 mx-auto mb-8" />
                <Skeleton className="h-12 w-full max-w-xl mx-auto rounded-full" />
              </div>
            </div>
          </section>
          <section className="py-8">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-lg" />
                ))}
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-muted/50 to-background py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
                {language === "fr" ? "Notre Catalogue" : "Our Catalog"}
              </h1>
              <p className="text-muted-foreground text-lg mb-8">
                {language === "fr" 
                  ? "Découvrez notre sélection d'électroménagers de qualité premium"
                  : "Discover our selection of premium quality appliances"}
              </p>
              
              {/* Search Bar with Autocomplete */}
              <SearchAutocomplete
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder={language === "fr" ? "Rechercher un produit..." : "Search for a product..."}
                className="max-w-xl mx-auto"
                inputClassName="h-12 text-base rounded-full border-2 focus:border-primary"
              />
            </div>
          </div>
        </section>

        {/* Products Grid */}
        <section className="py-8 md:py-12">
          <div className="container mx-auto px-4">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Desktop Filters Sidebar */}
              <aside className="hidden lg:block w-72 shrink-0">
                <div className="sticky top-24 bg-card rounded-xl border shadow-sm max-h-[calc(100vh-8rem)] flex flex-col">
                  <h2 className="font-bold text-lg p-6 pb-4 text-foreground border-b">
                    {language === "fr" ? "Filtres" : "Filters"}
                  </h2>
                  <div className="overflow-y-auto p-6 pt-4">
                    <FilterContent />
                  </div>
                </div>
              </aside>

              {/* Mobile Filter Button */}
              <div className="lg:hidden flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  {filteredProducts.length} {language === "fr" ? "produits" : "products"}
                </p>
                <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Filter className="w-4 h-4" />
                      {language === "fr" ? "Filtres" : "Filters"}
                      {hasActiveFilters && (
                        <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
                          !
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[300px] sm:w-[400px] flex flex-col">
                    <SheetHeader>
                      <SheetTitle>
                        {language === "fr" ? "Filtres" : "Filters"}
                      </SheetTitle>
                    </SheetHeader>
                    <div className="mt-6 overflow-y-auto flex-1 pr-2">
                      <FilterContent />
                    </div>
                    <div className="pt-4 border-t mt-4">
                      <Button 
                        onClick={() => setIsFilterOpen(false)} 
                        className="w-full"
                      >
                        {language === "fr" ? "Appliquer les filtres" : "Apply Filters"}
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Products Grid */}
              <div className="flex-1">
                {/* Results Count - Desktop */}
                <div className="hidden lg:flex items-center justify-between mb-6">
                  <p className="text-muted-foreground">
                    {filteredProducts.length} {language === "fr" ? "produits trouvés" : "products found"}
                  </p>
                </div>

                {filteredProducts.length === 0 ? (
                  <div className="text-center py-16">
                    <Package className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      {language === "fr" ? "Aucun produit trouvé" : "No products found"}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      {language === "fr" 
                        ? "Essayez de modifier vos critères de recherche"
                        : "Try adjusting your search criteria"}
                    </p>
                    <Button variant="outline" onClick={clearFilters}>
                      {language === "fr" ? "Effacer les filtres" : "Clear filters"}
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                    {filteredProducts.map((product) => (
                      <Link key={product.id} to={`/products/${product.id}`}>
                        <Card className="group h-full overflow-hidden border hover:border-primary/50 hover:shadow-lg transition-all duration-300">
                          {/* Product Image */}
                          <div className="aspect-square bg-gradient-to-br from-muted to-muted/50 relative overflow-hidden">
                            {product.images?.[0] ? (
                              <img 
                                src={getProxiedImageUrl(product.images[0])} 
                                alt={getProductName(product)}
                                className="w-full h-full object-contain p-4"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  target.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <div className={`absolute inset-0 flex items-center justify-center ${product.images?.[0] ? 'hidden' : ''}`}>
                              <Package className="w-16 h-16 text-muted-foreground/30" />
                            </div>
                            {/* Brand Badge */}
                            <Badge className="absolute top-3 left-3 bg-background/90 text-foreground backdrop-blur-sm border">
                              {product.brand}
                            </Badge>
                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                                {language === "fr" ? "Voir détails" : "View details"}
                                <ChevronRight className="w-4 h-4" />
                              </span>
                            </div>
                          </div>
                          
                          <CardContent className="p-4">
                            {/* Category */}
                            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                              {getCategoryLabel(product.category)}
                            </p>
                            
                            {/* Product Name */}
                            <h3 className="font-semibold text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                              {getProductName(product)}
                            </h3>
                            
                            {/* Price */}
                            <div className="flex items-baseline gap-2">
                              <p className="text-lg font-bold text-primary">
                                {formatPrice(product.price)}
                              </p>
                              {product.original_price && (
                                <p className="text-sm text-muted-foreground line-through">
                                  {formatPrice(product.original_price)}
                                </p>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <FloatingWhatsApp />
    </div>
  );
};

export default Products;
