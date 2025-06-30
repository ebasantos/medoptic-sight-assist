
-- Criar tabela para armazenar simulações de lentes
CREATE TABLE public.simulacoes_lentes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  optica_id UUID NOT NULL,
  nome_cliente TEXT NOT NULL,
  tipo_lente TEXT NOT NULL,
  tratamentos TEXT[] NOT NULL DEFAULT '{}',
  dados_estilo_vida JSONB,
  recomendacoes_ia JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.simulacoes_lentes ENABLE ROW LEVEL SECURITY;

-- Política para que usuários possam ver apenas simulações da sua ótica
CREATE POLICY "Usuarios podem ver simulacoes da sua otica" 
  ON public.simulacoes_lentes 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM usuarios_optica 
      WHERE user_id = auth.uid() 
      AND optica_id = simulacoes_lentes.optica_id 
      AND ativo = true
    )
  );

-- Política para que usuários possam inserir simulações na sua ótica
CREATE POLICY "Usuarios podem criar simulacoes na sua otica" 
  ON public.simulacoes_lentes 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios_optica 
      WHERE user_id = auth.uid() 
      AND optica_id = simulacoes_lentes.optica_id 
      AND ativo = true
    )
  );
