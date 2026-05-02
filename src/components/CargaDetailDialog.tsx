import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Package, Database, User, Truck, MapPin, Info, Pencil, Save, X, AlertTriangle, Loader2 } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { CargaConsolidada } from "@/lib/types";

const Field = ({ label, children, missing }: { label: string; children: React.ReactNode; missing?: boolean }) => (
  <div>
    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
      {label}
      {missing && <AlertTriangle className="w-3 h-3 text-warning" />}
    </p>
    <p className={`text-sm font-medium ${missing ? "text-warning italic" : "text-foreground"}`}>
      {children ?? "— não informado —"}
    </p>
  </div>
);

const EditField = ({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) => (
  <div className="space-y-1">
    <Label className="text-xs text-muted-foreground">{label}</Label>
    <Input value={value} onChange={(e) => onChange(e.target.value)} type={type} className="h-9" />
  </div>
);

const SectionTitle = ({ icon: Icon, title, endpoint, color, onEdit, editing, onCancel, onSave, saving }: any) => (
  <div className="flex items-center gap-2 mb-3">
    <Icon className="w-4 h-4 text-foreground" />
    <h3 className="font-semibold text-foreground">{title}</h3>
    <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${color}`}>{endpoint}</span>
    <div className="ml-auto flex gap-1">
      {!editing && onEdit && (
        <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={onEdit}>
          <Pencil className="w-3 h-3" /> Editar
        </Button>
      )}
      {editing && (
        <>
          <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={onCancel} disabled={saving}>
            <X className="w-3 h-3" /> Cancelar
          </Button>
          <Button size="sm" className="h-7 gap-1 text-xs gradient-primary text-primary-foreground" onClick={onSave} disabled={saving}>
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Salvar
          </Button>
        </>
      )}
    </div>
  </div>
);

export function CargaDetailDialog({ carga, onClose, onUpdated }: { carga: CargaConsolidada | null; onClose: () => void; onUpdated?: () => void }) {
  const [editSection, setEditSection] = useState<null | "motorista" | "veiculo" | "rota">(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    setEditSection(null);
    setForm({});
  }, [carga?.id]);

  if (!carga) return null;
  const m = carga.motorista, v = carga.veiculo;

  function startEdit(section: "motorista" | "veiculo" | "rota") {
    if (section === "motorista") setForm({ nome: m?.nome ?? "", cpf: m?.cpf ?? "", cnh: m?.cnh ?? "", telefone: m?.telefone ?? "" });
    if (section === "veiculo") setForm({ placa: v?.placa ?? "", tipo: v?.tipo ?? "", capacidade_kg: v?.capacidade_kg ?? "", ocupacao_percent: v?.ocupacao_percent ?? "" });
    if (section === "rota") setForm({ origem: carga!.origem ?? "", destino: carga!.destino ?? "", peso_kg: carga!.peso_kg ?? "", volume_m3: carga!.volume_m3 ?? "" });
    setEditSection(section);
  }

  async function save() {
    if (!editSection) return;
    setSaving(true);
    const nullify = (v: any) => (v === "" || v === null || v === undefined ? null : v);
    let error: any;
    if (editSection === "motorista") {
      if (!m?.id) { toast.error("Esta carga não tem motorista vinculado"); setSaving(false); return; }
      ({ error } = await supabase.from("motoristas").update({
        nome: form.nome || m.nome,
        cpf: nullify(form.cpf), cnh: nullify(form.cnh), telefone: nullify(form.telefone),
      }).eq("id", m.id));
    } else if (editSection === "veiculo") {
      if (!v?.id) { toast.error("Esta carga não tem veículo vinculado"); setSaving(false); return; }
      ({ error } = await supabase.from("veiculos").update({
        placa: form.placa || v.placa,
        tipo: nullify(form.tipo),
        capacidade_kg: form.capacidade_kg === "" ? null : Number(form.capacidade_kg),
        ocupacao_percent: form.ocupacao_percent === "" ? null : Number(form.ocupacao_percent),
      }).eq("id", v.id));
    } else if (editSection === "rota") {
      ({ error } = await supabase.from("cargas").update({
        origem: nullify(form.origem), destino: nullify(form.destino),
        peso_kg: form.peso_kg === "" ? null : Number(form.peso_kg),
        volume_m3: form.volume_m3 === "" ? null : Number(form.volume_m3),
      }).eq("id", carga!.id));
    }
    setSaving(false);
    if (error) return toast.error("Erro ao salvar: " + error.message);
    toast.success("Dados atualizados com sucesso");
    setEditSection(null);
    onUpdated?.();
  }

  const hasMissing =
    !m?.cpf || !m?.cnh || !m?.telefone ||
    !v?.tipo || v?.capacidade_kg == null || v?.ocupacao_percent == null ||
    !carga.origem || !carga.destino || carga.peso_kg == null || carga.volume_m3 == null;

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

        {hasMissing && (
          <div className="bg-warning-soft border border-warning/30 rounded-xl p-3 flex gap-2 text-sm">
            <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
            <p className="text-foreground/80">
              Foram detectados <strong>dados incompletos</strong>. Use o botão <em>Editar</em> em cada seção para complementar manualmente antes do envio.
            </p>
          </div>
        )}

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
            <SectionTitle
              icon={User} title="Dados do Motorista" endpoint="endpoint: /api/motoristas" color="bg-purple-100 text-purple-700"
              editing={editSection === "motorista"}
              onEdit={m ? () => startEdit("motorista") : undefined}
              onCancel={() => setEditSection(null)} onSave={save} saving={saving}
            />
            {editSection === "motorista" ? (
              <div className="grid grid-cols-2 gap-4">
                <EditField label="Nome Completo" value={form.nome} onChange={(v) => setForm({ ...form, nome: v })} />
                <EditField label="CPF" value={form.cpf} onChange={(v) => setForm({ ...form, cpf: v })} />
                <EditField label="CNH" value={form.cnh} onChange={(v) => setForm({ ...form, cnh: v })} />
                <EditField label="Telefone" value={form.telefone} onChange={(v) => setForm({ ...form, telefone: v })} />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <Field label="Nome Completo" missing={!m?.nome}>{m?.nome}</Field>
                <Field label="CPF" missing={!m?.cpf}>{m?.cpf}</Field>
                <Field label="CNH" missing={!m?.cnh}>{m?.cnh}</Field>
                <Field label="Telefone" missing={!m?.telefone}>{m?.telefone}</Field>
              </div>
            )}
          </section>

          <div className="border-t border-border" />

          <section>
            <SectionTitle
              icon={Truck} title="Dados do Veículo" endpoint="endpoint: /api/veiculos" color="bg-orange-100 text-orange-700"
              editing={editSection === "veiculo"}
              onEdit={v ? () => startEdit("veiculo") : undefined}
              onCancel={() => setEditSection(null)} onSave={save} saving={saving}
            />
            {editSection === "veiculo" ? (
              <div className="grid grid-cols-2 gap-4">
                <EditField label="Placa" value={form.placa} onChange={(val) => setForm({ ...form, placa: val })} />
                <EditField label="Tipo de Veículo" value={form.tipo} onChange={(val) => setForm({ ...form, tipo: val })} />
                <EditField label="Capacidade Máxima (kg)" value={String(form.capacidade_kg)} onChange={(val) => setForm({ ...form, capacidade_kg: val })} type="number" />
                <EditField label="Ocupação Atual (%)" value={String(form.ocupacao_percent)} onChange={(val) => setForm({ ...form, ocupacao_percent: val })} type="number" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <Field label="Placa" missing={!v?.placa}>{v?.placa}</Field>
                <Field label="Tipo de Veículo" missing={!v?.tipo}>{v?.tipo}</Field>
                <Field label="Capacidade Máxima" missing={v?.capacidade_kg == null}>{v?.capacidade_kg != null ? `${v.capacidade_kg.toLocaleString("pt-BR")} kg` : null}</Field>
                <Field label="Ocupação Atual" missing={v?.ocupacao_percent == null}>{v?.ocupacao_percent != null ? `${v.ocupacao_percent}%` : null}</Field>
              </div>
            )}
          </section>

          <div className="border-t border-border" />

          <section>
            <SectionTitle
              icon={MapPin} title="Rota e Carga" endpoint="rota" color="bg-success-soft text-success"
              editing={editSection === "rota"}
              onEdit={() => startEdit("rota")}
              onCancel={() => setEditSection(null)} onSave={save} saving={saving}
            />
            {editSection === "rota" ? (
              <div className="grid grid-cols-2 gap-4">
                <EditField label="Origem" value={form.origem} onChange={(val) => setForm({ ...form, origem: val })} />
                <EditField label="Destino" value={form.destino} onChange={(val) => setForm({ ...form, destino: val })} />
                <EditField label="Peso Total (kg)" value={String(form.peso_kg)} onChange={(val) => setForm({ ...form, peso_kg: val })} type="number" />
                <EditField label="Volume (m³)" value={String(form.volume_m3)} onChange={(val) => setForm({ ...form, volume_m3: val })} type="number" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <Field label="Origem" missing={!carga.origem}>{carga.origem ? `📍 ${carga.origem}` : null}</Field>
                <Field label="Destino" missing={!carga.destino}>{carga.destino ? `📍 ${carga.destino}` : null}</Field>
                <Field label="Peso Total" missing={carga.peso_kg == null}>{carga.peso_kg != null ? `${carga.peso_kg.toLocaleString("pt-BR")} kg` : null}</Field>
                <Field label="Volume" missing={carga.volume_m3 == null}>{carga.volume_m3 != null ? `${carga.volume_m3} m³` : null}</Field>
              </div>
            )}
          </section>

          <div className="bg-info-soft border border-info/20 rounded-xl p-4 flex gap-3">
            <Info className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
            <p style={{ "color": "#1c398e" }} className="text-sm text-foreground/80">
              Ao enviar esta carga para monitoramento, todos esses dados serão preenchidos
              automaticamente no portal Evolog sem necessidade de intervenção manual.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}