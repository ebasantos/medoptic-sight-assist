
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, Eye, Sun, Book, Monitor, Car } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface EnvironmentSimulatorProps {
  selectedLens: string | null;
  selectedTreatments: string[];
  onContinue: () => void;
  onBack: () => void;
}

export const EnvironmentSimulator = ({
  selectedLens,
  selectedTreatments,
  onContinue,
  onBack
}: EnvironmentSimulatorProps) => {
  const [currentEnvironment, setCurrentEnvironment] = useState<'outdoor' | 'reading' | 'digital' | 'driving'>('outdoor');
  const isMobile = useIsMobile();

  const environments = [
    {
      id: 'outdoor' as const,
      name: 'Ambiente Externo',
      icon: Sun,
      description: 'Sol forte, reflexos intensos',
      color: 'from-yellow-400 to-orange-500'
    },
    {
      id: 'reading' as const,
      name: 'Leitura',
      icon: Book,
      description: 'Luz ambiente, foco próximo',
      color: 'from-blue-400 to-blue-600'
    },
    {
      id: 'digital' as const,
      name: 'Telas Digitais',
      icon: Monitor,
      description: 'Luz azul, uso prolongado',
      color: 'from-purple-400 to-purple-600'
    },
    {
      id: 'driving' as const,
      name: 'Direção',
      icon: Car,
      description: 'Reflexos do para-brisa, faróis',
      color: 'from-gray-400 to-gray-600'
    }
  ];

  const getEnvironmentEffects = () => {
    const effects = [];
    
    // Efeitos baseados no ambiente
    switch (currentEnvironment) {
      case 'outdoor':
        effects.push('Proteção UV ativa');
        if (selectedTreatments.includes('polarizado')) {
          effects.push('Reflexos eliminados');
        }
        break;
      case 'digital':
        if (selectedTreatments.includes('filtro-azul')) {
          effects.push('Luz azul filtrada');
        }
        break;
      case 'driving':
        if (selectedTreatments.includes('antirreflexo')) {
          effects.push('Reflexos reduzidos');
        }
        break;
    }
    
    // Efeitos gerais dos tratamentos
    if (selectedTreatments.includes('antirreflexo')) {
      effects.push('Visão mais nítida');
    }
    
    return effects;
  };

  const currentEnv = environments.find(env => env.id === currentEnvironment);

  if (isMobile) {
    return (
      <div className="flex flex-col h-screen bg-gray-900">
        {/* Simulação em tela cheia */}
        <div className="flex-1 relative overflow-hidden">
          {/* Imagem de fundo baseada no ambiente */}
          <div className={`absolute inset-0 bg-gradient-to-br ${currentEnv?.color} opacity-20`} />
          
          {/* Círculo da lente com efeitos */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div className="w-64 h-64 rounded-full border-4 border-white shadow-2xl overflow-hidden">
                <div className={`w-full h-full bg-gradient-to-br ${currentEnv?.color} opacity-30`}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white">
                      <Eye className="w-12 h-12 mx-auto mb-2" />
                      <p className="text-sm font-medium">Visão Otimizada</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Indicador de tratamentos ativos */}
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-green-600 text-white">
                  {selectedTreatments.length} tratamentos ativos
                </Badge>
              </div>
            </div>
          </div>

          {/* Info do ambiente atual */}
          <div className="absolute top-4 left-4 right-4">
            <Card className="bg-black/50 backdrop-blur-sm border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3 text-white">
                  {currentEnv && <currentEnv.icon className="w-6 h-6" />}
                  <div>
                    <h3 className="font-semibold">{currentEnv?.name}</h3>
                    <p className="text-sm opacity-80">{currentEnv?.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Efeitos ativos */}
          <div className="absolute bottom-20 left-4 right-4">
            <Card className="bg-black/50 backdrop-blur-sm border-white/20">
              <CardContent className="p-4">
                <h4 className="text-white font-medium mb-2">Efeitos Ativos:</h4>
                <div className="space-y-1">
                  {getEnvironmentEffects().map((effect, index) => (
                    <div key={index} className="flex items-center text-green-400 text-sm">
                      <span className="w-2 h-2 bg-green-400 rounded-full mr-2" />
                      {effect}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Seletor de ambiente na parte inferior */}
        <div className="bg-white p-4 space-y-4">
          <h3 className="font-semibold text-center">Teste em Diferentes Ambientes</h3>
          <div className="grid grid-cols-2 gap-2">
            {environments.map((env) => {
              const Icon = env.icon;
              return (
                <Button
                  key={env.id}
                  variant={currentEnvironment === env.id ? 'default' : 'outline'}
                  onClick={() => setCurrentEnvironment(env.id)}
                  className="flex-col h-auto p-3"
                >
                  <Icon className="w-5 h-5 mb-1" />
                  <span className="text-xs">{env.name}</span>
                </Button>
              );
            })}
          </div>

          {/* Botões de navegação */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <Button onClick={onContinue} className="bg-blue-600 hover:bg-blue-700">
              Continuar
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Layout desktop (mantém o existente)
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

      {/* Seletor de ambiente */}
      <div className="mb-8">
        <div className="grid md:grid-cols-4 gap-4">
          {environments.map((env) => {
            const Icon = env.icon;
            return (
              <Card
                key={env.id}
                className={`cursor-pointer transition-all ${
                  currentEnvironment === env.id
                    ? 'ring-2 ring-blue-500 bg-blue-50'
                    : 'hover:shadow-md'
                }`}
                onClick={() => setCurrentEnvironment(env.id)}
              >
                <CardContent className="p-4 text-center">
                  <Icon className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <h3 className="font-medium">{env.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{env.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Simulação visual */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Eye className="mr-2 h-6 w-6" />
            Simulação: {currentEnv?.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative h-96 rounded-lg overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-br ${currentEnv?.color} opacity-30`} />
            
            {/* Círculo da lente */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 rounded-full border-4 border-white shadow-2xl bg-white/10 backdrop-blur-sm">
                <div className="w-full h-full rounded-full overflow-hidden">
                  <div className={`w-full h-full bg-gradient-to-br ${currentEnv?.color} opacity-50 flex items-center justify-center`}>
                    <div className="text-center text-white">
                      <Eye className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm font-medium">Visão Otimizada</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Efeitos */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-black/50 backdrop-blur-sm rounded-lg p-4 text-white">
                <h4 className="font-medium mb-2">Efeitos Ativos:</h4>
                <div className="grid md:grid-cols-2 gap-2">
                  {getEnvironmentEffects().map((effect, index) => (
                    <div key={index} className="flex items-center text-green-400 text-sm">
                      <span className="w-2 h-2 bg-green-400 rounded-full mr-2" />
                      {effect}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botões de navegação */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} size="lg">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <Button onClick={onContinue} size="lg" className="bg-blue-600 hover:bg-blue-700">
          Continuar
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
