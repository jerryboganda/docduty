import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Clock, UserCheck, ShieldCheck, BarChart3, ArrowRight, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import SectionHeader from "@/components/shared/SectionHeader";
import { useCountUp } from "@/hooks/useCountUp";

const features = [
  { icon: Clock, title: "Urgent Coverage", description: "Fill emergency duty gaps within hours. Automated matching finds the right doctor fast." },
  { icon: UserCheck, title: "Verified Doctors", description: "Every doctor is PMDC-verified, KYC-checked, and reliability-scored. No blind trust." },
  { icon: ShieldCheck, title: "Attendance Proof", description: "Geofence + rotating QR ensures the doctor was physically present. Timestamped and auditable." },
  { icon: FileCheck, title: "Financial Accountability", description: "Escrow holds, transparent fees, automated settlement. Full payout oversight." },
  { icon: BarChart3, title: "Operational Visibility", description: "Real-time dashboards, booking analytics, rating trends, and compliance reporting." },
];

const FacilityDashboard = () => {
  const { count: open } = useCountUp(5, 1200);
  const { count: confirmed } = useCountUp(12, 1500);
  const { count: completed } = useCountUp(89, 2000);

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl border border-border bg-card p-6 shadow-2xl shadow-primary/5 order-2 lg:order-1 card-hover-glow"
    >
      {/* Browser chrome */}
      <div className="flex items-center gap-2 mb-5 pb-4 border-b border-border">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-destructive/60" />
          <div className="w-3 h-3 rounded-full bg-warning/60" />
          <div className="w-3 h-3 rounded-full bg-success/60" />
        </div>
        <div className="flex-1 mx-3 h-6 rounded-md bg-secondary flex items-center px-3">
          <span className="text-[10px] text-muted-foreground">portal.docduty.com.pk/facility/dashboard</span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Open Shifts", value: open, color: "text-warning" },
            { label: "Confirmed", value: confirmed, color: "text-success" },
            { label: "In Progress", value: 3, color: "text-accent" },
            { label: "Completed", value: completed, color: "text-foreground" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl bg-secondary p-3 text-center">
              <p className={`font-heading font-bold text-lg tabular-nums ${stat.color}`}>{stat.value}</p>
              <p className="text-[9px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Coverage gauge */}
        <div className="rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-foreground">Shift Coverage Rate</span>
            <span className="text-xs font-bold text-success">97.8%</span>
          </div>
          <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: "97.8%" }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="h-full bg-gradient-to-r from-accent to-teal-light rounded-full"
            />
          </div>
        </div>

        {/* Recent bookings */}
        <div className="rounded-xl border border-border p-4">
          <span className="text-xs font-semibold text-foreground block mb-3">Recent Bookings</span>
          {[
            { doc: "Dr. Ayesha Khan", status: "Checked In", statusColor: "bg-success/10 text-success" },
            { doc: "Dr. Omar Farooq", status: "Confirmed", statusColor: "bg-accent/10 text-accent" },
            { doc: "Dr. Fatima Zaidi", status: "Completed", statusColor: "bg-secondary text-muted-foreground" },
          ].map((booking, i) => (
            <motion.div
              key={booking.doc}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8 + i * 0.1 }}
              className="flex items-center justify-between py-2.5 border-t border-border"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center">
                  <span className="text-[9px] font-bold text-accent">{booking.doc.split(" ")[1][0]}</span>
                </div>
                <span className="text-xs text-foreground">{booking.doc}</span>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${booking.statusColor}`}>{booking.status}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const ForFacilitiesSection = () => (
  <section className="py-24 lg:py-32 bg-section-alt relative">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <FacilityDashboard />

        <div className="order-1 lg:order-2">
          <SectionHeader
            badge="For Hospitals & Facilities"
            title="Staffing Continuity,"
            titleAccent="Guaranteed"
            description="Reduce time-to-fill from days to hours. Get verified, reliability-scored doctors with full attendance proof and financial control."
            align="left"
          />

          <div className="space-y-5">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: 20 }}
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
            <Link to="/for-hospitals" className="inline-block mt-8">
              <Button className="bg-accent text-accent-foreground hover:bg-teal-light font-semibold shadow-lg shadow-accent/20 group">
                Learn More for Facilities <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  </section>
);

export default ForFacilitiesSection;
