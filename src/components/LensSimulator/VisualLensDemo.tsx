
import React, { useState, useEffect } from 'react';

interface VisualLensDemoProps {
  selectedTreatments: string[];
  currentEnvironment: 'rua' | 'leitura' | 'computador' | 'direcao';
}

export const VisualLensDemo = ({ selectedTreatments, currentEnvironment }: VisualLensDemoProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  // URLs de imagens base para cada ambiente
  const environmentImages = {
    rua: 'https://images.unsplash.com/photo-1500673922987-e212871fec22?w=1200&h=800&fit=crop',
    leitura: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&h=800&fit=crop',
    computador: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=1200&h=800&fit=crop',
    direcao: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&h=800&fit=crop'
  };

  // Calcular filtros CSS baseados nos tratamentos selecionados
  const calculateLensFilters = () => {
    let filters = [];
    let overlayEffects = [];

    if (selectedTreatments.includes('antirreflexo')) {
      filters.push('brightness(1.2)');
      filters.push('contrast(1.1)');
    }

    if (selectedTreatments.includes('filtro-azul')) {
      filters.push('sepia(0.15)');
      filters.push('hue-rotate(-8deg)');
      filters.push('saturate(0.9)');
    }

    if (selectedTreatments.includes('protecao-uv')) {
      filters.push('saturate(1.05)');
    }

    if (selectedTreatments.includes('fotossensiveis')) {
      if (currentEnvironment === 'rua') {
        filters.push('brightness(0.6)');
        filters.push('contrast(1.2)');
      } else {
        filters.push('brightness(1.1)');
      }
    }

    if (selectedTreatments.includes('polarizado')) {
      filters.push('contrast(1.25)');
      filters.push('saturate(1.15)');
      overlayEffects.push('reduced-glare');
    }

    return { filters: filters.join(' '), overlayEffects };
  };

  const { filters, overlayEffects } = calculateLensFilters();

  useEffect(() => {
    setImageLoaded(false);
    const timer = setTimeout(() => setImageLoaded(true), 300);
    return () => clearTimeout(timer);
  }, [currentEnvironment, selectedTreatments]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Imagem de fundo em tela cheia */}
      <div className="absolute inset-0">
        <img
          src={environmentImages[currentEnvironment]}
          alt={`Ambiente: ${currentEnvironment}`}
          className={`w-full h-full object-cover transition-opacity duration-500 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
        />
      </div>

      {/* Círculo da lente com efeitos aplicados */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          {/* Área da lente */}
          <div 
            className="w-80 h-80 rounded-full overflow-hidden border-4 border-gray-300 shadow-2xl relative"
            style={{
              clipPath: 'circle(50% at 50% 50%)',
            }}
          >
            {/* Imagem com filtros aplicados apenas dentro da lente */}
            <div className="absolute inset-0 w-full h-full">
              <img
                src={environmentImages[currentEnvironment]}
                alt="Visão através da lente"
                className="w-full h-full object-cover"
                style={{
                  filter: filters,
                  transform: 'scale(1.2)',
                  transformOrigin: 'center'
                }}
              />

              {/* Overlay para efeito polarizado */}
              {overlayEffects.includes('reduced-glare') && (
                <div className="absolute inset-0">
                  <div className="absolute top-1/4 left-1/3 w-20 h-10 bg-white opacity-15 blur-xl animate-pulse"></div>
                  <div className="absolute top-1/2 right-1/4 w-16 h-8 bg-white opacity-8 blur-lg"></div>
                </div>
              )}

              {/* Reflexos reduzidos para antirreflexo */}
              {selectedTreatments.includes('antirreflexo') && currentEnvironment === 'direcao' && (
                <div className="absolute inset-0">
                  <div className="absolute top-1/3 left-1/2 w-12 h-6 bg-yellow-300 opacity-3 blur-md"></div>
                  <div className="absolute bottom-1/3 right-1/3 w-8 h-4 bg-white opacity-3 blur-sm"></div>
                </div>
              )}

              {/* Indicador de filtro azul */}
              {selectedTreatments.includes('filtro-azul') && (
                <div className="absolute top-4 right-4 w-2 h-2 bg-blue-400 rounded-full animate-pulse opacity-40"></div>
              )}
            </div>
          </div>

          {/* Moldura da lente */}
          <div className="absolute inset-0 w-80 h-80 rounded-full border-8 border-gray-600 shadow-inner pointer-events-none"></div>
        </div>
      </div>

      {/* Comparação visual - área sem lente */}
      <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg">
        <p className="text-sm font-medium">
          {selectedTreatments.length > 0 
            ? `${selectedTreatments.length} tratamento(s) aplicado(s)`
            : 'Nenhum tratamento selecionado'
          }
        </p>
      </div>

      {/* Label do ambiente atual */}
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg">
        <p className="text-sm font-medium">
          {currentEnvironment === 'rua' && '🌅 Ambiente Externo'}
          {currentEnvironment === 'leitura' && '📚 Leitura'}
          {currentEnvironment === 'computador' && '💻 Trabalho Digital'}
          {currentEnvironment === 'direcao' && '🚗 Direção Noturna'}
        </p>
      </div>

      {/* Loading overlay */}
      {!imageLoaded && (
        <div className="absolute inset-0 bg-black flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      )}
    </div>
  );
};
