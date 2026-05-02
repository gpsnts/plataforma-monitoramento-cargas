import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/AppHeader";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { CargaDetailDialog } from "@/components/CargaDetailDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Package, Search, Filter, Database, CheckCircle2, Truck, Clock, Send,
  ArrowUpDown, FileText, MapPin, User as UserIcon, Loader2, Zap
} from "lucide-react";
import type { CargaConsolidada, CargaStatus } from "@/lib/types";
import { toast } from "sonner";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";

const today = new Date();
const aMonthAgo = new Date(today.getTime() - 30 * 86400000);
const fmt = (d: Date) => d.toISOString().slice(0, 10);

export default function Index() {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [dataInicio, setDataInicio] = useState(fmt(aMonthAgo));
  const [dataFim, setDataFim] = useState(fmt(today));
  const [cargas, setCargas] = useState<CargaConsolidada[]>([]);
  const [loading, setLoading] = useState(false);
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set());
  const [ordem, setOrdem] = useState<"recente" | "antiga" | "codigo">("recente");
  const [detalhe, setDetalhe] = useState<CargaConsolidada | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate("/auth", { replace: true });
    });
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) navigate("/auth", { replace: true });
      else { setAuthChecked(true); consultar(); }
    });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function consultar() {
    setLoading(true);
    const { data, error } = await supabase
      .from("cargas")
      .select(`
        id, codigo, data, origem, destino, peso_kg, volume_m3, status, monitorada,
        motorista:motoristas(id, nome, cpf, cnh, telefone),
        veiculo:veiculos(id, placa, tipo, capacidade_kg, ocupacao_percent)
      `)
      .gte("data", dataInicio)
      .lte("data", dataFim)
      .order("data", { ascending: false });
    setLoading(false);
    if (error) return toast.error("Erro ao consultar cargas: " + error.message);
    setCargas((data ?? []) as unknown as CargaConsolidada[]);
    setSelecionadas(new Set());
  }

  const ordenadas = useMemo(() => {
    const arr = [...cargas];
    if (ordem === "recente") arr.sort((a, b) => b.data.localeCompare(a.data));
    if (ordem === "antiga") arr.sort((a, b) => a.data.localeCompare(b.data));
    if (ordem === "codigo") arr.sort((a, b) => a.codigo.localeCompare(b.codigo));
    return arr;
  }, [cargas, ordem]);

  const stats = useMemo(() => ({
    total: cargas.length,
    selecionadas: selecionadas.size,
    monitoradas: cargas.filter(c => c.monitorada).length,
    pendentes: cargas.filter(c => c.status === "pendente").length,
  }), [cargas, selecionadas]);

  function toggle(id: string) {
    const next = new Set(selecionadas);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelecionadas(next);
  }

  function toggleAll() {
    const pendentes = ordenadas.filter(c => !c.monitorada).map(c => c.id);
    if (selecionadas.size === pendentes.length) setSelecionadas(new Set());
    else setSelecionadas(new Set(pendentes));
  }

  async function enviarLote() {
    if (selecionadas.size === 0) return toast.error("Selecione ao menos uma carga");
    setEnviando(true);
    const ids = Array.from(selecionadas);
    const cargasSel = cargas.filter(c => ids.includes(c.id));
    const { data: { user } } = await supabase.auth.getUser();

    const inserts = cargasSel.map(c => ({
      carga_id: c.id,
      enviado_por: user?.id,
      status: "enviado",
      payload: {
        codigo: c.codigo,
        motorista: c.motorista as any,
        veiculo: c.veiculo as any,
        rota: { origem: c.origem, destino: c.destino },
        peso_kg: c.peso_kg, volume_m3: c.volume_m3,
      } as any,
    }));
    const { error: e1 } = await supabase.from("solicitacoes_monitoramento").insert(inserts);
    if (e1) { setEnviando(false); return toast.error(e1.message); }

    const { error: e2 } = await supabase.from("cargas")
      .update({ monitorada: true, status: "monitorada" as CargaStatus })
      .in("id", ids);

    setEnviando(false);
    if (e2) return toast.error(e2.message);
    toast.success(`${ids.length} solicitações de monitoramento enviadas com sucesso`);
    consultar();
  }

  function gerarRelatorio() {
    const header = "Codigo;Data;Motorista;CPF;Veiculo;Tipo;Origem;Destino;Peso(kg);Volume(m3);Status;Monitorada";
    const rows = ordenadas.map(c => [
      c.codigo, c.data, c.motorista?.nome ?? "", c.motorista?.cpf ?? "",
      c.veiculo?.placa ?? "", c.veiculo?.tipo ?? "",
      c.origem ?? "", c.destino ?? "", c.peso_kg ?? "", c.volume_m3 ?? "", c.status, c.monitorada ? "Sim" : "Não"
    ].join(";"));
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `relatorio_cargas_${dataInicio}_${dataFim}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success("Relatório gerado");
  }

  if (!authChecked) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen gradient-bg">
      <AppHeader />

      <main className="container py-6 space-y-6">
        {/* Banner sistema automatizado */}
        <section className="bg-info-soft border border-info/20 rounded-2xl p-5 flex gap-3">
          <Zap className="w-5 h-5 text-info flex-shrink-0 mt-0.5" fill="currentColor" />
          <div>
            <h2 className="font-semibold text-foreground">Sistema Automatizado:</h2>
            <p className="text-sm text-foreground/80 mt-1">
              Os dados são consultados e consolidados automaticamente de múltiplos endpoints da API Evolog.
            </p>
          </div>
        </section>

        {/* Filtro */}
        <section className="bg-card border border-border rounded-2xl shadow-card p-6">
          <div className="flex items-center gap-2 mb-1">
            <Filter className="w-4 h-4 text-primary" />
            <h2 className="font-semibold text-foreground">Filtrar Cargas por Período</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Consulte a API Evolog e visualize cargas consolidadas do período selecionado
          </p>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="di">Data Início</Label>
              <Input id="di" type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="df">Data Fim</Label>
              <Input id="df" type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
            </div>
            <Button onClick={consultar} disabled={loading} className="gradient-primary text-primary-foreground h-10 gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              Consultar Cargas
            </Button>
          </div>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-4">
            <Database className="w-3.5 h-3.5" />
            Dados consolidados de: /api/cargas, /api/motoristas, /api/veiculos
          </p>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total de Cargas" value={stats.total} icon={Package} tone="primary" />
          <StatCard label="Selecionadas" value={stats.selecionadas} icon={CheckCircle2} tone="success" />
          <StatCard label="Monitoradas" value={stats.monitoradas} icon={Truck} tone="info" />
          <StatCard label="Pendentes" value={stats.pendentes} icon={Clock} tone="warning" />
        </section>

        {/* Cargas */}
        <section className="bg-card border border-border rounded-2xl shadow-card">
          <div className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border">
            <div>
              <h2 className="font-semibold text-foreground text-lg">Cargas Consolidadas</h2>
              <p className="text-sm text-muted-foreground">Informações integradas de carga, motorista e veículo da API Evolog</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Ordenar por:</span>
                <Select value={ordem} onValueChange={(v: any) => setOrdem(v)}>
                  <SelectTrigger className="w-[160px] h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recente">Data (Recente)</SelectItem>
                    <SelectItem value="antiga">Data (Antiga)</SelectItem>
                    <SelectItem value="codigo">Código</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" size="sm" onClick={toggleAll} className="gap-2">
                <CheckCircle2 className="w-4 h-4" /> Selecionar Pendentes
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left text-muted-foreground">
                  <th className="px-4 py-3 w-10"></th>
                  <th className="px-4 py-3 font-medium">Código</th>
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">Motorista</th>
                  <th className="px-4 py-3 font-medium">Veículo</th>
                  <th className="px-4 py-3 font-medium">Origem → Destino</th>
                  <th className="px-4 py-3 font-medium text-right">Peso (kg)</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {ordenadas.length === 0 && !loading && (
                  <tr><td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                    Nenhuma carga encontrada no período. Ajuste o filtro e clique em Consultar.
                  </td></tr>
                )}
                {ordenadas.map(c => (
                  <tr key={c.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={selecionadas.has(c.id)}
                        onCheckedChange={() => toggle(c.id)}
                        disabled={c.monitorada}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground flex items-center gap-2">
                      {c.codigo}
                      {c.monitorada && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-success-soft text-success font-medium">
                          <CheckCircle2 className="w-3 h-3" /> Monitorado
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(c.data).toLocaleDateString("pt-BR")}</td>
                    <td className="px-4 py-3"><span className="inline-flex items-center gap-1.5"><UserIcon className="w-3.5 h-3.5 text-muted-foreground" />{c.motorista?.nome ?? "—"}</span></td>
                    <td className="px-4 py-3"><span className="inline-flex items-center gap-1.5"><Truck className="w-3.5 h-3.5 text-muted-foreground" />{c.veiculo?.placa ?? "—"}</span></td>
                    <td className="px-4 py-3"><span className="inline-flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-success" />{c.origem ?? "—"} → {c.destino ?? "—"}</span></td>
                    <td className="px-4 py-3 text-right font-medium">{c.peso_kg != null ? c.peso_kg.toLocaleString("pt-BR") : "—"}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="link" size="sm" className="text-primary h-auto p-0" onClick={() => setDetalhe(c)}>
                        Ver Detalhes
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer ações em lote */}
          <div className="p-4 border-t border-border bg-muted/20 flex flex-col md:flex-row items-center justify-between gap-3 rounded-b-2xl">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">{selecionadas.size}</strong> carga(s) selecionada(s) para envio em lote
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={gerarRelatorio} className="gap-2">
                <FileText className="w-4 h-4" /> Gerar Relatório
              </Button>
              <Button onClick={enviarLote} disabled={enviando || selecionadas.size === 0}
                className="gradient-primary text-primary-foreground gap-2">
                {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Enviar Solicitações ({selecionadas.size})
              </Button>
            </div>
          </div>
        </section>
      </main>

      <CargaDetailDialog carga={detalhe} onClose={() => setDetalhe(null)} onUpdated={() => { consultar(); setDetalhe(null); }} />
    </div>
  );
}
