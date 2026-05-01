import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: "primary" | "success" | "info" | "warning";
}

const toneClasses: Record<NonNullable<Props["tone"]>, string> = {
  primary: "bg-accent text-primary",
  success: "bg-success-soft text-success",
  info: "bg-info-soft text-info",
  warning: "bg-warning-soft text-warning",
};

export function StatCard({ label, value, icon: Icon, tone = "primary" }: Props) {
  return (
    <div className="bg-card rounded-2xl shadow-card border border-border p-5 flex items-center justify-between">
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
      </div>
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", toneClasses[tone])}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
}
