
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle,
  Ruler,
  Eye,
  User,
  Printer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import CameraCapture from '@/components/CameraCapture';

const MeasurementPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'setup' | 'capture' | 'measure' | 'results'>('setup');
  const [clientName, setClientName] = useState('');
  const [frameWidth, setFrameWidth] = useState('');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [measurements, setMeasurements] = useState({
    dp: '',
    dnpLeft: '',
    dnpRight: '',
    heightLeft: '',
    heightRight: '',
    lensWidth: ''
  });

  const handleStartMeasurement = () => {
    if (clientName && frameWidth) {
      setStep('capture');
    }
  };

  const handlePhotoCapture = (imageData: string) => {
    setCapturedPhoto(imageData);
    setStep('measure');
    
    // Simular processamento das medidas
    setTimeout(() => {
      setMeasurements({
        dp: '62.5',
        dnpLeft: '31.0',
        dnpRight: '31.5',
        heightLeft: '22.0',
        heightRight: '22.2',
        lensWidth: '52.0'
      });
      setStep('results');
    }, 3000);
  };

  const handleSaveAndPrint = () => {
    console.log('Salvando aferição:', {
      client: clientName,
      frameWidth,
      photo: capturedPhoto,
      measurements,
      timestamp: new Date().toISOString()
    });
    navigate('/optica');
  };

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/optica')}
              className="mr-4"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Aferição de Medidas Ópticas</h1>
              <p className="text-sm text-gray-600">Captura e medição precisa das distâncias pupilares</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              ['setup', 'capture', 'measure', 'results'].indexOf(step) >= 0 ? 'bg-primary text-white' : 'bg-gray-300'
            }`}>
              <User className="h-4 w-4" />
            </div>
            <div className={`w-16 h-0.5 ${
              ['capture', 'measure', 'results'].indexOf(step) >= 0 ? 'bg-primary' : 'bg-gray-300'
            }`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              ['capture', 'measure', 'results'].indexOf(step) >= 0 ? 'bg-primary text-white' : 'bg-gray-300'
            }`}>
              <Eye className="h-4 w-4" />
            </div>
            <div className={`w-16 h-0.5 ${
              ['measure', 'results'].indexOf(step) >= 0 ? 'bg-primary' : 'bg-gray-300'
            }`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              ['measure', 'results'].indexOf(step) >= 0 ? 'bg-primary text-white' : 'bg-gray-300'
            }`}>
              <Ruler className="h-4 w-4" />
            </div>
            <div className={`w-16 h-0.5 ${
              step === 'results' ? 'bg-primary' : 'bg-gray-300'
            }`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step === 'results' ? 'bg-primary text-white' : 'bg-gray-300'
            }`}>
              <CheckCircle className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Step: Setup */}
        {step === 'setup' && (
          <Card className="animate-fade-in">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Dados do Cliente</CardTitle>
              <CardDescription>
                Informe os dados básicos antes de iniciar a aferição
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label htmlFor="clientName" className="block text-sm font-medium mb-2">
                  Nome do Cliente *
                </label>
                <Input
                  id="clientName"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Digite o nome completo do cliente"
                  className="h-12 text-base"
                />
              </div>
              
              <div>
                <label htmlFor="frameWidth" className="block text-sm font-medium mb-2">
                  Largura Interna da Armação (mm) *
                </label>
                <Input
                  id="frameWidth"
                  value={frameWidth}
                  onChange={(e) => setFrameWidth(e.target.value)}
                  placeholder="Ex: 135"
                  type="number"
                  className="h-12 text-base"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Esta medida é essencial para calcular a escala de conversão pixel→mm
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-amber-600 mr-2 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-800">Instruções Importantes:</p>
                    <ul className="list-disc list-inside mt-2 text-amber-700 space-y-1">
                      <li>Cliente deve estar com a armação posicionada no rosto</li>
                      <li>Distância da câmera: 40 cm (padrão)</li>
                      <li>Iluminação frontal, sem sombras</li>
                      <li>Rosto centralizado e nivelado</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleStartMeasurement}
                disabled={!clientName || !frameWidth}
                className="w-full h-14 text-lg font-medium"
              >
                Iniciar Aferição
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step: Capture */}
        {step === 'capture' && (
          <Card className="animate-fade-in">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Captura da Foto</CardTitle>
              <CardDescription>
                Posicione o cliente conforme as diretrizes e capture a foto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CameraCapture 
                onCapture={handlePhotoCapture}
                showGuides={true}
                guideType="measurement"
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="text-center p-4 border rounded-lg">
                  <Eye className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="font-medium">Alinhamento dos Olhos</p>
                  <p className="text-sm text-gray-600">Na linha amarela superior</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <Ruler className="h-8 w-8 mx-auto mb-2 text-success" />
                  <p className="font-medium">Distância Calibrada</p>
                  <p className="text-sm text-gray-600">40cm da câmera</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step: Measure */}
        {step === 'measure' && (
          <Card className="animate-fade-in">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Processando Medições</CardTitle>
              <CardDescription>
                Analisando a foto e calculando as medidas automaticamente
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              {capturedPhoto && (
                <div className="aspect-video bg-gray-100 rounded-lg mb-6 overflow-hidden">
                  <img 
                    src={capturedPhoto} 
                    alt="Foto capturada para análise" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="text-center mb-6">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-lg font-medium">Analisando imagem...</p>
                <p className="text-sm text-gray-600">Calculando distâncias pupilares</p>
              </div>

              <div className="space-y-2 text-left max-w-md mx-auto">
                <div className="flex items-center text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  Detecção facial: Concluída
                </div>
                <div className="flex items-center text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  Identificação das pupilas: Concluída
                </div>
                <div className="flex items-center text-sm">
                  <div className="animate-spin rounded-full h-4 w-4 border-b border-primary mr-2"></div>
                  Cálculo das medidas: Em andamento...
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step: Results */}
        {step === 'results' && (
          <div className="space-y-6 animate-fade-in">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-green-600">Aferição Concluída!</CardTitle>
                <CardDescription>
                  Todas as medidas foram calculadas com precisão
                </CardDescription>
              </CardHeader>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Dados do Cliente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p><strong>Nome:</strong> {clientName}</p>
                    <p><strong>Data:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
                    <p><strong>Horário:</strong> {new Date().toLocaleTimeString('pt-BR')}</p>
                    <p><strong>Armação:</strong> {frameWidth}mm</p>
                  </div>
                  {capturedPhoto && (
                    <div className="mt-4">
                      <img 
                        src={capturedPhoto} 
                        alt="Foto do cliente"
                        className="w-full h-32 object-cover rounded border"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Medidas Aferidas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="font-medium">DP (Binocular):</span>
                      <span className="text-lg font-bold text-primary">{measurements.dp} mm</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-center p-2 border rounded">
                        <p className="text-sm text-gray-600">DNP Esquerda</p>
                        <p className="font-bold">{measurements.dnpLeft} mm</p>
                      </div>
                      <div className="text-center p-2 border rounded">
                        <p className="text-sm text-gray-600">DNP Direita</p>
                        <p className="font-bold">{measurements.dnpRight} mm</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-center p-2 border rounded">
                        <p className="text-sm text-gray-600">Altura E</p>
                        <p className="font-bold">{measurements.heightLeft} mm</p>
                      </div>
                      <div className="text-center p-2 border rounded">
                        <p className="text-sm text-gray-600">Altura D</p>
                        <p className="font-bold">{measurements.heightRight} mm</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="font-medium">Largura da Lente:</span>
                      <span className="text-lg font-bold text-success">{measurements.lensWidth} mm</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex gap-4">
              <Button 
                onClick={handleSaveAndPrint}
                className="flex-1 h-14 text-lg font-medium"
              >
                <Printer className="h-5 w-5 mr-2" />
                Salvar e Imprimir Ficha
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  setStep('setup');
                  setCapturedPhoto(null);
                  setClientName('');
                  setFrameWidth('');
                }}
                className="h-14 px-8"
              >
                Nova Aferição
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeasurementPage;
