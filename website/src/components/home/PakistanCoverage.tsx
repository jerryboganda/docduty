import { motion } from "framer-motion";
import SectionHeader from "@/components/shared/SectionHeader";
import { useCountUp } from "@/hooks/useCountUp";

const cities = [
  { name: "Karachi", facilities: 85, doctors: 620, x: 42, y: 78 },
  { name: "Lahore", facilities: 72, doctors: 530, x: 55, y: 35 },
  { name: "Islamabad", facilities: 45, doctors: 310, x: 53, y: 25 },
  { name: "Rawalpindi", facilities: 38, doctors: 240, x: 54, y: 27 },
  { name: "Peshawar", facilities: 28, doctors: 180, x: 48, y: 18 },
  { name: "Faisalabad", facilities: 22, doctors: 150, x: 52, y: 40 },
  { name: "Multan", facilities: 18, doctors: 120, x: 48, y: 50 },
  { name: "Quetta", facilities: 12, doctors: 80, x: 30, y: 48 },
];

const CityDot = ({ city, i }: { city: typeof cities[0]; i: number }) => {
  const { count: fac, ref } = useCountUp(city.facilities, 1800);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: 0.3 + i * 0.1, type: "spring", stiffness: 200 }}
      className="absolute group cursor-default"
      style={{ left: `${city.x}%`, top: `${city.y}%` }}
    >
      {/* Pulse ring */}
      <motion.div
        className="absolute -inset-2 rounded-full bg-accent/20"
        animate={{ scale: [1, 1.8, 1], opacity: [0.4, 0, 0.4] }}
        transition={{ duration: 3, repeat: Infinity, delay: i * 0.3 }}
        aria-hidden="true"
      />
      {/* Dot */}
      <div className="relative w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-accent shadow-lg shadow-accent/30 z-10" />
      {/* Label */}
      <div className="absolute left-5 -top-2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
        <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-xl">
          <p ref={ref as React.RefObject<HTMLParagraphElement>} className="font-heading font-bold text-sm text-foreground">{city.name}</p>
          <p className="text-[10px] text-muted-foreground">{fac} facilities · {city.doctors} doctors</p>
        </div>
      </div>
    </motion.div>
  );
};

const PakistanCoverage = () => (
  <section className="py-24 lg:py-32 bg-section-dark text-primary-foreground relative overflow-hidden">
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,hsl(168_76%_36%/0.05),transparent_60%)]" aria-hidden="true" />

    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <SectionHeader
        badge="Pakistan-Wide Coverage"
        title="Operational Across"
        titleAccent="Major Cities"
        description="From Karachi to Peshawar, DocDuty is building the infrastructure for reliable healthcare staffing across all provinces."
        dark
      />

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        {/* SVG Map area — scales down on mobile */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="relative aspect-[3/4] max-w-xs sm:max-w-md mx-auto w-full"
        >
          {/* Simplified Pakistan silhouette */}
          <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" aria-hidden="true" role="img">
            <path
              d="M45 5 L55 8 L60 12 L58 18 L52 15 L48 17 L53 22 L57 28 L60 32 L58 38 L55 42 L53 48 L50 55 L48 62 L45 70 L42 75 L40 80 L38 85 L42 88 L45 92 L40 95 L35 90 L30 85 L28 78 L25 70 L22 60 L20 50 L22 42 L25 35 L30 28 L35 20 L38 15 L42 10 Z"
              className="fill-primary-foreground/[0.04] stroke-primary-foreground/10"
              strokeWidth="0.5"
            />
          </svg>
          {/* City dots positioned over the map */}
          {cities.map((city, i) => (
            <CityDot key={city.name} city={city} i={i} />
          ))}
        </motion.div>

        {/* City stats grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {cities.map((city, i) => (
            <motion.div
              key={city.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
              className="rounded-xl border-0 bg-primary-foreground/[0.03] p-3 sm:p-4 hover:bg-primary-foreground/[0.06] transition-all duration-500 group"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-accent group-hover:shadow-lg group-hover:shadow-accent/30 transition-shadow" aria-hidden="true" />
                <h3 className="font-heading font-semibold text-sm sm:text-base">{city.name}</h3>
              </div>
              <div className="flex gap-3 sm:gap-4 text-[11px] sm:text-xs text-primary-foreground/60">
                <span><strong className="text-primary-foreground/70">{city.facilities}</strong> Facilities</span>
                <span><strong className="text-primary-foreground/70">{city.doctors}</strong> Doctors</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default PakistanCoverage;
