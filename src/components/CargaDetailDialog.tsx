import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Package, Database, User, Truck, MapPin, Info } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import type { CargaConsolidada } from "@/lib/types";

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <p className="text-xs text-muted-foreground mb-1">{label}</p>
    <p className="text-sm font-medium text-foreground">{children}</p>
  </div>
);

const SectionTitle = ({ icon: Icon, title, endpoint, color }: any) => (
  <div className="flex items-center gap-2 mb-3">
    <Icon className="w-4 h-4 text-foreground" />
    <h3 className="font-semibold text-foreground">{title}</h3>
    <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${color}`}>{endpoint}</span>
  </div>
);

export function CargaDetailDialog({ carga, onClose }: { carga: CargaConsolidada | null; onClose: () => void }) {
  if (!carga) return null;
  const m = carga.motorista, v = carga.veiculo;

  return (
    <Dialog open={!!carga} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Package className="w-5 h-5 text-primary" />
            Detalhes Consolidados — Carga {carga.codigo}
          </DialogTitle>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Database className="w-3.5 h-3.5" />
            Informações consolidadas de múltiplos endpoints da API Evolog
          </p>
        </DialogHeader>

        <div className="space-y-6 mt-2">
          <section>
            <SectionTitle icon={Package} title="Informações da Carga" endpoint="endpoint: /api/cargas" color="bg-accent text-primary" />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Código da Carga">{carga.codigo}</Field>
              <Field label="Data">{new Date(carga.data).toLocaleDateString("pt-BR")}</Field>
              <Field label="Status"><StatusBadge status={carga.status} /></Field>
              <Field label="Monitoramento">
                <span className="inline-block px-2 py-0.5 rounded border border-border text-xs">
                  {carga.monitorada ? "Configurado" : "Não Configurado"}
                </span>
              </Field>
            </div>
          </section>

          <div className="border-t border-border" />

          <section>
            <SectionTitle icon={User} title="Dados do Motorista" endpoint="endpoint: /api/motoristas" color="bg-purple-100 text-purple-700" />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Nome Completo">{m?.nome ?? "—"}</Field>
              <Field label="CPF">{m?.cpf ?? "—"}</Field>
              <Field label="CNH">{m?.cnh ?? "—"}</Field>
              <Field label="Telefone">{m?.telefone ?? "—"}</Field>
            </div>
          </section>

          <div className="border-t border-border" />

          <section>
            <SectionTitle icon={Truck} title="Dados do Veículo" endpoint="endpoint: /api/veiculos" color="bg-orange-100 text-orange-700" />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Placa">{v?.placa ?? "—"}</Field>
              <Field label="Tipo de Veículo">{v?.tipo ?? "—"}</Field>
              <Field label="Capacidade Máxima">{v ? `${v.capacidade_kg.toLocaleString("pt-BR")} kg` : "—"}</Field>
              <Field label="Ocupação Atual">{v ? `${v.ocupacao_percent}%` : "—"}</Field>
            </div>
          </section>

          <div className="border-t border-border" />

          <section>
            <SectionTitle icon={MapPin} title="Rota e Carga" endpoint="rota" color="bg-success-soft text-success" />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Origem">📍 {carga.origem}</Field>
              <Field label="Destino">📍 {carga.destino}</Field>
              <Field label="Peso Total">{carga.peso_kg.toLocaleString("pt-BR")} kg</Field>
              <Field label="Volume">{carga.volume_m3} m³</Field>
            </div>
          </section>

          <div className="bg-info-soft border border-info/20 rounded-xl p-4 flex gap-3">
            <Info className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
            <p className="text-sm text-info-foreground/90 text-foreground/80">
              Ao enviar esta carga para monitoramento, todos esses dados serão preenchidos
              automaticamente no portal Evolog sem necessidade de intervenção manual.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
