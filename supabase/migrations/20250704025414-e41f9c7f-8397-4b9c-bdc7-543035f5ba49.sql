
-- Criar tabela para modelos de óculos
CREATE TABLE public.modelos_oculos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL, -- 'quadrada', 'redonda', 'cat-eye', 'aviador', etc.
  formato_recomendado TEXT NOT NULL, -- formato de rosto recomendado
  tom_pele_recomendado TEXT[], -- array de tons de pele recomendados
  imagem_url TEXT NOT NULL, -- URL da imagem SVG/PNG
  cores_disponiveis JSONB NOT NULL DEFAULT '[]'::jsonb, -- cores disponíveis com seus códigos
  largura_mm INTEGER, -- largura em milímetros
  altura_mm INTEGER, -- altura em milímetros
  ponte_mm INTEGER, -- tamanho da ponte em milímetros
  popular BOOLEAN DEFAULT false, -- se é um modelo popular
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir alguns modelos de exemplo baseados nas sugestões da IA
INSERT INTO public.modelos_oculos (nome, categoria, formato_recomendado, tom_pele_recomendado, imagem_url, cores_disponiveis, largura_mm, altura_mm, ponte_mm, popular) VALUES
('Armação Quadrada Clássica', 'quadrada', 'redondo', ARRAY['claro', 'médio'], 'https://svgsilh.com/svg/304020.svg', '[{"nome": "Preto", "codigo": "#000000"}, {"nome": "Marrom", "codigo": "#8B4513"}, {"nome": "Dourado", "codigo": "#FFD700"}]'::jsonb, 140, 45, 18, true),
('Armação Redonda Vintage', 'redonda', 'quadrado', ARRAY['médio', 'escuro'], 'https://svgsilh.com/svg/304019.svg', '[{"nome": "Preto", "codigo": "#000000"}, {"nome": "Tartaruga", "codigo": "#8B4513"}, {"nome": "Prata", "codigo": "#C0C0C0"}]'::jsonb, 135, 50, 20, true),
('Cat-Eye Elegante', 'cat-eye', 'coração', ARRAY['claro', 'médio'], 'https://svgsilh.com/svg/304021.svg', '[{"nome": "Preto", "codigo": "#000000"}, {"nome": "Azul", "codigo": "#000080"}, {"nome": "Dourado", "codigo": "#FFD700"}]'::jsonb, 145, 40, 16, true),
('Aviador Moderno', 'aviador', 'losango', ARRAY['escuro', 'bronzeado'], 'https://svgsilh.com/svg/304022.svg', '[{"nome": "Dourado", "codigo": "#FFD700"}, {"nome": "Prata", "codigo": "#C0C0C0"}, {"nome": "Bronze", "codigo": "#CD7F32"}]'::jsonb, 150, 55, 14, true),
('Armação Oval Suave', 'oval', 'quadrado', ARRAY['claro', 'médio', 'escuro'], 'https://svgsilh.com/svg/304023.svg', '[{"nome": "Preto", "codigo": "#000000"}, {"nome": "Marrom", "codigo": "#8B4513"}, {"nome": "Azul", "codigo": "#000080"}]'::jsonb, 138, 42, 19, false),
('Retangular Moderna', 'retangular', 'redondo', ARRAY['médio', 'escuro'], 'https://svgsilh.com/svg/304024.svg', '[{"nome": "Preto", "codigo": "#000000"}, {"nome": "Cinza", "codigo": "#808080"}, {"nome": "Marrom", "codigo": "#8B4513"}]'::jsonb, 142, 38, 17, false);

-- Habilitar RLS na tabela
ALTER TABLE public.modelos_oculos ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir leitura pública dos modelos
CREATE POLICY "Modelos de óculos são públicos" 
  ON public.modelos_oculos 
  FOR SELECT 
  USING (ativo = true);

-- Criar índices para melhor performance
CREATE INDEX idx_modelos_oculos_categoria ON public.modelos_oculos(categoria);
CREATE INDEX idx_modelos_oculos_formato ON public.modelos_oculos(formato_recomendado);
CREATE INDEX idx_modelos_oculos_popular ON public.modelos_oculos(popular);
