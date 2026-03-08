import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SectionHeader from "@/components/shared/SectionHeader";
import RelatedPages from "@/components/shared/RelatedPages";
import PageWrapper from "@/components/shared/PageWrapper";
import { motion } from "framer-motion";
import { MapPin, QrCode, Clock, ShieldCheck, Fingerprint, Eye, AlertTriangle, Settings, ArrowRight, CreditCard, Scale } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getPortalRegisterUrl } from "@/lib/portal";

const features = [
  { icon: MapPin, title: "Geofence Boundaries", desc: "Each facility defines a GPS perimeter. Doctor's device must be within bounds to initiate check-in." },
  { icon: QrCode, title: "Rotating QR Codes", desc: "Time-limited QR codes displayed at the facility rotate every few minutes. Screenshots are useless." },
  { icon: Clock, title: "Check-in/Check-out Windows", desc: "Defined arrival and departure windows with configurable grace periods. Late arrivals are flagged." },
  { icon: Fingerprint, title: "GPS Spoofing Detection", desc: "Multi-signal location validation detects GPS spoofing attempts and flags suspicious patterns." },
  { icon: Settings, title: "Admin Override", desc: "Facility admins can override attendance with a documented reason. Every override is audit-logged." },
  { icon: Eye, title: "Real-Time Dashboard", desc: "Facility admins see live check-in status, location data, and timestamp records in real time." },
  { icon: AlertTriangle, title: "Anomaly Detection", desc: "System flags unusual patterns — repeated overrides, boundary violations, timing inconsistencies." },
  { icon: ShieldCheck, title: "Dispute Evidence", desc: "Attendance records serve as primary evidence in any payment or performance dispute." },
];

const AttendanceProofPage = () => {
  const portalRegisterUrl = getPortalRegisterUrl();

  return (
  <PageWrapper title="Attendance Proof — DocDuty" description="Dual-layer geofence + rotating QR verification creates irrefutable proof of doctor presence at healthcare facilities.">
  <div className="min-h-screen">
    <Navbar />
    <section className="pt-32 pb-20 bg-hero-pattern text-primary-foreground relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_80%,hsl(168_76%_36%/0.06),transparent_50%)]" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <span className="inline-block text-[11px] font-bold tracking-[0.15em] uppercase mb-5 px-4 py-1.5 rounded-full bg-accent/15 text-accent border border-accent/20">Attendance Proof</span>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-[1.1]">
            Verified Presence.<br /><span className="text-gradient-shimmer">Zero Guesswork.</span>
          </h1>
          <p className="text-lg text-primary-foreground/55 max-w-xl mx-auto">Our dual-layer attendance system combines geofencing with rotating QR codes to create irrefutable, timestamped proof of doctor presence.</p>
        </motion.div>
      </div>
    </section>

    {/* Visual explainer */}
    <section className="py-16 bg-card border-b border-border">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <div className="grid grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="p-6 rounded-2xl bg-accent/5 border border-accent/15">
            <div className="w-14 h-14 rounded-2xl bg-accent/15 flex items-center justify-center mx-auto mb-3">
              <MapPin className="w-7 h-7 text-accent" />
            </div>
            <h4 className="font-heading font-bold text-sm">Signal 1</h4>
            <p className="text-xs text-muted-foreground mt-1">GPS within geofence</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="p-6 rounded-2xl bg-foreground/5 border border-border flex flex-col items-center justify-center">
            <span className="text-2xl font-heading font-bold text-accent">+</span>
            <p className="text-xs text-muted-foreground mt-1">Both must validate</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="p-6 rounded-2xl bg-accent/5 border border-accent/15">
            <div className="w-14 h-14 rounded-2xl bg-accent/15 flex items-center justify-center mx-auto mb-3">
              <QrCode className="w-7 h-7 text-accent" />
            </div>
            <h4 className="font-heading font-bold text-sm">Signal 2</h4>
            <p className="text-xs text-muted-foreground mt-1">Rotating QR scan</p>
          </motion.div>
        </div>
      </div>
    </section>

    <section className="py-24 bg-section-gradient">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader badge="How It Works" title="Dual-Layer" titleAccent="Verification" description="Two independent signals must validate simultaneously — GPS location within geofence AND time-limited QR scan." />
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
        <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">See Attendance Proof <span className="text-gradient-teal">In Action</span></h2>
        <p className="text-primary-foreground/50 mb-8">Experience the most reliable attendance system in healthcare staffing.</p>
        <a href={portalRegisterUrl}><Button size="lg" className="bg-accent text-accent-foreground hover:bg-teal-light font-semibold px-8 shadow-lg shadow-accent/20">Get Started <ArrowRight className="w-4 h-4 ml-1" /></Button></a>
      </div>
    </section>
    <RelatedPages pages={[
      { label: "Payments & Escrow", href: "/payments-escrow", desc: "Secure settlement triggered by attendance", icon: CreditCard },
      { label: "Disputes & Reliability", href: "/disputes-reliability", desc: "Attendance data as dispute evidence", icon: Scale },
      { label: "Trust & Safety", href: "/trust-safety", desc: "Complete trust architecture overview", icon: ShieldCheck },
    ]} />
    <Footer />
  </div>
  </PageWrapper>
  );
};

export default AttendanceProofPage;
