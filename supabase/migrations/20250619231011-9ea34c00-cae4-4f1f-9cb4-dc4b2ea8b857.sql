
-- Criar função de segurança para permitir inserção durante signup
CREATE OR REPLACE FUNCTION public.allow_signup_insert()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT true;
$$;

-- Remover política atual problemática
DROP POLICY IF EXISTS "Allow signup insert" ON public.usuarios_optica;

-- Criar nova política usando a função de segurança
CREATE POLICY "Enable signup inserts" ON public.usuarios_optica
  FOR INSERT 
  WITH CHECK (public.allow_signup_insert());

-- Garantir que erik@admin.com tenha email confirmado
UPDATE auth.users 
SET email_confirmed_at = now(), 
    email_change_confirm_status = 0
WHERE email = 'erik@admin.com';
