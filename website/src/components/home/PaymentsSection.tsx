import { motion } from "framer-motion";
import { Lock, CheckCircle2, Banknote, RotateCcw, Receipt, ArrowDown } from "lucide-react";
import SectionHeader from "@/components/shared/SectionHeader";

const steps = [
  { icon: Lock, title: "Escrow Hold", description: "Funds are held securely when a booking is confirmed. Neither party can access until duty completes.", amount: "PKR 15,000" },
  { icon: CheckCircle2, title: "Attendance Verified", description: "Geofence + QR attendance triggers settlement eligibility. No manual intervention needed.", status: "Verified ✓" },
  { icon: Receipt, title: "Platform Fee Deducted", description: "Transparent commission is deducted automatically. Both parties see the exact breakdown.", amount: "- PKR 750" },
  { icon: Banknote, title: "Doctor Payout", description: "Net amount is released to doctor's wallet. Withdraw to bank account at any time.", amount: "PKR 14,250" },
];

const PaymentsSection = () => (
  <section className="py-24 lg:py-32 bg-section-gradient relative">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <SectionHeader
        badge="Payments & Escrow"
        title="Secure, Transparent,"
        titleAccent="Automated Payments"
        description="Platform-mediated financial operations eliminate payment disputes and ensure fair, timely compensation."
      />

      <div className="max-w-3xl mx-auto">
        {steps.map((step, i) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.12, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex gap-5 pb-10 last:pb-0"
          >
            {/* Animated connector line */}
            {i < steps.length - 1 && (
              <div className="absolute left-[23px] top-14 w-0.5 h-[calc(100%-32px)] bg-border overflow-hidden">
                <motion.div
                  initial={{ height: 0 }}
                  whileInView={{ height: "100%" }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.15, duration: 0.6 }}
                  className="w-full bg-gradient-to-b from-accent to-accent/30"
                />
                {/* Moving dot */}
                <motion.div
                  className="absolute w-2 h-2 -left-[3px] rounded-full bg-accent shadow-lg shadow-accent/50"
                  animate={{ top: ["0%", "100%"] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.5, ease: "easeInOut" }}
                />
              </div>
            )}
            <motion.div
              initial={{ scale: 0.8 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 + i * 0.12, type: "spring", stiffness: 300 }}
              className="w-12 h-12 rounded-xl bg-accent/10 border-2 border-accent/20 flex items-center justify-center shrink-0 relative z-10 bg-card"
            >
              <step.icon className="w-5 h-5 text-accent" />
            </motion.div>
            <div className="pt-1 flex-1">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-heading font-semibold text-base text-foreground">{step.title}</h3>
                {step.amount && (
                  <span className={`font-heading font-bold text-sm tabular-nums ${
                    step.amount.startsWith("-") ? "text-destructive" : "text-accent"
                  }`}>
                    {step.amount}
                  </span>
                )}
                {step.status && (
                  <span className="text-xs font-bold text-success bg-success/10 px-2.5 py-0.5 rounded-full">
                    {step.status}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bottom trust cards */}
      <div className="mt-16 grid sm:grid-cols-3 gap-5 max-w-3xl mx-auto">
        {[
          { icon: RotateCcw, label: "Refund Logic", desc: "Automated refunds for cancellations within policy" },
          { icon: Receipt, label: "Transaction History", desc: "Complete ledger of all financial operations" },
          { icon: Lock, label: "Financial Trust", desc: "Bank-grade security for all fund movements" },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 + i * 0.1 }}
            className="rounded-xl border border-border bg-card p-5 text-center card-hover-glow"
          >
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-3">
              <item.icon className="w-5 h-5 text-accent" />
            </div>
            <p className="font-heading font-semibold text-sm text-foreground">{item.label}</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default PaymentsSection;
