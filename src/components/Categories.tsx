import { ArrowRight } from "lucide-react";
import appliancesImg from "@/assets/category-appliances.jpg";
import furnitureImg from "@/assets/category-furniture.jpg";
import diningImg from "@/assets/category-dining.jpg";
import tvStandsImg from "@/assets/category-tv-stands.jpg";
import crockeryImg from "@/assets/category-crockery.jpg";
import { useLanguage } from "@/i18n/LanguageContext";

const Categories = () => {
  const { t } = useLanguage();

  const images = [appliancesImg, furnitureImg, diningImg, tvStandsImg, crockeryImg];

  return (
    <section id="categories" className="py-16 md:py-20 bg-secondary">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header - Compact */}
        <div className="text-center mb-10">
          <span className="text-primary text-sm font-medium tracking-[0.15em] uppercase mb-3 block">
            {t.categories.label}
          </span>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-serif font-bold text-foreground mb-4">
            {t.categories.title}
          </h2>
        </div>

        {/* Category Grid - 5 columns on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {t.categories.items.map((category, index) => (
            <div
              key={index}
              className="category-card group"
            >
              <div className="relative aspect-[3/4] overflow-hidden">
                <img
                  src={images[index]}
                  alt={category.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col justify-end p-4">
                  <h3 className="text-base md:text-lg font-serif font-bold text-white mb-1 line-clamp-2">
                    {category.title}
                  </h3>
                  <button className="inline-flex items-center gap-1 text-white/80 text-xs font-medium group/btn hover:text-white transition-colors">
                    {t.categories.viewCollection}
                    <ArrowRight className="w-3 h-3 transition-transform group-hover/btn:translate-x-1" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;
