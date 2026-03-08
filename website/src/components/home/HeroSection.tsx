import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle,
  ChevronRight,
  Clock,
  CreditCard,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ShiftCard from "@/components/shared/ShiftCard";
import { getPortalRegisterUrl } from "@/lib/portal";

const lifecycleSteps = [
  { label: "Post Shift", emoji: "\u{1F4CB}" },
  { label: "Match Doctor", emoji: "\u{1F50D}" },
  { label: "Verify Attendance", emoji: "\u{1F4CD}" },
  { label: "Settle Payment", emoji: "\u{1F4B0}" },
];

const words = ["Trusted", "Verified", "Accountable", "Secure"];

const HeroSection = () => {
  const doctorRegisterUrl = getPortalRegisterUrl("doctor");
  const facilityRegisterUrl = getPortalRegisterUrl("facility");

  return (
    <section className="relative overflow-hidden bg-hero-pattern" aria-label="Hero">
      <div
        className="absolute inset-0 bg-[linear-gradient(hsl(168_76%_36%/0.03)_1px,transparent_1px),linear-gradient(90deg,hsl(168_76%_36%/0.03)_1px,transparent_1px)] bg-[size:60px_60px]"
        aria-hidden="true"
      />
      <div
        className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-accent/5 blur-[100px] pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-accent/8 blur-[80px] pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative mx-auto flex min-h-[100svh] max-w-7xl items-center px-4 pb-16 pt-28 sm:px-6 sm:pb-20 sm:pt-32 lg:px-8 lg:pb-16 lg:pt-36">
        <div className="grid w-full grid-cols-1 items-start gap-12 md:gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(28rem,34rem)] lg:items-center lg:gap-16 xl:grid-cols-[minmax(0,1fr)_34rem] xl:gap-20">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="min-w-0 w-full max-w-[38rem]"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="live-badge glow-ring mb-6 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-4 py-2 sm:mb-8"
            >
              <div className="live-badge-dot h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
              <span className="live-badge-label text-xs font-semibold tracking-wider text-accent">
                {"LIVE MARKETPLACE \u2014 PAKISTAN-WIDE"}
              </span>
            </motion.div>

            <h1 className="max-w-[16ch] text-balance font-heading text-3xl font-bold leading-[1.05] tracking-tight text-primary-foreground sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
              Pakistan&apos;s
              <br />
              <span className="text-gradient-shimmer">{words[0]}</span>{" "}
              Doctor Duty
              <br />
              Replacement Network
            </h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="mt-5 max-w-xl text-base leading-relaxed text-primary-foreground/55 sm:mt-6 sm:text-lg lg:text-xl"
            >
              Fill urgent doctor shifts in hours, not days. Verified professionals.
              Geofence attendance proof. Escrow-secured payments. Full operational
              accountability.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mt-8 flex w-full max-w-xl flex-col gap-3 sm:mt-10 sm:flex-row sm:gap-4"
            >
              <a href={doctorRegisterUrl} className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="group w-full bg-accent px-8 text-base font-semibold text-accent-foreground shadow-lg shadow-accent/20 hover:bg-teal-light sm:w-auto"
                >
                  Join as Doctor
                  <ArrowRight
                    className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Button>
              </a>
              <a href={facilityRegisterUrl} className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full border border-primary-foreground/20 bg-primary-foreground/10 text-base text-primary-foreground backdrop-blur-sm hover:bg-primary-foreground/20 sm:w-auto"
                >
                  Register Your Facility
                </Button>
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="mt-10 flex w-full max-w-full items-center gap-1.5 overflow-x-auto overflow-y-hidden scrollbar-hide sm:mt-12 sm:gap-1"
            >
              {lifecycleSteps.map((step, i) => (
                <div key={step.label} className="flex shrink-0 items-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1 + i * 0.15 }}
                    className="flex items-center gap-2 whitespace-nowrap rounded-lg border border-primary-foreground/10 bg-primary-foreground/5 px-2.5 py-1.5"
                  >
                    <span className="text-sm" aria-hidden="true">
                      {step.emoji}
                    </span>
                    <span className="text-xs font-medium text-primary-foreground/70">
                      {step.label}
                    </span>
                  </motion.div>
                  {i < lifecycleSteps.length - 1 && (
                    <ChevronRight
                      className="mx-1 hidden h-3.5 w-3.5 shrink-0 text-accent/50 sm:block"
                      aria-hidden="true"
                    />
                  )}
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.3 }}
              className="mt-6 flex max-w-xl flex-wrap gap-4 sm:mt-8 sm:gap-5"
            >
              {[
                { icon: Shield, label: "PMDC Verified" },
                { icon: Clock, label: "< 2hr Matching" },
                { icon: CheckCircle, label: "Geo+QR Attendance" },
                { icon: CreditCard, label: "Escrow Payments" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-1.5 text-xs text-primary-foreground/60"
                >
                  <item.icon className="h-3.5 w-3.5 text-accent/70" aria-hidden="true" />
                  <span>{item.label}</span>
                </div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative hidden w-full justify-self-end lg:block lg:max-w-[34rem]"
            aria-hidden="true"
          >
            <div className="space-y-5">
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              >
                <ShiftCard
                  facility="Aga Khan University Hospital"
                  specialty="General Medicine"
                  city="Karachi"
                  date="Today"
                  time="6:00 PM - 12:00 AM"
                  rate="12,000"
                  urgent
                  type="replacement"
                />
              </motion.div>
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              >
                <ShiftCard
                  facility="Shaukat Khanum Memorial"
                  specialty="Anesthesiology"
                  city="Lahore"
                  date="Tomorrow"
                  time="8:00 AM - 2:00 PM"
                  rate="15,000"
                  type="locum"
                />
              </motion.div>
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              >
                <ShiftCard
                  facility="CMH Rawalpindi"
                  specialty="Emergency Medicine"
                  city="Rawalpindi"
                  date="Dec 18"
                  time="Night Shift"
                  rate="18,000"
                  urgent
                  type="vacancy"
                />
              </motion.div>
            </div>

            <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-accent/10 blur-[80px]" />
            <div className="pointer-events-none absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-accent/5 blur-[60px]" />
          </motion.div>
        </div>
      </div>

      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-24"
        aria-hidden="true"
        style={{
          background:
            "linear-gradient(180deg, rgba(4,14,34,0) 0%, rgba(4,14,34,0.88) 78%, rgba(4,14,34,1) 100%)",
        }}
      />
    </section>
  );
};

export default HeroSection;
