import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Shield, 
  Sun, 
  Monitor, 
  Zap, 
  Glasses, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles,
  HelpCircle,
  Eye,
  Settings,
  Menu
} from 'lucide-react';
import { VisualLensDemo } from './VisualLensDemo';

interface TreatmentSelectorProps {
  selectedLens: string | null;
  aiRecommendations: {
    tratamentosRecomendados?: string[];
    motivacao?: string;
  } | null;
  onSelect: (treatments: string[]) => void;
  onBack: () => void;
}

export const TreatmentSelector = ({ selectedLens, aiRecommendations, onSelect, onBack }: TreatmentSelectorProps) => {
  const [selectedTreatments, setSelectedTreatments] = useState<string[]>([]);
  const [currentEnvironment, setCurrentEnvironment] = useState<'rua' | 'leitura' | 'computador' | 'direcao'>('rua');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [recentlySelected, setRecentlySelected] = useState<string | null>(null);
  const isMobile = useIsMobile();

  // Refs para cada cartão de tratamento
  const treatmentRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const treatments = [
    {
      id: 'antirreflexo',
      name: 'Antirreflexo',
      icon: Shield,
      benefits: [
        'Elimina reflexos indesejados',
        'Melhora a nitidez visual',
        'Reduz cansaço visual',
        'Melhora aparência estética',
        'Essencial para direção noturna'
      ],
      recommended: aiRecommendations?.tratamentosRecomendados?.includes('antirreflexo')
    },
    {
      id: 'filtro-azul',
      name: 'Filtro Azul',
      icon: Monitor,
      benefits: [
        'Protege contra luz azul prejudicial',
        'Reduz fadiga ocular digital',
        'Melhora qualidade do sono',
        'Ideal para uso de telas',
        'Proteção a longo prazo'
      ],
      recommended: aiRecommendations?.tratamentosRecomendados?.includes('filtro-azul')
    },
    {
      id: 'protecao-uv',
      name: 'Proteção UV',
      icon: Sun,
      benefits: [
        'Bloqueia 100% dos raios UV',
        'Protege a retina',
        'Previne catarata precoce',
        'Essencial para atividades ao ar livre',
        'Proteção invisível'
      ],
      recommended: true
    },
    {
      id: 'fotossensiveis',
      name: 'Fotossensíveis',
      icon: Zap,
      benefits: [
        'Escurecimento automático',
        'Conveniência 2 em 1',
        'Proteção automática',
        'Conforto visual constante',
        'Adaptação rápida à luz'
      ],
      recommended: aiRecommendations?.tratamentosRecomendados?.includes('fotossensiveis')
    },
    {
      id: 'polarizado',
      name: 'Polarizado',
      icon: Glasses,
      benefits: [
        'Elimina reflexos de superfícies',
        'Ideal para direção',
        'Reduz ofuscamento intenso',
        'Cores mais vivas',
        'Melhor contraste'
      ],
      recommended: aiRecommendations?.tratamentosRecomendados?.includes('polarizado')
    }
  ];

  const environments: Array<{id: 'rua' | 'leitura' | 'computador' | 'direcao', name: string, icon: string}> = [
    { id: 'rua', name: 'Externo', icon: '🌅' },
    { id: 'leitura', name: 'Leitura', icon: '📚' },
    { id: 'computador', name: 'Digital', icon: '💻' },
    { id: 'direcao', name: 'Direção', icon: '🚗' }
  ];

  const scrollToTreatment = (treatmentId: string) => {
    const element = treatmentRefs.current[treatmentId];
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest'
      });
    }
  };

  const handleTreatmentToggle = (treatmentId: string) => {
    const wasSelected = selectedTreatments.includes(treatmentId);
    
    setSelectedTreatments(prev => 
      wasSelected
        ? prev.filter(id => id !== treatmentId)
        : [...prev, treatmentId]
    );
    
    // Se está sendo selecionado (não desselecionado), aplicar efeitos
    if (!wasSelected) {
      setRecentlySelected(treatmentId);
      
      // Scroll suave para o tratamento selecionado após um pequeno delay
      setTimeout(() => {
        scrollToTreatment(treatmentId);
      }, 150);
      
      // Remover o destaque após 2 segundos
      setTimeout(() => {
        setRecentlySelected(null);
      }, 2000);
    }
  };

  const handleContinue = () => {
    onSelect(selectedTreatments);
  };

  const TreatmentsList = () => (
    <TooltipProvider>
      <div className="space-y-3">
        {treatments.map((treatment) => {
          const Icon = treatment.icon;
          const isSelected = selectedTreatments.includes(treatment.id);
          const isRecommended = treatment.recommended;
          const isRecentlySelected = recentlySelected === treatment.id;

          return (
            <div 
              key={treatment.id}
              ref={el => treatmentRefs.current[treatment.id] = el}
              className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all duration-300 transform ${
                isSelected 
                  ? 'border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-200 ring-opacity-50 scale-[1.02]' 
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
              } ${isRecommended ? 'ring-1 ring-green-200' : ''} ${
                isRecentlySelected ? 'animate-pulse bg-blue-100 border-blue-600' : ''
              }`}
              onClick={() => {
                handleTreatmentToggle(treatment.id);
              }}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${
                  isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <span className="font-medium text-sm">{treatment.name}</span>
                  {isRecommended && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 ml-2 text-xs">
                      <Sparkles className="w-2 h-2 mr-1" />
                      IA
                    </Badge>
                  )}
                </div>
              </div>

              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </TooltipTrigger>
                <TooltipContent side={isMobile ? "top" : "right"} className="max-w-xs z-50">
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{treatment.name}</p>
                    <ul className="text-xs space-y-1">
                      {treatment.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-green-500 mr-1">•</span>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                </TooltipContent>
              </Tooltip>
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );

  if (isMobile) {
    return (
      <div className="flex flex-col h-screen bg-gray-900">
        {/* Simulação Visual em Tela Cheia */}
        <div className="flex-1 relative">
          <VisualLensDemo 
            selectedTreatments={selectedTreatments}
            currentEnvironment={currentEnvironment}
          />
          
          {/* Botão flutuante para abrir configurações */}
          <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
            <DrawerTrigger asChild>
              <Button 
                className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg z-50"
                size="lg"
              >
                <Settings className="mr-2 h-5 w-5" />
                Configurar Tratamentos
              </Button>
            </DrawerTrigger>
            
            <DrawerContent className="max-h-[80vh]">
              <DrawerHeader className="pb-4">
                <DrawerTitle className="text-center">
                  Tratamentos Ópticos
                </DrawerTitle>
                {selectedLens && (
                  <Badge variant="outline" className="mx-auto bg-blue-50 text-blue-700 border-blue-200">
                    {selectedLens}
                  </Badge>
                )}
              </DrawerHeader>

              <div className="px-4 pb-6 space-y-6 overflow-y-auto">
                {/* AI Recommendations */}
                {aiRecommendations && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center text-blue-900 mb-2">
                      <Sparkles className="mr-2 h-4 w-4" />
                      <span className="font-medium text-sm">IA Recomenda</span>
                    </div>
                    <p className="text-xs text-blue-800">{aiRecommendations.motivacao}</p>
                  </div>
                )}

                {/* Lista de Tratamentos */}
                <TreatmentsList />

                {/* Seletor de Ambiente */}
                <div>
                  <h3 className="font-medium text-sm mb-3">Ambiente de Teste</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {environments.map((env) => (
                      <Button
                        key={env.id}
                        variant={currentEnvironment === env.id ? 'default' : 'outline'}
                        onClick={() => setCurrentEnvironment(env.id)}
                        className="text-xs h-8"
                      >
                        <span className="mr-1">{env.icon}</span>
                        {env.name}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={onBack} size="sm">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar
                  </Button>

                  <Button 
                    onClick={() => {
                      handleContinue();
                      setDrawerOpen(false);
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                    size="sm"
                  >
                    Continuar
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </div>
    );
  }

  // Layout para desktop (mantém o original)
  return (
    <div className="flex h-screen bg-gray-900">
      {/* Painel lateral esquerdo - Tratamentos */}
      <div className="w-80 bg-white shadow-2xl z-10 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Tratamentos Ópticos
          </h2>
          <p className="text-sm text-gray-600">
            Selecione e veja os efeitos em tempo real
          </p>
          {selectedLens && (
            <Badge variant="outline" className="mt-2 bg-blue-50 text-blue-700 border-blue-200">
              {selectedLens}
            </Badge>
          )}
        </div>

        {/* AI Recommendations */}
        {aiRecommendations && (
          <div className="p-4 bg-blue-50 border-b">
            <div className="flex items-center text-blue-900 mb-2">
              <Sparkles className="mr-2 h-4 w-4" />
              <span className="font-medium text-sm">IA Recomenda</span>
            </div>
            <p className="text-xs text-blue-800">{aiRecommendations.motivacao}</p>
          </div>
        )}

        {/* Lista de Tratamentos */}
        <div className="flex-1 overflow-y-auto p-4">
          <TreatmentsList />
        </div>

        {/* Seletor de Ambiente */}
        <div className="p-4 border-t">
          <h3 className="font-medium text-sm mb-3">Ambiente de Teste</h3>
          <div className="grid grid-cols-2 gap-2">
            {environments.map((env) => (
              <Button
                key={env.id}
                variant={currentEnvironment === env.id ? 'default' : 'outline'}
                onClick={() => setCurrentEnvironment(env.id)}
                className="text-xs h-8"
              >
                <span className="mr-1">{env.icon}</span>
                {env.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="p-4 border-t flex justify-between">
          <Button variant="outline" onClick={onBack} size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>

          <Button 
            onClick={handleContinue}
            className="bg-blue-600 hover:bg-blue-700"
            size="sm"
          >
            Continuar
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Simulação Visual em Tela Cheia */}
      <div className="flex-1 relative">
        <VisualLensDemo 
          selectedTreatments={selectedTreatments}
          currentEnvironment={currentEnvironment}
        />
      </div>
    </div>
  );
};
