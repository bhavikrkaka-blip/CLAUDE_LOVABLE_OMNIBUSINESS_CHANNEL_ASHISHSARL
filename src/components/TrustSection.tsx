import { Star, Quote } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

const TrustSection = () => {
  const { t } = useLanguage();

  return (
    <section className="section-luxury bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Google Rating Highlight */}
        <div className="text-center mb-16">
          <div className="inline-flex flex-col items-center gap-4 p-8 bg-background rounded-sm shadow-md">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-8 h-8 text-primary fill-primary" />
              ))}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-serif font-bold text-primary">5.0</span>
              <span className="text-muted-foreground">{t.trust.googleRating}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {t.trust.trustedBy}
            </p>
          </div>
        </div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-3 gap-8">
          {t.trust.testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-background p-8 rounded-sm shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <Quote className="w-10 h-10 text-primary/30 mb-4" />
              <p className="text-foreground/80 mb-6 italic leading-relaxed">
                "{testimonial.text}"
              </p>
              <div className="flex items-center justify-between">
                <span className="font-medium text-primary">{testimonial.name}</span>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-primary fill-primary" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Location Banner */}
        <div className="mt-16 text-center">
          <p className="text-lg text-muted-foreground">
            {t.trust.servingFrom}{" "}
            <span className="text-primary font-medium">Central Market</span> &{" "}
            <span className="text-primary font-medium">Central Mall</span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
