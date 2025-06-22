
-- Criar função para confirmar email de administradores automaticamente
CREATE OR REPLACE FUNCTION public.confirm_admin_email(admin_email text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE auth.users 
  SET email_confirmed_at = now(),
      email_change_confirm_status = 0
  WHERE email = admin_email 
    AND email_confirmed_at IS NULL;
$$;
