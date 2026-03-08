import { motion } from "framer-motion";
import { UserCheck, Building2, CalendarCheck, ShieldCheck } from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";

const AnimatedStat = ({ icon: Icon, value, suffix, label }: { icon: React.ElementType; value: number; suffix: string; label: string }) => {
  const { count, ref } = useCountUp(value, 2200);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="flex items-center gap-4 lg:justify-center lg:px-6"
    >
      <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0 border border-accent/10">
        <Icon className="w-5 h-5 text-accent" />
      </div>
      <div>
        <p ref={ref as React.RefObject<HTMLParagraphElement>} className="font-heading font-bold text-2xl lg:text-3xl text-foreground tabular-nums">
          {count.toLocaleString()}{suffix}
        </p>
        <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">{label}</p>
      </div>
    </motion.div>
  );
};

const stats = [
  { icon: UserCheck, value: 2500, suffix: "+", label: "Verified Doctors" },
  { icon: Building2, value: 350, suffix: "+", label: "Partner Facilities" },
  { icon: CalendarCheck, value: 15000, suffix: "+", label: "Shifts Fulfilled" },
  { icon: ShieldCheck, value: 99, suffix: ".2%", label: "Attendance Accuracy" },
];

const TrustBar = () => (
  <section className="relative bg-card border-y border-border before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-6 before:bg-gradient-to-b before:from-primary/10 before:to-transparent">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-12">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0 lg:divide-x divide-border">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.12 }}
          >
            <AnimatedStat {...stat} />
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default TrustBar;
