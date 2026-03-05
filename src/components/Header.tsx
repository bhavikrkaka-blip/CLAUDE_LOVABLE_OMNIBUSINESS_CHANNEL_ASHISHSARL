import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Search } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCartTotal } from "@/hooks/useCart";
import CartSheet from "@/components/customer/CartSheet";
import CustomerUserMenu from "@/components/customer/CustomerUserMenu";
import logoWordmark from "@/assets/logo-wordmark-red.png";

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { itemCount: cartCount } = useCartTotal();
  const isHomePage = location.pathname === "/";

  const navLinks = [
    { name: t.nav.home, href: "/", isRoute: true },
    { name: language === "fr" ? "Catalogue" : "Catalog", href: "/products", isRoute: true },
    { name: "Blog", href: "/blog", isRoute: true },
    { name: t.nav.contact, href: isHomePage ? "#contact" : "/#contact", isRoute: !isHomePage },
  ];

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "fr" : "en");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  return (
    <header className="neu-header">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <img 
              src={logoWordmark} 
              alt="Ashish SARL" 
              className="h-8 md:h-10 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              link.isRoute ? (
                <Link
                  key={link.name}
                  to={link.href}
                  className="text-foreground/80 hover:text-primary transition-colors duration-300 text-sm font-medium tracking-wide"
                >
                  {link.name}
                </Link>
              ) : (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-foreground/80 hover:text-primary transition-colors duration-300 text-sm font-medium tracking-wide"
                >
                  {link.name}
                </a>
              )
            ))}
          </nav>

          {/* Center - Search Bar (Desktop) */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === "fr" ? "Rechercher des produits..." : "Search products..."}
                className="neu-input pr-12 text-sm"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 neu-icon-button w-10 h-10 text-primary"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          </form>

          {/* Right Icons */}
          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="hidden sm:flex neu-icon-button w-10 h-10 text-foreground hover:text-primary text-xs font-bold"
              aria-label={`Switch to ${language === "en" ? "French" : "English"}`}
            >
              {language === "en" ? "FR" : "EN"}
            </button>

            {/* User Menu */}
            <CustomerUserMenu />

            {/* Cart */}
            <div className="relative">
              <CartSheet />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden neu-icon-button text-foreground"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <nav className="lg:hidden mt-6 pb-6 border-t border-border pt-6 animate-fade-in">
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="mb-6">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === "fr" ? "Rechercher..." : "Search..."}
                className="neu-input text-sm"
              />
            </form>

            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                link.isRoute ? (
                  <Link
                    key={link.name}
                    to={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-foreground/80 hover:text-primary transition-colors duration-300 text-lg font-medium"
                  >
                    {link.name}
                  </Link>
                ) : (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-foreground/80 hover:text-primary transition-colors duration-300 text-lg font-medium"
                  >
                    {link.name}
                  </a>
                )
              ))}
              <button
                onClick={toggleLanguage}
                className="text-left text-foreground/80 hover:text-primary transition-colors text-lg font-medium"
              >
                {language === "en" ? "Français" : "English"}
              </button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
