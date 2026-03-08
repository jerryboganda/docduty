import { motion } from "framer-motion";
import { FileText, Users, CalendarCheck, MapPin, CreditCard } from "lucide-react";
import SectionHeader from "@/components/shared/SectionHeader";

const steps = [
  { icon: FileText, title: "Post Shift", description: "Hospital posts a duty replacement or vacancy with specialty, schedule, and pay rate.", color: "from-accent/20 to-accent/5" },
  { icon: Users, title: "Match Doctor", description: "Platform matches verified, eligible doctors by specialty, city, availability, and reliability score.", color: "from-accent/25 to-accent/8" },
  { icon: CalendarCheck, title: "Confirm Booking", description: "Doctor accepts or negotiates. Booking is confirmed with clear terms and escrow hold.", color: "from-accent/30 to-accent/10" },
  { icon: MapPin, title: "Verify Attendance", description: "Doctor checks in via geofence + rotating QR. Anti-fraud positioning ensures legitimate presence.", color: "from-accent/35 to-accent/12" },
  { icon: CreditCard, title: "Settle Payment", description: "On completion, escrow releases funds. Platform fee deducted. Payout to doctor wallet.", color: "from-accent/40 to-accent/15" },
];

const HowItWorksSection = () => (
  <section className="py-24 lg:py-32 bg-section-alt relative overflow-hidden">
    {/* Background decoration */}
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(168_76%_36%/0.03),transparent_70%)]" aria-hidden="true" />

    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <SectionHeader
        badge="How It Works"
        title="From Shift Gap to"
        titleAccent="Settled Payment in 5 Steps"
        description="A seamless, trust-backed workflow that replaces phone calls and guesswork with verified, accountable operations."
      />

      <div className="relative">
        {/* Animated connecting line — desktop only */}
        <div className="hidden lg:block absolute top-20 left-[10%] right-[10%] h-[2px]">
          <div className="absolute inset-0 bg-border" />
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
            className="absolute inset-0 bg-gradient-to-r from-accent via-teal-light to-accent origin-left"
          />
        </div>

        {/* Vertical line — mobile only */}
        <div className="block lg:hidden absolute top-8 bottom-8 left-8 w-[2px] bg-border">
          <motion.div
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
            className="absolute inset-0 bg-gradient-to-b from-accent via-teal-light to-accent origin-top"
          />
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: 0.2 + i * 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative text-center lg:text-center sm:text-left pl-16 sm:pl-0"
            >
              {/* Step number connector dot */}
              <div className="relative mx-auto sm:mx-auto lg:mx-auto mb-5 sm:mb-5 absolute left-0 sm:relative sm:left-auto lg:relative">
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 + i * 0.15, type: "spring", stiffness: 300 }}
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br border-2 border-accent/20 flex items-center justify-center mx-auto relative z-10 bg-card shadow-lg shadow-accent/5 group-hover:border-accent/40 group-hover:shadow-accent/15 transition-all duration-500"
                  style={{ backgroundImage: `linear-gradient(to bottom right, hsl(168 76% 36% / ${0.08 + i * 0.04}), hsl(168 76% 36% / ${0.02 + i * 0.02}))` }}
                >
                  <step.icon className="w-5 h-5 sm:w-6 sm:h-6 text-accent" aria-hidden="true" />
                </motion.div>
              </div>

              <motion.span
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 + i * 0.15 }}
                className="inline-block text-[10px] font-bold text-accent tracking-widest uppercase mb-2 px-2 py-0.5 rounded-full bg-accent/5 border border-accent/10"
              >
                Step {i + 1}
              </motion.span>
              <h3 className="font-heading font-semibold text-base mb-2 text-foreground">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default HowItWorksSection;
