
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Zap, Sparkles, ArrowRight, ArrowLeft, Info } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileDrawer } from './MobileDrawer';

interface LensType {
  id: string;
  name: string;
  description: string;
  benefits: string[];
  idealFor: string[];
  visualDemo: string;
  aiScore: number;
}

const lensTypes: LensType[] = [
  {
    id: 'monofocal',
    name: 'Lente Monofocal',
    description: 'Correção para uma única distância focal. Visão nítida e ampla.',
    benefits: ['Campo visual amplo', 'Adaptação rápida', 'Custo benefício', 'Ideal para atividades específicas'],
    idealFor: ['Miopia ou hipermetropia simples', 'Uso específico (leitura ou distância)', 'Primeira vez usando óculos'],
    visualDemo: 'single-focus-zone',
    aiScore: 0
  },
  {
    id: 'bifocal',
    name: 'Lente Bifocal',
    description: 'Duas zonas distintas: longe (parte superior) e perto (parte inferior).',
    benefits: ['Duas distâncias bem definidas', 'Transição clara', 'Custo acessível', 'Tecnologia consolidada'],
    idealFor: ['Presbiopia inicial', 'Atividades bem definidas', 'Pessoas acima de 45 anos'],
    visualDemo: 'dual-focus-zones',
    aiScore: 0
  },
  {
    id: 'progressiva',
    name: 'Lente Progressiva',
    description: 'Transição gradual entre todas as distâncias. Visão natural e contínua.',
    benefits: ['Visão natural', 'Sem salto visual', 'Múltiplas distâncias', 'Estética moderna'],
    idealFor: ['Presbiopia avançada', 'Vida ativa', 'Trabalho diversificado', 'Conforto estético'],
    visualDemo: 'progressive-zones',
    aiScore: 0
  },
  {
    id: 'ocupacional',
    name: 'Lente Ocupacional',
    description: 'Otimizada para atividades específicas como computador e leitura.',
    benefits: ['Foco em distâncias intermediárias', 'Reduz fadiga ocular', 'Campo visual amplo', 'Postura melhorada'],
    idealFor: ['Trabalho no computador', 'Atividades de escritório', 'Leitura prolongada'],
    visualDemo: 'occupational-zones',
    aiScore: 0
  }
];

interface LensTypeSelectorProps {
  aiRecommendations: any;
  onSelect: (lensType: string) => void;
  onBack: () => void;
}

export const LensTypeSelector: React.FC<LensTypeSelectorProps> = ({
  aiRecommendations,
  onSelect,
  onBack
}) => {
  const [selectedLens, setSelectedLens] = useState<string | null>(null);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [selectedForDetails, setSelectedForDetails] = useState<LensType | null>(null);
  const isMobile = useIsMobile();

  // Aplicar pontuação da IA (simulado)
  const lensTypesWithAI = lensTypes.map(lens => ({
    ...lens,
    aiScore: Math.random() * 100 // Aqui viria a pontuação real da IA
  })).sort((a, b) => b.aiScore - a.aiScore);

  const topRecommendation = lensTypesWithAI[0];

  const handleLensSelect = (lensId: string) => {
    setSelectedLens(lensId);
    if (isMobile) {
      // Em mobile, seleciona e continua automaticamente
      onSelect(lensId);
    }
  };

  const showLensDetails = (lens: LensType) => {
    setSelectedForDetails(lens);
    setShowDetailsDrawer(true);
  };

  if (isMobile) {
    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Escolha o Tipo de Lente
          </h2>
          <p className="text-base text-gray-600">
            IA analisou seu perfil e recomenda as melhores opções
          </p>
        </div>

        {/* Recomendação Principal da IA - Mobile */}
        <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Zap className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-blue-900 text-lg">Recomendação IA</CardTitle>
                  <p className="text-blue-700 text-sm">Baseado no seu perfil</p>
                </div>
              </div>
              <Badge className="bg-blue-600 text-white text-xs">
                {Math.round(topRecommendation.aiScore)}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              {topRecommendation.name}
            </h3>
            <p className="text-blue-700 text-sm mb-3">{topRecommendation.description}</p>
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => showLensDetails(topRecommendation)}
                className="border-blue-300 text-blue-700"
              >
                <Info className="w-4 h-4 mr-1" />
                Detalhes
              </Button>
              <Button
                onClick={() => handleLensSelect(topRecommendation.id)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Escolher
                <Sparkles className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de todas as opções - Mobile */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 text-lg mb-3">Todas as Opções</h3>
          {lensTypesWithAI.map((lens) => (
            <Card
              key={lens.id}
              className={`cursor-pointer transition-all duration-300 ${
                selectedLens === lens.id
                  ? 'border-2 border-blue-500 shadow-lg bg-blue-50'
                  : 'border hover:border-blue-200 hover:shadow-md'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-base">{lens.name}</h4>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${lens === topRecommendation ? 'border-blue-500 text-blue-700' : ''}`}
                  >
                    {Math.round(lens.aiScore)}%
                  </Badge>
                </div>
                <p className="text-gray-600 text-sm mb-3">{lens.description}</p>
                
                <div className="flex justify-between items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => showLensDetails(lens)}
                  >
                    <Info className="w-4 h-4 mr-1" />
                    Ver Detalhes
                  </Button>
                  <Button
                    onClick={() => handleLensSelect(lens.id)}
                    variant={selectedLens === lens.id ? "default" : "outline"}
                    size="sm"
                  >
                    {selectedLens === lens.id ? 'Selecionado' : 'Escolher'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Drawer de detalhes para mobile */}
        <MobileDrawer
          isOpen={showDetailsDrawer}
          onClose={() => setShowDetailsDrawer(false)}
          title={selectedForDetails?.name || ''}
          description={selectedForDetails?.description}
          footerContent={
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowDetailsDrawer(false)}
                className="flex-1"
              >
                Fechar
              </Button>
              <Button
                onClick={() => {
                  if (selectedForDetails) {
                    handleLensSelect(selectedForDetails.id);
                  }
                  setShowDetailsDrawer(false);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Escolher Esta Lente
              </Button>
            </div>
          }
        >
          {selectedForDetails && (
            <div className="space-y-4">
              {/* Simulação Visual */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-700 mb-2">Simulação Visual:</div>
                <LensVisualization type={selectedForDetails.visualDemo} />
              </div>

              {/* Benefícios */}
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Benefícios:</div>
                <div className="grid grid-cols-2 gap-2">
                  {selectedForDetails.benefits.map((benefit, index) => (
                    <Badge key={index} variant="secondary" className="text-xs justify-start">
                      {benefit}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Ideal para */}
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Ideal para:</div>
                <ul className="text-sm text-gray-600 space-y-1">
                  {selectedForDetails.idealFor.map((ideal, index) => (
                    <li key={index} className="flex items-start">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2 mt-2 flex-shrink-0" />
                      {ideal}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </MobileDrawer>

        {/* Botões de navegação mobile */}
        <div className="flex justify-between pt-4 border-t sticky bottom-0 bg-white pb-4">
          <Button variant="outline" onClick={onBack} className="px-6">
            <ArrowLeft className="mr-2 w-4 h-4" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  // Layout desktop (mantém o existente mas otimizado para tablet)
  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Escolha o Tipo de Lente
        </h2>
        <p className="text-lg text-gray-600">
          Nossa IA analisou seu perfil e recomenda as melhores opções para você
        </p>
      </div>

      {/* Recomendação Principal da IA */}
      <Card className="mb-8 border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-blue-900">Recomendação IA</CardTitle>
                <p className="text-blue-700">Baseado no seu perfil e necessidades</p>
              </div>
            </div>
            <Badge className="bg-blue-600 text-white">
              {Math.round(topRecommendation.aiScore)}% compatível
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-blue-900 mb-2">
                {topRecommendation.name}
              </h3>
              <p className="text-blue-700 mb-4">{topRecommendation.description}</p>
              <div className="flex flex-wrap gap-2">
                {topRecommendation.idealFor.slice(0, 2).map((ideal, index) => (
                  <Badge key={index} variant="outline" className="border-blue-300 text-blue-700">
                    {ideal}
                  </Badge>
                ))}
              </div>
            </div>
            <Button
              onClick={() => {
                setSelectedLens(topRecommendation.id);
                onSelect(topRecommendation.id);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3"
            >
              Escolher Recomendação IA
              <Sparkles className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Grid de todas as opções */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {lensTypesWithAI.map((lens) => (
          <Card
            key={lens.id}
            className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
              selectedLens === lens.id
                ? 'border-2 border-blue-500 shadow-lg bg-blue-50'
                : 'border hover:border-blue-200'
            }`}
            onClick={() => setSelectedLens(lens.id)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{lens.name}</CardTitle>
                <Badge 
                  variant="outline" 
                  className={lens === topRecommendation ? 'border-blue-500 text-blue-700' : ''}
                >
                  {Math.round(lens.aiScore)}% compatível
                </Badge>
              </div>
              <p className="text-gray-600">{lens.description}</p>
            </CardHeader>
            
            <CardContent>
              {/* Simulação Visual */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-700 mb-2">Simulação Visual:</div>
                <LensVisualization type={lens.visualDemo} />
              </div>

              {/* Benefícios */}
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 mb-2">Benefícios:</div>
                <div className="flex flex-wrap gap-1">
                  {lens.benefits.map((benefit, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {benefit}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Ideal para */}
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Ideal para:</div>
                <ul className="text-sm text-gray-600 space-y-1">
                  {lens.idealFor.map((ideal, index) => (
                    <li key={index} className="flex items-center">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2" />
                      {ideal}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Botões de navegação */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="px-6">
          <ArrowLeft className="mr-2 w-4 h-4" />
          Voltar
        </Button>
        
        <Button
          onClick={() => selectedLens && onSelect(selectedLens)}
          disabled={!selectedLens}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6"
        >
          Continuar para Tratamentos
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

// Componente para visualização das lentes
const LensVisualization: React.FC<{ type: string }> = ({ type }) => {
  const visualizations = {
    'single-focus-zone': (
      <div className="relative h-24 bg-gradient-to-b from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
        <div className="text-blue-700 font-medium">Zona Única de Foco</div>
      </div>
    ),
    'dual-focus-zones': (
      <div className="relative h-24 rounded-lg overflow-hidden">
        <div className="h-1/2 bg-gradient-to-b from-green-100 to-green-200 flex items-center justify-center">
          <span className="text-green-700 text-xs font-medium">Visão Distante</span>
        </div>
        <div className="h-1/2 bg-gradient-to-b from-orange-100 to-orange-200 flex items-center justify-center">
          <span className="text-orange-700 text-xs font-medium">Visão Próxima</span>
        </div>
      </div>
    ),
    'progressive-zones': (
      <div className="relative h-24 bg-gradient-to-b from-green-100 via-yellow-100 to-orange-100 rounded-lg flex items-center justify-center">
        <div className="text-gray-700 font-medium text-sm">Transição Gradual</div>
      </div>
    ),
    'occupational-zones': (
      <div className="relative h-24 bg-gradient-to-b from-purple-100 to-purple-200 rounded-lg flex items-center justify-center">
        <div className="text-purple-700 font-medium">Zona Intermediária</div>
      </div>
    )
  };

  return visualizations[type as keyof typeof visualizations] || null;
};
