
-- Inserir o usuário admin diretamente através do signup do Supabase
-- Vamos fazer isso de forma mais simples e segura

-- Primeiro, criar uma ótica admin
INSERT INTO public.opticas (
  nome,
  email,
  ativo
) VALUES (
  'Administração Sistema',
  'admin@medopticpro.com',
  true
);

-- Atualizar as políticas RLS para permitir que admins vejam tudo
DROP POLICY IF EXISTS "Admin pode ver todas as óticas" ON public.opticas;
CREATE POLICY "Admin pode ver todas as óticas" ON public.opticas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM usuarios_optica 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admin pode gerenciar usuários" ON public.usuarios_optica;
CREATE POLICY "Admin pode gerenciar usuários" ON public.usuarios_optica
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM usuarios_optica 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
