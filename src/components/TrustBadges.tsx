import { Truck, Shield, RotateCcw } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

const trustItems = [
  {
    icon: Truck,
    titleEn: "Fast Shipping",
    titleFr: "Livraison Rapide",
    descEn: "Quick delivery to your door",
    descFr: "Livraison rapide à votre porte",
  },
  {
    icon: Shield,
    titleEn: "Authentic Quality",
    titleFr: "Qualité Authentique",
    descEn: "100% genuine products",
    descFr: "Produits 100% authentiques",
  },
  {
    icon: RotateCcw,
    titleEn: "Easy Returns",
    titleFr: "Retours Faciles",
    descEn: "Hassle-free return policy",
    descFr: "Politique de retour simple",
  },
];

const TrustBadges = () => {
  const { language } = useLanguage();

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {trustItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="neu-trust-badge animate-fade-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shadow-neu-inset-sm">
                  <Icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-lg font-serif font-bold text-foreground">
                  {language === "fr" ? item.titleFr : item.titleEn}
                </h3>
                <p className="text-sm text-muted-foreground text-center">
                  {language === "fr" ? item.descFr : item.descEn}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TrustBadges;
