
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Car, Book, Monitor, Sun, Moon, ArrowRight, ArrowLeft, RotateCcw } from 'lucide-react';

interface Environment {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  conditions: {
    lighting: string;
    distance: string;
    challenges: string[];
  };
  visualEffects: {
    blur: boolean;
    glare: boolean;
    contrast: string;
    colorTemp: string;
  };
}

const environments: Environment[] = [
  {
    id: 'reading',
    name: 'Leitura',
    description: 'Ambiente interno com boa iluminação para leitura',
    icon: <Book className="w-6 h-6" />,
    conditions: {
      lighting: 'Luz ambiente suave',
      distance: '35-40cm',
      challenges: ['Texto pequeno', 'Fadiga visual', 'Foco prolongado']
    },
    visualEffects: {
      blur: false,
      glare: false,
      contrast: 'high',
      colorTemp: 'warm'
    }
  },
  {
    id: 'computer',
    name: 'Computador',
    description: 'Trabalho em tela digital por períodos prolongados',
    icon: <Monitor className="w-6 h-6" />,
    conditions: {
      lighting: 'Luz artificial + tela',
      distance: '60-70cm',
      challenges: ['Luz azul', 'Reflexos na tela', 'Piscar reduzido']
    },
    visualEffects: {
      blur: false,
      glare: true,
      contrast: 'medium',
      colorTemp: 'cool'
    }
  },
  {
    id: 'driving-day',
    name: 'Direção Diurna',
    description: 'Condução durante o dia com sol intenso',
    icon: <Sun className="w-6 h-6" />,
    conditions: {
      lighting: 'Sol intenso',
      distance: 'Longe (5m+)',
      challenges: ['Ofuscamento', 'Reflexos no para-brisa', 'Contraste']
    },
    visualEffects: {
      blur: false,
      glare: true,
      contrast: 'high',
      colorTemp: 'bright'
    }
  },
  {
    id: 'driving-night',
    name: 'Direção Noturna',
    description: 'Condução à noite com faróis e iluminação artificial',
    icon: <Moon className="w-6 h-6" />,
    conditions: {
      lighting: 'Baixa + faróis',
      distance: 'Longe (5m+)',
      challenges: ['Halos ao redor das luzes', 'Reflexos', 'Baixo contraste']
    },
    visualEffects: {
      blur: true,
      glare: true,
      contrast: 'low',
      colorTemp: 'cool'
    }
  }
];

interface EnvironmentSimulatorProps {
  selectedLens: string | null;
  selectedTreatments: string[];
  onContinue: () => void;
  onBack: () => void;
}

export const EnvironmentSimulator: React.FC<EnvironmentSimulatorProps> = ({
  selectedLens,
  selectedTreatments,
  onContinue,
  onBack
}) => {
  const [activeEnvironment, setActiveEnvironment] = useState<string>('reading');
  const [simulationIntensity, setSimulationIntensity] = useState([75]);

  const currentEnvironment = environments.find(env => env.id === activeEnvironment);

  // Simular como a combinação de lente + tratamentos afeta cada ambiente
  const getVisualImpact = () => {
    const impacts: Record<string, string[]> = {
      reading: [],
      computer: [],
      'driving-day': [],
      'driving-night': []
    };

    // Lógica simulada baseada na lente selecionada
    if (selectedLens === 'progressiva') {
      impacts.reading.push('Campo visual otimizado para leitura');
      impacts.computer.push('Zona intermediária ideal para tela');
    }

    // Lógica simulada baseada nos tratamentos
    if (selectedTreatments.includes('antireflexo')) {
      impacts['driving-night'].push('Reflexos de faróis reduzidos em 90%');
      impacts.computer.push('Reflexos da tela eliminados');
    }

    if (selectedTreatments.includes('luz-azul')) {
      impacts.computer.push('Luz azul filtrada - menor fadiga');
    }

    if (selectedTreatments.includes('fotossensivel')) {
      impacts['driving-day'].push('Escurecimento automático ao sol');
    }

    return impacts[activeEnvironment] || [];
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Simulação de Ambientes
        </h2>
        <p className="text-lg text-gray-600">
          Veja como sua configuração de lentes se comporta em diferentes situações do dia a dia
        </p>
      </div>

      {/* Seletor de Ambientes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {environments.map((env) => (
          <Card
            key={env.id}
            className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
              activeEnvironment === env.id
                ? 'border-2 border-blue-500 shadow-lg bg-blue-50'
                : 'border hover:border-blue-200'
            }`}
            onClick={() => setActiveEnvironment(env.id)}
          >
            <CardContent className="p-4 text-center">
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3">
                {env.icon}
              </div>
              <h3 className="font-semibold text-sm">{env.name}</h3>
              <p className="text-xs text-gray-600 mt-1">{env.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {currentEnvironment && (
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Informações do Ambiente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  {currentEnvironment.icon}
                </div>
                <span>{currentEnvironment.name}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Condições do Ambiente:</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Iluminação:</span>
                      <span className="font-medium">{currentEnvironment.conditions.lighting}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Distância focal:</span>
                      <span className="font-medium">{currentEnvironment.conditions.distance}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Desafios Visuais:</h4>
                  <div className="flex flex-wrap gap-2">
                    {currentEnvironment.conditions.challenges.map((challenge, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {challenge}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Melhorias com sua configuração:</h4>
                  <div className="space-y-2">
                    {getVisualImpact().map((impact, index) => (
                      <div key={index} className="flex items-center text-sm text-green-700">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                        {impact}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Simulação Visual */}
          <Card>
            <CardHeader>
              <CardTitle>Simulação Visual</CardTitle>
              <p className="text-gray-600">Ajuste a intensidade da simulação para ver os efeitos</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Intensidade da Simulação</span>
                    <span className="text-sm text-blue-600">{simulationIntensity[0]}%</span>
                  </div>
                  <Slider
                    value={simulationIntensity}
                    onValueChange={setSimulationIntensity}
                    max={100}
                    min={0}
                    step={10}
                    className="w-full"
                  />
                </div>

                {/* Área de Simulação Visual */}
                <div className="relative h-48 bg-gray-100 rounded-lg overflow-hidden">
                  <EnvironmentVisualization
                    environment={activeEnvironment}
                    lens={selectedLens}
                    treatments={selectedTreatments}
                    intensity={simulationIntensity[0]}
                  />
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Sem correção</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSimulationIntensity([75])}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Resetar
                  </Button>
                  <span>Com sua configuração</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Resumo da Configuração */}
      <Card className="mb-8 bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <h3 className="font-semibold text-blue-900 mb-4">Sua Configuração Atual:</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Tipo de Lente:</h4>
              <Badge className="bg-blue-600 text-white">{selectedLens}</Badge>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Tratamentos:</h4>
              <div className="flex flex-wrap gap-2">
                {selectedTreatments.map(treatment => (
                  <Badge key={treatment} variant="outline" className="border-blue-300 text-blue-700">
                    {treatment}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botões de navegação */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="px-6">
          <ArrowLeft className="mr-2 w-4 h-4" />
          Voltar
        </Button>
        
        <Button
          onClick={onContinue}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6"
        >
          Ver Comparação
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

// Componente para visualização dos ambientes
const EnvironmentVisualization: React.FC<{
  environment: string;
  lens: string | null;
  treatments: string[];
  intensity: number;
}> = ({ environment, lens, treatments, intensity }) => {
  const getVisualizationStyle = () => {
    const baseStyle = "w-full h-full flex items-center justify-center text-white font-medium";
    
    switch (environment) {
      case 'reading':
        return `${baseStyle} bg-gradient-to-br from-amber-200 to-orange-300`;
      case 'computer':
        return `${baseStyle} bg-gradient-to-br from-blue-400 to-purple-500`;
      case 'driving-day':
        return `${baseStyle} bg-gradient-to-br from-yellow-300 to-orange-400`;
      case 'driving-night':
        return `${baseStyle} bg-gradient-to-br from-gray-800 to-blue-900`;
      default:
        return `${baseStyle} bg-gradient-to-br from-gray-400 to-gray-600`;
    }
  };

  const getEffectDescription = () => {
    const effects = [];
    
    if (treatments.includes('antireflexo') && (environment === 'driving-night' || environment === 'computer')) {
      effects.push('Reflexos reduzidos');
    }
    
    if (treatments.includes('luz-azul') && environment === 'computer') {
      effects.push('Luz azul filtrada');
    }
    
    if (treatments.includes('fotossensivel') && environment === 'driving-day') {
      effects.push('Escurecimento automático');
    }

    return effects.length > 0 ? effects.join(' + ') : 'Visão otimizada';
  };

  return (
    <div className={getVisualizationStyle()}>
      <div className="text-center">
        <div className="text-lg mb-2">
          {environment === 'reading' && '📖'}
          {environment === 'computer' && '💻'}
          {environment === 'driving-day' && '☀️'}
          {environment === 'driving-night' && '🌙'}
        </div>
        <div className="text-sm opacity-90">
          {getEffectDescription()}
        </div>
        <div className="text-xs opacity-75 mt-2">
          Simulação: {intensity}%
        </div>
      </div>
    </div>
  );
};
