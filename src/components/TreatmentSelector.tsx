
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { 
  Shield, 
  Sun, 
  Monitor, 
  Zap, 
  Glasses, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles,
  Check,
  Eye
} from 'lucide-react';
import { VisualLensDemo } from './LensSimulator/VisualLensDemo';

interface TreatmentSelectorProps {
  selectedLens: string | null;
  aiRecommendations: any;
  onSelect: (treatments: string[]) => void;
  onBack: () => void;
}

export const TreatmentSelector = ({ selectedLens, aiRecommendations, onSelect, onBack }: TreatmentSelectorProps) => {
  const [selectedTreatments, setSelectedTreatments] = useState<string[]>([]);
  const [currentEnvironment, setCurrentEnvironment] = useState<'rua' | 'leitura' | 'computador' | 'direcao'>('rua');

  const treatments = [
    {
      id: 'antirreflexo',
      name: 'Antirreflexo',
      icon: Shield,
      description: 'Elimina reflexos indesejados e melhora a nitidez visual',
      benefits: ['Reduz cansaço visual', 'Melhora aparência estética', 'Maior durabilidade da lente'],
      effect: 'Reduz reflexos e halos, especialmente útil para direção noturna',
      recommended: aiRecommendations?.tratamentosRecomendados?.includes('antirreflexo')
    },
    {
      id: 'filtro-azul',
      name: 'Filtro Luz Azul',
      icon: Monitor,
      description: 'Protege contra a luz azul prejudicial de telas digitais',
      benefits: ['Reduz fadiga ocular digital', 'Melhora qualidade do sono', 'Proteção a longo prazo'],
      effect: 'Filtra luz azul-violeta, deixando cores mais quentes e confortáveis',
      recommended: aiRecommendations?.tratamentosRecomendados?.includes('filtro-azul')
    },
    {
      id: 'protecao-uv',
      name: 'Proteção UV',
      icon: Sun,
      description: 'Bloqueia 100% dos raios UV prejudiciais (UVA e UVB)',
      benefits: ['Protege a retina', 'Previne catarata precoce', 'Essencial para atividades ao ar livre'],
      effect: 'Proteção invisível contra radiação ultravioleta',
      recommended: true
    },
    {
      id: 'fotossensiveis',
      name: 'Lentes Fotossensíveis',
      icon: Zap,
      description: 'Escurecem automaticamente quando expostas à luz solar',
      benefits: ['Conveniência 2 em 1', 'Proteção automática', 'Conforto visual constante'],
      effect: 'Escurecimento automático em ambientes claros, clareamento em ambientes internos',
      recommended: aiRecommendations?.tratamentosRecomendados?.includes('fotossensiveis')
    },
    {
      id: 'polarizado',
      name: 'Polarizado',
      icon: Glasses,
      description: 'Elimina reflexos de superfícies como água, asfalto e vidro',
      benefits: ['Ideal para direção', 'Reduz ofuscamento intenso', 'Cores mais vivas e contrastadas'],
      effect: 'Remove reflexos horizontais, melhorando contraste e definição',
      recommended: aiRecommendations?.tratamentosRecomendados?.includes('polarizado')
    }
  ];

  const environments = [
    { id: 'rua', name: 'Ambiente Externo', icon: '🌅' },
    { id: 'leitura', name: 'Leitura', icon: '📚' },
    { id: 'computador', name: 'Trabalho Digital', icon: '💻' },
    { id: 'direcao', name: 'Direção Noturna', icon: '🚗' }
  ];

  const handleTreatmentToggle = (treatmentId: string) => {
    setSelectedTreatments(prev => 
      prev.includes(treatmentId)
        ? prev.filter(id => id !== treatmentId)
        : [...prev, treatmentId]
    );
  };

  const handleContinue = () => {
    onSelect(selectedTreatments);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Visualize os Tratamentos Ópticos
        </h2>
        <p className="text-lg text-gray-600">
          Veja como cada tratamento melhora sua experiência visual
        </p>
        {selectedLens && (
          <Badge variant="outline" className="mt-2 bg-blue-50 text-blue-700 border-blue-200">
            Lente selecionada: {selectedLens}
          </Badge>
        )}
      </div>

      {/* AI Recommendations */}
      {aiRecommendations && (
        <Card className="mb-8 border-2 border-blue-200 bg-blue-50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-blue-900">
              <Sparkles className="mr-2 h-5 w-5" />
              Recomendações Personalizadas da IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-800 mb-4">{aiRecommendations.motivacao}</p>
            <div className="flex flex-wrap gap-2">
              {aiRecommendations.tratamentosRecomendados?.map((treatment: string) => (
                <Badge key={treatment} variant="secondary" className="bg-blue-100 text-blue-800">
                  {treatments.find(t => t.id === treatment)?.name || treatment}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* Simulação Visual */}
        <div>
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <Eye className="mr-2 h-5 w-5 text-blue-600" />
              Simulação Visual em Tempo Real
            </h3>
            
            <VisualLensDemo 
              selectedTreatments={selectedTreatments}
              currentEnvironment={currentEnvironment}
            />
          </div>

          {/* Seletor de Ambiente */}
          <Card className="mb-6">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Alterar Ambiente de Teste</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {environments.map((env) => (
                  <Button
                    key={env.id}
                    variant={currentEnvironment === env.id ? 'default' : 'outline'}
                    onClick={() => setCurrentEnvironment(env.id as any)}
                    className="justify-start"
                  >
                    <span className="mr-2">{env.icon}</span>
                    {env.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Seleção de Tratamentos */}
        <div>
          <h3 className="text-xl font-semibold mb-4">Selecione os Tratamentos</h3>
          <div className="space-y-4">
            {treatments.map((treatment) => {
              const Icon = treatment.icon;
              const isSelected = selectedTreatments.includes(treatment.id);
              const isRecommended = treatment.recommended;

              return (
                <Card 
                  key={treatment.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    isSelected 
                      ? 'ring-2 ring-blue-500 bg-blue-50' 
                      : 'hover:shadow-md'
                  } ${isRecommended ? 'border-2 border-blue-200' : ''}`}
                  onClick={() => handleTreatmentToggle(treatment.id)}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-3 rounded-full ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{treatment.name}</CardTitle>
                          {isRecommended && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800 mt-1">
                              <Sparkles className="w-3 h-3 mr-1" />
                              Recomendado
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Checkbox
                        checked={isSelected}
                        onChange={() => handleTreatmentToggle(treatment.id)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-3">{treatment.description}</p>
                    <div className="mb-4">
                      <p className="text-sm font-medium text-blue-700 mb-2">Efeito Visual:</p>
                      <p className="text-sm text-blue-600">{treatment.effect}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Benefícios:</p>
                      {treatment.benefits.map((benefit, index) => (
                        <div key={index} className="flex items-center text-sm text-gray-600">
                          <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          {benefit}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Resumo de Seleção */}
      {selectedTreatments.length > 0 && (
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-lg text-blue-900">Tratamentos Selecionados</h3>
                <p className="text-blue-700">
                  {selectedTreatments.length} tratamento{selectedTreatments.length !== 1 ? 's' : ''} aplicado{selectedTreatments.length !== 1 ? 's' : ''} à simulação
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedTreatments.map((treatmentId) => {
                  const treatment = treatments.find(t => t.id === treatmentId);
                  return (
                    <Badge key={treatmentId} className="bg-blue-600 text-white">
                      {treatment?.name}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <Button 
          onClick={handleContinue}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Continuar para Simulação Completa
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
