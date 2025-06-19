
-- Criar tabela para óticas
CREATE TABLE public.opticas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  telefone TEXT,
  endereco TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para usuários das óticas
CREATE TABLE public.usuarios_optica (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  optica_id UUID REFERENCES public.opticas(id) NOT NULL,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'funcionario',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para aferições
CREATE TABLE public.afericoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  optica_id UUID REFERENCES public.opticas(id) NOT NULL,
  usuario_id UUID REFERENCES auth.users NOT NULL,
  nome_cliente TEXT NOT NULL,
  foto_url TEXT NOT NULL,
  largura_armacao DECIMAL(5,2) NOT NULL,
  dp_binocular DECIMAL(5,2),
  dnp_esquerda DECIMAL(5,2),
  dnp_direita DECIMAL(5,2),
  altura_esquerda DECIMAL(5,2),
  altura_direita DECIMAL(5,2),
  largura_lente DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para análises faciais
CREATE TABLE public.analises_faciais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  optica_id UUID REFERENCES public.opticas(id) NOT NULL,
  usuario_id UUID REFERENCES auth.users NOT NULL,
  nome_cliente TEXT NOT NULL,
  foto_url TEXT NOT NULL,
  formato_rosto TEXT,
  tom_pele TEXT,
  distancia_olhos TEXT,
  sugestoes JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.opticas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios_optica ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.afericoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analises_faciais ENABLE ROW LEVEL SECURITY;

-- Políticas para óticas (apenas admin pode ver todas)
CREATE POLICY "Admin pode ver todas as óticas" ON public.opticas
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Políticas para usuários de ótica
CREATE POLICY "Usuários podem ver sua própria ótica" ON public.usuarios_optica
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admin pode gerenciar usuários" ON public.usuarios_optica
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Políticas para aferições (usuários só veem da sua ótica)
CREATE POLICY "Usuários veem aferições da sua ótica" ON public.afericoes
  FOR SELECT USING (
    optica_id IN (
      SELECT optica_id FROM usuarios_optica WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem criar aferições" ON public.afericoes
  FOR INSERT WITH CHECK (
    optica_id IN (
      SELECT optica_id FROM usuarios_optica WHERE user_id = auth.uid()
    )
  );

-- Políticas para análises faciais (usuários só veem da sua ótica)
CREATE POLICY "Usuários veem análises da sua ótica" ON public.analises_faciais
  FOR SELECT USING (
    optica_id IN (
      SELECT optica_id FROM usuarios_optica WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem criar análises" ON public.analises_faciais
  FOR INSERT WITH CHECK (
    optica_id IN (
      SELECT optica_id FROM usuarios_optica WHERE user_id = auth.uid()
    )
  );

-- Criar bucket para fotos
INSERT INTO storage.buckets (id, name, public) VALUES ('fotos-clientes', 'fotos-clientes', true);

-- Política para storage - usuários podem fazer upload
CREATE POLICY "Usuários podem fazer upload de fotos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'fotos-clientes' AND auth.uid() IS NOT NULL);

CREATE POLICY "Usuários podem ver fotos" ON storage.objects
  FOR SELECT USING (bucket_id = 'fotos-clientes');
