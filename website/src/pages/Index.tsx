import { useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import TrustBar from "@/components/home/TrustBar";
import ProblemSection from "@/components/home/ProblemSection";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import ForDoctorsSection from "@/components/home/ForDoctorsSection";
import ForFacilitiesSection from "@/components/home/ForFacilitiesSection";
import MarketplaceShowcase from "@/components/home/MarketplaceShowcase";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import AttendanceSection from "@/components/home/AttendanceSection";
import PaymentsSection from "@/components/home/PaymentsSection";
import DisputesSection from "@/components/home/DisputesSection";
import PakistanCoverage from "@/components/home/PakistanCoverage";
import PricingPreview from "@/components/home/PricingPreview";
import FAQPreview from "@/components/home/FAQPreview";
import FinalCTA from "@/components/home/FinalCTA";
import { PUBLIC_SUPPORT_PHONE } from "@/lib/support";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "DocDuty",
      url: "https://docduty.pk",
      logo: "https://docduty.pk/favicon.ico",
      description: "Pakistan's trusted doctor duty replacement and locum marketplace.",
      contactPoint: {
        "@type": "ContactPoint",
        email: "hello@docduty.pk",
        telephone: PUBLIC_SUPPORT_PHONE,
        contactType: "customer service",
        areaServed: "PK",
      },
      sameAs: [],
    },
    {
      "@type": "WebSite",
      name: "DocDuty",
      url: "https://docduty.pk",
      potentialAction: {
        "@type": "SearchAction",
        target: "https://docduty.pk/search?q={search_term_string}",
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

const Index = () => {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(jsonLd);
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

  return (
    <div className="min-h-screen" id="main" role="main">
      <Navbar />
      <HeroSection />
      <TrustBar />
      <ProblemSection />
      <HowItWorksSection />
      <ForDoctorsSection />
      <ForFacilitiesSection />
      <MarketplaceShowcase />
      <TestimonialsSection />
      <AttendanceSection />
      <PaymentsSection />
      <DisputesSection />
      <PakistanCoverage />
      <PricingPreview />
      <FAQPreview />
      <FinalCTA />
      <Footer />
    </div>
  );
};

export default Index;
