import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Camera, CreditCard, Eye, CheckCircle, AlertCircle } from 'lucide-react';
import { VirtualCalibration } from './VirtualCalibration';
import { ProfessionalFaceCapture } from './ProfessionalFaceCapture';
import { DNPResults } from './DNPResults';
import { useSimpleDNPMeasurement } from '@/hooks/useSimpleDNPMeasurement';

interface DNPMeasurementConfig {
  apiKey?: string;
  containerId?: string;
  language?: string;
  theme?: {
    primaryColor?: string;
    buttonText?: string;
  };
  instructions?: {
    step1?: string;
    step2?: string;
  };
  onComplete?: (result: any) => void;
  onError?: (error: any) => void;
}

interface Props {
  config?: DNPMeasurementConfig;
}

type MeasurementStep = 'virtual-calibration' | 'face-capture' | 'processing' | 'results';

export const DNPMeasurementScreen: React.FC<Props> = ({ config = {} }) => {
  const [currentStep, setCurrentStep] = useState<MeasurementStep>('virtual-calibration');
  const [progress, setProgress] = useState(0);
  
  const [pixelsPerMm, setPixelsPerMm] = useState<number | null>(null);
  const [measurements, setMeasurements] = useState<any>(null);
  const { measureDNP, isProcessing, error } = useSimpleDNPMeasurement();

  const handleVirtualCalibration = useCallback(async (calibratedPixelsPerMm: number) => {
    try {
      setProgress(25);
      setPixelsPerMm(calibratedPixelsPerMm);
      setProgress(50);
      setCurrentStep('face-capture');
    } catch (err) {
      config.onError?.(err);
    }
  }, [config]);

  const handleFaceCapture = useCallback(async (imageData: string) => {
    if (!pixelsPerMm) return;
    
    try {
      setProgress(75);
      setCurrentStep('processing');
      const result = await measureDNP(imageData, pixelsPerMm);
      setMeasurements(result);
      setProgress(100);
      setCurrentStep('results');
      config.onComplete?.(result);
    } catch (err) {
      config.onError?.(err);
    }
  }, [measureDNP, pixelsPerMm, config]);

  const handleRestart = useCallback(() => {
    setPixelsPerMm(null);
    setMeasurements(null);
    setCurrentStep('virtual-calibration');
    setProgress(0);
  }, []);

  const getStepTitle = () => {
    switch (currentStep) {
      case 'virtual-calibration':
        return config.instructions?.step1 || 'Calibração Virtual';
      case 'face-capture':
        return config.instructions?.step2 || 'Captura Facial';
      case 'processing':
        return 'Processando...';
      case 'results':
        return 'Resultados';
    }
  };

  const getStepIcon = () => {
    switch (currentStep) {
      case 'virtual-calibration':
        return <CreditCard className="w-5 h-5" />;
      case 'face-capture':
        return <Eye className="w-5 h-5" />;
      case 'processing':
        return <Camera className="w-5 h-5 animate-pulse" />;
      case 'results':
        return <CheckCircle className="w-5 h-5 text-success" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStepIcon()}
              <div>
                <CardTitle>Medição de Distância Nasopupilar (DNP)</CardTitle>
                <CardDescription>{getStepTitle()}</CardDescription>
              </div>
            </div>
            <Badge variant="outline">
              Passo {currentStep === 'virtual-calibration' ? '1' : currentStep === 'face-capture' ? '2' : currentStep === 'processing' ? '3' : '4'} de 4
            </Badge>
          </div>
          <Progress value={progress} className="w-full" />
        </CardHeader>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Erro: {error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step Content */}
      <Card>
        <CardContent className="pt-6">
          {currentStep === 'virtual-calibration' && (
            <VirtualCalibration
              onCalibrationComplete={handleVirtualCalibration}
              isProcessing={isProcessing}
            />
          )}

          {currentStep === 'face-capture' && (
            <ProfessionalFaceCapture
              pixelsPerMm={pixelsPerMm}
              onCaptureComplete={handleFaceCapture}
              isProcessing={isProcessing}
            />
          )}

          {currentStep === 'processing' && (
            <div className="text-center py-12">
              <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">Processando Medições</h3>
              <p className="text-muted-foreground">
                Analisando landmarks faciais e calculando distâncias...
              </p>
            </div>
          )}

          {currentStep === 'results' && measurements && (
            <DNPResults
              measurements={measurements}
              onRestart={handleRestart}
              config={config}
            />
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      {currentStep !== 'results' && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary" />
                Instruções de Qualidade
              </h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                {currentStep === 'virtual-calibration' && (
                  <>
                    <div>• Arraste as extremidades da régua para pontos de referência conhecidos</div>
                    <div>• Ajuste a distância real em milímetros</div>
                    <div>• Certifique-se de boa iluminação</div>
                    <div>• Use objetos de tamanho conhecido para referência</div>
                  </>
                )}
                {currentStep === 'face-capture' && (
                  <>
                    <div>• Posicione o rosto centralizado na câmera</div>
                    <div>• Mantenha os olhos bem abertos</div>
                    <div>• Olhe diretamente para a câmera</div>
                    <div>• Evite inclinação da cabeça</div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DNPMeasurementScreen;