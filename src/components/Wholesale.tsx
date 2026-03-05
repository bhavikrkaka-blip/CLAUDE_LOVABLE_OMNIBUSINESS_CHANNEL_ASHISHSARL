import { Check, ArrowRight, Package, TrendingUp, Truck, Shield } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

const Wholesale = () => {
  const { t } = useLanguage();

  const icons = [TrendingUp, Shield, Truck, Package];

  return (
    <section id="wholesale" className="section-luxury bg-secondary">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div>
            <span className="text-primary text-sm font-medium tracking-[0.2em] uppercase mb-4 block">
              {t.wholesale.label}
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground mb-6">
              {t.wholesale.title1}
              <br />
              <span className="text-primary">{t.wholesale.title2}</span>
              <br />
              {t.wholesale.title3}
            </h2>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              {t.wholesale.subtitle}
            </p>

            {/* Benefits Grid */}
            <div className="grid sm:grid-cols-2 gap-6 mb-10">
              {t.wholesale.benefits.map((benefit, index) => {
                const Icon = icons[index];
                return (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-sm bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground mb-1">{benefit.title}</h3>
                      <p className="text-sm text-muted-foreground">{benefit.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CTA */}
            <a
              href="https://wa.me/237673750693?text=Hello%2C%20I%27m%20interested%20in%20wholesale%20pricing"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-red inline-flex group"
            >
              {t.wholesale.cta}
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </a>
          </div>

          {/* Ideal For Card */}
          <div className="bg-white p-8 md:p-12 rounded-sm border border-border shadow-md">
            <h3 className="text-2xl font-serif font-bold text-foreground mb-8">{t.wholesale.idealFor}</h3>
            <div className="grid gap-4">
              {t.wholesale.idealForList.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 bg-secondary rounded-sm"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <span className="font-medium text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Wholesale;
