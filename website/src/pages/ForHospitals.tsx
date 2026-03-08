import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SectionHeader from "@/components/shared/SectionHeader";
import RelatedPages from "@/components/shared/RelatedPages";
import PageWrapper from "@/components/shared/PageWrapper";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, UserCheck, ShieldCheck, BarChart3, FileCheck, CreditCard, MapPin, Building2, Check, X, Stethoscope } from "lucide-react";
import { getPortalRegisterUrl } from "@/lib/portal";

const benefits = [
  { icon: Clock, title: "Fill Shifts in Hours", desc: "Automated matching finds verified doctors for urgent duty gaps within 1–3 hours." },
  { icon: UserCheck, title: "Verified Professionals", desc: "Every doctor is PMDC-verified, KYC-checked, and reliability-scored." },
  { icon: ShieldCheck, title: "Attendance Proof", desc: "Geofence + rotating QR ensures verified physical presence with timestamps." },
  { icon: CreditCard, title: "Financial Control", desc: "Escrow-backed payments, transparent fees, and complete payout oversight." },
  { icon: BarChart3, title: "Operational Analytics", desc: "Real-time dashboards with booking trends, fill rates, and doctor performance." },
  { icon: FileCheck, title: "Compliance Ready", desc: "Full audit trails for every booking, attendance event, and financial transaction." },
  { icon: MapPin, title: "Multi-Location Support", desc: "Manage multiple hospital locations with independent geofences and QR codes." },
  { icon: Building2, title: "Enterprise Plans", desc: "Custom pricing, dedicated support, and advanced features for large hospital networks." },
];

const comparison = [
  { feature: "Time to fill shift", without: "12–48 hours", with: "1–3 hours" },
  { feature: "Doctor verification", without: "None / informal", with: "PMDC + KYC verified" },
  { feature: "Attendance proof", without: "Self-reported", with: "Geofence + QR" },
  { feature: "Payment security", without: "Verbal agreement", with: "Escrow-backed" },
  { feature: "Dispute resolution", without: "None", with: "Evidence-based" },
  { feature: "Audit trail", without: "No records", with: "Complete digital log" },
  { feature: "Reliability data", without: "Unknown", with: "Scored & ranked" },
];

const roiMetrics = [
  { label: "Faster Shift Coverage", value: "6x", desc: "Average time reduction" },
  { label: "Coverage Rate", value: "97.8%", desc: "Shifts successfully filled" },
  { label: "Payment Disputes", value: "< 1%", desc: "With escrow protection" },
  { label: "Admin Time Saved", value: "15hrs", desc: "Per week on staffing" },
];

const ForHospitals = () => {
  const facilityRegisterUrl = getPortalRegisterUrl("facility");

  return (
  <PageWrapper title="For Hospitals — DocDuty" description="Fill urgent doctor shifts in hours. Verified professionals, attendance proof, and financial control for hospitals and clinics across Pakistan.">
  <div className="min-h-screen">
    <Navbar />
    <section className="pt-32 pb-20 bg-hero-pattern text-primary-foreground relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,hsl(168_76%_36%/0.06),transparent_50%)]" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <span className="inline-block text-[11px] font-bold tracking-[0.15em] uppercase mb-5 px-4 py-1.5 rounded-full bg-accent/15 text-accent border border-accent/20">For Hospitals & Facilities</span>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-[1.1]">
              Never Miss a Shift.<br /><span className="text-gradient-shimmer">Staffing, Guaranteed.</span>
            </h1>
            <p className="text-lg text-primary-foreground/55 mb-8 max-w-xl">Replace the phone-call scramble with a verified, accountable, technology-driven staffing platform that fills gaps fast.</p>
            <a href={facilityRegisterUrl}><Button size="lg" className="bg-accent text-accent-foreground hover:bg-teal-light font-semibold px-8 shadow-lg shadow-accent/20 group">Register Facility <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" /></Button></a>
          </motion.div>
        </div>
      </div>
    </section>

    {/* ROI Metrics */}
    <section className="py-12 bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {roiMetrics.map((m, i) => (
            <motion.div key={m.label} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center p-4">
              <p className="font-heading font-bold text-3xl lg:text-4xl text-accent">{m.value}</p>
              <p className="font-heading font-semibold text-sm text-foreground mt-1">{m.label}</p>
              <p className="text-xs text-muted-foreground">{m.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* Benefits */}
    <section className="py-24 bg-section-gradient">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader badge="Why DocDuty" title="Enterprise-Grade Staffing" titleAccent="Operations" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((b, i) => (
            <motion.div key={b.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="p-6 rounded-2xl border border-border bg-card hover:border-accent/20 transition-all duration-500 group card-hover-glow">
              <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/10 flex items-center justify-center mb-4 group-hover:border-accent/25 transition-colors"><b.icon className="w-5 h-5 text-accent" /></div>
              <h3 className="font-heading font-semibold text-base mb-2 text-foreground">{b.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* Comparison Table */}
    <section className="py-24 bg-card">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader badge="The Difference" title="With DocDuty vs" titleAccent="Without" />
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-2xl border border-border overflow-hidden">
          <div className="grid grid-cols-3 bg-secondary p-4 text-xs font-bold text-foreground uppercase tracking-wider">
            <span>Feature</span>
            <span className="text-center">Without DocDuty</span>
            <span className="text-center">With DocDuty</span>
          </div>
          {comparison.map((row, i) => (
            <div key={row.feature} className={`grid grid-cols-3 p-4 text-sm items-center ${i % 2 === 0 ? 'bg-card' : 'bg-secondary/50'}`}>
              <span className="font-semibold text-foreground">{row.feature}</span>
              <span className="text-center text-muted-foreground flex items-center justify-center gap-1.5"><X className="w-3.5 h-3.5 text-destructive" />{row.without}</span>
              <span className="text-center text-foreground font-medium flex items-center justify-center gap-1.5"><Check className="w-3.5 h-3.5 text-accent" />{row.with}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>

    {/* CTA */}
    <section className="py-20 bg-section-dark text-primary-foreground">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">Ready to Modernize Your <span className="text-gradient-teal">Staffing?</span></h2>
        <p className="text-primary-foreground/50 mb-8">Join 350+ facilities already using DocDuty.</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <a href={facilityRegisterUrl}><Button size="lg" className="bg-accent text-accent-foreground hover:bg-teal-light font-semibold px-8 shadow-lg shadow-accent/20">Register Facility <ArrowRight className="w-4 h-4 ml-1" /></Button></a>
          <Link to="/contact"><Button size="lg" className="bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20">Contact Sales</Button></Link>
        </div>
      </div>
    </section>
    <RelatedPages pages={[
      { label: "Attendance Proof", href: "/attendance-proof", desc: "Geofence + QR verification for shift accountability", icon: MapPin },
      { label: "Pricing", href: "/pricing", desc: "Transparent plans for doctors and facilities", icon: CreditCard },
      { label: "For Doctors", href: "/for-doctors", desc: "How doctors benefit from DocDuty", icon: Stethoscope },
    ]} />
    <Footer />
  </div>
  </PageWrapper>
  );
};

export default ForHospitals;
