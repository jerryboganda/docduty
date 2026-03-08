import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SectionHeader from "@/components/shared/SectionHeader";
import RelatedPages from "@/components/shared/RelatedPages";
import PageWrapper from "@/components/shared/PageWrapper";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Users, CalendarCheck, MapPin, CreditCard, Scale, Stethoscope, Building2, Shield, Zap } from "lucide-react";

const doctorSteps = [
  { icon: Users, title: "Create Your Profile", desc: "Register, submit PMDC license, CNIC, and credentials for verification." },
  { icon: FileText, title: "Browse Shifts", desc: "Discover duty replacement, locum, and vacancy shifts filtered by specialty, city, and pay." },
  { icon: CalendarCheck, title: "Accept or Negotiate", desc: "Accept shifts instantly or submit counter-offers on rate and timing." },
  { icon: MapPin, title: "Check In", desc: "Arrive at facility, verify via geofence + rotating QR. Attendance is logged." },
  { icon: CreditCard, title: "Get Paid", desc: "On shift completion, escrow releases payment to your wallet. Withdraw anytime." },
  { icon: Scale, title: "Build Reputation", desc: "Earn ratings, improve reliability score, unlock priority matching." },
];

const facilitySteps = [
  { icon: Building2, title: "Register Facility", desc: "Add your hospital or clinic, locations, and administrative contacts." },
  { icon: FileText, title: "Post a Shift", desc: "Specify specialty, role, date, time, urgency level, and offered rate in PKR." },
  { icon: Users, title: "Review Matches", desc: "Platform suggests verified, eligible doctors ranked by reliability and proximity." },
  { icon: CalendarCheck, title: "Confirm Booking", desc: "Accept a doctor. Funds are held in escrow. Terms are locked." },
  { icon: MapPin, title: "Verify Attendance", desc: "Doctor checks in via geo+QR. Monitor real-time attendance from your dashboard." },
  { icon: CreditCard, title: "Settle Payment", desc: "Attendance verified, platform fee deducted, doctor paid. Full audit trail." },
];

const FlowSteps = ({ steps }: { steps: typeof doctorSteps }) => (
  <div className="max-w-3xl mx-auto space-y-2">
    {steps.map((step, i) => (
      <motion.div
        key={step.title}
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex gap-5 pb-8 last:pb-0"
      >
        {i < steps.length - 1 && (
          <div className="absolute left-[23px] top-14 w-0.5 h-[calc(100%-28px)] bg-border overflow-hidden">
            <motion.div
              initial={{ height: 0 }}
              whileInView={{ height: "100%" }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
              className="w-full bg-gradient-to-b from-accent to-accent/30"
            />
          </div>
        )}
        <motion.div
          initial={{ scale: 0.8 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1, type: "spring", stiffness: 300 }}
          className="w-12 h-12 rounded-xl bg-accent/10 border-2 border-accent/20 flex items-center justify-center shrink-0 relative z-10 bg-card"
        >
          <step.icon className="w-5 h-5 text-accent" />
        </motion.div>
        <div className="pt-1 pb-4">
          <span className="inline-block text-[10px] font-bold text-accent tracking-widest uppercase mb-1 px-2 py-0.5 rounded-full bg-accent/5 border border-accent/10">Step {i + 1}</span>
          <h3 className="font-heading font-semibold text-lg text-foreground">{step.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
        </div>
      </motion.div>
    ))}
  </div>
);

const HowItWorksPage = () => (
  <PageWrapper title="How It Works — DocDuty" description="Step-by-step guide to the DocDuty shift lifecycle. From posting to payout for doctors and facilities.">
  <div className="min-h-screen">
    <Navbar />
    <section className="pt-32 pb-20 bg-hero-pattern text-primary-foreground relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_80%,hsl(168_76%_36%/0.06),transparent_50%)]" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <span className="inline-block text-[11px] font-bold tracking-[0.15em] uppercase mb-5 px-4 py-1.5 rounded-full bg-accent/15 text-accent border border-accent/20">How It Works</span>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-[1.1]">
            Simple, Transparent,<br /><span className="text-gradient-shimmer">End-to-End</span>
          </h1>
          <p className="text-lg text-primary-foreground/55 max-w-xl mx-auto">From posting a shift to settling payment — every step is verified, tracked, and accountable.</p>
        </motion.div>
      </div>
    </section>

    <section className="py-24 bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Tabs defaultValue="doctor" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-16 h-12">
            <TabsTrigger value="doctor" className="flex items-center gap-2 text-sm font-semibold"><Stethoscope className="w-4 h-4" /> For Doctors</TabsTrigger>
            <TabsTrigger value="facility" className="flex items-center gap-2 text-sm font-semibold"><Building2 className="w-4 h-4" /> For Facilities</TabsTrigger>
          </TabsList>
          <TabsContent value="doctor"><FlowSteps steps={doctorSteps} /></TabsContent>
          <TabsContent value="facility"><FlowSteps steps={facilitySteps} /></TabsContent>
        </Tabs>
      </div>
    </section>
    <RelatedPages pages={[
      { label: "Product Overview", href: "/product", desc: "Full platform features and capabilities", icon: Zap },
      { label: "Attendance Proof", href: "/attendance-proof", desc: "How geofence + QR verification works", icon: MapPin },
      { label: "Trust & Safety", href: "/trust-safety", desc: "Platform trust architecture and policies", icon: Shield },
    ]} />
    <Footer />
  </div>
  </PageWrapper>
);

export default HowItWorksPage;
