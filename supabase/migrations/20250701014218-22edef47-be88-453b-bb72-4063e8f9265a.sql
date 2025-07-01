
-- Adicionar políticas RLS para a tabela simulacoes_lentes para administradores

-- Política para que administradores da plataforma possam ver todas as simulações
CREATE POLICY "Platform admins can view all simulacoes_lentes" 
  ON public.simulacoes_lentes 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM usuarios_optica 
      WHERE user_id = auth.uid() 
      AND role = 'admin' 
      AND optica_id IS NULL
    )
  );
