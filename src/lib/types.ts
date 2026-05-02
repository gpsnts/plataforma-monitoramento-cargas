export type CargaStatus = "pendente" | "em_transito" | "monitorada" | "entregue";

export interface Motorista {
  id: string;
  nome: string;
  cpf: string | null;
  cnh: string | null;
  telefone: string | null;
}

export interface Veiculo {
  id: string;
  placa: string;
  tipo: string | null;
  capacidade_kg: number | null;
  ocupacao_percent: number | null;
}

export interface CargaConsolidada {
  id: string;
  codigo: string;
  data: string;
  origem: string | null;
  destino: string | null;
  peso_kg: number | null;
  volume_m3: number | null;
  status: CargaStatus;
  monitorada: boolean;
  motorista: Motorista | null;
  veiculo: Veiculo | null;
}