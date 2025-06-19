
-- Permitir que optica_id seja null para administradores da plataforma
ALTER TABLE public.usuarios_optica 
ALTER COLUMN optica_id DROP NOT NULL;

-- Confirmar email automaticamente para erik@admin.com (caso ainda não esteja)
UPDATE auth.users 
SET email_confirmed_at = now()
WHERE email = 'erik@admin.com' AND email_confirmed_at IS NULL;
