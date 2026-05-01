export type CargaStatus = "pendente" | "em_transito" | "monitorada" | "entregue";

export interface Motorista {
  id: string;
  nome: string;
  cpf: string;
  cnh: string;
  telefone: string | null;
}

export interface Veiculo {
  id: string;
  placa: string;
  tipo: string;
  capacidade_kg: number;
  ocupacao_percent: number;
}

export interface CargaConsolidada {
  id: string;
  codigo: string;
  data: string;
  origem: string;
  destino: string;
  peso_kg: number;
  volume_m3: number;
  status: CargaStatus;
  monitorada: boolean;
  motorista: Motorista | null;
  veiculo: Veiculo | null;
}
