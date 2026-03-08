import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import SectionHeader from "@/components/shared/SectionHeader";

const testimonials = [
  {
    name: "Dr. Ayesha Khan",
    role: "General Physician",
    city: "Lahore",
    quote: "DocDuty changed my locum experience completely. I used to chase hospitals for payments — now escrow guarantees I get paid. My reliability score opened doors to premium shifts I never had access to before.",
    rating: 5,
    earnings: "PKR 180K/month",
    type: "doctor" as const,
  },
  {
    name: "Dr. Ahmed Raza",
    role: "Admin Director",
    city: "Karachi",
    org: "City Hospital Network",
    quote: "We went from 12-hour scrambles to 2-hour replacements. The attendance proof system alone saved us from three no-show disputes last month. It's the operational accountability we always needed.",
    rating: 5,
    metric: "97% coverage rate",
    type: "facility" as const,
  },
  {
    name: "Dr. Fatima Zaidi",
    role: "Anesthesiologist",
    city: "Islamabad",
    quote: "The marketplace shows me exactly what's available near me with transparent pay rates. No more WhatsApp group chaos. I've completed 40+ shifts with zero payment issues.",
    rating: 5,
    earnings: "40+ shifts completed",
    type: "doctor" as const,
  },
  {
    name: "Dr. Omar Siddiqui",
    role: "Medical Superintendent",
    city: "Rawalpindi",
    org: "District Health Services",
    quote: "The admin dashboard gives us complete visibility. Geofence check-ins, digital audit trails, and automated settlement — it's enterprise-grade staffing for Pakistani healthcare.",
    rating: 5,
    metric: "3x faster hiring",
    type: "facility" as const,
  },
];

const TestimonialsSection = () => (
  <section className="py-24 lg:py-32 bg-section-dark relative overflow-hidden">
    {/* Background pattern */}
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,hsl(168_76%_36%/0.06),transparent_50%)]" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_80%,hsl(168_76%_36%/0.04),transparent_40%)]" />

    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <SectionHeader
        badge="Trusted by Thousands"
        title="Hear From Pakistan's"
        titleAccent="Healthcare Community"
        description="Doctors and facilities across the country trust DocDuty for accountable, transparent, and efficient shift management."
        dark
      />

      <div className="grid md:grid-cols-2 gap-6">
        {testimonials.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative rounded-2xl border border-primary-foreground/10 bg-primary-foreground/[0.03] backdrop-blur-sm p-6 lg:p-8 group hover:border-accent/20 transition-all duration-500"
          >
            {/* Quote icon */}
            <Quote className="w-8 h-8 text-accent/20 mb-4" />

            {/* Stars */}
            <div className="flex gap-0.5 mb-4">
              {Array.from({ length: t.rating }).map((_, j) => (
                <Star key={j} className="w-3.5 h-3.5 text-warning fill-warning" />
              ))}
            </div>

            <p className="text-sm text-primary-foreground/70 leading-relaxed mb-6">
              "{t.quote}"
            </p>

            <div className="flex items-center justify-between pt-4 border-t border-primary-foreground/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center border border-accent/20">
                  <span className="font-heading font-bold text-sm text-accent">
                    {t.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-primary-foreground">{t.name}</p>
                  <p className="text-xs text-primary-foreground/60">
                    {t.role} · {t.city}
                    {t.org && ` · ${t.org}`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  t.type === "doctor"
                    ? "bg-accent/15 text-accent"
                    : "bg-primary-foreground/10 text-primary-foreground/70"
                }`}>
                  {t.type === "doctor" ? (t.earnings || "") : (t.metric || "")}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default TestimonialsSection;
