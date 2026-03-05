import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Facebook, Instagram, MessageCircle, Star } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import logoWordmarkWhite from "@/assets/logo-wordmark-white.png";

const Footer = () => {
  const { language, t } = useLanguage();

  return (
    <footer className="bg-charcoal text-white py-16">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div>
            <img 
              src={logoWordmarkWhite} 
              alt="Ashish SARL" 
              className="h-10 w-auto mb-6"
            />
            <p className="text-white/70 text-sm leading-relaxed mb-6">
              {t.footer.tagline}
            </p>
            <div className="flex items-center gap-2 mb-6">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-primary fill-primary" />
                ))}
              </div>
              <span className="text-sm text-white/70">5.0 {t.trust.googleRating}</span>
            </div>
            <div className="flex gap-3">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" 
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://wa.me/237673750693" target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#25D366] transition-colors">
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-serif font-bold mb-6">
              {t.footer.quickLinks}
            </h4>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-white/70 hover:text-primary transition-colors text-sm">
                  {t.nav.home}
                </Link>
              </li>
              <li>
                <Link to="/products" className="text-white/70 hover:text-primary transition-colors text-sm">
                  {language === "fr" ? "Catalogue" : "Catalog"}
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-white/70 hover:text-primary transition-colors text-sm">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/products?category=Electronics" className="text-white/70 hover:text-primary transition-colors text-sm">
                  {language === "fr" ? "Électronique" : "Electronics"}
                </Link>
              </li>
              <li>
                <Link to="/products?category=Furniture" className="text-white/70 hover:text-primary transition-colors text-sm">
                  {language === "fr" ? "Meubles" : "Furniture"}
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-lg font-serif font-bold mb-6">
              {t.footer.categoriesTitle}
            </h4>
            <ul className="space-y-3">
              <li>
                <Link to="/products?category=Appliances" className="text-white/70 hover:text-primary transition-colors text-sm">
                  {language === "fr" ? "Électroménager" : "Appliances"}
                </Link>
              </li>
              <li>
                <Link to="/products?category=Crockery" className="text-white/70 hover:text-primary transition-colors text-sm">
                  {language === "fr" ? "Vaisselle" : "Crockery"}
                </Link>
              </li>
              <li>
                <Link to="/products?category=TV_Stands" className="text-white/70 hover:text-primary transition-colors text-sm">
                  {language === "fr" ? "Meubles TV" : "TV Stands"}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-serif font-bold mb-6">
              {t.footer.contactUs}
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-white/70 text-sm">
                  Central Market, Yaoundé, Cameroon
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                <a href="tel:+237673750693" className="text-white/70 hover:text-primary transition-colors text-sm">
                  +237 673 750 693
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                <a href="mailto:info@ashishsarl.com" className="text-white/70 hover:text-primary transition-colors text-sm">
                  info@ashishsarl.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/50 text-sm">
            © {new Date().getFullYear()} Ashish SARL. {t.footer.copyright}
          </p>
          <span className="text-sm text-white/50">{t.footer.madeIn}</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
