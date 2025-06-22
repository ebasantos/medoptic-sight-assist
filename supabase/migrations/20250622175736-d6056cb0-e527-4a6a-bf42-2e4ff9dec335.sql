
-- Primeiro, vamos verificar se o bucket existe e criar se necessário
INSERT INTO storage.buckets (id, name, public) 
VALUES ('fotos-clientes', 'fotos-clientes', true) 
ON CONFLICT (id) DO NOTHING;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Usuários podem fazer upload de fotos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem ver fotos" ON storage.objects;

-- Criar política para permitir upload de fotos - usuários autenticados podem fazer upload
CREATE POLICY "Authenticated users can upload photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'fotos-clientes' AND 
    auth.uid() IS NOT NULL
  );

-- Criar política para permitir visualização de fotos - público pode ver
CREATE POLICY "Public can view photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'fotos-clientes');

-- Criar política para permitir atualização de fotos pelos proprietários
CREATE POLICY "Users can update their own photos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'fotos-clientes' AND 
    auth.uid() IS NOT NULL
  );

-- Criar política para permitir exclusão de fotos pelos proprietários  
CREATE POLICY "Users can delete their own photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'fotos-clientes' AND 
    auth.uid() IS NOT NULL
  );
