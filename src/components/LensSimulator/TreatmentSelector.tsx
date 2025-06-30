
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Shield, Sun, Eye, Monitor, Polarize, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';

interface Treatment {
  id: string;
  name: string;
  description: string;
  benefits: string[];
  icon: React.ReactNode;
  price: number;
  aiRecommended: boolean;
  visualDemo: string;
  compatibility: string[];
}

const treatments: Treatment[] = [
  {
    id: 'antireflexo',
    name: 'Antirreflexo Premium',
    description: 'Reduz reflexos e melhora a nitidez, especialmente à noite',
    benefits: ['Reduz cansaço visual', 'Melhora visão noturna', 'Lentes mais transparentes', 'Facilita limpeza'],
    icon: <Shield className="w-5 h-5" />,
    price: 150,
    aiRecommended: true,
    visualDemo: 'antireflexo-demo',
    compatibility: ['monofocal', 'bifocal', 'progressiva', 'ocupacional']
  },
  {
    id: 'uv',
    name: 'Proteção UV Total',
    description: 'Bloqueia 100% dos raios UV prejudiciais',
    benefits: ['Protege contra catarata', 'Previne degeneração macular', 'Reduz envelhecimento', 'Proteção solar'],
    icon: <Sun className="w-5 h-5" />,
    price: 80,
    aiRecommended: true,
    visualDemo: 'uv-demo',
    compatibility: ['monofocal', 'bifocal', 'progressiva', 'ocupacional']
  },
  {
    id: 'luz-azul',
    name: 'Filtro Luz Azul',
    description: 'Filtra a luz azul prejudicial de telas digitais',
    benefits: ['Reduz fadiga digital', 'Melhora qualidade do sono', 'Protege retina', 'Conforto em telas'],
    icon: <Monitor className="w-5 h-5" />,
    price: 120,
    aiRecommended: false,
    visualDemo: 'blue-light-demo',
    compatibility: ['monofocal', 'progressiva', 'ocupacional']
  },
  {
    id: 'fotossensivel',
    name: 'Lente Fotossensível',
    description: 'Escurece automaticamente ao sol, clara em ambientes internos',
    benefits: ['Adaptação automática', '2 em 1: óculos e óculos de sol', 'Conveniência', 'Proteção UV incluída'],
    icon: <Eye className="w-5 h-5" />,
    price: 200,
    aiRecommended: false,
    visualDemo: 'photochromic-demo',
    compatibility: ['monofocal', 'bifocal', 'progressiva']
  },
  {
    id: 'polarizado',
    name: 'Filtro Polarizado',
    description: 'Elimina reflexos de superfícies como água, asfalto e vidro',
    benefits: ['Elimina ofuscamento', 'Melhora contraste', 'Ideal para direção', 'Cores mais vivas'],
    icon: <Polarize className="w-5 h-5" />,
    price: 180,
    aiRecommended: false,
    visualDemo: 'polarized-demo',
    compatibility: ['monofocal']
  }
];

interface TreatmentSelectorProps {
  selectedLens: string | null;
  aiRecommendations: any;
  onSelect: (treatments: string[]) => void;
  onBack: () => void;
}

export const TreatmentSelector: React.FC<TreatmentSelectorProps> = ({
  selectedLens,
  aiRecommendations,
  onSelect,
  onBack
}) => {
  const [selectedTreatments, setSelectedTreatments] = useState<string[]>([]);

  // Filtrar tratamentos compatíveis com a lente selecionada
  const compatibleTreatments = treatments.filter(treatment =>
    !selectedLens || treatment.compatibility.includes(selectedLens)
  );

  const recommendedTreatments = compatibleTreatments.filter(t => t.aiRecommended);

  const toggleTreatment = (treatmentId: string) => {
    setSelectedTreatments(prev =>
      prev.includes(treatmentId)
        ? prev.filter(id => id !== treatmentId)
        : [...prev, treatmentId]
    );
  };

  const totalPrice = selectedTreatments.reduce((sum, id) => {
    const treatment = treatments.find(t => t.id === id);
    return sum + (treatment?.price || 0);
  }, 0);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Tratamentos Ópticos
        </h2>
        <p className="text-lg text-gray-600">
          Adicione tratamentos para maximizar o conforto e proteção das suas lentes
        </p>
      </div>

      {/* Recomendações IA */}
      {recommendedTreatments.length > 0 && (
        <Card className="mb-8 border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <Sparkles className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-green-900">Tratamentos Recomendados pela IA</CardTitle>
                <p className="text-green-700">Baseado no seu perfil e tipo de lente escolhida</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {recommendedTreatments.map((treatment) => (
                <div
                  key={treatment.id}
                  className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-green-200"
                >
                  <Checkbox
                    checked={selectedTreatments.includes(treatment.id)}
                    onCheckedChange={() => toggleTreatment(treatment.id)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      {treatment.icon}
                      <span className="font-medium">{treatment.name}</span>
                      <Badge className="bg-green-600 text-white text-xs">Recomendado</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{treatment.description}</p>
                    <p className="text-sm font-medium text-green-600">+ R$ {treatment.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grid de todos os tratamentos */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {compatibleTreatments.map((treatment) => (
          <Card
            key={treatment.id}
            className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
              selectedTreatments.includes(treatment.id)
                ? 'border-2 border-blue-500 shadow-lg bg-blue-50'
                : 'border hover:border-blue-200'
            }`}
            onClick={() => toggleTreatment(treatment.id)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    checked={selectedTreatments.includes(treatment.id)}
                    onCheckedChange={() => toggleTreatment(treatment.id)}
                  />
                  <div className="bg-blue-100 p-2 rounded-lg">
                    {treatment.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{treatment.name}</CardTitle>
                    <p className="text-blue-600 font-medium">+ R$ {treatment.price}</p>
                  </div>
                </div>
                {treatment.aiRecommended && (
                  <Badge className="bg-green-600 text-white">IA</Badge>
                )}
              </div>
              <p className="text-gray-600">{treatment.description}</p>
            </CardHeader>
            
            <CardContent>
              {/* Simulação Visual */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-700 mb-2">Simulação do Efeito:</div>
                <TreatmentVisualization type={treatment.visualDemo} />
              </div>

              {/* Benefícios */}
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Benefícios:</div>
                <div className="grid grid-cols-2 gap-1">
                  {treatment.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center text-sm text-gray-600">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2" />
                      {benefit}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Resumo de seleção */}
      {selectedTreatments.length > 0 && (
        <Card className="mb-8 bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Tratamentos Selecionados:</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedTreatments.map(id => {
                    const treatment = treatments.find(t => t.id === id);
                    return treatment ? (
                      <Badge key={id} className="bg-blue-600 text-white">
                        {treatment.name}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-700">Custo adicional:</p>
                <p className="text-2xl font-bold text-blue-900">R$ {totalPrice}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botões de navegação */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} className="px-6">
          <ArrowLeft className="mr-2 w-4 h-4" />
          Voltar
        </Button>
        
        <Button
          onClick={() => onSelect(selectedTreatments)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6"
        >
          Continuar para Simulação
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

// Componente para visualização dos tratamentos
const TreatmentVisualization: React.FC<{ type: string }> = ({ type }) => {
  const visualizations = {
    'antireflexo-demo': (
      <div className="relative h-20 bg-gradient-to-r from-gray-200 to-white rounded-lg flex items-center justify-center">
        <div className="text-sm text-gray-700">Reflexos reduzidos em 99%</div>
      </div>
    ),
    'uv-demo': (
      <div className="relative h-20 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg flex items-center justify-center">
        <div className="text-sm text-orange-700">Bloqueio UV total</div>
      </div>
    ),
    'blue-light-demo': (
      <div className="relative h-20 bg-gradient-to-r from-blue-100 to-amber-50 rounded-lg flex items-center justify-center">
        <div className="text-sm text-amber-700">Luz azul filtrada</div>
      </div>
    ),
    'photochromic-demo': (
      <div className="relative h-20 bg-gradient-to-r from-white to-gray-700 rounded-lg flex items-center justify-center">
        <div className="text-sm text-gray-700">Escurecimento automático</div>
      </div>
    ),
    'polarized-demo': (
      <div className="relative h-20 bg-gradient-to-r from-cyan-100 to-blue-100 rounded-lg flex items-center justify-center">
        <div className="text-sm text-blue-700">Reflexos eliminados</div>
      </div>
    )
  };

  return visualizations[type as keyof typeof visualizations] || null;
};
