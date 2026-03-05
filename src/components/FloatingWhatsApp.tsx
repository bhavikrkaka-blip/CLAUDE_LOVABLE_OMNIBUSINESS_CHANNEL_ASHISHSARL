import { MessageCircle } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

const FloatingWhatsApp = () => {
  const { t } = useLanguage();

  return (
    <a
      href="https://wa.me/237673750693"
      target="_blank"
      rel="noopener noreferrer"
      className="floating-cta"
      aria-label="Contact us on WhatsApp"
    >
      <MessageCircle className="w-6 h-6" />
      <span className="hidden sm:inline">{t.floatingWhatsApp}</span>
    </a>
  );
};

export default FloatingWhatsApp;
