# TODO# Plataforma de Monitoramento de Cargas

![Vite](https://img.shields.io/badge/Vite-FFD43B?style=flat&logo=vite&logoColor=333333)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-646cff?style=flat&logo=vitest&logoColor=white)

Aplicação frontend (Vite + React + TypeScript) para visualizar e gerenciar cargas/entregas, integrada ao Supabase para autenticação e persistência. Foi usado a plataforma [Lovable](https://lovable.dev/) para a estrutura inicial do projeto.

**Atenção!**
É necessário criar um usuário para usar a plataforma

**Resumo rápido**
- Interface: React + TypeScript (Vite)
- Estilo: Tailwind CSS
- Banco / Auth: Supabase (migrations em `supabase/migrations`)
- Estrutura de componentes em `src/components`

## Tópicos
- **Visão geral**
- **Principais recursos**
- **Modelo de dados (domínio)**
- **Fluxo típico de uma carga**
- **Estrutura do repositório**
- **Pré-requisitos & execução**
- **Variáveis de ambiente**
- **Banco de dados / Migrations**
- **Testes**
- **Deploy**
- **Arquivos importantes**

## Visão geral
Painel SPA para administração e monitoramento de cargas. Páginas em `src/pages` e componentes reutilizáveis em `src/components` e `src/components/ui`.

## Principais recursos
- Autenticação via Supabase
- Listagem, edição e status de cargas
- Vinculação de motorista e veículo às cargas
- UI composta por componentes reutilizáveis
- Migrations SQL para o schema em `supabase/migrations`

## Modelo de dados (domínio)
Baseado nos tipos do frontend (`src/lib/types.ts`), o principal modelo é `CargaConsolidada` com os seguintes campos:

- `id: string` — Identificador único
- `codigo: string` — Código/identificador legível da carga
- `data: string` — Data de criação/registro
- `origem: string | null` — Local de origem
- `destino: string | null` — Local de destino
- `peso_kg: number | null` — Peso em quilogramas
- `volume_m3: number | null` — Volume em metros cúbicos
- `status: "pendente" | "em_transito" | "monitorada" | "entregue"` — Estado atual da carga
- `monitorada: boolean` — Indicador se está em monitoramento ativo
- `motorista: Motorista | null` — Objeto do motorista vinculado (veja abaixo)
- `veiculo: Veiculo | null` — Objeto do veículo vinculado (veja abaixo)

Motorista (resumo):
- `id`, `nome`, `cpf?`, `cnh?`, `telefone?`

Veículo (resumo):
- `id`, `placa`, `tipo?`, `capacidade_kg?`, `ocupacao_percent?`

Exemplo JSON de uma carga:

```json
{
  "id": "uuid-123",
  "codigo": "CARGA-2026-0001",
  "data": "2026-05-02T12:00:00Z",
  "origem": "Armazém A",
  "destino": "Loja B",
  "peso_kg": 1200,
  "volume_m3": 8.5,
  "status": "em_transito",
  "monitorada": true,
  "motorista": { "id": "m1", "nome": "João" },
  "veiculo": { "id": "v1", "placa": "ABC-1234" }
}
```

## Fluxo típico de uma carga
1. Criação/registro (status: `pendente`)
2. Atribuição de motorista e veículo
3. Início da viagem (status: `em_transito`)
4. Monitoramento ativo (opcional, `monitorada: true`, status `monitorada`)
5. Entrega concluída (status: `entregue`)

## Estrutura do repositório (resumo)
- `src/` — código-fonte do frontend
  - `src/components/` — componentes de interface
  - `src/pages/` — páginas da aplicação
  - `src/integrations/supabase/` — cliente Supabase e tipos
- `public/` — ativos estáticos
- `supabase/migrations/` — arquivos SQL de migração
- `package.json`, `vite.config.ts`, `tailwind.config.ts` — configs

## Pré-requisitos & execução (local)
- Node.js (recomendado 18+)
- npm / pnpm / yarn

Instalar dependências:

```bash
npm install
# ou
# pnpm install
# yarn install
```

Rodar em desenvolvimento:

```bash
npm run dev
```

Build para produção e preview:

```bash
npm run build
npm run preview
```

## Variáveis de ambiente
Variáveis esperadas para conectar ao Supabase:

- `VITE_SUPABASE_URL` — URL do projeto Supabase
- `VITE_SUPABASE_ANON_KEY` — Chave pública (anon)

Exemplo `.env`:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

## Banco de dados / Migrations
As migrações SQL estão em `supabase/migrations`. Para aplicar migrações localmente com a CLI do Supabase:

```bash
supabase db push
```

Ou use seu fluxo de migração preferido conforme configurado no projeto.

## Deploy
Frontend: Vercel / Netlify / Cloudflare Pages — publicar a pasta `dist` gerada por `npm run build`.
Banco: Supabase (ou outro provedor compatível com PostgreSQL se preferir)

## Arquivos importantes
- [src/main.tsx](src/main.tsx)
- [src/App.tsx](src/App.tsx)
- [src/pages/Index.tsx](src/pages/Index.tsx)
- [src/components/AppHeader.tsx](src/components/AppHeader.tsx)
- [src/components/CargaDetailDialog.tsx](src/components/CargaDetailDialog.tsx)
- [src/integrations/supabase/client.ts](src/integrations/supabase/client.ts)
- [src/lib/types.ts](src/lib/types.ts)
- [supabase/migrations](supabase/migrations)

---
