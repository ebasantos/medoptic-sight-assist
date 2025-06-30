
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';

interface VisualLensDemoProps {
  selectedTreatments: string[];
  currentEnvironment: 'rua' | 'leitura' | 'computador' | 'direcao';
}

export const VisualLensDemo = ({ selectedTreatments, currentEnvironment }: VisualLensDemoProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  // URLs de imagens base para cada ambiente
  const environmentImages = {
    rua: 'https://images.unsplash.com/photo-1500673922987-e212871fec22?w=800&h=600&fit=crop',
    leitura: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=600&fit=crop',
    computador: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&h=600&fit=crop',
    direcao: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&h=600&fit=crop'
  };

  // Calcular filtros CSS baseados nos tratamentos selecionados
  const calculateFilters = () => {
    let filters = [];
    let overlayEffects = [];

    if (selectedTreatments.includes('antirreflexo')) {
      filters.push('brightness(1.1)');
      filters.push('contrast(1.05)');
    }

    if (selectedTreatments.includes('filtro-azul')) {
      filters.push('sepia(0.1)');
      filters.push('hue-rotate(-5deg)');
    }

    if (selectedTreatments.includes('protecao-uv')) {
      filters.push('saturate(1.02)');
    }

    if (selectedTreatments.includes('fotossensiveis')) {
      if (currentEnvironment === 'rua') {
        filters.push('brightness(0.7)');
        filters.push('contrast(1.1)');
      }
    }

    if (selectedTreatments.includes('polarizado')) {
      filters.push('contrast(1.15)');
      filters.push('saturate(1.1)');
      overlayEffects.push('reduced-glare');
    }

    return { filters: filters.join(' '), overlayEffects };
  };

  const { filters, overlayEffects } = calculateFilters();

  useEffect(() => {
    setImageLoaded(false);
    const timer = setTimeout(() => setImageLoaded(true), 300);
    return () => clearTimeout(timer);
  }, [currentEnvironment, selectedTreatments]);

  return (
    <Card className="relative overflow-hidden bg-gray-900 aspect-video">
      {/* Moldura da lente */}
      <div className="absolute inset-4 rounded-full border-4 border-gray-700 z-10 opacity-20">
        <div className="absolute inset-2 rounded-full border-2 border-gray-600 opacity-50"></div>
      </div>

      {/* Imagem do ambiente com filtros aplicados */}
      <div className="relative w-full h-full overflow-hidden">
        <img
          src={environmentImages[currentEnvironment]}
          alt={`Ambiente: ${currentEnvironment}`}
          className={`w-full h-full object-cover transition-all duration-500 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            filter: filters,
            transform: 'scale(1.05)'
          }}
          onLoad={() => setImageLoaded(true)}
        />

        {/* Overlay para efeito polarizado */}
        {overlayEffects.includes('reduced-glare') && (
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/3 w-32 h-16 bg-white opacity-20 blur-xl animate-pulse"></div>
            <div className="absolute top-1/2 right-1/4 w-24 h-12 bg-white opacity-10 blur-lg"></div>
          </div>
        )}

        {/* Reflexos reduzidos para antirreflexo */}
        {selectedTreatments.includes('antirreflexo') && currentEnvironment === 'direcao' && (
          <div className="absolute inset-0">
            <div className="absolute top-1/3 left-1/2 w-16 h-8 bg-yellow-300 opacity-5 blur-md"></div>
            <div className="absolute bottom-1/3 right-1/3 w-12 h-6 bg-white opacity-5 blur-sm"></div>
          </div>
        )}

        {/* Indicador de filtro azul */}
        {selectedTreatments.includes('filtro-azul') && currentEnvironment === 'computador' && (
          <div className="absolute top-4 right-4 w-3 h-3 bg-blue-400 rounded-full animate-pulse opacity-30"></div>
        )}

        {/* Loading overlay */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      {/* Label do ambiente atual */}
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-sm font-medium">
        {currentEnvironment === 'rua' && '🌅 Ambiente Externo'}
        {currentEnvironment === 'leitura' && '📚 Leitura'}
        {currentEnvironment === 'computador' && '💻 Trabalho Digital'}
        {currentEnvironment === 'direcao' && '🚗 Direção Noturna'}
      </div>

      {/* Indicadores de tratamentos ativos */}
      {selectedTreatments.length > 0 && (
        <div className="absolute top-4 left-4 flex flex-wrap gap-1">
          {selectedTreatments.map((treatment) => (
            <div 
              key={treatment}
              className="bg-blue-600 bg-opacity-80 text-white text-xs px-2 py-1 rounded-full"
            >
              {treatment === 'antirreflexo' && '🛡️ AR'}
              {treatment === 'filtro-azul' && '💙 Filtro Azul'}
              {treatment === 'protecao-uv' && '☀️ UV'}
              {treatment === 'fotossensiveis' && '🔄 Foto'}
              {treatment === 'polarizado' && '🕶️ Polar'}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
