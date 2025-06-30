
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  ArrowRight, 
  User, 
  Briefcase, 
  Clock, 
  Smartphone, 
  Car, 
  Eye,
  Sparkles
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface LifestyleData {
  nomeCompleto: string;
  idade: string;
  profissao: string;
  tempoTela: string;
  atividades: string[];
  problemas: string[];
  observacoes?: string;
}

interface AILifestyleFormProps {
  onComplete: (lifestyleData: LifestyleData, aiRecommendations: any) => void;
  onBack: () => void;
}

export const AILifestyleForm: React.FC<AILifestyleFormProps> = ({
  onComplete,
  onBack
}) => {
  const isMobile = useIsMobile();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<LifestyleData>({
    nomeCompleto: '',
    idade: '',
    profissao: '',
    tempoTela: '',
    atividades: [],
    problemas: [],
    observacoes: ''
  });

  const steps = [
    {
      title: 'Informações Pessoais',
      icon: User,
      fields: ['nomeCompleto', 'idade', 'profissao']
    },
    {
      title: 'Uso de Dispositivos',
      icon: Smartphone,
      fields: ['tempoTela', 'atividades']
    },
    {
      title: 'Problemas Visuais',
      icon: Eye,
      fields: ['problemas', 'observacoes']
    }
  ];

  const ageOptions = [
    '18-25 anos',
    '26-35 anos', 
    '36-45 anos',
    '46-55 anos',
    '56+ anos'
  ];

  const professionOptions = [
    'Escritório/Computador',
    'Estudante',
    'Aposentado',
    'Motorista',
    'Trabalho Manual',
    'Saúde/Médico',
    'Professor',
    'Outro'
  ];

  const screenTimeOptions = [
    'Menos de 2h/dia',
    '2-4h/dia',
    '4-6h/dia',
    '6-8h/dia',
    'Mais de 8h/dia'
  ];

  const activityOptions = [
    'Trabalho no computador',
    'Leitura frequente',
    'Direção diária',
    'Esportes ao ar livre',
    'Uso intenso do celular',
    'Atividades noturnas'
  ];

  const problemOptions = [
    'Dor de cabeça',
    'Olhos secos',
    'Visão cansada',
    'Dificuldade para focar',
    'Sensibilidade à luz',
    'Visão embaçada'
  ];

  const toggleArrayOption = (field: 'atividades' | 'problemas', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const generateAIRecommendations = (data: LifestyleData) => {
    // Lógica simplificada de IA baseada no perfil
    const recommendations = {
      lente: 'progressiva',
      tratamentos: ['antirreflexo'],
      score: 85,
      motivos: []
    };

    // Recomendações baseadas na idade
    if (data.idade.includes('45+') || data.idade.includes('56+')) {
      recommendations.lente = 'progressiva';
      recommendations.motivos.push('Idade compatível com presbiopia');
    }

    // Recomendações baseadas no tempo de tela
    if (data.tempoTela.includes('4h') || data.tempoTela.includes('8h')) {
      recommendations.tratamentos.push('filtro-azul');
      recommendations.motivos.push('Alto tempo de exposição a telas');
    }

    // Recomendações baseadas em atividades
    if (data.atividades.includes('Direção diária')) {
      recommendations.tratamentos.push('polarizado');
      recommendations.motivos.push('Direção frequente');
    }

    if (data.atividades.includes('Esportes ao ar livre')) {
      recommendations.tratamentos.push('protecao-uv');
      recommendations.motivos.push('Exposição solar');
    }

    // Recomendações baseadas em problemas
    if (data.problemas.includes('Sensibilidade à luz')) {
      recommendations.tratamentos.push('fotossensiveis');
      recommendations.motivos.push('Sensibilidade à luz relatada');
    }

    return recommendations;
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Finalizar e gerar recomendações
      const aiRecommendations = generateAIRecommendations(formData);
      onComplete(formData, aiRecommendations);
    }
  };

  const canProceed = () => {
    const currentFields = steps[currentStep].fields;
    
    if (currentStep === 0) {
      return formData.nomeCompleto.trim() && formData.idade && formData.profissao;
    }
    if (currentStep === 1) {
      return formData.tempoTela && formData.atividades.length > 0;
    }
    if (currentStep === 2) {
      return formData.problemas.length > 0;
    }
    return true;
  };

  const renderPersonalInfo = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="nome" className="text-base font-medium">Nome Completo *</Label>
        <Input
          id="nome"
          value={formData.nomeCompleto}
          onChange={(e) => setFormData(prev => ({ ...prev, nomeCompleto: e.target.value }))}
          placeholder="Digite o nome completo"
          className="mt-2"
        />
      </div>

      <div>
        <Label className="text-base font-medium">Faixa Etária *</Label>
        <div className="grid grid-cols-2 gap-3 mt-3">
          {ageOptions.map((age) => (
            <Button
              key={age}
              variant={formData.idade === age ? 'default' : 'outline'}
              onClick={() => setFormData(prev => ({ ...prev, idade: age }))}
              className="text-sm"
            >
              {age}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-base font-medium">Área de Trabalho *</Label>
        <div className="grid grid-cols-1 gap-2 mt-3">
          {professionOptions.map((prof) => (
            <Button
              key={prof}
              variant={formData.profissao === prof ? 'default' : 'outline'}
              onClick={() => setFormData(prev => ({ ...prev, profissao: prof }))}
              className="text-sm justify-start"
            >
              {prof}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderScreenTime = () => (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-medium">Tempo Diário em Telas *</Label>
        <div className="grid grid-cols-1 gap-2 mt-3">
          {screenTimeOptions.map((time) => (
            <Button
              key={time}
              variant={formData.tempoTela === time ? 'default' : 'outline'}
              onClick={() => setFormData(prev => ({ ...prev, tempoTela: time }))}
              className="text-sm justify-start"
            >
              {time}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-base font-medium">Principais Atividades * (selecione várias)</Label>
        <div className="grid grid-cols-1 gap-2 mt-3">
          {activityOptions.map((activity) => (
            <Button
              key={activity}
              variant={formData.atividades.includes(activity) ? 'default' : 'outline'}
              onClick={() => toggleArrayOption('atividades', activity)}
              className="text-sm justify-start"
            >
              {activity}
              {formData.atividades.includes(activity) && (
                <Badge className="ml-2 bg-white text-blue-600">✓</Badge>
              )}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderProblems = () => (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-medium">Problemas Visuais * (selecione os que sente)</Label>
        <div className="grid grid-cols-1 gap-2 mt-3">
          {problemOptions.map((problem) => (
            <Button
              key={problem}
              variant={formData.problemas.includes(problem) ? 'default' : 'outline'}
              onClick={() => toggleArrayOption('problemas', problem)}
              className="text-sm justify-start"
            >
              {problem}
              {formData.problemas.includes(problem) && (
                <Badge className="ml-2 bg-white text-blue-600">✓</Badge>
              )}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="observacoes" className="text-base font-medium">Observações Adicionais</Label>
        <Textarea
          id="observacoes"
          value={formData.observacoes}
          onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
          placeholder="Alguma informação adicional sobre sua rotina visual..."
          className="mt-2"
          rows={3}
        />
      </div>
    </div>
  );

  const StepIcon = steps[currentStep].icon;

  if (isMobile) {
    return (
      <div className="flex flex-col h-screen bg-white">
        {/* Header móvel */}
        <div className="bg-white border-b px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <StepIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">{steps[currentStep].title}</h1>
                <p className="text-sm text-gray-500">Etapa {currentStep + 1} de {steps.length}</p>
              </div>
            </div>
            <Badge className="bg-blue-50 text-blue-700">
              <Sparkles className="w-3 h-3 mr-1" />
              IA
            </Badge>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 px-4 py-6 overflow-y-auto">
          {currentStep === 0 && renderPersonalInfo()}
          {currentStep === 1 && renderScreenTime()}
          {currentStep === 2 && renderProblems()}
        </div>

        {/* Botões de navegação */}
        <div className="bg-white border-t px-4 py-4">
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={currentStep === 0 ? onBack : () => setCurrentStep(currentStep - 1)}
              className="px-6"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <Button 
              onClick={handleNext}
              disabled={!canProceed()}
              className="bg-blue-600 hover:bg-blue-700 px-6"
            >
              {currentStep === steps.length - 1 ? 'Finalizar' : 'Próximo'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Layout desktop
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <StepIcon className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {steps[currentStep].title}
        </h2>
        <p className="text-lg text-gray-600">
          Nossa IA analisará seu perfil para recomendar a melhor configuração
        </p>
        <Badge className="mt-4 bg-blue-50 text-blue-700 px-4 py-2">
          <Sparkles className="w-4 h-4 mr-2" />
          Análise Inteligente Ativa
        </Badge>
      </div>

      {/* Indicador de progresso */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
          {steps.map((step, index) => (
            <span key={index} className={index <= currentStep ? 'text-blue-600 font-medium' : ''}>
              {step.title}
            </span>
          ))}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            <StepIcon className="w-6 h-6 text-blue-600" />
            <span>{steps[currentStep].title}</span>
            <Badge variant="outline">Etapa {currentStep + 1}/{steps.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentStep === 0 && renderPersonalInfo()}
          {currentStep === 1 && renderScreenTime()}
          {currentStep === 2 && renderProblems()}
        </CardContent>
      </Card>

      {/* Botões de navegação */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={currentStep === 0 ? onBack : () => setCurrentStep(currentStep - 1)}
          size="lg"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <Button 
          onClick={handleNext}
          disabled={!canProceed()}
          size="lg"
          className="bg-blue-600 hover:bg-blue-700"
        >
          {currentStep === steps.length - 1 ? 'Gerar Recomendações IA' : 'Próximo'}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
