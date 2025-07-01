
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, Eye, Sun, Book, Monitor, Car } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';

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
      color: 'from-yellow-400 to-orange-500',
      image: 'https://images.unsplash.com/photo-1500673922987-e212871fec22?w=800&h=600&fit=crop'
    },
    {
      id: 'reading' as const,
      name: 'Leitura',
      icon: Book,
      description: 'Livros, luz ambiente, foco próximo',
      color: 'from-blue-400 to-blue-600',
      image: 'https://img.freepik.com/fotos-gratis/colher-as-maos-segurando-o-livro-aberto_23-2147767299.jpg'
    },
    {
      id: 'digital' as const,
      name: 'Telas Digitais',
      icon: Monitor,
      description: 'Luz azul, uso prolongado',
      color: 'from-purple-400 to-purple-600',
      image: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=600&fit=crop'
    },
    {
      id: 'driving' as const,
      name: 'Direção',
      icon: Car,
      description: 'Visão do motorista, reflexos do para-brisa',
      color: 'from-gray-400 to-gray-600',
      image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=600&fit=crop'
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
      <div className="flex flex-col h-screen bg-white">
        {/* Header fixo */}
        <div className="bg-white border-b px-4 py-4 flex-shrink-0">
          <h2 className="text-xl font-bold text-center mb-2">Simulação de Ambientes</h2>
          <p className="text-sm text-gray-600 text-center">
            Teste sua configuração em diferentes situações
          </p>
        </div>

        {/* Conteúdo com scroll */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6 pb-32">
            {/* Seletor de ambiente */}
            <div>
              <h3 className="font-medium mb-3">Selecione o Ambiente</h3>
              <div className="grid grid-cols-2 gap-3">
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
                      <CardContent className="p-3">
                        <div className="relative h-20 mb-2 rounded-lg overflow-hidden">
                          <img 
                            src={env.image} 
                            alt={env.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                        </div>
                        <h4 className="font-medium text-sm text-center">{env.name}</h4>
                        <p className="text-xs text-gray-500 mt-1 text-center">{env.description}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Simulação visual */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <Eye className="mr-2 h-5 w-5" />
                  Simulação: {currentEnv?.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative h-64 rounded-lg overflow-hidden mb-4">
                  <img 
                    src={currentEnv?.image} 
                    alt={currentEnv?.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-br ${currentEnv?.color} opacity-20`} />
                  
                  {/* Círculo da lente */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-32 rounded-full border-4 border-white shadow-2xl overflow-hidden">
                      <div className="w-full h-full relative">
                        <img 
                          src={currentEnv?.image} 
                          alt="Visão através da lente"
                          className="w-full h-full object-cover brightness-110 contrast-110"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-10">
                          <div className="text-center text-white">
                            <Eye className="w-6 h-6 mx-auto mb-1 drop-shadow-lg" />
                            <p className="text-xs font-medium drop-shadow-lg">Otimizada</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Efeitos ativos */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <h4 className="font-medium mb-2 text-sm">Efeitos Ativos:</h4>
                  {getEnvironmentEffects().length > 0 ? (
                    <div className="space-y-1">
                      {getEnvironmentEffects().map((effect, index) => (
                        <div key={index} className="flex items-center text-green-600 text-sm">
                          <span className="w-2 h-2 bg-green-600 rounded-full mr-2" />
                          {effect}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Selecione tratamentos para ver os efeitos</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Resumo da configuração */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <h4 className="font-medium mb-2 text-blue-900">Sua Configuração</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-blue-700">Lente:</span>
                    <span className="ml-2 font-medium text-blue-900">{selectedLens || 'Não selecionada'}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Tratamentos:</span>
                    <div className="mt-1">
                      {selectedTreatments.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {selectedTreatments.map((treatment, index) => (
                            <Badge key={index} variant="outline" className="text-xs border-blue-300 text-blue-700">
                              {treatment}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-blue-600">Nenhum selecionado</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        {/* Footer fixo */}
        <div className="bg-white border-t px-4 py-4 flex-shrink-0">
          <div className="flex justify-between gap-3">
            <Button variant="outline" onClick={onBack} className="flex-1">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <Button onClick={onContinue} className="flex-1 bg-blue-600 hover:bg-blue-700">
              Continuar
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Layout desktop (mantém o original com imagens atualizadas)
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

      {/* Seletor de ambiente com imagens */}
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
                <CardContent className="p-4">
                  <div className="relative h-32 mb-4 rounded-lg overflow-hidden">
                    <img 
                      src={env.image} 
                      alt={env.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <h3 className="font-medium text-center">{env.name}</h3>
                  <p className="text-sm text-gray-500 mt-1 text-center">{env.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Simulação visual com imagem real */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Eye className="mr-2 h-6 w-6" />
            Simulação: {currentEnv?.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative h-96 rounded-lg overflow-hidden">
            <img 
              src={currentEnv?.image} 
              alt={currentEnv?.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className={`absolute inset-0 bg-gradient-to-br ${currentEnv?.color} opacity-20`} />
            
            {/* Círculo da lente */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 rounded-full border-4 border-white shadow-2xl overflow-hidden">
                <div className="w-full h-full relative">
                  <img 
                    src={currentEnv?.image} 
                    alt="Visão através da lente"
                    className="w-full h-full object-cover brightness-110 contrast-110"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-10">
                    <div className="text-center text-white">
                      <Eye className="w-8 h-8 mx-auto mb-2 drop-shadow-lg" />
                      <p className="text-sm font-medium drop-shadow-lg">Visão Otimizada</p>
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
