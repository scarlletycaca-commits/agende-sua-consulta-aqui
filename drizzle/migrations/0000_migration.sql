CREATE TABLE public.agendamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL CHECK (char_length(nome) BETWEEN 2 AND 120),
  cidade text NOT NULL CHECK (char_length(cidade) BETWEEN 2 AND 80),
  telefone text NOT NULL CHECK (char_length(telefone) BETWEEN 8 AND 20),
  especialidade text NOT NULL CHECK (char_length(especialidade) BETWEEN 2 AND 60),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.agendamentos TO anon, authenticated;
GRANT ALL ON public.agendamentos TO service_role;
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Qualquer pessoa pode solicitar" ON public.agendamentos FOR INSERT TO anon, authenticated WITH CHECK (true);