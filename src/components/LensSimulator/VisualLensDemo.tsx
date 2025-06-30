
import React, { useState, useEffect } from 'react';

interface VisualLensDemoProps {
  selectedTreatments: string[];
  currentEnvironment: 'rua' | 'leitura' | 'computador' | 'direcao';
}

export const VisualLensDemo = ({ selectedTreatments, currentEnvironment }: VisualLensDemoProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  // URLs de imagens reais para cada ambiente
  const environmentImages = {
    rua: 'https://images.unsplash.com/photo-1500673922987-e212871fec22?w=1200&h=800&fit=crop',
    leitura: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&h=800&fit=crop',
    computador: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=1200&h=800&fit=crop',
    direcao: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1200&h=800&fit=crop'
  };

  // Calcular filtros CSS baseados nos tratamentos selecionados
  const calculateLensFilters = () => {
    let filters = [];
    let overlayEffects = [];

    if (selectedTreatments.includes('antirreflexo')) {
      filters.push('brightness(1.3)');
      filters.push('contrast(1.2)');
      overlayEffects.push('antirreflexo');
    }

    if (selectedTreatments.includes('filtro-azul')) {
      filters.push('sepia(0.25)');
      filters.push('hue-rotate(-12deg)');
      filters.push('saturate(0.85)');
      overlayEffects.push('filtro-azul');
    }

    if (selectedTreatments.includes('protecao-uv')) {
      filters.push('saturate(1.1)');
      filters.push('brightness(1.05)');
    }

    if (selectedTreatments.includes('fotossensiveis')) {
      if (currentEnvironment === 'rua') {
        filters.push('brightness(0.5)');
        filters.push('contrast(1.3)');
        overlayEffects.push('fotossensiveis-dark');
      } else {
        filters.push('brightness(1.1)');
      }
    }

    if (selectedTreatments.includes('polarizado')) {
      filters.push('contrast(1.4)');
      filters.push('saturate(1.3)');
      overlayEffects.push('polarizado');
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
            className="w-96 h-96 rounded-full overflow-hidden border-4 border-gray-400 shadow-2xl relative bg-black"
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
                  filter: filters || 'none',
                  transform: 'scale(1.1)',
                  transformOrigin: 'center'
                }}
              />

              {/* Overlay para efeito polarizado */}
              {overlayEffects.includes('polarizado') && (
                <div className="absolute inset-0">
                  <div className="absolute top-1/4 left-1/3 w-24 h-12 bg-white opacity-5 blur-xl"></div>
                  <div className="absolute top-1/2 right-1/4 w-20 h-10 bg-white opacity-3 blur-lg"></div>
                  <div className="absolute bottom-1/3 left-1/2 w-16 h-8 bg-yellow-300 opacity-2 blur-md"></div>
                </div>
              )}

              {/* Reflexos reduzidos para antirreflexo */}
              {overlayEffects.includes('antirreflexo') && (
                <div className="absolute inset-0">
                  <div className="absolute top-1/3 left-1/2 w-8 h-4 bg-yellow-300 opacity-1 blur-sm"></div>
                  <div className="absolute bottom-1/3 right-1/3 w-6 h-3 bg-white opacity-1 blur-xs"></div>
                </div>
              )}

              {/* Indicador visual de filtro azul */}
              {overlayEffects.includes('filtro-azul') && (
                <div className="absolute inset-0">
                  <div className="absolute top-4 right-4 w-3 h-3 bg-blue-400 rounded-full animate-pulse opacity-50"></div>
                  <div className="absolute inset-0 bg-yellow-50 opacity-5"></div>
                </div>
              )}

              {/* Efeito escurecimento para fotossensíveis */}
              {overlayEffects.includes('fotossensiveis-dark') && (
                <div className="absolute inset-0 bg-gray-900 opacity-30"></div>
              )}
            </div>
          </div>

          {/* Moldura da lente mais robusta */}
          <div className="absolute inset-0 w-96 h-96 rounded-full border-8 border-gray-700 shadow-inner pointer-events-none"></div>
          
          {/* Reflexo na moldura da lente */}
          <div className="absolute top-8 left-12 w-16 h-8 bg-white opacity-20 rounded-full blur-sm pointer-events-none"></div>
        </div>
      </div>

      {/* Comparação visual - contador de tratamentos */}
      <div className="absolute top-4 right-4 bg-black bg-opacity-80 text-white px-4 py-2 rounded-lg">
        <p className="text-sm font-medium">
          {selectedTreatments.length > 0 
            ? `${selectedTreatments.length} tratamento(s) ativo(s)`
            : 'Nenhum tratamento aplicado'
          }
        </p>
      </div>

      {/* Label do ambiente atual */}
      <div className="absolute bottom-4 right-4 bg-black bg-opacity-80 text-white px-4 py-2 rounded-lg">
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
