import { motion, useMotionValue, useTransform } from "framer-motion";
import { Link } from "react-router-dom";
import { Wallet, MapPin, Star, Shield, ArrowRight, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import SectionHeader from "@/components/shared/SectionHeader";
import { useCountUp } from "@/hooks/useCountUp";

const features = [
  { icon: Wallet, title: "Guaranteed Payouts", description: "Escrow-backed payments. Get paid on shift completion — no chasing, no disputes over fees." },
  { icon: MapPin, title: "Nearby Shifts", description: "Discover shifts by city, radius, and specialty. Real-time marketplace filtered to your availability." },
  { icon: Star, title: "Reliability Score", description: "Build your professional reputation. Higher scores unlock priority matching and better opportunities." },
  { icon: Shield, title: "Verified Facilities", description: "Every facility is vetted. Know where you're going, what's expected, and your shift terms upfront." },
  { icon: TrendingUp, title: "Extra Income", description: "Take locum shifts that fit your schedule. Full control over when and where you work." },
];

const DashboardPreview = () => {
  const { count: shifts } = useCountUp(12, 1500);
  const { count: earnings } = useCountUp(84, 2000);

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl border border-border bg-card p-6 shadow-2xl shadow-primary/5 card-hover-glow"
    >
      {/* Browser chrome */}
      <div className="flex items-center gap-2 mb-5 pb-4 border-b border-border">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-destructive/60" />
          <div className="w-3 h-3 rounded-full bg-warning/60" />
          <div className="w-3 h-3 rounded-full bg-success/60" />
        </div>
        <div className="flex-1 mx-3 h-6 rounded-md bg-secondary flex items-center px-3">
          <span className="text-[10px] text-muted-foreground">app.docduty.pk/doctor/dashboard</span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-accent/5 border border-accent/10 p-3.5 text-center">
            <p className="font-heading font-bold text-2xl text-accent tabular-nums">{shifts}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Active Shifts</p>
          </div>
          <div className="rounded-xl bg-secondary p-3.5 text-center">
            <p className="font-heading font-bold text-2xl text-foreground tabular-nums">PKR {earnings}K</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">This Month</p>
          </div>
          <div className="rounded-xl bg-secondary p-3.5 text-center">
            <div className="flex items-center justify-center gap-1">
              <p className="font-heading font-bold text-2xl text-success">4.9</p>
              <Star className="w-3.5 h-3.5 text-warning fill-warning" />
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Rating</p>
          </div>
        </div>

        {/* Earnings chart mockup */}
        <div className="rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-foreground">Monthly Earnings</span>
            <span className="text-[10px] text-accent font-medium px-2 py-0.5 rounded-full bg-accent/5">+23% ↑</span>
          </div>
          <div className="flex items-end gap-1.5 h-16">
            {[35, 48, 40, 55, 62, 58, 72, 68, 80, 75, 84, 90].map((h, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                whileInView={{ height: `${h}%` }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 + i * 0.05, duration: 0.4 }}
                className="flex-1 rounded-t bg-gradient-to-t from-accent to-teal-light opacity-70 hover:opacity-100 transition-opacity"
              />
            ))}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[8px] text-muted-foreground">Jan</span>
            <span className="text-[8px] text-muted-foreground">Dec</span>
          </div>
        </div>

        {/* Shift list */}
        <div className="rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-foreground">Available Shifts Near You</span>
            <span className="text-[10px] text-accent font-medium cursor-pointer hover:underline">View All →</span>
          </div>
          {[
            { name: "Jinnah Hospital — Emergency", rate: "PKR 10K", badge: "Urgent" },
            { name: "Services Hospital — General", rate: "PKR 8K", badge: null },
            { name: "Mayo Hospital — Pediatrics", rate: "PKR 12K", badge: "New" },
          ].map((item, i) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8 + i * 0.1 }}
              className="flex items-center justify-between py-2.5 border-t border-border first:border-0 group/row hover:bg-accent/[0.02] -mx-1 px-1 rounded transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{item.name}</span>
                {item.badge && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${item.badge === "Urgent" ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent"}`}>
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-xs font-semibold text-accent">{item.rate}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const ForDoctorsSection = () => (
  <section className="py-24 lg:py-32 bg-card relative">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <div>
          <SectionHeader
            badge="For Doctors"
            title="Your Skills Deserve"
            titleAccent="Fair Compensation"
            description="Join thousands of verified doctors earning extra income through transparent, secure locum and replacement shifts across Pakistan."
            align="left"
          />

          <div className="space-y-5">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="flex gap-4 items-start group p-3 -mx-3 rounded-xl hover:bg-accent/[0.03] transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/10 flex items-center justify-center shrink-0 mt-0.5 group-hover:border-accent/25 group-hover:bg-accent/15 transition-all">
                  <feature.icon className="w-4.5 h-4.5 text-accent" />
                </div>
                <div>
                  <h4 className="font-heading font-semibold text-sm text-foreground mb-0.5">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
          >
            <Link to="/for-doctors" className="inline-block mt-8">
              <Button className="bg-accent text-accent-foreground hover:bg-teal-light font-semibold shadow-lg shadow-accent/20 group">
                Learn More for Doctors <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </motion.div>
        </div>

        <DashboardPreview />
      </div>
    </div>
  </section>
);

export default ForDoctorsSection;
