
-- Remover as políticas problemáticas que podem causar recursão
DROP POLICY IF EXISTS "Admins can view all users" ON public.usuarios_optica;
DROP POLICY IF EXISTS "Admins can manage users" ON public.usuarios_optica;
DROP POLICY IF EXISTS "Platform admins can view all opticas" ON public.opticas;
DROP POLICY IF EXISTS "Platform admins can manage opticas" ON public.opticas;

-- Criar políticas mais simples e seguras
-- Para usuarios_optica: usuários podem ver apenas seus próprios dados
CREATE POLICY "Users can view own data" ON public.usuarios_optica
  FOR SELECT USING (user_id = auth.uid());

-- Para usuarios_optica: permitir inserção para usuários autenticados (durante signup)
CREATE POLICY "Users can insert own data" ON public.usuarios_optica
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Para opticas: permitir que usuários vejam óticas relacionadas a eles
CREATE POLICY "Users can view related opticas" ON public.opticas
  FOR SELECT USING (
    id IN (
      SELECT optica_id FROM usuarios_optica 
      WHERE user_id = auth.uid()
    ) OR 
    -- Admin da plataforma pode ver todas as óticas
    EXISTS (
      SELECT 1 FROM usuarios_optica 
      WHERE user_id = auth.uid() AND role = 'admin' AND optica_id IS NULL
    )
  );

-- Confirmar email automaticamente para erik@admin.com para facilitar teste
UPDATE auth.users 
SET email_confirmed_at = now() 
WHERE email = 'erik@admin.com' AND email_confirmed_at IS NULL;
