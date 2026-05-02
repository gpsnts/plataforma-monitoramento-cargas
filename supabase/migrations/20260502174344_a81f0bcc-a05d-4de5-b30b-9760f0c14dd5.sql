
ALTER TABLE public.motoristas ALTER COLUMN cpf DROP NOT NULL;
ALTER TABLE public.motoristas ALTER COLUMN cnh DROP NOT NULL;

ALTER TABLE public.veiculos ALTER COLUMN tipo DROP NOT NULL;
ALTER TABLE public.veiculos ALTER COLUMN capacidade_kg DROP NOT NULL;
ALTER TABLE public.veiculos ALTER COLUMN capacidade_kg DROP DEFAULT;
ALTER TABLE public.veiculos ALTER COLUMN ocupacao_percent DROP NOT NULL;
ALTER TABLE public.veiculos ALTER COLUMN ocupacao_percent DROP DEFAULT;

ALTER TABLE public.cargas ALTER COLUMN origem DROP NOT NULL;
ALTER TABLE public.cargas ALTER COLUMN destino DROP NOT NULL;
ALTER TABLE public.cargas ALTER COLUMN peso_kg DROP NOT NULL;
ALTER TABLE public.cargas ALTER COLUMN peso_kg DROP DEFAULT;
ALTER TABLE public.cargas ALTER COLUMN volume_m3 DROP NOT NULL;
ALTER TABLE public.cargas ALTER COLUMN volume_m3 DROP DEFAULT;
