import { motion } from "framer-motion";
import { Scale, FileSearch, Star, TrendingUp, MessageSquare, Shield } from "lucide-react";
import SectionHeader from "@/components/shared/SectionHeader";

const features = [
  { icon: FileSearch, title: "Evidence-Based Review", description: "Every dispute is reviewed using attendance logs, geofence data, QR scans, and communication records." },
  { icon: Scale, title: "Fair Resolution", description: "Structured resolution workflow with clear outcomes — partial refund, full settlement, or re-arbitration." },
  { icon: Star, title: "Ratings System", description: "Both doctors and facilities rate each other after every shift. Ratings drive marketplace trust." },
  { icon: TrendingUp, title: "Reliability Score", description: "Composite score built from attendance, punctuality, completion rate, and dispute history." },
  { icon: MessageSquare, title: "Booking-Linked Chat", description: "All communication is tied to specific bookings. Creates a clear record for any dispute." },
  { icon: Shield, title: "Policy Enforcement", description: "Platform policies on cancellation, no-shows, and conduct are enforced automatically." },
];

const DisputesSection = () => (
  <section className="py-24 lg:py-32 bg-section-alt relative">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <SectionHeader
        badge="Disputes & Reliability"
        title="Accountability That"
        titleAccent="Builds Trust"
        description="A comprehensive dispute resolution and reliability system that protects both doctors and facilities."
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="p-6 rounded-2xl border border-border bg-card hover:border-accent/20 transition-all duration-500 group card-hover-glow"
          >
            <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/10 flex items-center justify-center mb-4 group-hover:border-accent/25 transition-colors">
              <feature.icon className="w-5 h-5 text-accent" />
            </div>
            <h3 className="font-heading font-semibold text-base mb-2 text-foreground">{feature.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default DisputesSection;
