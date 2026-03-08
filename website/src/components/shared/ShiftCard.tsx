import { MapPin, Clock, Building2, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ShiftCardProps {
  facility: string;
  specialty: string;
  city: string;
  date: string;
  time: string;
  rate: string;
  urgent?: boolean;
  type?: "replacement" | "locum" | "vacancy";
  compact?: boolean;
}

const typeLabels = {
  replacement: "Replacement",
  locum: "Locum",
  vacancy: "Vacancy",
};

const ShiftCard = ({ facility, specialty, city, date, time, rate, urgent, type = "replacement", compact }: ShiftCardProps) => (
  <div className={cn(
    "rounded-2xl border bg-card hover:border-accent/30 transition-all duration-500 group card-3d gradient-border overflow-hidden",
    compact ? "p-3" : "p-5 lg:p-6"
  )}>
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center border border-accent/10 group-hover:border-accent/20 transition-colors">
          <Building2 className="w-4.5 h-4.5 text-accent" />
        </div>
        <div>
          <p className="font-heading font-semibold text-sm text-card-foreground">{facility}</p>
          <p className="text-xs text-muted-foreground">{specialty}</p>
        </div>
      </div>
      <div className="flex gap-1.5">
        {urgent && (
          <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] px-2 py-0.5 animate-pulse">
            <Zap className="w-3 h-3 mr-0.5" /> Urgent
          </Badge>
        )}
        <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-accent/30 text-accent">
          {typeLabels[type]}
        </Badge>
      </div>
    </div>

    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{city}</span>
      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{time}</span>
    </div>

    <div className="flex items-center justify-between pt-3 border-t border-border">
      <span className="text-xs text-muted-foreground">{date}</span>
      <span className="font-heading font-bold text-accent text-lg group-hover:text-teal-light transition-colors">PKR {rate}</span>
    </div>
  </div>
);

export default ShiftCard;
