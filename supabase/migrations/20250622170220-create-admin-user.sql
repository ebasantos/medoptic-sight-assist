
-- Inserir um usuário admin diretamente na tabela usuarios_optica
-- Este usuário pode fazer login usando o sistema de autenticação customizado

-- Primeiro, vamos buscar ou criar uma ótica para o admin
INSERT INTO public.opticas (
  nome,
  email,
  ativo
) VALUES (
  'Administração Geral',
  'admin@sistema.com',
  true
) ON CONFLICT (email) DO NOTHING;

-- Agora vamos inserir o usuário admin
-- Usando um UUID fixo para facilitar o gerenciamento
INSERT INTO public.usuarios_optica (
  user_id,
  nome,
  email,
  role,
  optica_id,
  ativo
) VALUES (
  'admin-uuid-123456789',
  'Administrador',
  'admin@sistema.com',
  'admin',
  (SELECT id FROM public.opticas WHERE email = 'admin@sistema.com' LIMIT 1),
  true
) ON CONFLICT (email) DO NOTHING;

