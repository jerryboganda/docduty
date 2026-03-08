import { motion, useReducedMotion } from "framer-motion";
import {
  Clock,
  Eye,
  Fingerprint,
  MapPin,
  QrCode,
  ShieldCheck,
} from "lucide-react";
import SectionHeader from "@/components/shared/SectionHeader";

const features = [
  {
    icon: MapPin,
    title: "Geofence Verification",
    description:
      "Doctor's GPS position must be within the facility's defined geofence boundary to check in.",
  },
  {
    icon: QrCode,
    title: "Rotating QR Codes",
    description:
      "Time-limited QR codes at the facility rotate every few minutes. Prevents screenshot fraud.",
  },
  {
    icon: Clock,
    title: "Check-in/Check-out Windows",
    description:
      "Defined arrival and departure windows with grace periods. Late arrivals are flagged automatically.",
  },
  {
    icon: Fingerprint,
    title: "Anti-Fraud Positioning",
    description:
      "Multi-signal location validation prevents GPS spoofing and ensures legitimate physical presence.",
  },
  {
    icon: ShieldCheck,
    title: "Admin Override + Audit",
    description:
      "Facility admins can override with reason. Every override is logged with a full audit trail.",
  },
  {
    icon: Eye,
    title: "Dispute-Ready Evidence",
    description:
      "Complete attendance records serve as evidence in any payment or performance dispute.",
  },
];

type OrbitNodeKind = "badge" | "status" | "tile";

type OrbitNode = {
  label: string;
  shortLabel?: string;
  icon: typeof MapPin;
  kind: OrbitNodeKind;
  top: string;
  left: string;
  delay: number;
  mobile?: boolean;
  compact?: boolean;
  accent?: "accent" | "success";
};

const orbitNodes: OrbitNode[] = [
  {
    label: "IN ZONE",
    shortLabel: "ZONE",
    icon: MapPin,
    kind: "status",
    top: "18%",
    left: "63%",
    delay: 0,
    mobile: true,
    accent: "success",
  },
  {
    label: "LIVE STATUS",
    shortLabel: "LIVE",
    icon: Eye,
    kind: "badge",
    top: "27%",
    left: "79%",
    delay: 1.3,
    mobile: true,
  },
  {
    label: "TIME WINDOW",
    shortLabel: "TIME",
    icon: Clock,
    kind: "badge",
    top: "58%",
    left: "74%",
    delay: 2.2,
    mobile: false,
  },
  {
    label: "QR SCAN",
    shortLabel: "QR",
    icon: QrCode,
    kind: "tile",
    top: "72%",
    left: "78%",
    delay: 0.6,
    mobile: true,
  },
  {
    label: "AUDIT LOG",
    shortLabel: "AUDIT",
    icon: ShieldCheck,
    kind: "tile",
    top: "76%",
    left: "25%",
    delay: 2.8,
    mobile: false,
    compact: true,
  },
  {
    label: "EVIDENCE READY",
    shortLabel: "EVIDENCE",
    icon: Eye,
    kind: "badge",
    top: "49%",
    left: "18%",
    delay: 1.8,
    mobile: false,
  },
  {
    label: "ANTI-SPOOF",
    shortLabel: "SAFE",
    icon: Fingerprint,
    kind: "status",
    top: "23%",
    left: "26%",
    delay: 3.3,
    mobile: true,
  },
  {
    label: "OVERRIDE",
    shortLabel: "OVR",
    icon: ShieldCheck,
    kind: "badge",
    top: "66%",
    left: "50%",
    delay: 3.9,
    mobile: false,
    compact: true,
  },
];

const getNodeClasses = (node: OrbitNode) => {
  const visibility = node.mobile ? "" : "hidden sm:flex";

  if (node.kind === "tile") {
    return `${visibility} h-14 w-14 flex-col rounded-2xl border border-accent/15 bg-primary-foreground/[0.04] shadow-[0_0_22px_hsl(168_76%_36%/0.07)]`;
  }

  if (node.kind === "status") {
    return `${visibility} min-w-[5rem] rounded-full border px-3 py-1.5 ${
      node.accent === "success"
        ? "border-success/25 bg-success/10 text-success shadow-[0_0_18px_hsl(142_70%_45%/0.12)]"
        : "border-accent/20 bg-accent/10 text-accent shadow-[0_0_18px_hsl(168_76%_36%/0.08)]"
    }`;
  }

  return `${visibility} rounded-full border border-accent/15 bg-primary-foreground/[0.04] px-3 py-1.5 shadow-[0_0_18px_hsl(168_76%_36%/0.06)]`;
};

const OrbitSignal = ({
  node,
  reduceMotion,
}: {
  node: OrbitNode;
  reduceMotion: boolean;
}) => {
  const Icon = node.icon;
  const label = node.shortLabel && !node.mobile ? node.label : node.label;
  const displayLabel = node.mobile ? node.label : node.label;

  return (
    <motion.div
      className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
      style={{ top: node.top, left: node.left }}
      animate={
        reduceMotion
          ? { opacity: 0.9 }
          : {
              y: [0, -3, 0, 2, 0],
              opacity: [0.72, 1, 0.8, 0.92, 0.72],
              scale: node.kind === "tile" ? [1, 1.03, 1] : [1, 1.02, 1],
            }
      }
      transition={{
        duration: 5.5 + node.delay,
        repeat: Infinity,
        ease: "easeInOut",
        delay: node.delay,
      }}
      aria-hidden="true"
    >
      <div
        className={`relative flex items-center justify-center gap-1.5 backdrop-blur-sm ${getNodeClasses(
          node,
        )}`}
      >
        {!reduceMotion && (node.kind === "status" || node.kind === "tile") && (
          <motion.div
            className="pointer-events-none absolute inset-0 rounded-[inherit] border border-accent/15"
            animate={{ opacity: [0, 0.28, 0], scale: [0.96, 1.06, 1.1] }}
            transition={{
              duration: 3.6,
              repeat: Infinity,
              ease: "easeOut",
              delay: node.delay + 0.8,
            }}
          />
        )}

        <Icon
          className={`shrink-0 ${
            node.kind === "tile"
              ? "h-5 w-5 text-accent"
              : node.kind === "status" && node.accent === "success"
                ? "h-3.5 w-3.5 text-success"
                : "h-3.5 w-3.5 text-accent"
          }`}
        />

        {node.kind === "tile" ? (
          <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[7px] font-semibold tracking-[0.18em] text-accent/55">
            {node.shortLabel ?? node.label}
          </span>
        ) : (
          <span
            className={`whitespace-nowrap font-bold tracking-[0.14em] ${
              node.compact ? "text-[7px]" : "text-[8px]"
            } ${
              node.kind === "status" && node.accent === "success"
                ? "text-success"
                : "text-accent/80"
            }`}
          >
            {displayLabel}
          </span>
        )}
      </div>
    </motion.div>
  );
};

const GeofenceVisual = () => {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8 }}
      className="relative mx-auto mb-16 flex aspect-square w-full max-w-md items-center justify-center overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_50%_52%,hsl(168_76%_36%/0.1),transparent_34%),linear-gradient(180deg,hsl(220_78%_10%/0.94),hsl(220_78%_8%/0.82))]"
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[linear-gradient(hsl(168_76%_36%/0.03)_1px,transparent_1px),linear-gradient(90deg,hsl(168_76%_36%/0.03)_1px,transparent_1px)] bg-[size:54px_54px]" />

      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <div
          key={deg}
          className="absolute inset-0 flex items-center justify-center"
          style={{ transform: `rotate(${deg}deg)` }}
        >
          <div className="absolute h-1/2 w-px origin-bottom bg-gradient-to-t from-accent/12 to-transparent" />
        </div>
      ))}

      {[28, 50, 72].map((size) => (
        <div
          key={size}
          className="absolute rounded-full border border-accent/10"
          style={{ width: `${size}%`, height: `${size}%` }}
        />
      ))}

      <div className="absolute h-[90%] w-[90%] rounded-full border-2 border-dashed border-accent/25 shadow-[0_0_30px_hsl(168_76%_36%/0.08)]" />

      <motion.div
        className="absolute h-[88%] w-[88%] rounded-full"
        style={{
          background:
            "conic-gradient(from 0deg, transparent 0deg, hsl(168 76% 36% / 0.18) 28deg, transparent 58deg)",
          maskImage:
            "radial-gradient(circle, black 0%, black 48%, transparent 50%)",
          WebkitMaskImage:
            "radial-gradient(circle, black 0%, black 48%, transparent 50%)",
        }}
        animate={reduceMotion ? undefined : { rotate: 360 }}
        transition={
          reduceMotion
            ? undefined
            : { duration: 4.2, repeat: Infinity, ease: "linear" }
        }
      />

      {!reduceMotion && (
        <motion.div
          className="absolute h-[82%] w-[82%] rounded-full border border-accent/10"
          animate={{ opacity: [0.18, 0.42, 0.18], scale: [0.96, 1.01, 1.04] }}
          transition={{ duration: 4.8, repeat: Infinity, ease: "easeOut" }}
        />
      )}

      {orbitNodes.map((node) => (
        <OrbitSignal key={node.label} node={node} reduceMotion={!!reduceMotion} />
      ))}

      <div className="relative z-20 flex h-24 w-24 flex-col items-center justify-center rounded-2xl border border-accent/20 bg-accent/10 shadow-[0_0_40px_hsl(168_76%_36%/0.12)]">
        <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20">
          <MapPin className="h-5 w-5 text-accent" />
        </div>
        <span className="text-[9px] font-bold tracking-[0.15em] text-accent">
          FACILITY
        </span>
      </div>

      <motion.div
        className="absolute z-30"
        animate={
          reduceMotion
            ? { x: 58, y: -66 }
            : {
                x: [58, 42, 68, 48, 58],
                y: [-66, -48, -30, -54, -66],
              }
        }
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {!reduceMotion && (
          <motion.div
            className="absolute -inset-2 rounded-full bg-success/20"
            animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
          />
        )}
        <div className="relative flex h-11 w-11 items-center justify-center rounded-full border-2 border-success/50 bg-success/15 backdrop-blur-sm">
          <ShieldCheck className="h-5 w-5 text-success" />
        </div>
      </motion.div>

      {[
        "top-[5%] left-[5%]",
        "top-[5%] right-[5%]",
        "bottom-[5%] left-[5%]",
        "bottom-[5%] right-[5%]",
      ].map((pos, i) => (
        <div key={i} className={`absolute ${pos} h-4 w-4 opacity-20`}>
          <div className="absolute left-0 top-1/2 h-px w-full bg-accent" />
          <div className="absolute left-1/2 top-0 h-full w-px bg-accent" />
        </div>
      ))}
    </motion.div>
  );
};

const AttendanceSection = () => (
  <section className="relative overflow-hidden bg-section-dark py-24 text-primary-foreground lg:py-32">
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,hsl(168_76%_36%/0.06),transparent_50%)]" />

    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <SectionHeader
        badge="Attendance Proof"
        title="Trust, Not Guesswork."
        titleAccent="Verified Presence."
        description="Our dual-layer attendance system combines geofencing with rotating QR codes to create irrefutable proof of doctor presence."
        dark
      />

      <GeofenceVisual />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{
              delay: i * 0.08,
              duration: 0.5,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="group rounded-2xl border-0 bg-primary-foreground/[0.03] p-6 transition-all duration-500 hover:bg-primary-foreground/[0.06]"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-accent/15 bg-accent/15 transition-colors group-hover:border-accent/30">
              <feature.icon className="h-5 w-5 text-accent" />
            </div>
            <h3 className="mb-2 font-heading text-base font-semibold">
              {feature.title}
            </h3>
            <p className="text-sm leading-relaxed text-primary-foreground/55">
              {feature.description}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default AttendanceSection;
