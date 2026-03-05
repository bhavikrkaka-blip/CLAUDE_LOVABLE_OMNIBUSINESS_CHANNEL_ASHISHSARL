import Header from "@/components/Header";
import Hero from "@/components/Hero";
import PromoBanner from "@/components/PromoBanner";
import CategoryDeck from "@/components/CategoryDeck";
import FeaturedProducts from "@/components/FeaturedProducts";
import TrustBadges from "@/components/TrustBadges";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        <PromoBanner />
        <Hero />
        <CategoryDeck />
        <FeaturedProducts />
        <TrustBadges />
        <Contact />
      </main>
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
};

export default Index;
