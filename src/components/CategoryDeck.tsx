import { Link } from "react-router-dom";
import { Monitor, Sofa, Microwave, Wine } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useTrackClick } from "@/hooks/useAnalytics";

const categories = [
  {
    id: "electronics",
    icon: Monitor,
    nameEn: "Electronics",
    nameFr: "Électronique",
    slug: "Electronics",
  },
  {
    id: "furniture",
    icon: Sofa,
    nameEn: "Furniture",
    nameFr: "Meubles",
    slug: "Furniture",
  },
  {
    id: "appliances",
    icon: Microwave,
    nameEn: "Appliances",
    nameFr: "Électroménager",
    slug: "Appliances",
  },
  {
    id: "crockery",
    icon: Wine,
    nameEn: "Crockery",
    nameFr: "Vaisselle",
    slug: "Crockery",
  },
];

const CategoryDeck = () => {
  const { language } = useLanguage();
  const trackClick = useTrackClick();

  const handleCategoryClick = (category: string) => {
    trackClick.mutate({
      elementId: `category-${category}`,
      elementType: "category-card",
      elementLabel: category,
    });
  };

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-14 animate-fade-up">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
            {language === "fr" ? "Que recherchez-vous ?" : "What are you looking for?"}
          </h2>
          <p className="text-muted-foreground text-lg">
            {language === "fr" 
              ? "Parcourez nos catégories soigneusement sélectionnées"
              : "Browse our carefully curated categories"}
          </p>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {categories.map((category, index) => {
            const Icon = category.icon;
            return (
              <Link
                key={category.id}
                to={`/products?category=${category.slug}`}
                onClick={() => handleCategoryClick(category.id)}
                className="neu-category-card aspect-square animate-fade-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <Icon className="w-8 h-8 md:w-10 md:h-10 text-primary" />
                </div>
                <h3 className="text-lg md:text-xl font-serif font-bold text-foreground text-center">
                  {language === "fr" ? category.nameFr : category.nameEn}
                </h3>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CategoryDeck;
