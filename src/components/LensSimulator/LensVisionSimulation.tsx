import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, ZoomIn, ZoomOut, Monitor, Book, Car, Users, Glasses } from 'lucide-react';

interface LensVisionSimulationProps {
  lensType: string;
  title: string;
  description: string;
}

export const LensVisionSimulation: React.FC<LensVisionSimulationProps> = ({
  lensType,
  title,
  description
}) => {
  const [selectedDistance, setSelectedDistance] = useState<'far' | 'intermediate' | 'near'>('far');

  const getLensVisualization = () => {
    switch (lensType) {
      case 'monofocal':
        return (
          <MonofocalSimulation selectedDistance={selectedDistance} />
        );
      case 'bifocal':
        return (
          <BifocalSimulation selectedDistance={selectedDistance} />
        );
      case 'progressiva':
        return (
          <ProgressiveSimulation selectedDistance={selectedDistance} />
        );
      case 'ocupacional':
        return (
          <OccupationalSimulation selectedDistance={selectedDistance} />
        );
      default:
        return null;
    }
  };

  const getDistanceButtons = () => (
    <div className="flex gap-2 justify-center mb-4">
      <Button
        variant={selectedDistance === 'far' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setSelectedDistance('far')}
        className="flex items-center gap-1"
      >
        <Car className="w-3 h-3" />
        Longe
      </Button>
      <Button
        variant={selectedDistance === 'intermediate' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setSelectedDistance('intermediate')}
        className="flex items-center gap-1"
      >
        <Monitor className="w-3 h-3" />
        Intermediário
      </Button>
      <Button
        variant={selectedDistance === 'near' ? 'default' : 'outline'}
        size="sm"
        onClick={() => setSelectedDistance('near')}
        className="flex items-center gap-1"
      >
        <Book className="w-3 h-3" />
        Perto
      </Button>
    </div>
  );

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>

        {getDistanceButtons()}

        <div className="relative">
          {/* Simulação realista da lente com imagem fotográfica */}
          <div className="relative w-full h-80 bg-gray-900 rounded-xl overflow-hidden border-4 border-gray-300">
            {/* Imagem de fundo fotorrealista */}
            <div className="absolute inset-0">
              <PhotoRealisticScene selectedDistance={selectedDistance} />
            </div>

            {/* Formato e efeito da lente */}
            <div className="absolute inset-4 rounded-lg overflow-hidden">
              {getLensVisualization()}
            </div>

            {/* Moldura dos óculos mais realista */}
            <div className="absolute inset-0 pointer-events-none">
              <svg viewBox="0 0 400 300" className="w-full h-full">
                {/* Lente esquerda */}
                <ellipse cx="130" cy="150" rx="80" ry="60" 
                  fill="none" stroke="rgba(0,0,0,0.9)" strokeWidth="6"/>
                {/* Lente direita */}
                <ellipse cx="270" cy="150" rx="80" ry="60" 
                  fill="none" stroke="rgba(0,0,0,0.9)" strokeWidth="6"/>
                {/* Ponte */}
                <line x1="210" y1="140" x2="190" y2="140" 
                  stroke="rgba(0,0,0,0.9)" strokeWidth="6"/>
                {/* Hastes */}
                <line x1="50" y1="140" x2="15" y2="115" 
                  stroke="rgba(0,0,0,0.9)" strokeWidth="6"/>
                <line x1="350" y1="140" x2="385" y2="115" 
                  stroke="rgba(0,0,0,0.9)" strokeWidth="6"/>
                {/* Sombra da armação */}
                <ellipse cx="132" cy="152" rx="80" ry="60" 
                  fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="2"/>
                <ellipse cx="272" cy="152" rx="80" ry="60" 
                  fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="2"/>
              </svg>
            </div>

            {/* Reflexo nas lentes */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-16 left-16 w-20 h-12 bg-white opacity-10 rounded-full blur-sm"></div>
              <div className="absolute top-16 right-16 w-20 h-12 bg-white opacity-10 rounded-full blur-sm"></div>
            </div>
          </div>

          {/* Legenda dos campos visuais */}
          <LensLegend lensType={lensType} />
        </div>

        {/* Informações sobre a distância selecionada */}
        <DistanceInfo distance={selectedDistance} lensType={lensType} />
      </CardContent>
    </Card>
  );
};

// Componente para lente monofocal
const MonofocalSimulation: React.FC<{ selectedDistance: string }> = ({ selectedDistance }) => {
  return (
    <div className="relative w-full h-full">
      {/* Efeito de desfoque seletivo baseado na distância */}
      {selectedDistance === 'far' ? (
        // Foco na distância - desfoque no perto
        <div className="absolute inset-0">
          <div className="absolute bottom-0 w-full h-2/5 backdrop-blur-md bg-opacity-20 bg-gray-300"></div>
          <div className="absolute top-2 right-2 z-20">
            <Badge className="bg-green-600 text-white text-xs">LONGE NÍTIDO</Badge>
          </div>
        </div>
      ) : selectedDistance === 'near' ? (
        // Foco no perto - desfoque na distância
        <div className="absolute inset-0">
          <div className="absolute top-0 w-full h-3/5 backdrop-blur-md bg-opacity-20 bg-gray-300"></div>
          <div className="absolute top-2 right-2 z-20">
            <Badge className="bg-green-600 text-white text-xs">PERTO NÍTIDO</Badge>
          </div>
        </div>
      ) : (
        // Foco intermediário - ambos desfocados
        <div className="absolute inset-0">
          <div className="absolute inset-0 backdrop-blur-lg bg-opacity-30 bg-red-200"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="p-2 rounded-full bg-red-200 bg-opacity-80 border-2 border-red-400">
              <ZoomOut className="w-4 h-4 text-red-700" />
            </div>
          </div>
          <div className="absolute top-2 right-2 z-20">
            <Badge variant="destructive" className="text-xs">TURVO</Badge>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente para lente bifocal
const BifocalSimulation: React.FC<{ selectedDistance: string }> = ({ selectedDistance }) => {
  return (
    <div className="relative w-full h-full">
      {/* Linha divisória bem visível da bifocal */}
      <div className="absolute top-3/5 w-full h-1 bg-gray-800 z-30 opacity-80 shadow-lg"></div>
      
      {selectedDistance === 'far' ? (
        // Foco na zona superior (distância)
        <div className="absolute inset-0">
          <div className="absolute bottom-0 w-full h-2/5 backdrop-blur-md bg-opacity-20 bg-gray-300"></div>
          <div className="absolute top-2 left-2 z-20">
            <Badge className="bg-green-600 text-white text-xs">ZONA LONGE</Badge>
          </div>
        </div>
      ) : selectedDistance === 'near' ? (
        // Foco na zona inferior (perto)
        <div className="absolute inset-0">
          <div className="absolute top-0 w-full h-3/5 backdrop-blur-md bg-opacity-20 bg-gray-300"></div>
          <div className="absolute bottom-2 left-2 z-20">
            <Badge className="bg-green-600 text-white text-xs">ZONA PERTO</Badge>
          </div>
        </div>
      ) : (
        // Zona intermediária sempre problemática
        <div className="absolute inset-0">
          <div className="absolute inset-0 backdrop-blur-lg bg-opacity-30 bg-red-200"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="p-2 rounded-full bg-red-200 bg-opacity-80 border-2 border-red-400 text-center">
              <ZoomOut className="w-4 h-4 text-red-700 mx-auto mb-1" />
              <span className="text-xs font-medium text-red-700 block">TURVO</span>
            </div>
          </div>
        </div>
      )}

      <div className="absolute top-2 right-2 z-20">
        <Badge className="bg-blue-600 text-white text-xs">BIFOCAL</Badge>
      </div>
    </div>
  );
};

// Componente para lente progressiva
const ProgressiveSimulation: React.FC<{ selectedDistance: string }> = ({ selectedDistance }) => {
  return (
    <div className="relative w-full h-full">
      {/* Gradientes suaves indicando as zonas de foco */}
      <div className="absolute inset-0">
        {/* Zona de distância */}
        {selectedDistance === 'far' && (
          <div className="absolute top-0 w-full h-1/3 bg-green-100 bg-opacity-20 border border-green-300 rounded-t">
            <div className="absolute top-1 left-2">
              <Badge className="bg-green-600 text-white text-xs">LONGE ATIVO</Badge>
            </div>
          </div>
        )}

        {/* Zona intermediária */}
        {selectedDistance === 'intermediate' && (
          <div className="absolute top-1/3 w-full h-1/3 bg-green-100 bg-opacity-20 border border-green-300">
            <div className="absolute top-1 right-2">
              <Badge className="bg-green-600 text-white text-xs">MÉDIO ATIVO</Badge>
            </div>
          </div>
        )}

        {/* Zona de perto */}
        {selectedDistance === 'near' && (
          <div className="absolute bottom-0 w-full h-1/3 bg-green-100 bg-opacity-20 border border-green-300 rounded-b">
            <div className="absolute bottom-1 left-2">
              <Badge className="bg-green-600 text-white text-xs">PERTO ATIVO</Badge>
            </div>
          </div>
        )}
      </div>

      {/* Linhas graduais muito sutis */}
      <div className="absolute inset-0">
        <div className="absolute top-1/3 w-full h-px bg-gradient-to-r from-transparent via-green-400 to-transparent opacity-30"></div>
        <div className="absolute top-2/3 w-full h-px bg-gradient-to-r from-transparent via-green-400 to-transparent opacity-30"></div>
      </div>

      {/* Indicador central mostrando visão clara */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="p-2 rounded-full bg-green-100 bg-opacity-60 border border-green-400">
          <Eye className="w-4 h-4 text-green-700" />
        </div>
      </div>

      <div className="absolute top-2 right-2 z-20">
        <Badge className="bg-green-600 text-white text-xs">PROGRESSIVA</Badge>
      </div>
    </div>
  );
};

// Componente para lente ocupacional
const OccupationalSimulation: React.FC<{ selectedDistance: string }> = ({ selectedDistance }) => {
  return (
    <div className="relative w-full h-full">
      {selectedDistance === 'intermediate' ? (
        // Zona intermediária ampliada e otimizada
        <div className="absolute inset-0">
          <div className="absolute top-0 w-full h-3/5 bg-green-100 bg-opacity-20 border border-green-300 rounded-t">
            <div className="absolute top-2 left-2">
              <Badge className="bg-green-600 text-white text-xs">COMPUTADOR IDEAL</Badge>
            </div>
          </div>
        </div>
      ) : selectedDistance === 'near' ? (
        // Zona de perto boa
        <div className="absolute inset-0">
          <div className="absolute top-3/5 w-full h-2/5 bg-green-100 bg-opacity-20 border border-green-300 rounded-b">
            <div className="absolute bottom-2 left-2">
              <Badge className="bg-blue-600 text-white text-xs">LEITURA BOA</Badge>
            </div>
          </div>
          {/* Leve desfoque na zona superior */}
          <div className="absolute top-0 w-full h-3/5 backdrop-blur-sm bg-opacity-10 bg-gray-200"></div>
        </div>
      ) : (
        // Zona distante muito limitada
        <div className="absolute inset-0">
          <div className="absolute inset-0 backdrop-blur-md bg-opacity-25 bg-yellow-200"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="p-2 rounded-full bg-yellow-200 bg-opacity-80 border-2 border-yellow-400 text-center">
              <Car className="w-4 h-4 text-yellow-700 mx-auto mb-1" />
              <span className="text-xs font-medium text-yellow-700 block">LIMITADA</span>
            </div>
          </div>
        </div>
      )}

      {/* Linha divisória sutil entre as zonas */}
      <div className="absolute top-3/5 w-full h-px bg-purple-400 opacity-40"></div>

      <div className="absolute top-2 right-2 z-20">
        <Badge className={`text-xs ${
          selectedDistance === 'far' ? 'bg-yellow-500' : 'bg-purple-600'
        } text-white`}>
          OCUPACIONAL
        </Badge>
      </div>
    </div>
  );
};

// Componente de legenda
const LensLegend: React.FC<{ lensType: string }> = ({ lensType }) => {
  const legends = {
    monofocal: [
      { color: 'bg-green-100 border-green-400', label: 'Zona Nítida (apenas 1 distância)', icon: <Eye className="w-3 h-3" /> },
      { color: 'bg-red-100 border-red-400', label: 'Visão Turva (outras distâncias)', icon: <ZoomOut className="w-3 h-3" /> }
    ],
    bifocal: [
      { color: 'bg-green-100 border-green-400', label: 'Zonas Nítidas (Longe + Perto)', icon: <Eye className="w-3 h-3" /> },
      { color: 'bg-gray-100 border-gray-400', label: 'Zona Inativa', icon: <Monitor className="w-3 h-3" /> },
      { color: 'bg-red-100 border-red-400', label: 'Intermediário Turvo', icon: <ZoomOut className="w-3 h-3" /> }
    ],
    progressiva: [
      { color: 'bg-green-100 border-green-400', label: 'Todas as Distâncias Nítidas', icon: <Eye className="w-3 h-3" /> },
      { color: 'bg-blue-100 border-blue-400', label: 'Transição Suave', icon: <Glasses className="w-3 h-3" /> }
    ],
    ocupacional: [
      { color: 'bg-green-100 border-green-400', label: 'Computador + Leitura', icon: <Monitor className="w-3 h-3" /> },
      { color: 'bg-yellow-100 border-yellow-400', label: 'Distância Limitada', icon: <Car className="w-3 h-3" /> }
    ]
  };

  const currentLegend = legends[lensType as keyof typeof legends] || [];

  return (
    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
      <div className="text-sm font-medium text-gray-700 mb-2 text-center">Como você enxergará:</div>
      <div className="flex flex-wrap gap-2 justify-center">
        {currentLegend.map((item, index) => (
          <div key={index} className="flex items-center gap-1 text-xs bg-white px-2 py-1 rounded border">
            <div className={`w-3 h-3 rounded border ${item.color}`}></div>
            {item.icon}
            <span className="text-gray-700">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Componente de informações sobre a distância
const DistanceInfo: React.FC<{ distance: string; lensType: string }> = ({ distance, lensType }) => {
  const getDistanceInfo = () => {
    const info = {
      monofocal: {
        far: { quality: 'Excelente', description: 'Visão perfeita para dirigir e atividades à distância' },
        intermediate: { quality: 'Turva', description: 'Necessita trocar de óculos para computador' },
        near: { quality: 'Turva', description: 'Necessita trocar de óculos para leitura' }
      },
      bifocal: {
        far: { quality: 'Excelente', description: 'Zona superior ideal para distância' },
        intermediate: { quality: 'Difícil', description: 'Zona intermediária limitada, pode causar desconforto' },
        near: { quality: 'Excelente', description: 'Zona inferior perfeita para leitura' }
      },
      progressiva: {
        far: { quality: 'Excelente', description: 'Transição natural para todas as distâncias' },
        intermediate: { quality: 'Excelente', description: 'Zona ampla para computador e trabalho' },
        near: { quality: 'Excelente', description: 'Leitura confortável sem saltos visuais' }
      },
      ocupacional: {
        far: { quality: 'Limitada', description: 'Não recomendada para dirigir ou atividades distantes' },
        intermediate: { quality: 'Excelente', description: 'Zona ampliada ideal para computador' },
        near: { quality: 'Boa', description: 'Boa para leitura e trabalhos de perto' }
      }
    };

    const current = info[lensType as keyof typeof info]?.[distance as keyof typeof info['monofocal']];
    if (!current) return null;

    const qualityColor = {
      'Excelente': 'text-green-600 bg-green-50 border-green-200',
      'Boa': 'text-blue-600 bg-blue-50 border-blue-200',
      'Limitada': 'text-yellow-600 bg-yellow-50 border-yellow-200',
      'Turva': 'text-red-600 bg-red-50 border-red-200',
      'Difícil': 'text-orange-600 bg-orange-50 border-orange-200'
    };

    return (
      <div className="mt-4 p-3 rounded-lg border bg-gray-50">
        <div className="flex items-center gap-2 mb-2">
          <Badge className={qualityColor[current.quality as keyof typeof qualityColor]}>
            {current.quality}
          </Badge>
          <span className="text-sm font-medium text-gray-700">
            Visão {distance === 'far' ? 'à Distância' : distance === 'intermediate' ? 'Intermediária' : 'de Perto'}
          </span>
        </div>
        <p className="text-sm text-gray-600">{current.description}</p>
      </div>
    );
  };

  return getDistanceInfo();
};

// Componente de ambiente realista
const RealisticEnvironment: React.FC<{ selectedDistance: string }> = ({ selectedDistance }) => {
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Elementos distantes (prédios/cidade) */}
      <div className="absolute top-0 w-full h-1/3 bg-gradient-to-b from-gray-600 to-gray-400">
        {/* Silhuetas de prédios */}
        <div className="absolute bottom-0 w-full h-full flex items-end justify-center space-x-1">
          <div className="w-8 h-16 bg-gray-800 opacity-70"></div>
          <div className="w-12 h-20 bg-gray-700 opacity-70"></div>
          <div className="w-6 h-12 bg-gray-800 opacity-70"></div>
          <div className="w-10 h-18 bg-gray-700 opacity-70"></div>
          <div className="w-8 h-14 bg-gray-800 opacity-70"></div>
        </div>
        {/* Carros distantes */}
        <div className="absolute bottom-2 left-8 w-4 h-2 bg-red-400 rounded-sm opacity-60"></div>
        <div className="absolute bottom-2 right-12 w-4 h-2 bg-blue-400 rounded-sm opacity-60"></div>
      </div>

      {/* Elementos intermediários (móveis/computador) */}
      <div className="absolute top-1/3 w-full h-1/3 bg-gradient-to-b from-gray-400 to-gray-300">
        {/* Mesa com computador */}
        <div className="absolute bottom-0 left-1/4 w-20 h-8 bg-amber-700 opacity-80"></div>
        <div className="absolute bottom-8 left-1/3 w-12 h-8 bg-gray-800 opacity-80 border border-gray-600">
          {/* Tela do computador */}
          <div className="w-full h-full bg-blue-200 opacity-60 p-1">
            <div className="w-full h-1 bg-gray-600 opacity-40 mb-1"></div>
            <div className="w-3/4 h-1 bg-gray-600 opacity-40 mb-1"></div>
            <div className="w-1/2 h-1 bg-gray-600 opacity-40"></div>
          </div>
        </div>
        {/* Pessoa trabalhando */}
        <div className="absolute bottom-2 left-1/2 w-6 h-12 bg-pink-300 opacity-70 rounded-t-full"></div>
      </div>

      {/* Elementos próximos (livro/texto) */}
      <div className="absolute bottom-0 w-full h-1/3 bg-gradient-to-b from-gray-300 to-gray-200">
        {/* Livro/documento */}
        <div className="absolute top-4 left-1/3 w-16 h-20 bg-white border-2 border-gray-400 shadow-lg">
          {/* Linhas de texto */}
          <div className="p-2">
            <div className="w-full h-0.5 bg-gray-800 mb-1 opacity-70"></div>
            <div className="w-5/6 h-0.5 bg-gray-800 mb-1 opacity-70"></div>
            <div className="w-full h-0.5 bg-gray-800 mb-1 opacity-70"></div>
            <div className="w-3/4 h-0.5 bg-gray-800 mb-1 opacity-70"></div>
            <div className="w-full h-0.5 bg-gray-800 mb-1 opacity-70"></div>
            <div className="w-4/5 h-0.5 bg-gray-800 mb-1 opacity-70"></div>
          </div>
        </div>
        {/* Smartphone */}
        <div className="absolute top-6 right-1/4 w-6 h-12 bg-gray-900 rounded border border-gray-600">
          <div className="w-full h-8 bg-blue-100 m-0.5 rounded-sm opacity-80">
            <div className="w-4 h-1 bg-gray-700 mx-auto mt-1 opacity-60"></div>
            <div className="w-3 h-1 bg-gray-700 mx-auto mt-0.5 opacity-60"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente de cena fotorrealista
const PhotoRealisticScene: React.FC<{ selectedDistance: string }> = ({ selectedDistance }) => {
  return (
    <div className="relative w-full h-full bg-gradient-to-b from-gray-100 via-gray-200 to-amber-100 overflow-hidden">
      {/* Fundo - Ambiente de escritório */}
      <div className="absolute inset-0">
        {/* Parede com textura */}
        <div className="absolute top-0 w-full h-2/3 bg-gradient-to-b from-gray-300 to-gray-200">
          {/* Estante/móveis no fundo */}
          <div className="absolute top-1/4 left-4 w-24 h-32 bg-amber-800 opacity-60 rounded-sm shadow-lg">
            {/* Prateleiras */}
            <div className="absolute top-4 w-full h-1 bg-amber-900 opacity-40"></div>
            <div className="absolute top-12 w-full h-1 bg-amber-900 opacity-40"></div>
            <div className="absolute top-20 w-full h-1 bg-amber-900 opacity-40"></div>
            {/* Livros */}
            <div className="absolute top-5 left-1 w-2 h-6 bg-red-600 opacity-50"></div>
            <div className="absolute top-5 left-4 w-2 h-6 bg-blue-600 opacity-50"></div>
            <div className="absolute top-5 left-7 w-2 h-6 bg-green-600 opacity-50"></div>
          </div>

          {/* Monitor/TV no fundo */}
          <div className="absolute top-1/3 right-8 w-20 h-12 bg-gray-900 rounded border-2 border-gray-700">
            <div className="absolute inset-1 bg-blue-300 opacity-30">
              {/* Conteúdo da tela */}
              <div className="absolute top-1 left-1 w-8 h-1 bg-white opacity-40"></div>
              <div className="absolute top-3 left-1 w-6 h-1 bg-white opacity-40"></div>
              <div className="absolute top-5 left-1 w-10 h-1 bg-white opacity-40"></div>
            </div>
          </div>

          {/* Janela com persiana */}
          <div className="absolute top-4 right-1/3 w-16 h-24 bg-yellow-100 opacity-70 border-2 border-gray-400">
            {/* Lâminas da persiana */}
            {Array.from({length: 8}).map((_, i) => (
              <div key={i} className={`absolute w-full h-0.5 bg-gray-500 opacity-30`} 
                   style={{top: `${i * 3 + 2}px`}}></div>
            ))}
          </div>
        </div>

        {/* Mesa/superfície */}
        <div className="absolute bottom-0 w-full h-1/3 bg-gradient-to-t from-amber-200 to-amber-100">
          {/* Textura da mesa */}
          <div className="absolute inset-0 opacity-20"
               style={{
                 backgroundImage: `repeating-linear-gradient(
                   90deg,
                   transparent,
                   transparent 2px,
                   rgba(139, 69, 19, 0.1) 2px,
                   rgba(139, 69, 19, 0.1) 4px
                 )`
               }}>
          </div>
        </div>
      </div>

      {/* Elemento principal - Mãos segurando smartphone */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        {/* Braços/mãos */}
        <div className="relative">
          {/* Braço esquerdo */}
          <div className="absolute -bottom-8 -left-12 w-8 h-16 bg-pink-200 rounded-full transform rotate-12 shadow-md"></div>
          {/* Braço direito */}
          <div className="absolute -bottom-8 -right-4 w-8 h-16 bg-pink-200 rounded-full transform -rotate-12 shadow-md"></div>
          
          {/* Mão esquerda */}
          <div className="absolute -bottom-4 -left-8 w-6 h-8 bg-pink-300 rounded-full shadow-lg"></div>
          {/* Mão direita */}
          <div className="absolute -bottom-4 right-0 w-6 h-8 bg-pink-300 rounded-full shadow-lg"></div>

          {/* Smartphone */}
          <div className="relative w-16 h-24 bg-gray-900 rounded-lg border-2 border-gray-700 shadow-2xl">
            {/* Tela do smartphone */}
            <div className="absolute inset-1 bg-blue-50 rounded-md overflow-hidden">
              {/* Barra superior */}
              <div className="absolute top-0 w-full h-2 bg-gray-100">
                <div className="absolute top-0.5 right-1 w-2 h-1 bg-green-500 rounded-sm"></div>
                <div className="absolute top-0.5 right-4 w-1 h-1 bg-gray-600 rounded-sm"></div>
              </div>
              
              {/* Conteúdo da tela - Social media */}
              <div className="absolute top-3 inset-x-1">
                {/* Header do app */}
                <div className="w-full h-3 bg-blue-500 rounded-sm mb-1 opacity-80"></div>
                
                {/* Post com foto */}
                <div className="w-full h-6 bg-gray-200 rounded-sm mb-1 relative overflow-hidden">
                  {/* Foto do post */}
                  <div className="absolute inset-0.5 bg-gradient-to-br from-green-300 to-blue-300 rounded-sm">
                    {/* Silhueta de pessoa */}
                    <div className="absolute bottom-1 left-2 w-3 h-4 bg-gray-700 opacity-40 rounded-t-full"></div>
                  </div>
                </div>
                
                {/* Texto do post */}
                <div className="space-y-0.5">
                  <div className="w-full h-0.5 bg-gray-600 opacity-60"></div>
                  <div className="w-3/4 h-0.5 bg-gray-600 opacity-60"></div>
                  <div className="w-5/6 h-0.5 bg-gray-600 opacity-60"></div>
                </div>
                
                {/* Botões de interação */}
                <div className="absolute bottom-1 flex space-x-1">
                  <div className="w-2 h-1 bg-red-500 rounded-sm opacity-70"></div>
                  <div className="w-2 h-1 bg-blue-500 rounded-sm opacity-70"></div>
                  <div className="w-2 h-1 bg-green-500 rounded-sm opacity-70"></div>
                </div>
              </div>
            </div>

            {/* Reflexo na tela */}
            <div className="absolute top-2 left-2 w-4 h-6 bg-white opacity-10 rounded blur-sm"></div>
          </div>
        </div>
      </div>

      {/* Objetos na mesa */}
      <div className="absolute bottom-4 left-8">
        {/* Xícara de café */}
        <div className="w-4 h-4 bg-white rounded-full border border-gray-300 shadow-md">
          <div className="absolute inset-0.5 bg-amber-800 rounded-full opacity-70"></div>
          {/* Alça */}
          <div className="absolute -right-1 top-1 w-1.5 h-2 border border-gray-400 rounded-r-full"></div>
        </div>
      </div>

      <div className="absolute bottom-6 right-12">
        {/* Notebook */}
        <div className="w-12 h-8 bg-gray-300 rounded-sm shadow-lg transform -rotate-12">
          {/* Teclado */}
          <div className="absolute inset-1 bg-gray-800 rounded-sm">
            {/* Teclas */}
            {Array.from({length: 15}).map((_, i) => (
              <div key={i} 
                   className="absolute w-0.5 h-0.5 bg-gray-600 rounded-sm"
                   style={{
                     left: `${(i % 5) * 2 + 1}px`,
                     top: `${Math.floor(i / 5) * 1.5 + 1}px`
                   }}></div>
            ))}
          </div>
        </div>
      </div>

      {/* Iluminação e sombras */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-gray-900 opacity-10"></div>
      
      {/* Sombra do smartphone */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-20 h-4 bg-gray-800 opacity-20 rounded-full blur-md"></div>
    </div>
  );
};
