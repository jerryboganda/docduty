import { motion } from "framer-motion";
import { ArrowRight, Stethoscope, Building2 } from "lucide-react";
import { getPortalRegisterUrl } from "@/lib/portal";

const FinalCTA = () => {
  const doctorRegisterUrl = getPortalRegisterUrl("doctor");
  const facilityRegisterUrl = getPortalRegisterUrl("facility");

  return (
  <section className="py-24 lg:py-32 bg-section-dark text-primary-foreground relative overflow-hidden">
    {/* Animated background grid */}
    <div className="absolute inset-0 bg-[linear-gradient(hsl(168_76%_36%/0.04)_1px,transparent_1px),linear-gradient(90deg,hsl(168_76%_36%/0.04)_1px,transparent_1px)] bg-[size:40px_40px]" />
    {/* Radial glows */}
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,hsl(168_76%_36%/0.1),transparent_50%)]" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_80%,hsl(168_76%_36%/0.06),transparent_40%)]" />

    {/* Floating particles */}
    {[...Array(6)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 rounded-full bg-accent/30"
        style={{ left: `${15 + i * 14}%`, top: `${20 + (i % 3) * 25}%` }}
        animate={{
          y: [0, -30, 0],
          opacity: [0.2, 0.5, 0.2],
        }}
        transition={{
          duration: 4 + i,
          repeat: Infinity,
          delay: i * 0.5,
          ease: "easeInOut",
        }}
      />
    ))}

    <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-8"
        >
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-xs font-bold text-accent tracking-wider">JOIN 2,500+ HEALTHCARE PROFESSIONALS</span>
        </motion.div>

        <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight mb-5 leading-[1.1]">
          Ready to Transform How{" "}
          <span className="text-gradient-shimmer">Healthcare Staffing</span>{" "}
          Works?
        </h2>
        <p className="text-lg lg:text-xl text-primary-foreground/60 max-w-2xl mx-auto mb-12">
          Whether you're a doctor seeking fair opportunities or a facility needing reliable coverage — DocDuty is built for you.
        </p>

        <div className="grid sm:grid-cols-2 gap-6 max-w-xl mx-auto">
          <a href={doctorRegisterUrl}>
            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400 }}
              className="rounded-2xl border border-primary-foreground/10 bg-primary-foreground/[0.04] hover:bg-primary-foreground/[0.08] transition-colors p-7 text-center group cursor-pointer"
            >
              <div className="w-14 h-14 rounded-2xl bg-accent/15 border border-accent/20 flex items-center justify-center mx-auto mb-4">
                <Stethoscope className="w-7 h-7 text-accent" />
              </div>
              <h3 className="font-heading font-bold text-lg mb-1.5">I'm a Doctor</h3>
              <p className="text-sm text-primary-foreground/60 mb-5">Find shifts, earn more, build your reputation</p>
              <span className="inline-flex items-center text-sm text-accent font-semibold gap-1.5 group-hover:gap-2.5 transition-all">
                Get Started <ArrowRight className="w-4 h-4" />
              </span>
            </motion.div>
          </a>

          <a href={facilityRegisterUrl}>
            <motion.div
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400 }}
              className="rounded-2xl border border-accent/25 bg-accent/[0.08] hover:bg-accent/[0.12] transition-colors p-7 text-center group cursor-pointer shadow-lg shadow-accent/5"
            >
              <div className="w-14 h-14 rounded-2xl bg-accent/20 border border-accent/25 flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-7 h-7 text-accent" />
              </div>
              <h3 className="font-heading font-bold text-lg mb-1.5">I'm a Facility</h3>
              <p className="text-sm text-primary-foreground/60 mb-5">Fill shifts fast with verified, reliable doctors</p>
              <span className="inline-flex items-center text-sm text-accent font-semibold gap-1.5 group-hover:gap-2.5 transition-all">
                Register Now <ArrowRight className="w-4 h-4" />
              </span>
            </motion.div>
          </a>
        </div>
      </motion.div>
    </div>
  </section>
  );
};

export default FinalCTA;
