import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PageWrapper from "@/components/shared/PageWrapper";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Stethoscope, Building2, ArrowRight, CheckCircle, Shield, Clock, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

const doctorReqs = ["Valid PMDC registration", "CNIC for identity verification", "Professional credentials", "Active mobile number", "Bank account for payouts"];
const facilityReqs = ["Hospital/clinic registration", "Facility location details", "Admin contact information", "Geofence coordinates for attendance", "QR code display capability"];

const doctorSteps = [
  { step: "1", title: "Create Account", desc: "Sign up with your email and mobile number" },
  { step: "2", title: "Submit Credentials", desc: "Upload PMDC license and CNIC for verification" },
  { step: "3", title: "Get Verified", desc: "Our team verifies your identity within 24–48 hours" },
  { step: "4", title: "Start Earning", desc: "Browse shifts, accept bookings, and get paid" },
];

const GetStarted = () => (
  <PageWrapper title="Get Started — DocDuty" description="Join DocDuty as a doctor or facility. Simple onboarding, fast verification, and start earning or filling shifts.">
  <div className="min-h-screen">
    <Navbar />
    <section className="pt-32 pb-20 bg-hero-pattern text-primary-foreground relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_80%,hsl(168_76%_36%/0.06),transparent_50%)]" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <span className="inline-block text-[11px] font-bold tracking-[0.15em] uppercase mb-5 px-4 py-1.5 rounded-full bg-accent/15 text-accent border border-accent/20">Get Started</span>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-[1.1]">
            Choose Your<br /><span className="text-gradient-shimmer">Path</span>
          </h1>
          <p className="text-lg text-primary-foreground/55 max-w-xl mx-auto">Join Pakistan's trusted healthcare workforce marketplace in minutes.</p>
        </motion.div>
      </div>
    </section>

    {/* Onboarding steps */}
    <section className="py-12 bg-card border-b border-border">
      <div className="max-w-4xl mx-auto px-4">
        <div className="grid grid-cols-4 gap-4">
          {doctorSteps.map((s, i) => (
            <motion.div key={s.step} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center">
              <div className="w-10 h-10 rounded-full bg-accent/15 border border-accent/20 flex items-center justify-center mx-auto mb-2">
                <span className="font-heading font-bold text-sm text-accent">{s.step}</span>
              </div>
              <h4 className="font-heading font-semibold text-xs text-foreground">{s.title}</h4>
              <p className="text-[10px] text-muted-foreground mt-0.5">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    <section className="py-24 bg-section-gradient">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-8">
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="rounded-2xl border border-border bg-card p-8 card-hover-glow">
            <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/15 flex items-center justify-center mb-6">
              <Stethoscope className="w-7 h-7 text-accent" />
            </div>
            <h2 className="font-heading font-bold text-2xl text-foreground mb-2">Join as Doctor</h2>
            <p className="text-sm text-muted-foreground mb-6">Find locum and replacement shifts, earn transparently, and build your professional reputation.</p>

            <div className="flex gap-4 mb-6">
              {[
                { icon: Shield, label: "Verified" },
                { icon: CreditCard, label: "Escrow" },
                { icon: Clock, label: "Flexible" },
              ].map((tag) => (
                <div key={tag.label} className="flex items-center gap-1 text-xs text-muted-foreground">
                  <tag.icon className="w-3 h-3 text-accent" />{tag.label}
                </div>
              ))}
            </div>

            <h3 className="font-heading font-semibold text-sm text-foreground mb-3">What You'll Need:</h3>
            <ul className="space-y-2.5 mb-8">
              {doctorReqs.map((r) => <li key={r} className="flex gap-2.5 text-sm text-muted-foreground"><CheckCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />{r}</li>)}
            </ul>
            <Button className="w-full bg-accent text-accent-foreground hover:bg-teal-light font-semibold h-12 shadow-lg shadow-accent/20 group">Register as Doctor <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" /></Button>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="rounded-2xl border-2 border-accent bg-card p-8 relative overflow-hidden card-hover-glow">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-accent/10 rounded-full blur-[60px] pointer-events-none" />
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-accent/15 border border-accent/20 flex items-center justify-center mb-6">
                <Building2 className="w-7 h-7 text-accent" />
              </div>
              <h2 className="font-heading font-bold text-2xl text-foreground mb-2">Register Facility</h2>
              <p className="text-sm text-muted-foreground mb-6">Fill urgent duty gaps with verified doctors. Get attendance proof and full operational control.</p>

              <div className="flex gap-4 mb-6">
                {[
                  { icon: Clock, label: "1–3hr Fill" },
                  { icon: Shield, label: "Verified MDs" },
                  { icon: CreditCard, label: "Escrow" },
                ].map((tag) => (
                  <div key={tag.label} className="flex items-center gap-1 text-xs text-muted-foreground">
                    <tag.icon className="w-3 h-3 text-accent" />{tag.label}
                  </div>
                ))}
              </div>

              <h3 className="font-heading font-semibold text-sm text-foreground mb-3">What You'll Need:</h3>
              <ul className="space-y-2.5 mb-8">
                {facilityReqs.map((r) => <li key={r} className="flex gap-2.5 text-sm text-muted-foreground"><CheckCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />{r}</li>)}
              </ul>
              <Button className="w-full bg-accent text-accent-foreground hover:bg-teal-light font-semibold h-12 shadow-lg shadow-accent/20 group">Register Facility <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" /></Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
    <Footer />
  </div>
  </PageWrapper>
);

export default GetStarted;
