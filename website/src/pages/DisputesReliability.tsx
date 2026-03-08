import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SectionHeader from "@/components/shared/SectionHeader";
import RelatedPages from "@/components/shared/RelatedPages";
import PageWrapper from "@/components/shared/PageWrapper";
import { motion } from "framer-motion";
import { Scale, FileSearch, Star, TrendingUp, MessageSquare, Shield, AlertTriangle, CheckCircle, ArrowRight, MapPin, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getPortalRegisterUrl } from "@/lib/portal";

const features = [
  { icon: FileSearch, title: "Evidence-Based Review", desc: "Every dispute is reviewed using attendance logs, geofence data, QR scans, timestamps, and communication records." },
  { icon: Scale, title: "Structured Resolution", desc: "Clear workflow: submission, evidence review, decision, outcome. Partial refund, full settlement, or re-arbitration." },
  { icon: Star, title: "Mutual Ratings", desc: "After every shift, both doctors and facilities rate each other. Ratings build marketplace trust." },
  { icon: TrendingUp, title: "Reliability Score", desc: "Composite score from attendance %, punctuality, completion rate, dispute outcomes, and peer ratings." },
  { icon: MessageSquare, title: "Contextual Communication", desc: "All messages are booking-linked. Creates clear communication trails for dispute evidence." },
  { icon: Shield, title: "Policy Enforcement", desc: "Cancellation, no-show, and conduct policies are enforced automatically with transparent rules." },
  { icon: AlertTriangle, title: "Flagging System", desc: "Repeated violations trigger warnings, restrictions, or suspension based on severity tiers." },
  { icon: CheckCircle, title: "Fair Outcomes", desc: "Resolution decisions consider all evidence equally. Both parties can appeal with additional evidence." },
];

const disputeFlow = [
  { step: "1", title: "Dispute Filed", desc: "Either party submits dispute within 48 hours with description and evidence." },
  { step: "2", title: "Evidence Collected", desc: "Platform gathers attendance logs, geo data, QR scans, and communications." },
  { step: "3", title: "Review & Decision", desc: "Operations team reviews all evidence and reaches a fair resolution." },
  { step: "4", title: "Outcome Applied", desc: "Full payment, partial refund, or full refund — with reliability score impact." },
];

const DisputesReliability = () => {
  const portalRegisterUrl = getPortalRegisterUrl();

  return (
  <PageWrapper title="Disputes & Reliability — DocDuty" description="Evidence-based dispute resolution and composite reliability scoring for fair, transparent healthcare staffing.">
  <div className="min-h-screen">
    <Navbar />
    <section className="pt-32 pb-20 bg-hero-pattern text-primary-foreground relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_80%,hsl(168_76%_36%/0.06),transparent_50%)]" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <span className="inline-block text-[11px] font-bold tracking-[0.15em] uppercase mb-5 px-4 py-1.5 rounded-full bg-accent/15 text-accent border border-accent/20">Disputes & Reliability</span>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-[1.1]">
            Accountability That<br /><span className="text-gradient-shimmer">Builds Trust</span>
          </h1>
          <p className="text-lg text-primary-foreground/55 max-w-xl mx-auto">A comprehensive dispute resolution and reliability system that protects both doctors and facilities with evidence-based fairness.</p>
        </motion.div>
      </div>
    </section>

    {/* Dispute flow */}
    <section className="py-16 bg-card border-b border-border">
      <div className="max-w-4xl mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {disputeFlow.map((item, i) => (
            <motion.div key={item.step} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center p-5 rounded-2xl bg-accent/[0.03] border border-accent/10">
              <div className="w-10 h-10 rounded-full bg-accent/15 border border-accent/20 flex items-center justify-center mx-auto mb-3">
                <span className="font-heading font-bold text-sm text-accent">{item.step}</span>
              </div>
              <h4 className="font-heading font-semibold text-sm text-foreground mb-1">{item.title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    <section className="py-24 bg-section-gradient">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader badge="Trust System" title="Resolution &" titleAccent="Reliability" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="p-6 rounded-2xl border border-border bg-card hover:border-accent/20 transition-all duration-500 group card-hover-glow">
              <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/10 flex items-center justify-center mb-4 group-hover:border-accent/25 transition-colors"><f.icon className="w-5 h-5 text-accent" /></div>
              <h3 className="font-heading font-semibold text-base mb-2 text-foreground">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    <section className="py-20 bg-section-dark text-primary-foreground">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">Fair Resolution <span className="text-gradient-teal">Guaranteed</span></h2>
        <p className="text-primary-foreground/50 mb-8">Every dispute is handled with transparency and evidence.</p>
        <a href={portalRegisterUrl}><Button size="lg" className="bg-accent text-accent-foreground hover:bg-teal-light font-semibold px-8 shadow-lg shadow-accent/20">Get Started <ArrowRight className="w-4 h-4 ml-1" /></Button></a>
      </div>
    </section>
    <RelatedPages pages={[
      { label: "Attendance Proof", href: "/attendance-proof", desc: "Verification data used as dispute evidence", icon: MapPin },
      { label: "Payments & Escrow", href: "/payments-escrow", desc: "Financial settlement after resolution", icon: CreditCard },
      { label: "Trust & Safety", href: "/trust-safety", desc: "Complete platform trust architecture", icon: Shield },
    ]} />
    <Footer />
  </div>
  </PageWrapper>
  );
};

export default DisputesReliability;
