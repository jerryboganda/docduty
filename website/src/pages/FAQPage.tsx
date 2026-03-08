import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SectionHeader from "@/components/shared/SectionHeader";
import RelatedPages from "@/components/shared/RelatedPages";
import PageWrapper from "@/components/shared/PageWrapper";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Stethoscope, CreditCard, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const categories = [
  {
    title: "For Doctors",
    faqs: [
      { q: "How do I sign up as a doctor?", a: "Register on the platform, submit your PMDC license number, CNIC, and professional credentials. Our team verifies your identity within 24–48 hours." },
      { q: "How do I find shifts near me?", a: "Use the shift marketplace to filter by city, specialty, date, and pay range. You'll also receive notifications for matching shifts." },
      { q: "When do I get paid?", a: "Payment is released to your wallet after shift completion and attendance verification. You can withdraw to your bank account anytime." },
      { q: "Can I negotiate shift rates?", a: "Yes. You can submit counter-offers on rate and timing. The facility can accept, reject, or counter." },
    ],
  },
  {
    title: "For Facilities",
    faqs: [
      { q: "How quickly can a shift be filled?", a: "Most urgent shifts are matched within 1–3 hours. Our system prioritizes by specialty, proximity, and reliability score." },
      { q: "How are doctors verified?", a: "All doctors undergo PMDC license verification, CNIC identity checks, and credential review before they can accept shifts." },
      { q: "Can I manage multiple locations?", a: "Yes. Add multiple facility locations, each with independent geofences and QR code management." },
      { q: "What if a doctor doesn't show up?", a: "No-shows are automatically detected via the attendance system. Escrow funds are returned and the doctor's reliability score is impacted." },
    ],
  },
  {
    title: "Payments",
    faqs: [
      { q: "How does escrow work?", a: "When a booking is confirmed, the shift fee is held in platform escrow. After attendance verification, the platform fee is deducted and the remainder is released to the doctor." },
      { q: "What are the platform fees?", a: "A transparent commission is deducted from each completed shift. Both parties see the exact breakdown before confirming." },
      { q: "How do refunds work?", a: "Cancellations within policy windows trigger automated refunds. Late cancellations may incur partial fees per platform policy." },
    ],
  },
  {
    title: "Attendance & Disputes",
    faqs: [
      { q: "How does attendance verification work?", a: "Doctors check in using a dual-layer system: GPS within the facility's geofence AND scanning a time-limited rotating QR code at the facility." },
      { q: "What if there's a dispute?", a: "Disputes are reviewed using attendance logs, geofence data, QR scans, and communication records. Resolutions are evidence-based and fair." },
      { q: "What is the reliability score?", a: "A composite score built from attendance percentage, punctuality, completion rate, dispute outcomes, and peer ratings." },
    ],
  },
];

const FAQPage = () => (
  <PageWrapper title="FAQ — DocDuty" description="Frequently asked questions about DocDuty for doctors, facilities, payments, and platform policies.">
  <div className="min-h-screen">
    <Navbar />
    <section className="pt-32 pb-20 bg-hero-pattern text-primary-foreground relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_80%,hsl(168_76%_36%/0.06),transparent_50%)]" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <span className="inline-block text-[11px] font-bold tracking-[0.15em] uppercase mb-5 px-4 py-1.5 rounded-full bg-accent/15 text-accent border border-accent/20">FAQ</span>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-[1.1]">
            Frequently Asked<br /><span className="text-gradient-shimmer">Questions</span>
          </h1>
          <p className="text-lg text-primary-foreground/55 max-w-xl mx-auto">Everything you need to know about DocDuty.</p>
        </motion.div>
      </div>
    </section>

    <section className="py-24 bg-card">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {categories.map((cat, ci) => (
          <motion.div key={cat.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: ci * 0.1 }}>
            <h2 className="font-heading font-bold text-2xl text-foreground mb-6 flex items-center gap-3">
              <div className="w-1 h-6 rounded-full bg-accent" />
              {cat.title}
            </h2>
            <Accordion type="single" collapsible className="space-y-3">
              {cat.faqs.map((faq, i) => (
                <AccordionItem key={i} value={`${cat.title}-${i}`} className="border rounded-xl px-6 bg-background hover:border-accent/20 transition-colors data-[state=open]:border-accent/30 data-[state=open]:shadow-lg data-[state=open]:shadow-accent/5">
                  <AccordionTrigger className="text-left font-heading font-semibold text-sm hover:no-underline py-5">{faq.q}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        ))}
      </div>
    </section>

    <section className="py-20 bg-section-dark text-primary-foreground">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">Still Have <span className="text-gradient-teal">Questions?</span></h2>
        <p className="text-primary-foreground/50 mb-8">Our team is ready to help.</p>
        <Link to="/contact"><Button size="lg" className="bg-accent text-accent-foreground hover:bg-teal-light font-semibold px-8 shadow-lg shadow-accent/20">Contact Us <ArrowRight className="w-4 h-4 ml-1" /></Button></Link>
      </div>
    </section>
    <RelatedPages pages={[
      { label: "For Doctors", href: "/for-doctors", desc: "Benefits and getting started for doctors", icon: Stethoscope },
      { label: "Pricing", href: "/pricing", desc: "Transparent plans and fee structure", icon: CreditCard },
      { label: "Trust & Safety", href: "/trust-safety", desc: "Platform trust and safety architecture", icon: Shield },
    ]} />
    <Footer />
  </div>
  </PageWrapper>
);

export default FAQPage;
