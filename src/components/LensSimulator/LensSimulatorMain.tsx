import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Eye, Camera, Settings, FileText, Sparkles, Menu, ArrowLeft } from 'lucide-react';
import { LensTypeSelector } from './LensTypeSelector';
import { TreatmentSelector } from './TreatmentSelector';
import { EnvironmentSimulator } from './EnvironmentSimulator';
import { ComparisonView } from './ComparisonView';
import { AILifestyleForm } from './AILifestyleForm';
import { FinalReport } from './FinalReport';
import { MobileDrawer } from './MobileDrawer';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
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
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
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
    try {
      console.log('Iniciando salvamento da simulação...');
      console.log('Estado atual:', simulatorState);

      if (!user?.opticId) {
        console.error('Usuário não tem ótica associada');
        toast.error('Erro: usuário não tem ótica associada');
        return;
      }

      if (!simulatorState.clientName) {
        console.error('Nome do cliente não informado');
        toast.error('Nome do cliente é obrigatório');
        return;
      }

      if (!simulatorState.selectedLens) {
        console.error('Lente não selecionada');
        toast.error('Tipo de lente é obrigatório');
        return;
      }

      const dataToSave = {
        optica_id: user.opticId,
        nome_cliente: simulatorState.clientName,
        tipo_lente: simulatorState.selectedLens,
        tratamentos: simulatorState.selectedTreatments || [],
        dados_estilo_vida: simulatorState.lifestyleData,
        recomendacoes_ia: simulatorState.aiRecommendations
      };

      console.log('Dados para salvar:', dataToSave);

      const { data, error } = await supabase
        .from('simulacoes_lentes')
        .insert(dataToSave)
        .select();

      if (error) {
        console.error('Erro no Supabase:', error);
        toast.error(`Erro ao salvar simulação: ${error.message}`);
        return;
      }

      console.log('Simulação salva com sucesso:', data);
      toast.success('Simulação salva no histórico!');
    } catch (error) {
      console.error('Erro geral ao salvar simulação:', error);
      toast.error('Erro inesperado ao salvar simulação');
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

  const stepNames = {
    intro: 'Início',
    lifestyle: 'Análise',
    'lens-selection': 'Lentes',
    'treatment-selection': 'Tratamentos',
    'environment-test': 'Simulação',
    comparison: 'Comparação',
    report: 'Relatório'
  };

  const currentStepIndex = ['intro', 'lifestyle', 'lens-selection', 'treatment-selection', 'environment-test', 'comparison', 'report'].indexOf(simulatorState.step);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50">
      {/* Header adaptável */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className={`${isMobile ? 'px-4' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}`}>
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Eye className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold text-gray-900`}>
                  {isMobile ? 'Simulador IA' : 'Simulador de Lentes IA'}
                </h1>
                {!isMobile && <p className="text-sm text-gray-500">Tecnologia avançada para visualização</p>}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/optica')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button> 
            </div>
            
            <div className="flex items-center space-x-2">
              {isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowMobileMenu(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              )}
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <Sparkles className="w-3 h-3 mr-1" />
                IA Ativa
              </Badge>
            </div>
          </div>
          
          {/* Barra de progresso mobile otimizada */}
          <div className="pb-4">
            {!isMobile && (
              <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                <span>Início</span>
                <span>Análise</span>
                <span>Lentes</span>
                <span>Tratamentos</span>
                <span>Simulação</span>
                <span>Comparação</span>
                <span>Relatório</span>
              </div>
            )}
            {isMobile && (
              <div className="text-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {stepNames[simulatorState.step]} ({currentStepIndex + 1}/7)
                </span>
              </div>
            )}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ 
                  width: `${((currentStepIndex + 1) / 7) * 100}%` 
                }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Menu mobile drawer */}
      <MobileDrawer
        isOpen={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
        title="Menu do Simulador"
        description="Acompanhe o progresso da simulação"
      >
        <div className="space-y-4">
          <div className="text-sm font-medium text-gray-700 mb-4">
            Progresso: {currentStepIndex + 1} de 7 etapas
          </div>
          <div className="space-y-3">
            {Object.entries(stepNames).map(([step, name], index) => (
              <div
                key={step}
                className={`flex items-center space-x-3 p-3 rounded-lg ${
                  simulatorState.step === step
                    ? 'bg-blue-100 text-blue-900'
                    : index <= currentStepIndex
                    ? 'bg-green-50 text-green-800'
                    : 'bg-gray-50 text-gray-500'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  simulatorState.step === step
                    ? 'bg-blue-600 text-white'
                    : index <= currentStepIndex
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {index + 1}
                </div>
                <span className="font-medium">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </MobileDrawer>

      {/* Conteúdo principal adaptável */}
      <main className={`${isMobile ? 'px-4 py-6' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'}`}>
        {simulatorState.step === 'intro' && (
          <IntroScreen onStart={() => nextStep()} />
        )}

        {simulatorState.step === 'lifestyle' && (
          <AILifestyleForm 
            onComplete={(lifestyleData, aiRecommendations) => {
              console.log('Dados recebidos do formulário:', lifestyleData);
              setSimulatorState(prev => ({
                ...prev,
                lifestyleData,
                aiRecommendations,
                clientName: lifestyleData.nomeCompleto || 'Cliente'
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
      </main>
    </div>
  );
};

// Tela inicial otimizada para mobile
const IntroScreen = ({ onStart }: { onStart: () => void }) => {
  const isMobile = useIsMobile();

  return (
    <div className={`text-center ${isMobile ? 'space-y-6' : 'max-w-4xl mx-auto'}`}>
      <div className={`${isMobile ? 'mb-6' : 'mb-8'}`}>
        <div className={`inline-flex items-center justify-center ${isMobile ? 'w-16 h-16' : 'w-20 h-20'} bg-blue-100 rounded-full mb-6`}>
          <Eye className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} text-blue-600`} />
        </div>
        <h2 className={`${isMobile ? 'text-2xl' : 'text-4xl'} font-bold text-gray-900 mb-4`}>
          Simulador de Lentes com IA
        </h2>
        <p className={`${isMobile ? 'text-base' : 'text-xl'} text-gray-600 ${isMobile ? 'mb-6' : 'max-w-2xl mx-auto mb-8'}`}>
          Descubra como diferentes tipos de lentes e tratamentos irão melhorar sua visão. 
          Nossa IA personaliza a experiência baseada no seu perfil e necessidades.
        </p>
      </div>

      <div className={`grid ${isMobile ? 'grid-cols-1 gap-4 mb-8' : 'md:grid-cols-3 gap-6 mb-12'}`}>
        <Card className="border-2 hover:border-blue-200 transition-colors">
          <CardContent className={`${isMobile ? 'p-4' : 'p-6'} text-center`}>
            <Camera className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-blue-600 mx-auto mb-4`} />
            <h3 className={`font-semibold ${isMobile ? 'text-sm' : ''} mb-2`}>Análise Facial IA</h3>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>Detectamos automaticamente suas medidas oculares</p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-blue-200 transition-colors">
          <CardContent className={`${isMobile ? 'p-4' : 'p-6'} text-center`}>
            <Settings className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-blue-600 mx-auto mb-4`} />
            <h3 className={`font-semibold ${isMobile ? 'text-sm' : ''} mb-2`}>Simulação Realística</h3>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>Veja exatamente como cada lente afetará sua visão</p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-blue-200 transition-colors">
          <CardContent className={`${isMobile ? 'p-4' : 'p-6'} text-center`}>
            <FileText className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-blue-600 mx-auto mb-4`} />
            <h3 className={`font-semibold ${isMobile ? 'text-sm' : ''} mb-2`}>Relatório Personalizado</h3>
            <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-600`}>Receba um comparativo detalhado das opções</p>
          </CardContent>
        </Card>
      </div>

      <Button 
        onClick={onStart}
        size={isMobile ? "default" : "lg"}
        className={`bg-blue-600 hover:bg-blue-700 text-white ${isMobile ? 'px-6 py-3 text-base w-full' : 'px-8 py-4 text-lg'} rounded-xl shadow-lg hover:shadow-xl transition-all duration-300`}
      >
        Iniciar Simulação
        <Sparkles className={`ml-2 ${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
      </Button>

      <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 mt-4`}>
        ⏱️ Tempo estimado: 3-5 minutos
      </p>
    </div>
  );
};
