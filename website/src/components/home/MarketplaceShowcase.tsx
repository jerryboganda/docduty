import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SectionHeader from "@/components/shared/SectionHeader";
import ShiftCard from "@/components/shared/ShiftCard";

const filters = ["All Shifts", "Urgent", "Replacement", "Locum", "Vacancy"] as const;

const shifts = [
  { facility: "Aga Khan University Hospital", specialty: "Cardiology", city: "Karachi", date: "Today", time: "2:00 PM – 10:00 PM", rate: "20,000", urgent: true, type: "replacement" as const },
  { facility: "Shifa International Hospital", specialty: "General Surgery", city: "Islamabad", date: "Tomorrow", time: "8:00 AM – 4:00 PM", rate: "18,000", type: "locum" as const },
  { facility: "Lahore General Hospital", specialty: "Emergency Medicine", city: "Lahore", date: "Dec 20", time: "Night Shift", rate: "14,000", urgent: true, type: "vacancy" as const },
  { facility: "Combined Military Hospital", specialty: "Anesthesiology", city: "Rawalpindi", date: "Dec 21", time: "6:00 AM – 2:00 PM", rate: "16,000", type: "replacement" as const },
  { facility: "Ziauddin Hospital", specialty: "Pediatrics", city: "Karachi", date: "Dec 22", time: "10:00 AM – 6:00 PM", rate: "12,000", type: "locum" as const },
  { facility: "Services Hospital", specialty: "Orthopedics", city: "Lahore", date: "Dec 23", time: "2:00 PM – 10:00 PM", rate: "15,000", urgent: true, type: "vacancy" as const },
];

const MarketplaceShowcase = () => {
  const [active, setActive] = useState<typeof filters[number]>("All Shifts");

  const filtered = shifts.filter((s) => {
    if (active === "All Shifts") return true;
    if (active === "Urgent") return s.urgent;
    return s.type === active.toLowerCase();
  });

  return (
    <section className="py-24 lg:py-32 bg-card relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader
          badge="Live Marketplace"
          title="Real Shifts. Real Facilities."
          titleAccent="Real Opportunity."
          description="Browse duty replacement and locum opportunities across Pakistan's top hospitals and healthcare facilities."
        />

        {/* Interactive filter chips — horizontal scroll on mobile */}
        <div className="flex gap-2 justify-start sm:justify-center mb-12 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible scrollbar-hide" role="tablist" aria-label="Filter shifts">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActive(filter)}
              role="tab"
              aria-selected={active === filter}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 border whitespace-nowrap shrink-0 ${
                active === filter
                  ? "bg-accent text-accent-foreground border-accent shadow-lg shadow-accent/20"
                  : "bg-card text-muted-foreground border-border hover:border-accent/40 hover:text-foreground"
              }`}
            >
              {filter}
              {filter === "Urgent" && (
                <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-destructive inline-block animate-pulse" aria-hidden="true" />
              )}
            </button>
          ))}
        </div>

        <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5" role="tabpanel">
          <AnimatePresence mode="popLayout">
            {filtered.map((shift) => (
              <motion.div
                key={shift.facility + shift.specialty}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <ShiftCard {...shift} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-12">No shifts match this filter.</p>
        )}
      </div>
    </section>
  );
};

export default MarketplaceShowcase;
