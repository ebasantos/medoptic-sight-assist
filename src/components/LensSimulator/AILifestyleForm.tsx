
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Briefcase, 
  Car, 
  Smartphone, 
  Sun, 
  Moon, 
  Eye, 
  Clock,
  Sparkles,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

interface LifestyleData {
  idade: number;
  profissao: string;
  horasComputador: number;
  dirigeNoturno: boolean;
  esportes: string[];
  problemas: string[];
  prioridades: string[];
}

interface AILifestyleFormProps {
  onComplete: (lifestyleData: LifestyleData, aiRecommendations: any) => void;
  onBack: () => void;
}

export const AILifestyleForm = ({ onComplete, onBack }: AILifestyleFormProps) => {
  const [formData, setFormData] = useState<LifestyleData>({
    idade: 30,
    profissao: '',
    horasComputador: 4,
    dirigeNoturno: false,
    esportes: [],
    problemas: [],
    prioridades: []
  });

  const [step, setStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleSportChange = (sport: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      esportes: checked 
        ? [...prev.esportes, sport]
        : prev.esportes.filter(s => s !== sport)
    }));
  };

  const handleProblemChange = (problem: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      problemas: checked 
        ? [...prev.problemas, problem]
        : prev.problemas.filter(p => p !== problem)
    }));
  };

  const handlePriorityChange = (priority: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      prioridades: checked 
        ? [...prev.prioridades, priority]
        : prev.prioridades.filter(p => p !== priority)
    }));
  };

  const generateAIRecommendations = async () => {
    setIsAnalyzing(true);
    
    // Simulação de análise de IA
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const recommendations = {
      lentesRecomendadas: ['progressiva', 'monofocal'],
      tratamentosRecomendados: ['antirreflexo', 'filtro-azul'],
      motivacao: 'Baseado no seu perfil profissional e hábitos diários',
      score: 95
    };

    setIsAnalyzing(false);
    onComplete(formData, recommendations);
  };

  const sports = [
    'Futebol', 'Tênis', 'Natação', 'Corrida', 'Ciclismo', 'Academia'
  ];

  const problems = [
    'Dor de cabeça', 'Olhos secos', 'Visão embaçada', 'Fadiga ocular', 
    'Dificuldade para ler', 'Sensibilidade à luz'
  ];

  const priorities = [
    'Conforto visual', 'Estética', 'Durabilidade', 'Preço', 
    'Tecnologia avançada', 'Proteção UV'
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader className="text-center pb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <Sparkles className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Análise de Estilo de Vida com IA
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Vamos conhecer melhor seus hábitos para personalizar sua experiência visual
          </p>
          
          {/* Progress indicator */}
          <div className="flex justify-center mt-6">
            <div className="flex items-center space-x-2">
              {[1, 2, 3].map((num) => (
                <div key={num} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= num ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {num}
                  </div>
                  {num < 3 && (
                    <div className={`w-12 h-1 mx-2 ${
                      step > num ? 'bg-blue-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8">
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold flex items-center">
                <User className="mr-2 h-5 w-5 text-blue-600" />
                Informações Pessoais
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="idade">Idade</Label>
                  <Input
                    id="idade"
                    type="number"
                    value={formData.idade}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      idade: parseInt(e.target.value) || 0
                    }))}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="profissao">Profissão</Label>
                  <Input
                    id="profissao"
                    value={formData.profissao}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      profissao: e.target.value
                    }))}
                    placeholder="Ex: Designer, Contador, Professor..."
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label>Horas por dia em computador/celular</Label>
                <div className="mt-2">
                  <RadioGroup
                    value={formData.horasComputador.toString()}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      horasComputador: parseInt(value)
                    }))}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="2" id="r1" />
                      <Label htmlFor="r1">Menos de 2h</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="4" id="r2" />
                      <Label htmlFor="r2">2-4 horas</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="6" id="r3" />
                      <Label htmlFor="r3">4-6 horas</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="8" id="r4" />
                      <Label htmlFor="r4">Mais de 6h</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              <div>
                <Label>Dirige frequentemente à noite?</Label>
                <div className="mt-2">
                  <RadioGroup
                    value={formData.dirigeNoturno.toString()}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      dirigeNoturno: value === 'true'
                    }))}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="true" id="night1" />
                      <Label htmlFor="night1">Sim, frequentemente</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="false" id="night2" />
                      <Label htmlFor="night2">Raramente ou nunca</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold flex items-center">
                <Briefcase className="mr-2 h-5 w-5 text-blue-600" />
                Atividades e Hobbies
              </h3>
              
              <div>
                <Label>Esportes que pratica (selecione todos que se aplicam)</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                  {sports.map((sport) => (
                    <div key={sport} className="flex items-center space-x-2">
                      <Checkbox
                        id={sport}
                        checked={formData.esportes.includes(sport)}
                        onCheckedChange={(checked) => 
                          handleSportChange(sport, checked as boolean)
                        }
                      />
                      <Label htmlFor={sport} className="text-sm">{sport}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <Label>Problemas visuais que você tem enfrentado</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  {problems.map((problem) => (
                    <div key={problem} className="flex items-center space-x-2">
                      <Checkbox
                        id={problem}
                        checked={formData.problemas.includes(problem)}
                        onCheckedChange={(checked) => 
                          handleProblemChange(problem, checked as boolean)
                        }
                      />
                      <Label htmlFor={problem} className="text-sm">{problem}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold flex items-center">
                <Eye className="mr-2 h-5 w-5 text-blue-600" />
                Suas Prioridades
              </h3>
              
              <div>
                <Label>O que é mais importante para você nas lentes?</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  {priorities.map((priority) => (
                    <div key={priority} className="flex items-center space-x-2">
                      <Checkbox
                        id={priority}
                        checked={formData.prioridades.includes(priority)}
                        onCheckedChange={(checked) => 
                          handlePriorityChange(priority, checked as boolean)
                        }
                      />
                      <Label htmlFor={priority} className="text-sm">{priority}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Resumo do seu perfil:</h4>
                <div className="space-y-2 text-sm text-blue-800">
                  <p><strong>Idade:</strong> {formData.idade} anos</p>
                  <p><strong>Profissão:</strong> {formData.profissao || 'Não informado'}</p>
                  <p><strong>Uso de telas:</strong> {formData.horasComputador}h por dia</p>
                  <p><strong>Direção noturna:</strong> {formData.dirigeNoturno ? 'Sim' : 'Não'}</p>
                  {formData.esportes.length > 0 && (
                    <p><strong>Esportes:</strong> {formData.esportes.join(', ')}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between pt-8">
            <Button 
              variant="outline" 
              onClick={step === 1 ? onBack : () => setStep(step - 1)}
              disabled={isAnalyzing}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {step === 1 ? 'Voltar' : 'Anterior'}
            </Button>

            {step < 3 ? (
              <Button 
                onClick={() => setStep(step + 1)}
                disabled={isAnalyzing}
              >
                Próximo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button 
                onClick={generateAIRecommendations}
                disabled={isAnalyzing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Analisando com IA...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Gerar Recomendações
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
