import { MapPin, Phone, Clock, Navigation, MessageCircle } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

const Contact = () => {
  const { t, language } = useLanguage();

  return (
    <section id="contact" className="py-20 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-14 animate-fade-up">
          <span className="text-primary text-sm font-medium tracking-[0.2em] uppercase mb-4 block">
            {t.contact.label}
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground mb-6">
            {t.contact.title}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t.contact.subtitle}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Locations - Neumorphic Cards */}
          <div className="lg:col-span-2">
            <div className="grid md:grid-cols-3 gap-6">
              {t.contact.locations.map((location, index) => (
                <div
                  key={index}
                  className="neu-card text-center animate-fade-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4 shadow-neu-inset-sm">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-serif font-bold text-foreground mb-2">
                    {location.name}
                  </h3>
                  <p className="text-muted-foreground text-sm">{location.address}</p>
                </div>
              ))}
            </div>

            {/* Map */}
            <div className="mt-8 neu-card p-2 overflow-hidden">
              <div className="aspect-[16/9] rounded-xl overflow-hidden">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3980.7884894855716!2d11.516666315259065!3d3.866666996169164!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x108bcf7a309a7977%3A0x7c8dd2d4e1c3c2f0!2sMarch%C3%A9%20Central%2C%20Yaound%C3%A9%2C%20Cameroon!5e0!3m2!1sen!2sus!4v1647891234567!5m2!1sen!2sus"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Ashish SARL Location"
                />
              </div>
            </div>
          </div>

          {/* Contact Info - Neumorphic */}
          <div className="space-y-6">
            {/* Phone Card */}
            <div className="neu-card-flat bg-primary text-white p-6">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-4">
                <Phone className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-serif font-bold mb-2">{t.contact.callUs}</h3>
              <a
                href="tel:+237673750693"
                className="text-2xl font-bold text-white hover:text-white/80 transition-colors"
              >
                6 73 75 06 93
              </a>
            </div>

            {/* Hours Card */}
            <div className="neu-card">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 shadow-neu-inset-sm">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-serif font-bold text-foreground mb-2">
                {t.contact.openingHours}
              </h3>
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">{t.contact.openDaily}</span>
                <br />
                07:30 AM – 06:30 PM
              </p>
            </div>

            {/* Action Buttons - Neumorphic */}
            <div className="space-y-3">
              <a
                href="tel:+237673750693"
                className="neu-button-primary w-full justify-center"
              >
                <Phone className="w-5 h-5" />
                {t.contact.callNow}
              </a>
              <a
                href="https://wa.me/237673750693"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 font-semibold text-base transition-all duration-300 bg-[#25D366] text-white rounded-full hover:bg-[#128C7E]"
                style={{ boxShadow: 'var(--shadow-neu-raised), 0 4px 20px rgba(37, 211, 102, 0.3)' }}
              >
                <MessageCircle className="w-5 h-5" />
                {t.contact.whatsappUs}
              </a>
              <a
                href="https://www.google.com/maps/dir//Marché+Central,+Yaoundé,+Cameroon"
                target="_blank"
                rel="noopener noreferrer"
                className="neu-button w-full justify-center text-foreground"
              >
                <Navigation className="w-5 h-5 text-primary" />
                {t.contact.getDirections}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
