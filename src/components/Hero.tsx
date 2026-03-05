import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useBannerByPlacement } from "@/hooks/useBanners";
import { useTrackClick } from "@/hooks/useAnalytics";
import { Link } from "react-router-dom";
import defaultHeroImage from "@/assets/hero-lifestyle.jpg";

const Hero = () => {
  const { t, language } = useLanguage();
  const { data: heroBanner } = useBannerByPlacement("hero-main");
  const trackClick = useTrackClick();

  const handleCtaClick = (ctaName: string) => {
    trackClick.mutate({
      elementId: `hero-cta-${ctaName}`,
      elementType: "button",
      elementLabel: ctaName,
    });
  };

  const bannerLink = heroBanner?.link_url || "/products";
  const bannerImage = heroBanner?.image_url || defaultHeroImage;
  const bannerTitle = heroBanner?.title;
  const bannerSubtitle = heroBanner?.subtitle;
  const bannerButtonText = heroBanner?.button_text;

  return (
    <section className="relative min-h-[90vh] flex items-center pt-24 bg-background">
      <div className="container mx-auto px-4 lg:px-8 py-16">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Content */}
          <div className="max-w-xl animate-fade-up">
            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-foreground leading-[1.1] mb-6">
              {bannerTitle ? (
                <span dangerouslySetInnerHTML={{ __html: bannerTitle.replace(/\n/g, '<br />') }} />
              ) : (
                <>
                  {language === "fr" ? "Vivre moderne," : "Modern Living,"}
                  <br />
                  <span className="text-primary">
                    {language === "fr" ? "Livré." : "Delivered."}
                  </span>
                </>
              )}
            </h1>

            {/* Subheadline */}
            <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
              {bannerSubtitle || (language === "fr" 
                ? "Explorez notre collection soigneusement sélectionnée d'électronique, de meubles et d'essentiels pour la maison."
                : "Explore our curated collection of electronics, furniture, and home essentials.")}
            </p>

            {/* CTA Button - Neumorphic */}
            <Link 
              to={bannerLink}
              onClick={() => handleCtaClick("explore-collection")}
              className="neu-button-primary text-lg px-10 py-5 group"
            >
              {bannerButtonText || (language === "fr" ? "Explorer Notre Collection" : "Explore Our Collection")}
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Right - Lifestyle Image */}
          <div className="relative animate-fade-up stagger-2">
            <div className="neu-card p-4 overflow-hidden">
              <img 
                src={bannerImage}
                alt={bannerTitle || "Modern living room with electronics and furniture"}
                className="w-full h-auto rounded-xl object-cover aspect-[4/3]"
              />
            </div>
            
            {/* Floating Badge */}
            <div className="absolute -bottom-4 -left-4 neu-card-flat px-5 py-3 flex items-center gap-2">
              <span className="w-3 h-3 bg-primary rounded-full animate-pulse" />
              <span className="text-sm font-medium text-foreground">
                {language === "fr" ? "Livraison Gratuite" : "Free Delivery"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
