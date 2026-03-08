import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  badge?: string;
  title: string;
  titleAccent?: string;
  description?: string;
  align?: "left" | "center";
  dark?: boolean;
}

const SectionHeader = ({ badge, title, titleAccent, description, align = "center", dark = false }: SectionHeaderProps) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    className={cn("mb-14 lg:mb-20", align === "center" ? "text-center max-w-3xl mx-auto" : "max-w-2xl")}
  >
    {badge && (
      <span className={cn(
        "inline-block text-[11px] font-bold tracking-[0.15em] uppercase mb-5 px-4 py-1.5 rounded-full border",
        dark
          ? "bg-accent/15 text-accent border-accent/20"
          : "bg-accent/8 text-accent border-accent/15"
      )}>
        {badge}
      </span>
    )}
    <h2 className={cn(
      "font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1]",
      dark ? "text-primary-foreground" : "text-foreground"
    )}>
      {title}
      {titleAccent && <span className="text-gradient-teal"> {titleAccent}</span>}
    </h2>
    {description && (
      <p className={cn(
        "mt-5 text-lg leading-relaxed max-w-2xl",
        align === "center" && "mx-auto",
        dark ? "text-primary-foreground/55" : "text-muted-foreground"
      )}>
        {description}
      </p>
    )}
    {/* Decorative accent line */}
    <div className={cn(
      "mt-6 h-1 w-16 rounded-full bg-accent/30",
      align === "center" && "mx-auto"
    )} />
  </motion.div>
);

export default SectionHeader;
