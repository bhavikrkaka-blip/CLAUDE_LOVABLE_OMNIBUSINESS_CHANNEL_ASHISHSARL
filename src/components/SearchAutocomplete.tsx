import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Search, ArrowRight } from "lucide-react";
import { useProducts, Product } from "@/hooks/useProducts";
import { getProxiedImageUrl } from "@/lib/imageProxy";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";

interface SearchAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("fr-FR").format(price) + " FCFA";
};

const SearchAutocomplete = ({
  value,
  onChange,
  placeholder,
  className,
  inputClassName,
}: SearchAutocompleteProps) => {
  const { data: products } = useProducts();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter products based on search query
  const filteredProducts = products?.filter((product) => {
    if (!value || value.length < 2) return false;
    const searchLower = value.toLowerCase();
    const name = language === "fr" && product.name_fr ? product.name_fr : product.name;
    return (
      name.toLowerCase().includes(searchLower) ||
      product.brand.toLowerCase().includes(searchLower) ||
      product.category.toLowerCase().includes(searchLower)
    );
  }).slice(0, 6) || [];

  const getProductName = (product: Product) => {
    return language === "fr" && product.name_fr ? product.name_fr : product.name;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || filteredProducts.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < filteredProducts.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && filteredProducts[selectedIndex]) {
          handleSelect(filteredProducts[selectedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSelect = (product: Product) => {
    setIsOpen(false);
    setSelectedIndex(-1);
    onChange("");
    navigate(`/products/${product.id}`);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsOpen(newValue.length >= 2);
    setSelectedIndex(-1);
  };

  const showDropdown = isOpen && filteredProducts.length > 0;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
      <Input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        onFocus={() => value.length >= 2 && setIsOpen(true)}
        onKeyDown={handleKeyDown}
        className={cn("pl-12 pr-4", inputClassName)}
        autoComplete="off"
      />

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border rounded-xl shadow-lg overflow-hidden z-50 animate-in fade-in-0 slide-in-from-top-2 duration-200">
          <div className="py-2">
            <p className="px-4 py-1.5 text-xs text-muted-foreground font-medium">
              {language === "fr" ? "Suggestions" : "Suggestions"}
            </p>
            {filteredProducts.map((product, index) => (
              <button
                key={product.id}
                onClick={() => handleSelect(product)}
                className={cn(
                  "w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left",
                  selectedIndex === index && "bg-muted"
                )}
              >
                {/* Product thumbnail */}
                <div className="w-10 h-10 bg-muted rounded-lg flex-shrink-0 overflow-hidden">
                  {product.images?.[0] ? (
                    <img
                      src={getProxiedImageUrl(product.images[0])}
                      alt={getProductName(product)}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Search className="w-4 h-4 text-muted-foreground/50" />
                    </div>
                  )}
                </div>

                {/* Product info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {getProductName(product)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {product.brand} • {formatPrice(product.price)}
                  </p>
                </div>

                <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </button>
            ))}
          </div>
          
          {/* View all results */}
          <button
            onClick={() => {
              setIsOpen(false);
              navigate(`/products`);
            }}
            className="w-full px-4 py-3 text-sm text-primary font-medium hover:bg-primary/5 border-t flex items-center justify-center gap-2 transition-colors"
          >
            {language === "fr" ? "Voir tous les résultats" : "View all results"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchAutocomplete;
