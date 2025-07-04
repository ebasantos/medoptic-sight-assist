
-- Atualizar modelos de óculos com imagens reais sem fundo
UPDATE public.modelos_oculos SET imagem_url = 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=300&h=150&fit=crop&auto=format' WHERE categoria = 'quadrada';
UPDATE public.modelos_oculos SET imagem_url = 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=300&h=150&fit=crop&auto=format' WHERE categoria = 'redonda';
UPDATE public.modelos_oculos SET imagem_url = 'https://images.unsplash.com/photo-1577803645773-f96470509666?w=300&h=150&fit=crop&auto=format' WHERE categoria = 'cat-eye';
UPDATE public.modelos_oculos SET imagem_url = 'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=300&h=150&fit=crop&auto=format' WHERE categoria = 'aviador';
UPDATE public.modelos_oculos SET imagem_url = 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=300&h=150&fit=crop&auto=format' WHERE categoria = 'oval';
UPDATE public.modelos_oculos SET imagem_url = 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=300&h=150&fit=crop&auto=format' WHERE categoria = 'retangular';

-- Inserir novos modelos com imagens de qualidade profissional (URLs que funcionam bem)
INSERT INTO public.modelos_oculos (nome, categoria, formato_recomendado, tom_pele_recomendado, imagem_url, cores_disponiveis, largura_mm, altura_mm, ponte_mm, popular) VALUES
('Ray-Ban Wayfarer', 'quadrada', 'redondo', ARRAY['claro', 'médio'], 'https://cdn.pixabay.com/photo/2017/07/31/22/05/sunglasses-2561611_960_720.png', '[{"nome": "Preto", "codigo": "#000000"}, {"nome": "Marrom", "codigo": "#8B4513"}]'::jsonb, 140, 45, 18, true),
('Oliver Peoples Redonda', 'redonda', 'quadrado', ARRAY['médio', 'escuro'], 'https://cdn.pixabay.com/photo/2016/03/05/22/31/eyeglasses-1239544_960_720.png', '[{"nome": "Dourado", "codigo": "#FFD700"}, {"nome": "Prata", "codigo": "#C0C0C0"}]'::jsonb, 135, 50, 20, true),
('Tom Ford Cat-Eye', 'cat-eye', 'coração', ARRAY['claro', 'médio'], 'https://cdn.pixabay.com/photo/2017/07/31/22/05/sunglasses-2561607_960_720.png', '[{"nome": "Preto", "codigo": "#000000"}, {"nome": "Dourado", "codigo": "#FFD700"}]'::jsonb, 145, 40, 16, true),
('Ray-Ban Aviador Clássico', 'aviador', 'losango', ARRAY['escuro', 'bronzeado'], 'https://cdn.pixabay.com/photo/2016/09/07/11/37/glasses-1651861_960_720.png', '[{"nome": "Dourado", "codigo": "#FFD700"}, {"nome": "Prata", "codigo": "#C0C0C0"}]'::jsonb, 150, 55, 14, true);
