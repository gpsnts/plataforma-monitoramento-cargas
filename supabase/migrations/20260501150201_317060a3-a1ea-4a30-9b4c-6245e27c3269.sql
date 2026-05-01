
-- Roles enum + table
create type public.app_role as enum ('gestor', 'colaborador');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  email text not null,
  created_at timestamptz not null default now()
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique(user_id, role)
);

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- Motoristas
create table public.motoristas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cpf text not null,
  cnh text not null,
  telefone text,
  created_at timestamptz not null default now()
);

-- Veículos
create table public.veiculos (
  id uuid primary key default gen_random_uuid(),
  placa text not null unique,
  tipo text not null,
  capacidade_kg numeric not null default 0,
  ocupacao_percent numeric not null default 0,
  created_at timestamptz not null default now()
);

-- Cargas
create type public.carga_status as enum ('pendente', 'em_transito', 'monitorada', 'entregue');

create table public.cargas (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  data date not null,
  motorista_id uuid references public.motoristas(id),
  veiculo_id uuid references public.veiculos(id),
  origem text not null,
  destino text not null,
  peso_kg numeric not null default 0,
  volume_m3 numeric not null default 0,
  status carga_status not null default 'pendente',
  monitorada boolean not null default false,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Solicitações de monitoramento
create table public.solicitacoes_monitoramento (
  id uuid primary key default gen_random_uuid(),
  carga_id uuid not null references public.cargas(id) on delete cascade,
  enviado_por uuid references auth.users(id),
  enviado_em timestamptz not null default now(),
  status text not null default 'enviado',
  payload jsonb
);

-- Trigger create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nome, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', split_part(new.email,'@',1)), new.email);
  insert into public.user_roles (user_id, role) values (new.id, 'colaborador');
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Updated_at trigger for cargas
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger cargas_updated_at before update on public.cargas
  for each row execute function public.set_updated_at();

-- RLS
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.motoristas enable row level security;
alter table public.veiculos enable row level security;
alter table public.cargas enable row level security;
alter table public.solicitacoes_monitoramento enable row level security;

-- Profiles: own + authenticated read
create policy "profiles_select_auth" on public.profiles for select to authenticated using (true);
create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = id);

-- user_roles: read own, gestor manages
create policy "roles_select_own" on public.user_roles for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'gestor'));
create policy "roles_gestor_all" on public.user_roles for all to authenticated using (public.has_role(auth.uid(),'gestor')) with check (public.has_role(auth.uid(),'gestor'));

-- Operational data: any authenticated user can read/write (transportadora interna)
create policy "motoristas_all" on public.motoristas for all to authenticated using (true) with check (true);
create policy "veiculos_all" on public.veiculos for all to authenticated using (true) with check (true);
create policy "cargas_all" on public.cargas for all to authenticated using (true) with check (true);
create policy "solicit_all" on public.solicitacoes_monitoramento for all to authenticated using (true) with check (true);

-- Seed simulated Evolog data
insert into public.motoristas (nome, cpf, cnh, telefone) values
('Carlos Pereira','567.890.123-44','56789012344','(85) 98765-4321'),
('Juliana Rocha','123.456.789-00','12345678900','(92) 99876-5432'),
('Roberto Lima','321.654.987-11','32165498711','(62) 98123-4567'),
('Marina Souza','741.852.963-22','74185296322','(11) 97654-3210'),
('Pedro Alves','852.963.741-33','85296374133','(21) 96543-2109'),
('Ana Beatriz','963.852.741-55','96385274155','(31) 95432-1098'),
('Lucas Martins','159.357.486-66','15935748666','(41) 94321-0987');

insert into public.veiculos (placa, tipo, capacidade_kg, ocupacao_percent) values
('MNO-7890','Caminhão 3/4',10000,85),
('PQR-2345','Carreta',25000,80),
('STU-6789','Caminhão Toco',15000,93),
('VWX-1234','Bitrem',30000,60),
('ABC-5678','VUC',5000,70),
('DEF-9012','Caminhão 3/4',10000,75),
('GHI-3456','Carreta',25000,50);

insert into public.cargas (codigo, data, motorista_id, veiculo_id, origem, destino, peso_kg, volume_m3, status, monitorada) values
('CRG001238','2026-03-29',(select id from motoristas where nome='Carlos Pereira'),(select id from veiculos where placa='MNO-7890'),'Fortaleza - CE','Natal - RN',8500,25,'pendente',false),
('CRG001239','2026-03-29',(select id from motoristas where nome='Juliana Rocha'),(select id from veiculos where placa='PQR-2345'),'Manaus - AM','Belém - PA',20000,60,'em_transito',true),
('CRG001240','2026-03-29',(select id from motoristas where nome='Roberto Lima'),(select id from veiculos where placa='STU-6789'),'Goiânia - GO','Campo Grande - MS',14000,40,'pendente',false),
('CRG001236','2026-03-28',(select id from motoristas where nome='Marina Souza'),(select id from veiculos where placa='VWX-1234'),'São Paulo - SP','Rio de Janeiro - RJ',18000,55,'pendente',false),
('CRG001237','2026-03-28',(select id from motoristas where nome='Pedro Alves'),(select id from veiculos where placa='ABC-5678'),'Curitiba - PR','Florianópolis - SC',10000,30,'pendente',false),
('CRG001234','2026-03-27',(select id from motoristas where nome='Ana Beatriz'),(select id from veiculos where placa='DEF-9012'),'Belo Horizonte - MG','Salvador - BA',15000,45,'pendente',false),
('CRG001235','2026-03-27',(select id from motoristas where nome='Lucas Martins'),(select id from veiculos where placa='GHI-3456'),'Porto Alegre - RS','Curitiba - PR',12500,38,'em_transito',true);
