import { motion } from "framer-motion";
import { AlertTriangle, UserX, Banknote, ShieldOff, ArrowRight } from "lucide-react";
import SectionHeader from "@/components/shared/SectionHeader";

const problems = [
  {
    icon: UserX,
    title: "Last-Minute No-Shows",
    description: "A doctor calls in sick hours before their shift. The hospital scrambles with phone calls and personal contacts — often failing to find coverage.",
    stat: "38%",
    statLabel: "of shifts affected by no-shows",
  },
  {
    icon: AlertTriangle,
    title: "Informal Hiring Risks",
    description: "Replacements found through WhatsApp groups and personal referrals lack verification, accountability, and audit trails.",
    stat: "Zero",
    statLabel: "verification in current process",
  },
  {
    icon: Banknote,
    title: "Payment Disputes",
    description: "Verbal agreements on shift fees lead to delayed payments, underpayment, and zero financial recourse for doctors.",
    stat: "62%",
    statLabel: "of doctors report payment delays",
  },
  {
    icon: ShieldOff,
    title: "Zero Accountability",
    description: "No attendance proof, no performance records, no dispute mechanisms. Both sides operate on blind trust.",
    stat: "0%",
    statLabel: "digital accountability",
  },
];

const ProblemSection = () => (
  <section className="py-24 lg:py-32 bg-section-gradient">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <SectionHeader
        badge="The Problem"
        title="Healthcare Staffing in Pakistan is"
        titleAccent="Broken"
        description="Every day, hospitals across Pakistan struggle with short-notice duty gaps. The current system is informal, unverified, and high-risk."
      />

      {/* Alternating layout: 2 large + 2 small */}
      <div className="grid lg:grid-cols-2 gap-6">
        {problems.map((problem, i) => (
          <motion.div
            key={problem.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="group relative p-6 lg:p-8 rounded-2xl border border-border bg-card hover:border-destructive/30 transition-all duration-500 card-hover-glow overflow-hidden"
          >
            {/* Subtle background glow on hover */}
            <div className="absolute inset-0 bg-destructive/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div className="relative flex flex-col sm:flex-row sm:items-start gap-5">
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0 border border-destructive/10 group-hover:border-destructive/20 transition-colors">
                <problem.icon className="w-5 h-5 text-destructive" />
              </div>
              <div className="flex-1">
                <h3 className="font-heading font-semibold text-xl mb-2 text-foreground">{problem.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{problem.description}</p>
                <div className="flex items-center gap-3 pt-3 border-t border-border">
                  <span className="font-heading font-bold text-2xl text-destructive">{problem.stat}</span>
                  <span className="text-xs text-muted-foreground">{problem.statLabel}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Transition CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5 }}
        className="mt-12 text-center"
      >
        <p className="text-lg text-muted-foreground">
          DocDuty was built to fix this.{" "}
          <a href="/how-it-works" className="text-accent font-semibold inline-flex items-center gap-1 hover:underline">
            See how it works <ArrowRight className="w-4 h-4" />
          </a>
        </p>
      </motion.div>
    </div>
  </section>
);

export default ProblemSection;
