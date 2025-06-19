
-- Remover a foreign key constraint que está causando o erro
ALTER TABLE public.usuarios_optica 
DROP CONSTRAINT IF EXISTS usuarios_optica_user_id_fkey;

-- Adicionar um índice para manter performance na coluna user_id
CREATE INDEX IF NOT EXISTS idx_usuarios_optica_user_id 
ON public.usuarios_optica(user_id);
