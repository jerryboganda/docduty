import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SectionHeader from "@/components/shared/SectionHeader";
import RelatedPages from "@/components/shared/RelatedPages";
import PageWrapper from "@/components/shared/PageWrapper";
import { motion } from "framer-motion";
import { Shield, UserCheck, Lock, FileSearch, Eye, BarChart3, Scale, Bell, ArrowRight, MapPin, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getPortalRegisterUrl } from "@/lib/portal";

const pillars = [
  { icon: UserCheck, title: "Identity Verification", desc: "PMDC license verification, CNIC checks, and credential review for all doctors. Facility verification for all hospitals and clinics.", layer: "Layer 1" },
  { icon: Lock, title: "Role-Based Access", desc: "Doctors, facility admins, and platform admins have distinct access levels. No unauthorized actions.", layer: "Layer 2" },
  { icon: Eye, title: "Complete Audit Trails", desc: "Every action — booking, attendance, payment, dispute, override — is logged with timestamps and actor identity.", layer: "Layer 3" },
  { icon: Shield, title: "Attendance Anti-Fraud", desc: "Dual-layer geofence + rotating QR with GPS spoofing detection ensures legitimate physical presence.", layer: "Layer 4" },
  { icon: Scale, title: "Dispute Workflows", desc: "Structured, evidence-based dispute resolution with attendance data, geo logs, and communication records.", layer: "Layer 5" },
  { icon: BarChart3, title: "Reliability Scoring", desc: "Composite scoring from attendance, punctuality, completion rate, dispute history, and peer ratings.", layer: "Layer 6" },
  { icon: Bell, title: "Real-Time Monitoring", desc: "Live dashboards for platform operations, booking status, attendance events, and financial flows.", layer: "Layer 7" },
  { icon: FileSearch, title: "Policy Enforcement", desc: "Automated enforcement of cancellation, no-show, payout, and conduct policies across the platform.", layer: "Layer 8" },
];

const TrustSafety = () => {
  const portalRegisterUrl = getPortalRegisterUrl();

  return (
  <PageWrapper title="Trust & Safety — DocDuty" description="8 pillars of platform trust: identity verification, anti-fraud attendance, dispute resolution, and reliability scoring.">
  <div className="min-h-screen">
    <Navbar />
    <section className="pt-32 pb-20 bg-hero-pattern text-primary-foreground relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,hsl(168_76%_36%/0.06),transparent_50%)]" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <span className="inline-block text-[11px] font-bold tracking-[0.15em] uppercase mb-5 px-4 py-1.5 rounded-full bg-accent/15 text-accent border border-accent/20">Trust & Safety</span>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-[1.1]">
            Trust Is Our<br /><span className="text-gradient-shimmer">Operating System</span>
          </h1>
          <p className="text-lg text-primary-foreground/55 max-w-xl mx-auto">Every layer of DocDuty is designed to create verifiable trust between doctors, facilities, and the platform.</p>
        </motion.div>
      </div>
    </section>

    {/* Trust Architecture */}
    <section className="py-24 bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader badge="Trust Architecture" title="8 Pillars of" titleAccent="Platform Trust" description="Each layer independently strengthens the trust model. Together, they create an unbreakable chain of accountability." />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((p, i) => (
            <motion.div key={p.title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06, duration: 0.5 }} className="p-6 rounded-2xl border border-border bg-background hover:border-accent/20 transition-all duration-500 group card-hover-glow relative overflow-hidden">
              <span className="absolute top-3 right-3 text-[10px] font-bold text-accent/40 tracking-wider">{p.layer}</span>
              <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/10 flex items-center justify-center mb-4 group-hover:border-accent/25 transition-colors"><p.icon className="w-5 h-5 text-accent" /></div>
              <h3 className="font-heading font-semibold text-base mb-2 text-foreground">{p.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* Compliance badges */}
    <section className="py-16 bg-section-alt border-t border-border">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h3 className="font-heading font-bold text-xl text-foreground mb-8">Compliance & Standards</h3>
        <div className="flex flex-wrap justify-center gap-4">
          {["PMDC Verified", "KYC Compliant", "Bank-Grade Security", "Encrypted Data", "GDPR Aligned", "Audit Ready"].map((badge) => (
            <div key={badge} className="px-4 py-2.5 rounded-xl border border-border bg-card text-xs font-bold text-foreground flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-accent" /> {badge}
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="py-20 bg-section-dark text-primary-foreground">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">Trust Starts <span className="text-gradient-teal">Here</span></h2>
        <p className="text-primary-foreground/50 mb-8">Experience the most accountable healthcare staffing platform in Pakistan.</p>
        <a href={portalRegisterUrl}><Button size="lg" className="bg-accent text-accent-foreground hover:bg-teal-light font-semibold px-8 shadow-lg shadow-accent/20">Get Started <ArrowRight className="w-4 h-4 ml-1" /></Button></a>
      </div>
    </section>
    <RelatedPages pages={[
      { label: "Attendance Proof", href: "/attendance-proof", desc: "Geofence + QR anti-fraud verification", icon: MapPin },
      { label: "Disputes & Reliability", href: "/disputes-reliability", desc: "Evidence-based dispute resolution", icon: Scale },
      { label: "Payments & Escrow", href: "/payments-escrow", desc: "Secure financial settlement system", icon: CreditCard },
    ]} />
    <Footer />
  </div>
  </PageWrapper>
  );
};

export default TrustSafety;
