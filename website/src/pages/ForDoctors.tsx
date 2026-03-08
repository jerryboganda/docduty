import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SectionHeader from "@/components/shared/SectionHeader";
import RelatedPages from "@/components/shared/RelatedPages";
import PageWrapper from "@/components/shared/PageWrapper";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Wallet, MapPin, Star, Shield, TrendingUp, Clock, CheckCircle, CreditCard, Zap, Building2 } from "lucide-react";
import { useState } from "react";
import { useCountUp } from "@/hooks/useCountUp";
import { getPortalRegisterUrl } from "@/lib/portal";

const benefits = [
  { icon: Wallet, title: "Guaranteed Payouts", desc: "Escrow-backed payments release on shift completion. No chasing, no delays." },
  { icon: MapPin, title: "Shifts Near You", desc: "Filter by city, radius, and specialty. See only opportunities that match your profile." },
  { icon: Star, title: "Build Your Reputation", desc: "Every completed shift improves your reliability score and unlocks better opportunities." },
  { icon: Shield, title: "Verified Facilities", desc: "Every hospital and clinic is vetted. Know your workplace before you commit." },
  { icon: TrendingUp, title: "Earn More", desc: "Take locum and replacement shifts that fit your schedule. Full income transparency." },
  { icon: Clock, title: "Flexible Schedule", desc: "You choose when and where to work. No long-term commitments required." },
  { icon: CheckCircle, title: "Fair Dispute Protection", desc: "Evidence-based dispute resolution protects you from unfair claims." },
  { icon: CreditCard, title: "Instant Withdrawals", desc: "Withdraw earnings to your bank account from your DocDuty wallet anytime." },
];

const timeline = [
  { time: "8:00 AM", event: "Browse available shifts on marketplace", detail: "Filter by specialty, city, and pay range" },
  { time: "8:15 AM", event: "Accept a General Medicine shift", detail: "PKR 12,000 at Jinnah Hospital, Karachi" },
  { time: "1:45 PM", event: "Arrive at facility, geofence check-in", detail: "GPS verified within hospital boundary" },
  { time: "2:00 PM", event: "Scan rotating QR code", detail: "Attendance confirmed, shift starts" },
  { time: "10:00 PM", event: "Shift complete, check-out verified", detail: "8 hours logged, attendance perfect" },
  { time: "10:05 PM", event: "Payment released to wallet", detail: "PKR 11,400 after platform fee" },
];

const EarningsCalculator = () => {
  const [shifts, setShifts] = useState(8);
  const rate = 12000;
  const fee = 0.05;
  const monthly = shifts * rate * (1 - fee);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-2xl border border-accent/20 bg-accent/[0.03] p-8">
      <h3 className="font-heading font-bold text-xl text-foreground mb-2">Earnings Calculator</h3>
      <p className="text-sm text-muted-foreground mb-6">See how much you could earn with DocDuty</p>
      <div className="space-y-4 mb-6">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Shifts per month</span>
            <span className="font-heading font-bold text-foreground">{shifts}</span>
          </div>
          <input type="range" min={1} max={30} value={shifts} onChange={(e) => setShifts(+e.target.value)} className="w-full accent-[hsl(168,76%,36%)]" />
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Average rate per shift</span>
          <span className="font-heading font-semibold text-foreground">PKR {rate.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Platform fee</span>
          <span className="font-heading font-semibold text-foreground">{fee * 100}%</span>
        </div>
      </div>
      <div className="pt-4 border-t border-border">
        <div className="flex justify-between items-end">
          <span className="text-sm text-muted-foreground">Estimated monthly earnings</span>
          <span className="font-heading font-bold text-3xl text-accent">PKR {monthly.toLocaleString()}</span>
        </div>
      </div>
    </motion.div>
  );
};

const ForDoctors = () => {
  const doctorRegisterUrl = getPortalRegisterUrl("doctor");

  return (
  <PageWrapper title="For Doctors — DocDuty" description="Earn more with flexible locum shifts across Pakistan. Guaranteed escrow payouts, verified facilities, and reputation building on DocDuty.">
  <div className="min-h-screen">
    <Navbar />
    <section className="pt-32 pb-20 bg-hero-pattern text-primary-foreground relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_50%,hsl(168_76%_36%/0.06),transparent_50%)]" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <span className="inline-block text-[11px] font-bold tracking-[0.15em] uppercase mb-5 px-4 py-1.5 rounded-full bg-accent/15 text-accent border border-accent/20">For Doctors</span>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-[1.1]">
              Your Skills. Your Schedule.<br /><span className="text-gradient-shimmer">Your Fair Pay.</span>
            </h1>
            <p className="text-lg text-primary-foreground/55 mb-8 max-w-xl">Join Pakistan's largest verified locum marketplace. Browse shifts, earn transparently, and build a professional reputation that opens doors.</p>
            <a href={doctorRegisterUrl}><Button size="lg" className="bg-accent text-accent-foreground hover:bg-teal-light font-semibold px-8 shadow-lg shadow-accent/20 group">Join as Doctor <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" /></Button></a>
          </motion.div>
        </div>
      </div>
    </section>

    {/* Benefits */}
    <section className="py-24 bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader badge="Why DocDuty" title="Built for Doctors Who" titleAccent="Deserve Better" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((b, i) => (
            <motion.div key={b.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="p-6 rounded-2xl border border-border bg-background hover:border-accent/20 transition-all duration-500 group card-hover-glow">
              <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/10 flex items-center justify-center mb-4 group-hover:border-accent/25 transition-colors"><b.icon className="w-5 h-5 text-accent" /></div>
              <h3 className="font-heading font-semibold text-base mb-2 text-foreground">{b.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* Earnings Calculator + Day in the Life */}
    <section className="py-24 bg-section-gradient">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12">
          <div>
            <SectionHeader badge="Earnings" title="Calculate Your" titleAccent="Potential Income" align="left" />
            <EarningsCalculator />
          </div>
          <div>
            <SectionHeader badge="A Day on DocDuty" title="From Browse to" titleAccent="Payout" align="left" />
            <div className="space-y-1">
              {timeline.map((item, i) => (
                <motion.div key={item.time} initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="flex gap-4 p-3 rounded-xl hover:bg-accent/[0.03] transition-colors">
                  <span className="text-xs font-bold text-accent w-16 shrink-0 pt-0.5 tabular-nums">{item.time}</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{item.event}</p>
                    <p className="text-xs text-muted-foreground">{item.detail}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="py-20 bg-section-dark text-primary-foreground">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">Ready to Start <span className="text-gradient-teal">Earning?</span></h2>
        <p className="text-primary-foreground/50 mb-8">Join thousands of doctors already earning on DocDuty.</p>
        <a href={doctorRegisterUrl}><Button size="lg" className="bg-accent text-accent-foreground hover:bg-teal-light font-semibold px-8 shadow-lg shadow-accent/20">Join as Doctor <ArrowRight className="w-4 h-4 ml-1" /></Button></a>
      </div>
    </section>
    <RelatedPages pages={[
      { label: "How It Works", href: "/how-it-works", desc: "Step-by-step shift lifecycle from signup to payout", icon: Clock },
      { label: "Payments & Escrow", href: "/payments-escrow", desc: "Secure escrow-backed payment settlement", icon: CreditCard },
      { label: "Trust & Safety", href: "/trust-safety", desc: "Platform verification and safety architecture", icon: Shield },
    ]} />
    <Footer />
  </div>
  </PageWrapper>
  );
};

export default ForDoctors;
