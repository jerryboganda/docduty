import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import SectionHeader from "@/components/shared/SectionHeader";
import { getPortalRegisterUrl } from "@/lib/portal";

const PricingPreview = () => {
  const doctorRegisterUrl = getPortalRegisterUrl("doctor");
  const facilityRegisterUrl = getPortalRegisterUrl("facility");

  return (
  <section className="py-24 lg:py-32 bg-section-gradient relative">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <SectionHeader
        badge="Pricing"
        title="Transparent. Fair."
        titleAccent="Performance-Aligned."
        description="DocDuty charges a simple platform fee on completed shifts. You only pay when the system delivers."
      />

      <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
        {/* Doctor Card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border border-border bg-card p-8 card-hover-glow group"
        >
          <h3 className="font-heading font-bold text-xl text-foreground mb-1">For Doctors</h3>
          <p className="text-sm text-muted-foreground mb-6">Free to join. Earn on every completed shift.</p>
          <div className="mb-8">
            <span className="text-5xl font-heading font-bold text-foreground">0%</span>
            <span className="text-muted-foreground ml-2 text-sm">sign-up fee</span>
          </div>
          <ul className="space-y-3.5 mb-8">
            {["Free profile & verification", "Browse unlimited shifts", "Guaranteed escrow payments", "Build reliability score", "Small platform fee on payouts"].map((item) => (
              <li key={item} className="flex gap-2.5 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" /> {item}
              </li>
            ))}
          </ul>
          <a href={doctorRegisterUrl}>
            <Button className="w-full bg-primary text-primary-foreground hover:bg-navy-light h-12 font-semibold group/btn">
              Join as Doctor <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover/btn:translate-x-1" />
            </Button>
          </a>
        </motion.div>

        {/* Facility Card — featured */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="rounded-2xl border-2 border-accent bg-card p-8 relative overflow-hidden card-hover-glow group"
        >
          {/* Gradient glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-accent/10 rounded-full blur-[60px] pointer-events-none" />

          <div className="absolute -top-px left-6 right-6">
            <div className="flex justify-center">
              <span className="px-4 py-1.5 bg-accent text-accent-foreground text-xs font-bold rounded-b-lg flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" /> Most Popular
              </span>
            </div>
          </div>

          <div className="relative mt-4">
            <h3 className="font-heading font-bold text-xl text-foreground mb-1">For Facilities</h3>
            <p className="text-sm text-muted-foreground mb-6">Post shifts. Pay per successful placement.</p>
            <div className="mb-8">
              <span className="text-5xl font-heading font-bold text-gradient-teal">Pay-per-shift</span>
            </div>
            <ul className="space-y-3.5 mb-8">
              {["Unlimited shift postings", "Verified doctor matching", "Attendance proof included", "Escrow-backed payments", "Dispute resolution", "Enterprise plans available"].map((item) => (
                <li key={item} className="flex gap-2.5 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" /> {item}
                </li>
              ))}
            </ul>
            <a href={facilityRegisterUrl}>
              <Button className="w-full bg-accent text-accent-foreground hover:bg-teal-light h-12 font-semibold shadow-lg shadow-accent/20 group/btn">
                Register Facility <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover/btn:translate-x-1" />
              </Button>
            </a>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4 }}
        className="text-center mt-10"
      >
        <Link to="/pricing" className="text-sm text-accent hover:underline inline-flex items-center gap-1 font-medium">
          View full pricing details <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </motion.div>
    </div>
  </section>
  );
};

export default PricingPreview;
