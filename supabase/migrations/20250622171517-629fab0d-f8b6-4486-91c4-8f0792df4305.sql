
-- Remover todas as políticas RLS existentes da tabela opticas
DROP POLICY IF EXISTS "Admins can view all opticas" ON public.opticas;
DROP POLICY IF EXISTS "Admins can create opticas" ON public.opticas;
DROP POLICY IF EXISTS "Admins can update opticas" ON public.opticas;
DROP POLICY IF EXISTS "Admins can delete opticas" ON public.opticas;

-- Desabilitar RLS temporariamente para facilitar o desenvolvimento
ALTER TABLE public.opticas DISABLE ROW LEVEL SECURITY;

-- Ou se preferir manter RLS ativo, criar políticas mais simples
-- ALTER TABLE public.opticas ENABLE ROW LEVEL SECURITY;

-- Política simples que permite acesso a usuários autenticados
-- CREATE POLICY "Allow authenticated users full access to opticas" 
--   ON public.opticas 
--   FOR ALL 
--   USING (true)
--   WITH CHECK (true);
