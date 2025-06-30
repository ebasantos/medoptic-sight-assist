
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Eye, Camera, Settings, FileText, Sparkles } from 'lucide-react';
import { LensTypeSelector } from './LensTypeSelector';
import { TreatmentSelector } from './TreatmentSelector';
import { EnvironmentSimulator } from './EnvironmentSimulator';
import { ComparisonView } from './ComparisonView';
import { AILifestyleForm } from './AILifestyleForm';
import { FinalReport } from './FinalReport';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface SimulatorState {
  step: 'intro' | 'lifestyle' | 'lens-selection' | 'treatment-selection' | 'environment-test' | 'comparison' | 'report';
  selectedLens: string | null;
  selectedTreatments: string[];
  clientPhoto: string | null;
  prescription: any;
  lifestyleData: any;
  aiRecommendations: any;
  clientName: string;
}

export const LensSimulatorMain = () => {
  const { user } = useAuth();
  const [simulatorState, setSimulatorState] = useState<SimulatorState>({
    step: 'intro',
    selectedLens: null,
    selectedTreatments: [],
    clientPhoto: null,
    prescription: null,
    lifestyleData: null,
    aiRecommendations: null,
    clientName: ''
  });

  const saveSimulation = async () => {
    if (!user || !simulatorState.selectedLens || !simulatorState.clientName) {
      toast.error('Dados incompletos para salvar a simulação');
      return;
    }

    try {
      console.log('Salvando simulação...', {
        optica_id: user.opticId,
        nome_cliente: simulatorState.clientName,
        tipo_lente: simulatorState.selectedLens,
        tratamentos: simulatorState.selectedTreatments,
        dados_estilo_vida: simulatorState.lifestyleData,
        recomendacoes_ia: simulatorState.aiRecommendations
      });

      const { error } = await supabase
        .from('simulacoes_lentes')
        .insert({
          optica_id: user.opticId,
          nome_cliente: simulatorState.clientName,
          tipo_lente: simulatorState.selectedLens,
          tratamentos: simulatorState.selectedTreatments,
          dados_estilo_vida: simulatorState.lifestyleData,
          recomendacoes_ia: simulatorState.aiRecommendations
        });

      if (error) {
        console.error('Erro ao salvar simulação:', error);
        toast.error('Erro ao salvar simulação');
      } else {
        console.log('Simulação salva com sucesso');
        toast.success('Simulação salva no histórico!');
      }
    } catch (error) {
      console.error('Erro ao salvar simulação:', error);
      toast.error('Erro ao salvar simulação');
    }
  };

  const nextStep = () => {
    const steps = ['intro', 'lifestyle', 'lens-selection', 'treatment-selection', 'environment-test', 'comparison', 'report'];
    const currentIndex = steps.indexOf(simulatorState.step);
    if (currentIndex < steps.length - 1) {
      setSimulatorState(prev => ({
        ...prev,
        step: steps[currentIndex + 1] as any
      }));
    }
  };

  const prevStep = () => {
    const steps = ['intro', 'lifestyle', 'lens-selection', 'treatment-selection', 'environment-test', 'comparison', 'report'];
    const currentIndex = steps.indexOf(simulatorState.step);
    if (currentIndex > 0) {
      setSimulatorState(prev => ({
        ...prev,
        step: steps[currentIndex - 1] as any
      }));
    }
  };

  const handleComparisonContinue = async () => {
    await saveSimulation();
    nextStep();
  };

  const handleRestart = () => {
    setSimulatorState({
      step: 'intro',
      selectedLens: null,
      selectedTreatments: [],
      clientPhoto: null,
      prescription: null,
      lifestyleData: null,
      aiRecommendations: null,
      clientName: ''
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50">
      {/* Header com progresso */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Eye className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Simulador de Lentes IA</h1>
                <p className="text-sm text-gray-500">Tecnologia avançada para visualização</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <Sparkles className="w-3 h-3 mr-1" />
                IA Ativa
              </Badge>
            </div>
          </div>
          
          {/* Barra de progresso */}
          <div className="pb-4">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
              <span>Início</span>
              <span>Análise</span>
              <span>Lentes</span>
              <span>Tratamentos</span>
              <span>Simulação</span>
              <span>Comparação</span>
              <span>Relatório</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ 
                  width: `${((['intro', 'lifestyle', 'lens-selection', 'treatment-selection', 'environment-test', 'comparison', 'report'].indexOf(simulatorState.step) + 1) / 7) * 100}%` 
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {simulatorState.step === 'intro' && (
          <IntroScreen onStart={() => nextStep()} />
        )}

        {simulatorState.step === 'lifestyle' && (
          <AILifestyleForm 
            onComplete={(lifestyleData, aiRecommendations) => {
              setSimulatorState(prev => ({
                ...prev,
                lifestyleData,
                aiRecommendations,
                clientName: lifestyleData?.nome || ''
              }));
              nextStep();
            }}
            onBack={prevStep}
          />
        )}

        {simulatorState.step === 'lens-selection' && (
          <LensTypeSelector
            aiRecommendations={simulatorState.aiRecommendations}
            onSelect={(lensType) => {
              setSimulatorState(prev => ({
                ...prev,
                selectedLens: lensType
              }));
              nextStep();
            }}
            onBack={prevStep}
          />
        )}

        {simulatorState.step === 'treatment-selection' && (
          <TreatmentSelector
            selectedLens={simulatorState.selectedLens}
            aiRecommendations={simulatorState.aiRecommendations}
            onSelect={(treatments) => {
              setSimulatorState(prev => ({
                ...prev,
                selectedTreatments: treatments
              }));
              nextStep();
            }}
            onBack={prevStep}
          />
        )}

        {simulatorState.step === 'environment-test' && (
          <EnvironmentSimulator
            selectedLens={simulatorState.selectedLens}
            selectedTreatments={simulatorState.selectedTreatments}
            onContinue={() => nextStep()}
            onBack={prevStep}
          />
        )}

        {simulatorState.step === 'comparison' && (
          <ComparisonView
            configuration={simulatorState}
            onContinue={handleComparisonContinue}
            onBack={prevStep}
          />
        )}

        {simulatorState.step === 'report' && (
          <FinalReport
            configuration={simulatorState}
            onRestart={handleRestart}
            onBack={prevStep}
          />
        )}
      </div>
    </div>
  );
};

// Tela inicial do simulador
const IntroScreen = ({ onStart }: { onStart: () => void }) => {
  return (
    <div className="text-center max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
          <Eye className="w-10 h-10 text-blue-600" />
        </div>
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          Simulador de Lentes com IA
        </h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          Descubra como diferentes tipos de lentes e tratamentos irão melhorar sua visão. 
          Nossa IA personaliza a experiência baseada no seu perfil e necessidades.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <Card className="border-2 hover:border-blue-200 transition-colors">
          <CardContent className="p-6 text-center">
            <Camera className="w-8 h-8 text-blue-600 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Análise Facial IA</h3>
            <p className="text-sm text-gray-600">Detectamos automaticamente suas medidas oculares</p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-blue-200 transition-colors">
          <CardContent className="p-6 text-center">
            <Settings className="w-8 h-8 text-blue-600 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Simulação Realística</h3>
            <p className="text-sm text-gray-600">Veja exatamente como cada lente afetará sua visão</p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-blue-200 transition-colors">
          <CardContent className="p-6 text-center">
            <FileText className="w-8 h-8 text-blue-600 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Relatório Personalizado</h3>
            <p className="text-sm text-gray-600">Receba um comparativo detalhado das opções</p>
          </CardContent>
        </Card>
      </div>

      <Button 
        onClick={onStart}
        size="lg"
        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
      >
        Iniciar Simulação
        <Sparkles className="ml-2 w-5 h-5" />
      </Button>

      <p className="text-sm text-gray-500 mt-4">
        ⏱️ Tempo estimado: 3-5 minutos
      </p>
    </div>
  );
};
