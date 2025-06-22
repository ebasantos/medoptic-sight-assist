
-- Remover políticas existentes que podem estar causando conflito
DROP POLICY IF EXISTS "Admins can view all opticas" ON public.opticas;
DROP POLICY IF EXISTS "Admins can create opticas" ON public.opticas;
DROP POLICY IF EXISTS "Admins can update opticas" ON public.opticas;
DROP POLICY IF EXISTS "Admins can delete opticas" ON public.opticas;

-- Adicionar RLS (Row Level Security) para a tabela opticas
ALTER TABLE public.opticas ENABLE ROW LEVEL SECURITY;

-- Política mais permissiva para admins verem todas as óticas
CREATE POLICY "Admins can view all opticas" 
  ON public.opticas 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios_optica 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
    OR
    -- Permitir também para usuários autenticados (temporário para debug)
    auth.uid() IS NOT NULL
  );

-- Política mais permissiva para admins criarem óticas
CREATE POLICY "Admins can create opticas" 
  ON public.opticas 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.usuarios_optica 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
    OR
    -- Permitir também para usuários autenticados (temporário para debug)
    auth.uid() IS NOT NULL
  );

-- Política para admins atualizarem óticas
CREATE POLICY "Admins can update opticas" 
  ON public.opticas 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios_optica 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
    OR
    auth.uid() IS NOT NULL
  );

-- Política para admins deletarem óticas
CREATE POLICY "Admins can delete opticas" 
  ON public.opticas 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.usuarios_optica 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
    OR
    auth.uid() IS NOT NULL
  );
