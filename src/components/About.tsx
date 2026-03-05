import { Sparkles } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

const About = () => {
  const { t } = useLanguage();

  return (
    <section id="about" className="section-luxury bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <span className="text-primary text-sm font-medium tracking-[0.2em] uppercase mb-4 block">
              {t.about.label}
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground mb-6">
              {t.about.title}
            </h2>
          </div>

          {/* Content */}
          <div className="prose prose-lg mx-auto text-center">
            <p className="text-muted-foreground leading-relaxed text-lg mb-8">
              <strong className="text-foreground">Ashish SARL</strong> {t.about.p1}
            </p>
            <p className="text-muted-foreground leading-relaxed text-lg mb-8">
              {t.about.p2}{" "}
              <span className="text-primary font-medium">{t.about.p2Highlight}</span>.
            </p>
            <p className="text-muted-foreground leading-relaxed text-lg">
              {t.about.p3}
            </p>
          </div>

          {/* Brand Promise */}
          <div className="mt-16 p-8 md:p-12 bg-primary text-white rounded-sm text-center">
            <Sparkles className="w-10 h-10 text-white mx-auto mb-6" />
            <blockquote className="text-2xl md:text-3xl font-serif italic mb-4">
              "{t.about.quote}"
            </blockquote>
            <p className="text-white/70">{t.about.quoteAuthor}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
