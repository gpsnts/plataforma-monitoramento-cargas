import { Clock, Truck, CheckCircle2, PackageCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const map = {
  pendente: { label: "Pendente", icon: Clock, cls: "bg-warning-soft text-warning border-warning/20" },
  em_transito: { label: "Em Trânsito", icon: Truck, cls: "bg-info-soft text-info border-info/20" },
  monitorada: { label: "Monitorada", icon: CheckCircle2, cls: "bg-success-soft text-success border-success/20" },
  entregue: { label: "Entregue", icon: PackageCheck, cls: "bg-accent text-primary border-primary/20" },
} as const;

export function StatusBadge({ status }: { status: keyof typeof map }) {
  const s = map[status] ?? map.pendente;
  const Icon = s.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border", s.cls)}>
      <Icon className="w-3 h-3" />
      {s.label}
    </span>
  );
}
