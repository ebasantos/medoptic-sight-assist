import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Shield, 
  Sun, 
  Monitor, 
  Zap, 
  Glasses, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles,
  Check
} from 'lucide-react';

interface TreatmentSelectorProps {
  selectedLens: string | null;
  aiRecommendations: any;
  onSelect: (treatments: string[]) => void;
  onBack: () => void;
}

export const TreatmentSelector = ({ selectedLens, aiRecommendations, onSelect, onBack }: TreatmentSelectorProps) => {
  const [selectedTreatments, setSelectedTreatments] = useState<string[]>([]);

  const treatments = [
    {
      id: 'antirreflexo',
      name: 'Antirreflexo',
      icon: Shield,
      description: 'Elimina reflexos indesejados e melhora a nitidez',
      benefits: ['Reduz cansaço visual', 'Melhora aparência', 'Maior durabilidade'],
      price: 'R$ 150',
      recommended: aiRecommendations?.tratamentosRecomendados?.includes('antirreflexo')
    },
    {
      id: 'filtro-azul',
      name: 'Filtro Luz Azul',
      icon: Monitor,
      description: 'Protege contra a luz azul de telas digitais',
      benefits: ['Reduz fadiga ocular', 'Melhora o sono', 'Proteção digital'],
      price: 'R$ 120',
      recommended: aiRecommendations?.tratamentosRecomendados?.includes('filtro-azul')
    },
    {
      id: 'protecao-uv',
      name: 'Proteção UV',
      icon: Sun,
      description: 'Bloqueia 100% dos raios UV prejudiciais',
      benefits: ['Protege a retina', 'Previne catarata', 'Essencial ao ar livre'],
      price: 'R$ 80',
      recommended: true
    },
    {
      id: 'fotossensiveis',
      name: 'Lentes Fotossensíveis',
      icon: Zap,
      description: 'Escurecem automaticamente no sol',
      benefits: ['Conveniência 2 em 1', 'Proteção automática', 'Conforto visual'],
      price: 'R$ 200',
      recommended: aiRecommendations?.tratamentosRecomendados?.includes('fotossensiveis')
    },
    {
      id: 'polarizado',
      name: 'Polarizado',
      icon: Glasses,
      description: 'Elimina reflexos de superfícies como água e asfalto',
      benefits: ['Ideal para direção', 'Reduz ofuscamento', 'Cores mais vivas'],
      price: 'R$ 180',
      recommended: aiRecommendations?.tratamentosRecomendados?.includes('polarizado')
    }
  ];

  const handleTreatmentToggle = (treatmentId: string) => {
    setSelectedTreatments(prev => 
      prev.includes(treatmentId)
        ? prev.filter(id => id !== treatmentId)
        : [...prev, treatmentId]
    );
  };

  const calculateTotal = () => {
    return treatments
      .filter(t => selectedTreatments.includes(t.id))
      .reduce((total, treatment) => {
        const price = parseInt(treatment.price.replace('R$ ', ''));
        return total + price;
      }, 0);
  };

  const handleContinue = () => {
    onSelect(selectedTreatments);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Escolha os Tratamentos Ópticos
        </h2>
        <p className="text-lg text-gray-600">
          Personalize sua experiência visual com tratamentos avançados
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
              Recomendações da IA
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

      {/* Treatments Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
                      <Icon className="h-6 w-6" />
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
                  <div className="flex flex-col items-end">
                    <Checkbox
                      checked={isSelected}
                      onChange={() => handleTreatmentToggle(treatment.id)}
                    />
                    <span className="text-lg font-bold text-blue-600 mt-2">
                      {treatment.price}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{treatment.description}</p>
                <div className="space-y-2">
                  {treatment.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center text-sm text-gray-700">
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

      {/* Summary */}
      {selectedTreatments.length > 0 && (
        <Card className="mb-8 bg-gray-50">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-lg">Tratamentos Selecionados</h3>
                <p className="text-gray-600">
                  {selectedTreatments.length} tratamento{selectedTreatments.length !== 1 ? 's' : ''} selecionado{selectedTreatments.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">
                  R$ {calculateTotal()}
                </p>
                <p className="text-sm text-gray-500">Total em tratamentos</p>
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
          disabled={selectedTreatments.length === 0}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Continuar para Simulação
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
