import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SectionHeader from "@/components/shared/SectionHeader";
import RelatedPages from "@/components/shared/RelatedPages";
import PageWrapper from "@/components/shared/PageWrapper";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Users, Building2, CreditCard, MapPin, FileCheck, MessageSquare, BarChart3, Zap, Lock, QrCode, ChevronRight, Stethoscope, Clock } from "lucide-react";
import { getPortalRegisterUrl } from "@/lib/portal";

const features = [
  { icon: Zap, title: "Shift Marketplace", desc: "Post and discover duty replacement, locum, and vacancy shifts across Pakistan in real-time." },
  { icon: Users, title: "Verified Matching", desc: "Automated matching by specialty, city, availability, and reliability score. Counter-offer support." },
  { icon: MapPin, title: "Attendance Proof", desc: "Dual-layer geofence + rotating QR verification creates irrefutable proof of doctor presence." },
  { icon: Lock, title: "Escrow Payments", desc: "Funds held in escrow until shift completion. Transparent fees, automated settlement." },
  { icon: Shield, title: "Dispute Resolution", desc: "Evidence-based disputes using attendance logs, geo data, and communication records." },
  { icon: BarChart3, title: "Reliability Scoring", desc: "Composite reliability scores built from attendance, punctuality, completion rate, and ratings." },
  { icon: QrCode, title: "Anti-Fraud System", desc: "Rotating QR codes, GPS validation, and multi-signal positioning prevent attendance fraud." },
  { icon: FileCheck, title: "Compliance & Audit", desc: "Complete audit trails for every booking, attendance, payment, and dispute action." },
  { icon: MessageSquare, title: "Integrated Communication", desc: "Booking-linked messaging ensures all communication is contextual and traceable." },
  { icon: CreditCard, title: "Wallet & Payouts", desc: "Doctor wallets with instant payout to bank accounts. Full transaction history." },
  { icon: Building2, title: "Multi-Location Support", desc: "Facilities manage multiple locations, each with independent QR codes and geofences." },
  { icon: Users, title: "Admin Governance", desc: "Platform admin console with KPIs, verification queues, policy config, and oversight." },
];

const workflowSteps = [
  { label: "Post Shift", icon: "📋" },
  { label: "Match Doctor", icon: "🔍" },
  { label: "Confirm Booking", icon: "✅" },
  { label: "Verify Attendance", icon: "📍" },
  { label: "Settle Payment", icon: "💰" },
];

const stakeholders = [
  { title: "For Doctors", desc: "Discover shifts, earn transparently, build your reliability score, get paid securely.", link: "/for-doctors", icon: "🩺", stats: "2,500+ verified doctors" },
  { title: "For Hospitals & Facilities", desc: "Fill urgent staffing gaps with verified doctors. Full attendance proof and payment control.", link: "/for-hospitals", icon: "🏥", stats: "350+ partner facilities" },
  { title: "For Platform Operations", desc: "Complete governance with verification workflows, dispute handling, analytics, and audit logs.", link: "/trust-safety", icon: "🛡️", stats: "99.2% accuracy rate" },
];

const ProductOverview = () => {
  const portalRegisterUrl = getPortalRegisterUrl();

  return (
  <PageWrapper title="Product Overview — DocDuty" description="Explore DocDuty's complete platform: shift marketplace, verified matching, attendance proof, escrow payments, and dispute resolution for Pakistan's healthcare.">
  <div className="min-h-screen">
    <Navbar />

    {/* Hero */}
    <section className="pt-32 pb-20 bg-hero-pattern text-primary-foreground relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,hsl(168_76%_36%/0.06),transparent_50%)]" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <span className="inline-block text-[11px] font-bold tracking-[0.15em] uppercase mb-5 px-4 py-1.5 rounded-full bg-accent/15 text-accent border border-accent/20">Product Overview</span>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-[1.1]">
            The Complete Healthcare<br /><span className="text-gradient-shimmer">Workforce Operations Platform</span>
          </h1>
          <p className="text-lg text-primary-foreground/55 max-w-2xl mx-auto mb-10">
            DocDuty is the infrastructure layer for reliable, accountable, and transparent doctor duty coverage across Pakistan.
          </p>
          <div className="flex gap-3 justify-center">
            <a href={portalRegisterUrl}><Button size="lg" className="bg-accent text-accent-foreground hover:bg-teal-light font-semibold px-8 shadow-lg shadow-accent/20">Get Started <ArrowRight className="w-4 h-4 ml-1" /></Button></a>
            <Link to="/how-it-works"><Button size="lg" className="bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20">See How It Works</Button></Link>
          </div>
        </motion.div>
      </div>
    </section>

    {/* Workflow Diagram */}
    <section className="py-16 bg-card border-b border-border">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {workflowSteps.map((step, i) => (
            <div key={step.label} className="flex items-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-accent/5 border border-accent/15"
              >
                <span className="text-lg">{step.icon}</span>
                <span className="text-sm font-semibold text-foreground">{step.label}</span>
              </motion.div>
              {i < workflowSteps.length - 1 && <ChevronRight className="w-4 h-4 text-accent/40 mx-1" />}
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Features */}
    <section className="py-24 bg-section-gradient">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader badge="Platform Capabilities" title="Everything You Need for" titleAccent="Healthcare Staffing" description="A full-stack marketplace platform covering every aspect of duty replacement and locum operations." />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04, duration: 0.5 }} className="p-6 rounded-2xl border border-border bg-card hover:border-accent/20 transition-all duration-500 group card-hover-glow">
              <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/10 flex items-center justify-center mb-4 group-hover:border-accent/25 transition-colors">
                <f.icon className="w-5 h-5 text-accent" />
              </div>
              <h3 className="font-heading font-semibold text-base mb-2 text-foreground">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* Stakeholders */}
    <section className="py-24 bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader badge="Built For Everyone" title="One Platform," titleAccent="Three Stakeholders" />
        <div className="grid md:grid-cols-3 gap-6">
          {stakeholders.map((s, i) => (
            <motion.div key={s.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="rounded-2xl border border-border bg-background p-8 hover:border-accent/20 transition-all duration-500 card-hover-glow group">
              <span className="text-3xl block mb-4">{s.icon}</span>
              <h3 className="font-heading font-bold text-xl mb-2 text-foreground">{s.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{s.desc}</p>
              <p className="text-xs font-bold text-accent mb-6">{s.stats}</p>
              <Link to={s.link}><Button variant="outline" size="sm" className="group-hover:border-accent/30 group-hover:text-accent transition-colors">Learn More <ArrowRight className="w-3 h-3 ml-1" /></Button></Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
    <RelatedPages pages={[
      { label: "How It Works", href: "/how-it-works", desc: "Step-by-step shift lifecycle for doctors and facilities", icon: Clock },
      { label: "For Doctors", href: "/for-doctors", desc: "Benefits, earnings calculator, and getting started", icon: Stethoscope },
      { label: "For Hospitals", href: "/for-hospitals", desc: "ROI metrics, comparison table, and enterprise plans", icon: Building2 },
    ]} />
    <Footer />
  </div>
  </PageWrapper>
  );
};

export default ProductOverview;
