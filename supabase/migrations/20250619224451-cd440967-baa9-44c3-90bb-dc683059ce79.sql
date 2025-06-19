
-- Corrigir as políticas RLS que estão causando recursão infinita
-- Remover as políticas problemáticas e criar versões mais simples

DROP POLICY IF EXISTS "Admin pode ver todas as óticas" ON public.opticas;
DROP POLICY IF EXISTS "Admin pode gerenciar usuários" ON public.usuarios_optica;

-- Habilitar RLS nas tabelas se ainda não estiver habilitado
ALTER TABLE public.opticas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios_optica ENABLE ROW LEVEL SECURITY;

-- Criar políticas mais simples que não causem recursão
CREATE POLICY "Usuários podem ver suas óticas" ON public.opticas
  FOR ALL USING (
    id IN (
      SELECT optica_id FROM usuarios_optica 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem ver seus próprios dados" ON public.usuarios_optica
  FOR ALL USING (user_id = auth.uid());

-- Desabilitar confirmação de email para facilitar o teste
-- Isso permitirá login imediato sem precisar confirmar email
UPDATE auth.users 
SET email_confirmed_at = now() 
WHERE email = 'erik@admin.com' AND email_confirmed_at IS NULL;
