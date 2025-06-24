
-- Criar políticas RLS para permitir que admins vejam todas as aferições
CREATE POLICY "Platform admins can view all afericoes" ON public.afericoes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM usuarios_optica 
      WHERE user_id = auth.uid() AND role = 'admin' AND optica_id IS NULL
    )
  );

-- Criar políticas RLS para permitir que admins vejam todas as análises faciais
CREATE POLICY "Platform admins can view all analises_faciais" ON public.analises_faciais
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM usuarios_optica 
      WHERE user_id = auth.uid() AND role = 'admin' AND optica_id IS NULL
    )
  );

-- Habilitar RLS nas tabelas se não estiver habilitado
ALTER TABLE public.afericoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analises_faciais ENABLE ROW LEVEL SECURITY;

-- Criar política para usuários das óticas verem suas próprias aferições
CREATE POLICY "Optica users can view their own afericoes" ON public.afericoes
  FOR SELECT USING (
    optica_id IN (
      SELECT optica_id FROM usuarios_optica 
      WHERE user_id = auth.uid()
    )
  );

-- Criar política para usuários das óticas verem suas próprias análises
CREATE POLICY "Optica users can view their own analises_faciais" ON public.analises_faciais
  FOR SELECT USING (
    optica_id IN (
      SELECT optica_id FROM usuarios_optica 
      WHERE user_id = auth.uid()
    )
  );
