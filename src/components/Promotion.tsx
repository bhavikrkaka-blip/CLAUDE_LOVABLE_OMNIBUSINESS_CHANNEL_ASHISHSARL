import { ArrowRight, Clock, Sparkles } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

const Promotion = () => {
  const { t } = useLanguage();

  return (
    <section className="py-16 md:py-24 bg-primary relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 lg:px-8 relative">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/30 rounded-full mb-8">
            <Sparkles className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-medium">{t.promotion.badge}</span>
          </div>

          {/* Main Offer */}
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white mb-6">
            <span className="text-white">{t.promotion.title1}</span> {t.promotion.title2}
            <br />
            {t.promotion.title3}
          </h2>

          <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
            {t.promotion.subtitle}
          </p>

          {/* Urgency */}
          <div className="flex items-center justify-center gap-6 mb-10 flex-wrap">
            <div className="flex items-center gap-2 text-white/70">
              <Clock className="w-5 h-5 text-white" />
              <span>{t.promotion.whileStock}</span>
            </div>
            <div className="h-4 w-px bg-white/20 hidden sm:block" />
            <span className="text-white/70">{t.promotion.delivery}</span>
          </div>

          {/* CTA */}
          <a href="#categories" className="inline-flex items-center justify-center gap-2 px-8 py-4 font-medium text-base transition-all duration-300 bg-white text-primary rounded-sm hover:bg-white/90 hover:shadow-lg hover:-translate-y-0.5 group">
            {t.promotion.cta}
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default Promotion;
