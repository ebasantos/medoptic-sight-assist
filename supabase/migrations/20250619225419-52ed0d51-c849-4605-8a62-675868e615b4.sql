
-- Habilitar RLS na tabela usuarios_optica
ALTER TABLE public.usuarios_optica ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários autenticados vejam seus próprios dados
CREATE POLICY "Users can view their own data" ON public.usuarios_optica
FOR SELECT USING (auth.uid() = user_id);

-- Política para permitir inserção durante cadastro (necessário para signup)
CREATE POLICY "Allow insert during signup" ON public.usuarios_optica
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para permitir que admins vejam todos os dados
CREATE POLICY "Admins can view all users" ON public.usuarios_optica
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.usuarios_optica 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Política para permitir que admins gerenciem usuários
CREATE POLICY "Admins can manage users" ON public.usuarios_optica
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.usuarios_optica 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Habilitar RLS na tabela opticas também
ALTER TABLE public.opticas ENABLE ROW LEVEL SECURITY;

-- Política para que admins da plataforma vejam todas as óticas
CREATE POLICY "Platform admins can view all opticas" ON public.opticas
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.usuarios_optica 
    WHERE user_id = auth.uid() AND role = 'admin' AND optica_id IS NULL
  )
);

-- Política para que funcionários vejam apenas sua ótica
CREATE POLICY "Users can view their optica" ON public.opticas
FOR SELECT USING (
  id IN (
    SELECT optica_id FROM public.usuarios_optica 
    WHERE user_id = auth.uid()
  )
);

-- Política para permitir que admins da plataforma gerenciem óticas
CREATE POLICY "Platform admins can manage opticas" ON public.opticas
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.usuarios_optica 
    WHERE user_id = auth.uid() AND role = 'admin' AND optica_id IS NULL
  )
);
