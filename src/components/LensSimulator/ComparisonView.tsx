import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowRight, ArrowLeft, Eye, Check, X, Star } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface ComparisonViewProps {
  configuration: any;
  onContinue: () => void;
  onBack: () => void;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({
  configuration,
  onContinue,
  onBack
}) => {
  const isMobile = useIsMobile();
  const [comparisonMode, setComparisonMode] = useState<'side-by-side' | 'before-after'>('side-by-side');

  // Configurações para comparação
  const currentConfig = {
    lens: configuration.selectedLens,
    treatments: configuration.selectedTreatments,
    score: 92,
    pros: [
      'Visão nítida em todas as distâncias',
      'Redução significativa de reflexos',
      'Proteção completa contra UV',
      'Menor fadiga visual'
    ],
    cons: [
      'Período de adaptação necessário',
      'Investimento inicial mais alto'
    ],
    price: 850
  };

  const alternativeConfig = {
    lens: 'monofocal',
    treatments: ['antireflexo'],
    score: 76,
    pros: [
      'Adaptação imediata',
      'Custo mais baixo',
      'Visão nítida para distância principal'
    ],
    cons: [
      'Limitação em múltiplas distâncias',
      'Proteção UV limitada',
      'Mais reflexos em ambientes específicos'
    ],
    price: 350
  };

  if (isMobile) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        {/* Header mobile */}
        <div className="bg-white border-b px-4 py-4">
          <div className="text-center">
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              Comparação de Opções
            </h1>
            <p className="text-sm text-gray-600">
              Compare para tomar a melhor decisão
            </p>
          </div>
        </div>

        {/* Seletor de modo mobile */}
        <div className="px-4 py-4 bg-gray-50 border-b">
          <Tabs value={comparisonMode} onValueChange={(value) => setComparisonMode(value as any)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="side-by-side" className="text-xs">Lado a Lado</TabsTrigger>
              <TabsTrigger value="before-after" className="text-xs">Antes/Depois</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Content mobile */}
        <div className="flex-1 px-4 py-6 overflow-y-auto space-y-6">
          {comparisonMode === 'side-by-side' ? (
            <div className="space-y-4">
              {/* Sua Escolha */}
              <Card className="border-2 border-blue-500 bg-blue-50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-blue-900">Sua Escolha</CardTitle>
                    <Badge className="bg-blue-600 text-white text-xs">Recomendado</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Configuração:</h4>
                    <Badge className="bg-blue-600 text-white mb-2">{currentConfig.lens}</Badge>
                    <div className="flex flex-wrap gap-1">
                      {currentConfig.treatments.map((treatment: string, index: number) => (
                        <Badge key={index} variant="outline" className="border-blue-300 text-blue-700 text-xs">
                          {treatment}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Vantagens:</h4>
                    <ul className="space-y-1">
                      {currentConfig.pros.slice(0, 3).map((pro: string, index: number) => (
                        <li key={index} className="flex items-start text-sm text-gray-700">
                          <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-3 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-blue-900">
                        R$ {currentConfig.price}
                      </span>
                      <Badge className="bg-green-600 text-white text-xs">
                        Score: {currentConfig.score}/100
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Alternativa */}
              <Card className="border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-gray-700">Alternativa Econômica</CardTitle>
                    <Badge variant="outline" className="text-xs">Básica</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Configuração:</h4>
                    <Badge variant="outline" className="mb-2">{alternativeConfig.lens}</Badge>
                    <div className="flex flex-wrap gap-1">
                      {alternativeConfig.treatments.map((treatment: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {treatment}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Vantagens:</h4>
                    <ul className="space-y-1">
                      {alternativeConfig.pros.slice(0, 3).map((pro: string, index: number) => (
                        <li key={index} className="flex items-start text-sm text-gray-700">
                          <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-3 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-700">
                        R$ {alternativeConfig.price}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        Score: {alternativeConfig.score}/100
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <BeforeAfterMobile 
              currentConfig={currentConfig} 
              alternativeConfig={alternativeConfig} 
            />
          )}

          {/* Simulação Visual Mobile */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Eye className="w-5 h-5 text-blue-600 mr-2" />
                Simulação Visual
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <h3 className="font-semibold mb-3 text-blue-900">Leitura - Sua Configuração</h3>
                <div className="relative h-32 rounded-lg overflow-hidden mb-3">
                  <img 
                    src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80" 
                    alt="Livro aberto para leitura"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-green-600/20 to-transparent flex items-center justify-center">
                    <div className="bg-white/90 px-3 py-1 rounded-full">
                      <span className="text-xs font-medium text-green-800">Visão Nítida</span>
                    </div>
                  </div>
                </div>
                <Badge className="bg-green-600 text-white text-xs">Score: {currentConfig.score}/100</Badge>
              </div>

              <div className="text-center">
                <h3 className="font-semibold mb-3 text-gray-700">Direção - Sua Configuração</h3>
                <div className="relative h-32 rounded-lg overflow-hidden mb-3">
                  <img 
                    src="https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80" 
                    alt="Visão em primeira pessoa ao dirigir"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-600/20 to-transparent flex items-center justify-center">
                    <div className="bg-white/90 px-3 py-1 rounded-full">
                      <span className="text-xs font-medium text-blue-800">Proteção UV</span>
                    </div>
                  </div>
                </div>
                <Badge className="bg-blue-600 text-white text-xs">Visão Protegida</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Recomendação IA Mobile */}
          <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-2">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Star className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg text-blue-900">Recomendação IA</CardTitle>
                  <p className="text-sm text-blue-700">Baseada no seu perfil</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-white p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">
                  Recomendamos sua configuração
                </h3>
                <p className="text-sm text-gray-700 mb-3">
                  Baseada na sua análise, oferece a melhor relação custo-benefício.
                </p>
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Principais vantagens:</h4>
                  <ul className="space-y-1">
                    {currentConfig.pros.slice(0, 3).map((pro, index) => (
                      <li key={index} className="flex items-center text-xs text-gray-700">
                        <Check className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
                        {pro}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer mobile */}
        <div className="bg-white border-t px-4 py-4">
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={onBack}
              className="flex-1"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <Button
              onClick={onContinue}
              className="flex-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Finalizar
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Comparação de Configurações
        </h2>
        <p className="text-lg text-gray-600">
          Compare sua escolha com uma alternativa para tomar a melhor decisão
        </p>
      </div>

      {/* Seletor de modo de comparação */}
      <div className="flex justify-center mb-8">
        <Tabs value={comparisonMode} onValueChange={(value) => setComparisonMode(value as any)}>
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="side-by-side">Lado a Lado</TabsTrigger>
            <TabsTrigger value="before-after">Antes e Depois</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {comparisonMode === 'side-by-side' ? (
        <SideBySideComparison 
          currentConfig={currentConfig} 
          alternativeConfig={alternativeConfig} 
        />
      ) : (
        <BeforeAfterComparison 
          currentConfig={currentConfig} 
          alternativeConfig={alternativeConfig} 
        />
      )}

      {/* Simulação Visual Comparativa com imagens atualizadas */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            <Eye className="w-6 h-6 text-blue-600" />
            <span>Simulação Visual Comparativa</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="text-center">
              <h3 className="font-semibold mb-4 text-blue-900">Leitura - Sua Configuração</h3>
              <div className="relative h-48 rounded-lg overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80" 
                  alt="Livro aberto para leitura"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-green-600/30 to-transparent flex items-center justify-center">
                  <div className="bg-white/90 px-4 py-2 rounded-lg">
                    <div className="text-green-800 font-medium">Visão Nítida para Leitura</div>
                    <div className="text-sm text-green-700">Múltiplas distâncias otimizadas</div>
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Badge className="bg-green-600 text-white">Score: {currentConfig.score}/100</Badge>
                <p className="text-sm text-gray-600">
                  {currentConfig.lens} + {currentConfig.treatments.length} tratamentos
                </p>
              </div>
            </div>

            <div className="text-center">
              <h3 className="font-semibold mb-4 text-blue-900">Direção - Sua Configuração</h3>
              <div className="relative h-48 rounded-lg overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80" 
                  alt="Visão em primeira pessoa ao dirigir"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-600/30 to-transparent flex items-center justify-center">
                  <div className="bg-white/90 px-4 py-2 rounded-lg">
                    <div className="text-blue-800 font-medium">Visão Protegida na Direção</div>
                    <div className="text-sm text-blue-700">Proteção UV e antirreflexo</div>
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Badge className="bg-blue-600 text-white">Proteção Completa</Badge>
                <p className="text-sm text-gray-600">
                  Ideal para dirigir com segurança
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recomendação Final da IA */}
      <Card className="mb-8 border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Star className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-blue-900">Recomendação Final da IA</CardTitle>
              <p className="text-blue-700">Análise baseada no seu perfil completo</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-white p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-blue-900 mb-4">
              Recomendamos sua configuração escolhida
            </h3>
            <p className="text-gray-700 mb-4">
              Com base na sua idade, prescrição, estilo de vida e necessidades visuais, 
              a configuração que você escolheu oferece a melhor relação custo-benefício 
              e qualidade de vida visual.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Principais vantagens:</h4>
                <ul className="space-y-1">
                  {currentConfig.pros.slice(0, 3).map((pro, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-700">
                      <Check className="w-4 h-4 text-green-500 mr-2" />
                      {pro}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Retorno do investimento:</h4>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• Redução de 80% da fadiga visual</li>
                  <li>• Melhora na produtividade diária</li>
                  <li>• Prevenção de problemas futuros</li>
                </ul>
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
          Gerar Relatório Final
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

// Componente para Before/After mobile
const BeforeAfterMobile: React.FC<{
  currentConfig: any;
  alternativeConfig: any;
}> = ({ currentConfig, alternativeConfig }) => {
  const [showAfter, setShowAfter] = useState(false);

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="inline-flex rounded-lg border p-1 bg-white">
          <Button
            variant={!showAfter ? "default" : "ghost"}
            size="sm"
            onClick={() => setShowAfter(false)}
            className="rounded-md px-3 text-xs"
          >
            Antes
          </Button>
          <Button
            variant={showAfter ? "default" : "ghost"}
            size="sm"
            onClick={() => setShowAfter(true)}
            className="rounded-md px-3 text-xs"
          >
            Depois
          </Button>
        </div>
      </div>

      <Card className={`transition-all duration-500 ${showAfter ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
        <CardHeader className="pb-3">
          <CardTitle className={`text-lg ${showAfter ? 'text-blue-900' : 'text-gray-700'}`}>
            {showAfter ? 'Com Sua Configuração' : 'Com Configuração Básica'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showAfter ? (
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-blue-900 mb-2">Benefícios Conquistados:</h4>
                <ul className="space-y-1">
                  {currentConfig.pros.slice(0, 3).map((pro: string, index: number) => (
                    <li key={index} className="flex items-start text-sm">
                      <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-gradient-to-br from-green-100 to-green-200 p-4 rounded-lg text-center">
                <div className="text-xl mb-1">✨</div>
                <div className="font-semibold text-green-800 text-sm">Visão Otimizada</div>
                <div className="text-xs text-green-700 mt-1">Score: {currentConfig.score}/100</div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Limitações:</h4>
                <ul className="space-y-1">
                  {alternativeConfig.cons.slice(0, 3).map((con: string, index: number) => (
                    <li key={index} className="flex items-start text-sm">
                      <X className="w-4 h-4 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600">{con}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-4 rounded-lg text-center">
                <div className="text-xl mb-1">⚪</div>
                <div className="font-semibold text-gray-700 text-sm">Configuração Básica</div>
                <div className="text-xs text-gray-600 mt-1">Score: {alternativeConfig.score}/100</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Componente para SideBySideComparison
const SideBySideComparison: React.FC<{
  currentConfig: any;
  alternativeConfig: any;
}> = ({ currentConfig, alternativeConfig }) => {
  return (
    <div className="grid md:grid-cols-2 gap-6 mb-8">
      {/* Configuração Atual */}
      <Card className="border-2 border-blue-500 bg-blue-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-blue-900">Sua Escolha</CardTitle>
            <Badge className="bg-blue-600 text-white">Recomendado</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Configuração:</h4>
            <div className="space-y-1">
              <Badge className="bg-blue-600 text-white">{currentConfig.lens}</Badge>
              <div className="flex flex-wrap gap-1 mt-2">
                {currentConfig.treatments.map((treatment: string, index: number) => (
                  <Badge key={index} variant="outline" className="border-blue-300 text-blue-700 text-xs">
                    {treatment}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Vantagens:</h4>
            <ul className="space-y-1">
              {currentConfig.pros.map((pro: string, index: number) => (
                <li key={index} className="flex items-start text-sm text-gray-700">
                  <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5" />
                  {pro}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Considerações:</h4>
            <ul className="space-y-1">
              {currentConfig.cons.map((con: string, index: number) => (
                <li key={index} className="flex items-start text-sm text-gray-600">
                  <X className="w-4 h-4 text-orange-500 mr-2 mt-0.5" />
                  {con}
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-blue-900">
                R$ {currentConfig.price}
              </span>
              <Badge className="bg-green-600 text-white">
                Score: {currentConfig.score}/100
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuração Alternativa */}
      <Card className="border hover:border-gray-300">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-gray-700">Alternativa Econômica</CardTitle>
            <Badge variant="outline">Básica</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Configuração:</h4>
            <div className="space-y-1">
              <Badge variant="outline">{alternativeConfig.lens}</Badge>
              <div className="flex flex-wrap gap-1 mt-2">
                {alternativeConfig.treatments.map((treatment: string, index: number) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {treatment}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Vantagens:</h4>
            <ul className="space-y-1">
              {alternativeConfig.pros.map((pro: string, index: number) => (
                <li key={index} className="flex items-start text-sm text-gray-700">
                  <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5" />
                  {pro}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-2">Limitações:</h4>
            <ul className="space-y-1">
              {alternativeConfig.cons.map((con: string, index: number) => (
                <li key={index} className="flex items-start text-sm text-gray-600">
                  <X className="w-4 h-4 text-orange-500 mr-2 mt-0.5" />
                  {con}
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-700">
                R$ {alternativeConfig.price}
              </span>
              <Badge variant="outline">
                Score: {alternativeConfig.score}/100
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const BeforeAfterComparison: React.FC<{
  currentConfig: any;
  alternativeConfig: any;
}> = ({ currentConfig, alternativeConfig }) => {
  const [showAfter, setShowAfter] = useState(false);

  return (
    <div className="mb-8">
      <div className="text-center mb-6">
        <div className="inline-flex rounded-lg border p-1 bg-white">
          <Button
            variant={!showAfter ? "default" : "ghost"}
            size="sm"
            onClick={() => setShowAfter(false)}
            className="rounded-md px-4"
          >
            Antes (Alternativa)
          </Button>
          <Button
            variant={showAfter ? "default" : "ghost"}
            size="sm"
            onClick={() => setShowAfter(true)}
            className="rounded-md px-4"
          >
            Depois (Sua Escolha)
          </Button>
        </div>
      </div>

      <Card className={`transition-all duration-500 ${showAfter ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
        <CardHeader>
          <CardTitle className={showAfter ? 'text-blue-900' : 'text-gray-700'}>
            {showAfter ? 'Com Sua Configuração' : 'Com Configuração Básica'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showAfter ? (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-blue-900 mb-3">Benefícios Conquistados:</h4>
                  <ul className="space-y-2">
                    {currentConfig.pros.map((pro: string, index: number) => (
                      <li key={index} className="flex items-start text-sm">
                        <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5" />
                        <span className="text-gray-700">{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-gradient-to-br from-green-100 to-green-200 p-6 rounded-lg text-center">
                  <div className="text-2xl mb-2">✨</div>
                  <div className="font-semibold text-green-800">Visão Otimizada</div>
                  <div className="text-sm text-green-700 mt-2">Score: {currentConfig.score}/100</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Limitações:</h4>
                  <ul className="space-y-2">
                    {alternativeConfig.cons.map((con: string, index: number) => (
                      <li key={index} className="flex items-start text-sm">
                        <X className="w-4 h-4 text-orange-500 mr-2 mt-0.5" />
                        <span className="text-gray-600">{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-6 rounded-lg text-center">
                  <div className="text-2xl mb-2">⚪</div>
                  <div className="font-semibold text-gray-700">Configuração Básica</div>
                  <div className="text-sm text-gray-600 mt-2">Score: {alternativeConfig.score}/100</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
