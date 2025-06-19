
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Sparkles, 
  User,
  Heart,
  Star,
  Palette
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import CameraCapture from '@/components/CameraCapture';

const FrameSuggestionPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'capture' | 'analysis' | 'suggestions'>('capture');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

  const faceAnalysis = {
    shape: 'Oval',
    skinTone: 'Médio',
    eyeDistance: 'Normal',
    recommendations: [
      {
        style: 'Gatinho (Cat-eye)',
        description: 'Realça a elegância natural do rosto oval',
        colors: ['Preto', 'Tartaruga', 'Dourado'],
        confidence: 95
      },
      {
        style: 'Aviador',
        description: 'Complementa bem as proporções faciais',
        colors: ['Dourado', 'Prata', 'Preto'],
        confidence: 88
      },
      {
        style: 'Redondo Vintage',
        description: 'Adiciona charme retrô ao visual',
        colors: ['Tartaruga', 'Transparente', 'Vinho'],
        confidence: 82
      }
    ]
  };

  const handlePhotoCapture = (imageData: string) => {
    setCapturedPhoto(imageData);
    setStep('analysis');
    setTimeout(() => setStep('suggestions'), 3000);
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
              <h1 className="text-xl font-semibold text-gray-900">Sugestão Inteligente de Armação</h1>
              <p className="text-sm text-gray-600">Análise facial e recomendações personalizadas</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              ['capture', 'analysis', 'suggestions'].indexOf(step) >= 0 ? 'bg-success text-white' : 'bg-gray-300'
            }`}>
              <User className="h-4 w-4" />
            </div>
            <div className={`w-16 h-0.5 ${
              ['analysis', 'suggestions'].indexOf(step) >= 0 ? 'bg-success' : 'bg-gray-300'
            }`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              ['analysis', 'suggestions'].indexOf(step) >= 0 ? 'bg-success text-white' : 'bg-gray-300'
            }`}>
              <Sparkles className="h-4 w-4" />
            </div>
            <div className={`w-16 h-0.5 ${
              step === 'suggestions' ? 'bg-success' : 'bg-gray-300'
            }`} />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              step === 'suggestions' ? 'bg-success text-white' : 'bg-gray-300'
            }`}>
              <Heart className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Step: Capture */}
        {step === 'capture' && (
          <Card className="animate-fade-in">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Captura para Análise Facial</CardTitle>
              <CardDescription className="text-base">
                Tire uma foto frontal do cliente <strong>sem óculos</strong> para análise do formato facial
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <CameraCapture 
                  onCapture={handlePhotoCapture}
                  showGuides={true}
                  guideType="face-analysis"
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <User className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                    <p className="font-medium">Sem Óculos</p>
                    <p className="text-sm text-gray-600">Remover armação atual</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Sparkles className="h-8 w-8 mx-auto mb-2 text-success" />
                    <p className="font-medium">Rosto Centralizado</p>
                    <p className="text-sm text-gray-600">Dentro do oval guia</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Palette className="h-8 w-8 mx-auto mb-2 text-warning" />
                    <p className="font-medium">Boa Iluminação</p>
                    <p className="text-sm text-gray-600">Para análise precisa</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step: Analysis */}
        {step === 'analysis' && (
          <Card className="animate-fade-in">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Analisando Características Faciais</CardTitle>
              <CardDescription>
                Nossa IA está processando formato facial, proporções e tom de pele
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              {capturedPhoto && (
                <div className="aspect-video bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg mb-6 overflow-hidden">
                  <img 
                    src={capturedPhoto} 
                    alt="Foto para análise facial"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="text-center mb-6">
                <div className="relative mx-auto mb-4">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-success"></div>
                  <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-success" />
                </div>
                <p className="text-lg font-medium">Análise em andamento...</p>
                <p className="text-sm text-gray-600">Identificando características únicas</p>
              </div>

              <div className="space-y-3 text-left max-w-md mx-auto">
                <div className="flex items-center text-sm">
                  <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                  Detecção do formato facial: Concluída
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                  Análise de proporções: Concluída
                </div>
                <div className="flex items-center text-sm">
                  <div className="animate-pulse w-4 h-4 bg-yellow-500 rounded-full mr-3"></div>
                  Identificação do tom de pele: Em andamento...
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-4 h-4 bg-gray-300 rounded-full mr-3"></div>
                  Geração de recomendações: Aguardando...
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step: Suggestions */}
        {step === 'suggestions' && (
          <div className="space-y-6 animate-fade-in">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-success">Análise Completa!</CardTitle>
                <CardDescription>
                  Encontramos as armações perfeitas para este cliente
                </CardDescription>
              </CardHeader>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Análise Facial */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Análise Facial
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {capturedPhoto && (
                    <div className="mb-4">
                      <img 
                        src={capturedPhoto} 
                        alt="Foto analisada"
                        className="w-full h-32 object-cover rounded border"
                      />
                    </div>
                  )}
                  
                  <div>
                    <p className="font-medium text-sm text-gray-600">Formato do Rosto</p>
                    <p className="text-lg font-bold text-success">{faceAnalysis.shape}</p>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-600">Tom de Pele</p>
                    <p className="text-lg font-bold">{faceAnalysis.skinTone}</p>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-600">Distância entre Olhos</p>
                    <p className="text-lg font-bold">{faceAnalysis.eyeDistance}</p>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600 mb-2">Características Detectadas:</p>
                    <div className="space-y-1">
                      <Badge variant="secondary" className="text-xs">Simetria facial excelente</Badge>
                      <br />
                      <Badge variant="secondary" className="text-xs">Proporções harmoniosas</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recomendações */}
              <div className="lg:col-span-2 space-y-4">
                {faceAnalysis.recommendations.map((rec, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-bold">{rec.style}</h3>
                            <div className="flex items-center text-yellow-500">
                              <Star className="h-4 w-4 fill-current" />
                              <span className="text-sm font-medium ml-1">{rec.confidence}%</span>
                            </div>
                          </div>
                          <p className="text-gray-600">{rec.description}</p>
                        </div>
                        {index === 0 && (
                          <Badge className="bg-success text-white">
                            Recomendação Principal
                          </Badge>
                        )}
                      </div>
                      
                      <div>
                        <p className="font-medium text-sm text-gray-600 mb-2">Cores Recomendadas:</p>
                        <div className="flex gap-2">
                          {rec.colors.map((color, colorIndex) => (
                            <Badge key={colorIndex} variant="outline" className="text-xs">
                              {color}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="mt-4 flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          Ver Modelos
                        </Button>
                        <Button size="sm" className="flex-1 bg-success hover:bg-success/90">
                          Salvar Sugestão
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <Button 
                onClick={() => {
                  setStep('capture');
                  setCapturedPhoto(null);
                }}
                variant="outline"
                className="flex-1 h-12"
              >
                Nova Análise
              </Button>
              <Button 
                onClick={() => navigate('/optica')}
                className="flex-1 h-12 bg-success hover:bg-success/90"
              >
                Concluir
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FrameSuggestionPage;
