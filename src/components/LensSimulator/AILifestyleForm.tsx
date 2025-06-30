
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { User, Briefcase, Clock, Eye, Camera, ArrowRight, ArrowLeft, Brain } from 'lucide-react';
import { useCamera } from '@/hooks/useCamera';

interface LifestyleData {
  age: string;
  occupation: string;
  screenTime: number;
  activities: string[];
  visionConcerns: string[];
  currentGlasses: string;
  lifestyle: string;
}

interface AILifestyleFormProps {
  onComplete: (lifestyleData: LifestyleData, aiRecommendations: any) => void;
  onBack: () => void;
}

export const AILifestyleForm: React.FC<AILifestyleFormProps> = ({
  onComplete,
  onBack
}) => {
  const [step, setStep] = useState(1);
  const [lifestyleData, setLifestyleData] = useState<LifestyleData>({
    age: '',
    occupation: '',
    screenTime: 4,
    activities: [],
    visionConcerns: [],
    currentGlasses: '',
    lifestyle: ''
  });

  const { 
    videoRef, 
    canvasRef, 
    isActive, 
    capturedImage, 
    startCamera, 
    stopCamera, 
    capturePhoto 
  } = useCamera();

  const totalSteps = 4;

  const occupations = [
    { id: 'office', label: 'Trabalho de Escritório', icon: '💼' },
    { id: 'education', label: 'Educação/Professor', icon: '🎓' },
    { id: 'healthcare', label: 'Área da Saúde', icon: '⚕️' },
    { id: 'retail', label: 'Comércio/Atendimento', icon: '🛍️' },
    { id: 'creative', label: 'Área Criativa/Design', icon: '🎨' },
    { id: 'technical', label: 'Técnico/Engenharia', icon: '🔧' },
    { id: 'retired', label: 'Aposentado', icon: '🏖️' },
    { id: 'other', label: 'Outros', icon: '💼' }
  ];

  const activities = [
    { id: 'reading', label: 'Leitura Frequente' },
    { id: 'driving', label: 'Dirigir Regularmente' },
    { id: 'sports', label: 'Esportes/Exercícios' },
    { id: 'crafts', label: 'Trabalhos Manuais' },
    { id: 'music', label: 'Tocar Instrumentos' },
    { id: 'cooking', label: 'Cozinhar' },
    { id: 'gaming', label: 'Jogos/Gaming' },
    { id: 'travel', label: 'Viajar com Frequência' }
  ];

  const visionConcerns = [
    { id: 'eyestrain', label: 'Cansaço Visual' },
    { id: 'headaches', label: 'Dores de Cabeça' },
    { id: 'dry-eyes', label: 'Olhos Secos' },
    { id: 'blurred', label: 'Visão Embaçada' },
    { id: 'glare', label: 'Sensibilidade à Luz' },
    { id: 'night-vision', label: 'Dificuldade Noturna' },
    { id: 'reading', label: 'Dificuldade para Ler' },
    { id: 'distance', label: 'Visão à Distância' }
  ];

  const handleActivityToggle = (activityId: string) => {
    setLifestyleData(prev => ({
      ...prev,
      activities: prev.activities.includes(activityId)
        ? prev.activities.filter(id => id !== activityId)
        : [...prev.activities, activityId]
    }));
  };

  const handleConcernToggle = (concernId: string) => {
    setLifestyleData(prev => ({
      ...prev,
      visionConcerns: prev.visionConcerns.includes(concernId)
        ? prev.visionConcerns.filter(id => id !== concernId)
        : [...prev.visionConcerns, concernId]
    }));
  };

  const generateAIRecommendations = () => {
    // Simulação de análise de IA baseada nos dados coletados
    const recommendations = {
      lensType: 'progressiva', // Baseado na idade e atividades
      treatments: ['antireflexo', 'luz-azul'], // Baseado no tempo de tela e preocupações
      priorityScore: 85,
      reasoning: [
        'Baseado na sua idade e atividades, lentes progressivas oferecem melhor versatilidade',
        'Tempo de tela elevado indica necessidade de filtro de luz azul',
        'Preocupações com cansaço visual sugerem tratamento antirreflexo'
      ]
    };

    return recommendations;
  };

  const handleComplete = () => {
    const aiRecommendations = generateAIRecommendations();
    onComplete(lifestyleData, aiRecommendations);
  };

  const nextStep = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Análise do Seu Perfil
        </h2>
        <p className="text-lg text-gray-600">
          Nossa IA precisa conhecer você para fazer as melhores recomendações
        </p>
        
        {/* Indicador de progresso */}
        <div className="flex justify-center mt-6">
          <div className="flex space-x-2">
            {[1, 2, 3, 4].map((stepNum) => (
              <div
                key={stepNum}
                className={`w-3 h-3 rounded-full ${
                  stepNum <= step 
                    ? 'bg-blue-600' 
                    : stepNum === step 
                      ? 'bg-blue-400' 
                      : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Etapa 1: Informações Básicas */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-3">
              <User className="w-6 h-6 text-blue-600" />
              <span>Informações Pessoais</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-base font-medium mb-4 block">Qual sua faixa etária?</Label>
              <RadioGroup
                value={lifestyleData.age}
                onValueChange={(value) => setLifestyleData(prev => ({ ...prev, age: value }))}
                className="grid grid-cols-2 md:grid-cols-4 gap-4"
              >
                {['18-30', '31-45', '46-60', '60+'].map((ageRange) => (
                  <div key={ageRange} className="flex items-center space-x-2">
                    <RadioGroupItem value={ageRange} id={ageRange} />
                    <Label htmlFor={ageRange}>{ageRange} anos</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div>
              <Label className="text-base font-medium mb-4 block">Já usa óculos atualmente?</Label>
              <RadioGroup
                value={lifestyleData.currentGlasses}
                onValueChange={(value) => setLifestyleData(prev => ({ ...prev, currentGlasses: value }))}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                {[
                  { value: 'none', label: 'Não uso óculos' },
                  { value: 'reading', label: 'Só para leitura' },
                  { value: 'distance', label: 'Só para longe' },
                  { value: 'multifocal', label: 'Multifocal/Progressiva' },
                  { value: 'fulltime', label: 'Uso o tempo todo' }
                ].map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label htmlFor={option.value}>{option.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Etapa 2: Trabalho e Tempo de Tela */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-3">
              <Briefcase className="w-6 h-6 text-blue-600" />
              <span>Trabalho e Atividades Digitais</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-base font-medium mb-4 block">Qual sua área de trabalho?</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {occupations.map((occupation) => (
                  <Card
                    key={occupation.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      lifestyleData.occupation === occupation.id
                        ? 'border-2 border-blue-500 bg-blue-50'
                        : 'border hover:border-blue-200'
                    }`}
                    onClick={() => setLifestyleData(prev => ({ ...prev, occupation: occupation.id }))}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl mb-2">{occupation.icon}</div>
                      <div className="text-sm font-medium">{occupation.label}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-base font-medium mb-4 block">
                Quantas horas por dia você usa telas (computador, celular, TV)?
              </Label>
              <div className="px-3">
                <Slider
                  value={[lifestyleData.screenTime]}
                  onValueChange={(value) => setLifestyleData(prev => ({ ...prev, screenTime: value[0] }))}
                  max={16}
                  min={0}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-600 mt-2">
                  <span>0h</span>
                  <span className="font-medium text-blue-600">{lifestyleData.screenTime}h por dia</span>
                  <span>16h+</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Etapa 3: Atividades e Hobbies */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-3">
              <Clock className="w-6 h-6 text-blue-600" />
              <span>Suas Atividades Principais</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-base font-medium mb-4 block">
                Quais atividades você faz regularmente? (Selecione todas que se aplicam)
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {activities.map((activity) => (
                  <Card
                    key={activity.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      lifestyleData.activities.includes(activity.id)
                        ? 'border-2 border-blue-500 bg-blue-50'
                        : 'border hover:border-blue-200'
                    }`}
                    onClick={() => handleActivityToggle(activity.id)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Checkbox
                          checked={lifestyleData.activities.includes(activity.id)}
                          readOnly
                        />
                      </div>
                      <div className="text-sm font-medium">{activity.label}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-base font-medium mb-4 block">Como você descreveria seu estilo de vida?</Label>
              <RadioGroup
                value={lifestyleData.lifestyle}
                onValueChange={(value) => setLifestyleData(prev => ({ ...prev, lifestyle: value }))}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                {[
                  { value: 'active', label: 'Muito Ativo - Sempre em movimento' },
                  { value: 'moderate', label: 'Moderado - Equilibrio entre trabalho e lazer' },
                  { value: 'sedentary', label: 'Mais Calmo - Atividades internas e relaxantes' }
                ].map((option) => (
                  <Card
                    key={option.value}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      lifestyleData.lifestyle === option.value
                        ? 'border-2 border-blue-500 bg-blue-50'
                        : 'border hover:border-blue-200'
                    }`}
                    onClick={() => setLifestyleData(prev => ({ ...prev, lifestyle: option.value }))}
                  >
                    <CardContent className="p-4 text-center">
                      <RadioGroupItem value={option.value} id={option.value} className="mb-2" />
                      <Label htmlFor={option.value} className="text-sm font-medium cursor-pointer">
                        {option.label}
                      </Label>
                    </CardContent>
                  </Card>
                ))}
              </RadioGroup>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Etapa 4: Preocupações Visuais e Captura de Foto */}
      {step === 4 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <Eye className="w-6 h-6 text-blue-600" />
                <span>Preocupações com a Visão</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label className="text-base font-medium mb-4 block">
                  Que problemas visuais você tem sentido? (Selecione todos que se aplicam)
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {visionConcerns.map((concern) => (
                    <Card
                      key={concern.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        lifestyleData.visionConcerns.includes(concern.id)
                          ? 'border-2 border-blue-500 bg-blue-50'
                          : 'border hover:border-blue-200'
                      }`}
                      onClick={() => handleConcernToggle(concern.id)}
                    >
                      <CardContent className="p-4 text-center">
                        <div className="flex items-center justify-center mb-2">
                          <Checkbox
                            checked={lifestyleData.visionConcerns.includes(concern.id)}
                            readOnly
                          />
                        </div>
                        <div className="text-sm font-medium">{concern.label}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <Camera className="w-6 h-6 text-blue-600" />
                <span>Captura Facial (Opcional)</span>
              </CardTitle>
              <p className="text-gray-600">
                Para uma análise mais precisa, capture uma foto do seu rosto para medições automáticas
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                {!isActive && !capturedImage && (
                  <Button
                    onClick={startCamera}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Camera className="mr-2 w-4 h-4" />
                    Iniciar Câmera
                  </Button>
                )}

                {isActive && (
                  <div className="space-y-4">
                    <div className="relative inline-block">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-80 h-60 rounded-lg border-2 border-blue-200"
                      />
                      <div className="absolute inset-0 border-2 border-blue-400 rounded-lg pointer-events-none">
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-32 border-2 border-blue-600 rounded-lg opacity-50"></div>
                      </div>
                    </div>
                    <div className="space-x-4">
                      <Button onClick={capturePhoto} className="bg-green-600 hover:bg-green-700 text-white">
                        Capturar Foto
                      </Button>
                      <Button onClick={stopCamera} variant="outline">
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}

                {capturedImage && (
                  <div className="space-y-4">
                    <img
                      src={capturedImage}
                      alt="Foto capturada"
                      className="w-80 h-60 rounded-lg border-2 border-green-200 mx-auto"
                    />
                    <div className="space-x-4">
                      <Badge className="bg-green-600 text-white">Foto capturada com sucesso!</Badge>
                      <Button
                        onClick={() => {
                          startCamera();
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Tirar outra foto
                      </Button>
                    </div>
                  </div>
                )}

                <canvas ref={canvasRef} className="hidden" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Botões de navegação */}
      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={step === 1 ? onBack : prevStep} className="px-6">
          <ArrowLeft className="mr-2 w-4 h-4" />
          {step === 1 ? 'Voltar' : 'Anterior'}
        </Button>
        
        {step < totalSteps ? (
          <Button
            onClick={nextStep}
            disabled={
              (step === 1 && (!lifestyleData.age || !lifestyleData.currentGlasses)) ||
              (step === 2 && !lifestyleData.occupation)
            }
            className="bg-blue-600 hover:bg-blue-700 text-white px-6"
          >
            Próximo
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={handleComplete}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6"
          >
            <Brain className="mr-2 w-4 h-4" />
            Analisar com IA
          </Button>
        )}
      </div>
    </div>
  );
};
