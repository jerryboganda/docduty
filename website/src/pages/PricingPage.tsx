import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SectionHeader from "@/components/shared/SectionHeader";
import RelatedPages from "@/components/shared/RelatedPages";
import PageWrapper from "@/components/shared/PageWrapper";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Sparkles, HelpCircle, Stethoscope, Building2, CreditCard } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { getPortalRegisterUrl } from "@/lib/portal";

const plans = [
  {
    name: "Doctor",
    price: "PKR 0",
    period: "Free forever",
    subtitle: "Free to join. Earn on every shift.",
    features: ["Free profile & verification", "Browse unlimited shifts", "Guaranteed escrow payouts", "Build reliability score", "Dispute protection", "Small platform fee on completed shifts"],
    cta: "Join as Doctor",
    featured: false,
  },
  {
    name: "Facility",
    price: "Pay-per-Shift",
    period: "Per successful placement",
    subtitle: "Pay only when a shift is successfully filled.",
    features: ["Unlimited shift postings", "Verified doctor matching", "Attendance proof included", "Escrow-backed payments", "Dispute resolution", "Operational dashboard", "Multi-location support"],
    cta: "Register Facility",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "Tailored pricing",
    subtitle: "For large hospital networks and health systems.",
    features: ["Volume pricing", "Dedicated account manager", "Custom SLA", "API access", "Advanced analytics", "Priority matching", "White-label options"],
    cta: "Contact Sales",
    featured: false,
  },
];

const pricingFaqs = [
  { q: "Are there any upfront fees?", a: "No. Doctors join for free. Facilities only pay when a shift is successfully filled." },
  { q: "What is the platform fee for doctors?", a: "A small transparent commission is deducted from each completed shift. The exact percentage is shown before you accept any shift." },
  { q: "Can facilities get volume discounts?", a: "Yes. Enterprise plans include volume pricing, dedicated support, and custom SLAs. Contact our sales team for details." },
  { q: "Is there a minimum commitment?", a: "No. Both doctors and facilities can use the platform without any long-term commitments." },
];

const PricingPage = () => {
  const doctorRegisterUrl = getPortalRegisterUrl("doctor");
  const facilityRegisterUrl = getPortalRegisterUrl("facility");

  return (
  <PageWrapper title="Pricing — DocDuty" description="Transparent pricing for doctors and facilities. Free for doctors, affordable plans for hospitals with no hidden fees.">
  <div className="min-h-screen">
    <Navbar />
    <section className="pt-32 pb-20 bg-hero-pattern text-primary-foreground relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_80%,hsl(168_76%_36%/0.06),transparent_50%)]" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <span className="inline-block text-[11px] font-bold tracking-[0.15em] uppercase mb-5 px-4 py-1.5 rounded-full bg-accent/15 text-accent border border-accent/20">Pricing</span>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-[1.1]">
            Transparent. Fair.<br /><span className="text-gradient-shimmer">Performance-Aligned.</span>
          </h1>
          <p className="text-lg text-primary-foreground/55 max-w-xl mx-auto">You only pay when the platform delivers. No upfront fees, no hidden charges.</p>
        </motion.div>
      </div>
    </section>

    <section className="py-24 bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div key={plan.name} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }}
              className={`rounded-2xl border p-8 relative overflow-hidden card-hover-glow ${plan.featured ? "border-2 border-accent" : "border-border"}`}>
              {plan.featured && (
                <div className="absolute -top-px left-0 right-0 flex justify-center">
                  <span className="px-4 py-1.5 bg-accent text-accent-foreground text-xs font-bold rounded-b-lg flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" /> Most Popular
                  </span>
                </div>
              )}
              {plan.featured && <div className="absolute -top-24 -right-24 w-48 h-48 bg-accent/10 rounded-full blur-[60px] pointer-events-none" />}
              <div className={plan.featured ? "mt-4" : ""}>
                <h3 className="font-heading font-bold text-xl text-foreground mb-1">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{plan.subtitle}</p>
                <p className="text-4xl font-heading font-bold text-foreground mb-1">{plan.price}</p>
                <p className="text-xs text-muted-foreground mb-6">{plan.period}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2.5 text-sm text-muted-foreground"><Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />{f}</li>
                  ))}
                </ul>
                {plan.name === "Enterprise" ? (
                  <Link to="/contact">
                    <Button className={`w-full h-12 font-semibold ${plan.featured ? "bg-accent text-accent-foreground hover:bg-teal-light shadow-lg shadow-accent/20" : ""}`} variant={plan.featured ? "default" : "outline"}>
                      {plan.cta} <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                ) : (
                  <a href={plan.name === "Doctor" ? doctorRegisterUrl : facilityRegisterUrl}>
                    <Button className={`w-full h-12 font-semibold ${plan.featured ? "bg-accent text-accent-foreground hover:bg-teal-light shadow-lg shadow-accent/20" : ""}`} variant={plan.featured ? "default" : "outline"}>
                      {plan.cta} <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* Pricing FAQ */}
    <section className="py-24 bg-section-alt">
      <div className="max-w-3xl mx-auto px-4">
        <SectionHeader badge="Pricing FAQ" title="Common" titleAccent="Questions" />
        <Accordion type="single" collapsible className="space-y-3">
          {pricingFaqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="border rounded-xl px-6 bg-card hover:border-accent/20 transition-colors">
              <AccordionTrigger className="text-left font-heading font-semibold text-sm hover:no-underline py-5">{faq.q}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">{faq.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
    <RelatedPages pages={[
      { label: "For Doctors", href: "/for-doctors", desc: "Benefits and earnings calculator for doctors", icon: Stethoscope },
      { label: "For Hospitals", href: "/for-hospitals", desc: "ROI metrics and enterprise plans", icon: Building2 },
      { label: "Payments & Escrow", href: "/payments-escrow", desc: "How escrow-backed payments work", icon: CreditCard },
    ]} />
    <Footer />
  </div>
  </PageWrapper>
  );
};

export default PricingPage;
