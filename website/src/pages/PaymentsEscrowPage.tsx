import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SectionHeader from "@/components/shared/SectionHeader";
import RelatedPages from "@/components/shared/RelatedPages";
import PageWrapper from "@/components/shared/PageWrapper";
import { motion } from "framer-motion";
import { Lock, CheckCircle2, Receipt, Banknote, RotateCcw, Wallet, Shield, FileText, ArrowRight, ArrowDown, MapPin, Scale } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getPortalRegisterUrl } from "@/lib/portal";

const flowSteps = [
  { icon: Lock, title: "Escrow Hold", desc: "When a booking is confirmed, the shift fee is held in platform escrow. Neither party can access until conditions are met.", amount: "PKR 15,000" },
  { icon: CheckCircle2, title: "Attendance Triggers Settlement", desc: "Verified check-in and check-out via geofence + QR automatically marks the shift as eligible for settlement.", status: "Verified" },
  { icon: Receipt, title: "Transparent Fee Deduction", desc: "Platform commission is deducted transparently. Both parties see the exact fee breakdown before and after.", amount: "- PKR 750" },
  { icon: Banknote, title: "Doctor Payout", desc: "Net amount is released to the doctor's DocDuty wallet. Full transaction record is created.", amount: "PKR 14,250" },
];

const additionalFeatures = [
  { icon: Wallet, title: "Wallet & Withdrawals", desc: "Doctors maintain a platform wallet with complete transaction history. Withdraw to bank account anytime." },
  { icon: RotateCcw, title: "Refund Logic", desc: "Policy-based automated refunds for cancellations within defined windows. Fair to both parties." },
  { icon: Shield, title: "Financial Security", desc: "Bank-grade security for all fund movements. Encrypted, audited, and compliant." },
  { icon: FileText, title: "Complete Ledger", desc: "Every financial event is recorded in the platform ledger with timestamps, actors, and amounts." },
];

const PaymentsEscrowPage = () => {
  const portalRegisterUrl = getPortalRegisterUrl();

  return (
  <PageWrapper title="Payments & Escrow — DocDuty" description="Secure escrow-backed payment settlement for healthcare shifts. Transparent fees, automated payouts, and full financial audit trails.">
  <div className="min-h-screen">
    <Navbar />
    <section className="pt-32 pb-20 bg-hero-pattern text-primary-foreground relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_80%,hsl(168_76%_36%/0.06),transparent_50%)]" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <span className="inline-block text-[11px] font-bold tracking-[0.15em] uppercase mb-5 px-4 py-1.5 rounded-full bg-accent/15 text-accent border border-accent/20">Payments & Escrow</span>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-[1.1]">
            Secure. Transparent.<br /><span className="text-gradient-shimmer">Fully Automated.</span>
          </h1>
          <p className="text-lg text-primary-foreground/55 max-w-xl mx-auto">Platform-mediated financial operations eliminate payment disputes and ensure fair, timely compensation for every completed shift.</p>
        </motion.div>
      </div>
    </section>

    {/* Visual Payment Flow */}
    <section className="py-24 bg-card">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader badge="Payment Flow" title="From Escrow to" titleAccent="Settlement" />
        {flowSteps.map((step, i) => (
          <motion.div key={step.title} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12, duration: 0.5 }} className="relative flex gap-5 pb-10 last:pb-0">
            {i < flowSteps.length - 1 && (
              <div className="absolute left-[23px] top-14 w-0.5 h-[calc(100%-32px)] bg-border overflow-hidden">
                <motion.div initial={{ height: 0 }} whileInView={{ height: "100%" }} viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.15, duration: 0.6 }} className="w-full bg-gradient-to-b from-accent to-accent/30" />
              </div>
            )}
            <motion.div initial={{ scale: 0.8 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.12, type: "spring", stiffness: 300 }} className="w-12 h-12 rounded-xl bg-accent/10 border-2 border-accent/20 flex items-center justify-center shrink-0 relative z-10 bg-card">
              <step.icon className="w-5 h-5 text-accent" />
            </motion.div>
            <div className="pt-1 flex-1">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-heading font-semibold text-base text-foreground">{step.title}</h3>
                {step.amount && <span className={`font-heading font-bold text-sm tabular-nums ${step.amount.startsWith("-") ? "text-destructive" : "text-accent"}`}>{step.amount}</span>}
                {step.status && <span className="text-xs font-bold text-success bg-success/10 px-2.5 py-0.5 rounded-full">{step.status} ✓</span>}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>

    {/* Additional features */}
    <section className="py-24 bg-section-gradient">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader badge="Financial Infrastructure" title="Complete Payment" titleAccent="Ecosystem" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {additionalFeatures.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="p-6 rounded-2xl border border-border bg-card hover:border-accent/20 transition-all duration-500 group card-hover-glow">
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
        <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">Secure Payments <span className="text-gradient-teal">Start Here</span></h2>
        <p className="text-primary-foreground/50 mb-8">Join thousands trusting DocDuty for transparent healthcare payments.</p>
        <a href={portalRegisterUrl}><Button size="lg" className="bg-accent text-accent-foreground hover:bg-teal-light font-semibold px-8 shadow-lg shadow-accent/20">Get Started <ArrowRight className="w-4 h-4 ml-1" /></Button></a>
      </div>
    </section>
    <RelatedPages pages={[
      { label: "Attendance Proof", href: "/attendance-proof", desc: "Verification that triggers payment release", icon: MapPin },
      { label: "Disputes & Reliability", href: "/disputes-reliability", desc: "Resolution for payment disputes", icon: Scale },
      { label: "Pricing", href: "/pricing", desc: "Transparent fee structure and plans", icon: Receipt },
    ]} />
    <Footer />
  </div>
  </PageWrapper>
  );
};

export default PaymentsEscrowPage;
