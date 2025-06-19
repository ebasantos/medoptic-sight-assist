
-- Remover a política de INSERT problemática
DROP POLICY IF EXISTS "Users can insert own data" ON public.usuarios_optica;

-- Criar política mais permissiva para INSERT durante signup
CREATE POLICY "Allow signup insert" ON public.usuarios_optica
  FOR INSERT WITH CHECK (true);

-- Política para UPDATE (caso necessário)
CREATE POLICY "Users can update own data" ON public.usuarios_optica
  FOR UPDATE USING (user_id = auth.uid());

-- Política para DELETE (caso necessário)  
CREATE POLICY "Users can delete own data" ON public.usuarios_optica
  FOR DELETE USING (user_id = auth.uid());
