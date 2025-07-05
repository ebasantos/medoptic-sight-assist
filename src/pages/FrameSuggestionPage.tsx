
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Camera, Glasses, Brain, CheckCircle, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import CameraCapture from '@/components/CameraCapture';
import FaceAnalysisLoader from '@/components/FaceAnalysisLoader';
import { VirtualTryOn } from '@/components/VirtualTryOn';
import { useFacialMeasurements } from '@/hooks/useFacialMeasurements';

const FrameSuggestionPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { isAnalyzing, faceAnalysis, error, analyzeFaceCharacteristics } = useFacialMeasurements();
  
  const [step, setStep] = useState<'camera' | 'analysis' | 'simulation'>('camera');
  const [saving, setSaving] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [simulatedImage, setSimulatedImage] = useState<string | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStage, setAnalysisStage] = useState<'capturing' | 'compressing' | 'analyzing' | 'processing'>('capturing');
  
  const [formData, setFormData] = useState({
    nomeCliente: ''
  });

  const handleImageCapture = async (imageData: string) => {
    console.log('Imagem capturada na página de sugestão');
    setCapturedImage(imageData);
    
    try {
      console.log('Iniciando análise automática das características faciais...');
      
      // Simular progresso da análise
      setAnalysisStage('compressing');
      setAnalysisProgress(10);
      
      // Pequeno delay para mostrar o loader
      await new Promise(resolve => setTimeout(resolve, 500));
      setAnalysisProgress(25);
      
      setAnalysisStage('analyzing');
      setAnalysisProgress(40);
      
      // Analisar características automaticamente
      const result = await analyzeFaceCharacteristics(imageData);
      
      setAnalysisStage('processing');
      setAnalysisProgress(90);
      
      await new Promise(resolve => setTimeout(resolve, 300));
      setAnalysisProgress(100);
      
      console.log('Análise completada:', result);
      
      setStep('analysis');
      
      toast({
        title: "Análise Completada!",
        description: "Características faciais detectadas com sucesso"
      });
    } catch (error) {
      console.error('Erro na análise automática:', error);
      
      // Mensagem de erro mais específica
      let errorMessage = "Erro ao analisar características faciais.";
      if (error instanceof Error) {
        if (error.message.includes('TIMEOUT') || error.message.includes('timeout')) {
          errorMessage = "A análise demorou muito para responder. Tente novamente com uma foto mais clara.";
        } else if (error.message.includes('limite') || error.message.includes('excedido')) {
          errorMessage = "Limite de análises excedido. Tente novamente em alguns minutos.";
        } else if (error.message.includes('imagem')) {
          errorMessage = "Problema com a qualidade da imagem. Tente capturar novamente com melhor iluminação.";
        }
      }
      
      toast({
        title: "Erro na Análise",
        description: errorMessage,
        variant: "destructive"
      });
      
      // Permitir ir para a próxima etapa mesmo com erro
      setStep('analysis');
    } finally {
      setAnalysisProgress(0);
    }
  };

  const retryAnalysis = async () => {
    if (!capturedImage) return;
    
    try {
      setAnalysisStage('analyzing');
      setAnalysisProgress(30);
      
      const result = await analyzeFaceCharacteristics(capturedImage);
      setAnalysisProgress(100);
      
      toast({
        title: "Análise Completada!",
        description: "Características faciais detectadas com sucesso"
      });
    } catch (error) {
      console.error('Erro na nova tentativa:', error);
      toast({
        title: "Erro Persistente",
        description: "Não foi possível analisar a imagem. Sugestões genéricas serão usadas.",
        variant: "destructive"
      });
    } finally {
      setAnalysisProgress(0);
    }
  };

  const uploadImage = async (imageData: string): Promise<string | null> => {
    try {
      // Converter base64 para blob
      const base64Data = imageData.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });
      
      // Gerar nome único para o arquivo
      const fileName = `analise_${Date.now()}.jpg`;
      
      // Upload para Supabase Storage
      const { data, error } = await supabase.storage
        .from('fotos-clientes')
        .upload(fileName, blob);

      if (error) {
        console.error('Erro no upload:', error);
        return null;
      }

      // Obter URL pública
      const { data: publicData } = supabase.storage
        .from('fotos-clientes')
        .getPublicUrl(fileName);

      return publicData.publicUrl;
    } catch (error) {
      console.error('Erro ao processar upload:', error);
      return null;
    }
  };

  const generateSuggestions = () => {
    if (!faceAnalysis) {
      // Retornar sugestões genéricas se não houver análise
      return [
        {
          tipo: 'Armação Clássica',
          motivo: 'Versátil para diversos formatos de rosto'
        },
        {
          tipo: 'Armação Moderna',
          motivo: 'Design contemporâneo e elegante'
        },
        {
          tipo: 'Armação Neutra',
          motivo: 'Cores que combinam com qualquer tom de pele'
        }
      ];
    }
    
    const suggestions = [];
    
    // Lógica de sugestões baseada no formato do rosto detectado
    switch (faceAnalysis.formatoRosto.toLowerCase()) {
      case 'oval':
        suggestions.push({
          tipo: 'Armação Quadrada',
          motivo: 'Complementa a harmonia natural do rosto oval'
        });
        suggestions.push({
          tipo: 'Armação Redonda Vintage',
          motivo: 'Mantém o equilíbrio das proporções'
        });
        break;
      case 'redondo':
        suggestions.push({
          tipo: 'Armação Quadrada Angular',
          motivo: 'Adiciona definição e estrutura ao rosto'
        });
        suggestions.push({
          tipo: 'Armação Retangular Moderna',
          motivo: 'Alonga visualmente o rosto'
        });
        break;
      case 'quadrado':
        suggestions.push({
          tipo: 'Armação Redonda Clássica',
          motivo: 'Suaviza os ângulos marcantes'
        });
        suggestions.push({
          tipo: 'Armação Oval Elegante',
          motivo: 'Cria harmonia com as linhas faciais'
        });
        break;
      case 'coração':
      case 'triangular':
        suggestions.push({
          tipo: 'Armação Cat-Eye',
          motivo: 'Equilibra a testa mais larga'
        });
        suggestions.push({
          tipo: 'Armação Oval Pequena',
          motivo: 'Harmoniza com o queixo mais fino'
        });
        break;
      case 'losango':
        suggestions.push({
          tipo: 'Armação Oval Larga',
          motivo: 'Suaviza os ângulos e alarga o rosto'
        });
        suggestions.push({
          tipo: 'Armação Aviador',
          motivo: 'Equilibra as proporções do rosto'
        });
        break;
      case 'retangular':
      case 'alongado':
        suggestions.push({
          tipo: 'Armação Redonda Grande',
          motivo: 'Quebra as linhas retas e adiciona suavidade'
        });
        suggestions.push({
          tipo: 'Armação Oversized',
          motivo: 'Cria equilíbrio com o rosto alongado'
        });
        break;
      default:
        suggestions.push({
          tipo: 'Armação Clássica',
          motivo: 'Versátil para diversos formatos'
        });
    }

    // Adicionar sugestões baseadas no tom de pele
    const tomPele = faceAnalysis.tomPele.toLowerCase();
    if (tomPele.includes('claro')) {
      suggestions.push({
        tipo: 'Cores Suaves (Marrom/Dourado)',
        motivo: 'Tons mais suaves harmonizam com pele clara'
      });
    } else if (tomPele.includes('escuro') || tomPele.includes('bronzeado')) {
      suggestions.push({
        tipo: 'Cores Vibrantes (Dourado/Bronze)',
        motivo: 'Tons mais intensos realçam a beleza natural da pele'
      });
    } else if (tomPele.includes('médio')) {
      suggestions.push({
        tipo: 'Cores Versáteis (Preto/Marrom)',
        motivo: 'Tom de pele médio permite grande variedade de cores'
      });
    }

    return suggestions;
  };

  const handleSave = async () => {
    if (!user || !capturedImage) return;

    setSaving(true);
    try {
      // Upload da imagem original
      const fotoUrl = await uploadImage(capturedImage);
      
      // Upload da imagem simulada se existir
      let simulacaoUrl = null;
      if (simulatedImage) {
        simulacaoUrl = await uploadImage(simulatedImage);
      }
      
      if (!fotoUrl) {
        toast({
          title: "Erro",
          description: "Erro ao fazer upload da imagem",
          variant: "destructive"
        });
        return;
      }

      // Obter o user_id do auth do usuário logado
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        toast({
          title: "Erro",
          description: "Usuário não autenticado",
          variant: "destructive"
        });
        return;
      }

      const sugestoes = generateSuggestions();

      // Salvar análise no banco usando o user_id correto do auth
      const { error } = await supabase
        .from('analises_faciais')
        .insert({
          optica_id: user.opticId!,
          usuario_id: authUser.id,
          nome_cliente: formData.nomeCliente,
          foto_url: fotoUrl,
          formato_rosto: faceAnalysis?.formatoRosto || 'indefinido',
          tom_pele: faceAnalysis?.tomPele || 'indefinido',
          distancia_olhos: faceAnalysis?.distanciaOlhos || 'indefinido',
          sugestoes: {
            ...sugestoes,
            simulacao_url: simulacaoUrl
          }
        });

      if (error) {
        console.error('Erro ao salvar análise:', error);
        toast({
          title: "Erro",
          description: "Erro ao salvar análise facial",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Análise facial salva com sucesso!"
      });

      navigate('/optica');
    } catch (error) {
      console.error('Erro:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSimulatedImageSave = (imageData: string) => {
    setSimulatedImage(imageData);
    toast({
      title: "Simulação Salva",
      description: "Imagem com armação simulada foi salva!"
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p>Você precisa estar logado para acessar esta página.</p>
            <Button onClick={() => navigate('/')} className="mt-4">
              Fazer Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sugestoes = generateSuggestions();

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (step === 'simulation') {
                setStep('analysis');
              } else if (step === 'analysis') {
                setStep('camera');
              } else {
                navigate('/optica');
              }
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
            {step === 'camera' ? 'Capturar Foto do Cliente' : 
             step === 'analysis' ? 'Análise Facial Automática' : 
             'Simulação de Armação'}
          </h1>
        </div>

        {/* Loader durante análise */}
        {isAnalyzing && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <FaceAnalysisLoader progress={analysisProgress} stage={analysisStage} />
          </div>
        )}

        {step === 'camera' && (
          <CameraCapture
            onCapture={handleImageCapture}
            showGuides={true}
            guideType="face-analysis"
          />
        )}

        {step === 'analysis' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Foto capturada */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Foto Capturada
                </CardTitle>
              </CardHeader>
              <CardContent>
                {capturedImage && (
                  <img 
                    src={capturedImage} 
                    alt="Cliente" 
                    className="w-full h-64 object-cover rounded-lg"
                  />
                )}
              </CardContent>
            </Card>

            {/* Análise automática */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Análise Automática
                  {error && (
                    <Button
                      onClick={retryAnalysis}
                      size="sm"
                      variant="outline"
                      className="ml-auto"
                      disabled={isAnalyzing}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Tentar Novamente
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-red-600 text-sm font-medium">Análise automática falhou</p>
                      <p className="text-red-500 text-xs mt-1">{error}</p>
                      <p className="text-gray-600 text-xs mt-2">
                        ✓ Sugestões genéricas serão exibidas<br/>
                        ✓ Você pode tentar analisar novamente<br/>
                        ✓ Ou continuar com as sugestões básicas
                      </p>
                    </div>
                  </div>
                )}

                {faceAnalysis && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-green-600 mb-3">
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-medium">Análise Concluída com Sucesso</span>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <Label className="font-semibold text-blue-900">Formato do Rosto</Label>
                        <p className="text-blue-700 capitalize">{faceAnalysis.formatoRosto}</p>
                      </div>
                      
                      <div className="p-3 bg-green-50 rounded-lg">
                        <Label className="font-semibold text-green-900">Tom de Pele</Label>
                        <p className="text-green-700 capitalize">{faceAnalysis.tomPele}</p>
                      </div>
                      
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <Label className="font-semibold text-purple-900">Distância entre Olhos</Label>
                        <p className="text-purple-700 capitalize">{faceAnalysis.distanciaOlhos}</p>
                      </div>
                      
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <Label className="font-semibold text-gray-900">Confiabilidade</Label>
                        <p className="text-gray-700">{Math.round((faceAnalysis.confiabilidade || 0) * 100)}%</p>
                      </div>
                    </div>

                    {faceAnalysis.observacoes && (
                      <div className="p-3 bg-yellow-50 rounded-lg">
                        <Label className="font-semibold text-yellow-900">Observações da IA</Label>
                        <p className="text-yellow-700 text-sm">{faceAnalysis.observacoes}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-4 border-t">
                  <Label htmlFor="nomeCliente">Nome do Cliente *</Label>
                  <Input
                    id="nomeCliente"
                    value={formData.nomeCliente}
                    onChange={(e) => setFormData({ ...formData, nomeCliente: e.target.value })}
                    placeholder="Digite o nome do cliente"
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleSave}
                    disabled={saving || !formData.nomeCliente}
                    variant="outline"
                    className="flex-1"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Salvando...' : 'Salvar Apenas Análise'}
                  </Button>
                  
                  {(faceAnalysis || error) && (
                    <Button
                      onClick={() => setStep('simulation')}
                      disabled={!formData.nomeCliente}
                      className="flex-1"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Simular Armação
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Sugestões */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Glasses className="h-5 w-5" />
                  Sugestões de Armação 
                  {faceAnalysis ? '(Baseadas na Análise IA)' : '(Sugestões Genéricas)'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sugestoes.map((sugestao, index) => (
                    <div key={index} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h3 className="font-semibold text-blue-900">{sugestao.tipo}</h3>
                      <p className="text-sm text-blue-700 mt-1">{sugestao.motivo}</p>
                    </div>
                  ))}
                </div>
                
                {!faceAnalysis && (
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-amber-800 text-sm">
                      💡 <strong>Dica:</strong> Para sugestões mais precisas, tente capturar novamente uma foto com boa iluminação e o rosto bem centralizado.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {step === 'simulation' && capturedImage && (
          <div className="space-y-6">
            <VirtualTryOn
              originalImage={capturedImage}
              faceAnalysis={faceAnalysis || {
                formatoRosto: 'oval',
                tomPele: 'médio',
                distanciaOlhos: 'normal',
                confiabilidade: 0.8,
                observacoes: 'Análise genérica'
              }}
              suggestions={sugestoes}
              onSave={handleSimulatedImageSave}
            />
            
            <Card>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="nomeClienteSimulacao">Nome do Cliente *</Label>
                    <Input
                      id="nomeClienteSimulacao"
                      value={formData.nomeCliente}
                      onChange={(e) => setFormData({ ...formData, nomeCliente: e.target.value })}
                      placeholder="Digite o nome do cliente"
                      required
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <Button 
                      onClick={handleSave}
                      disabled={saving || !formData.nomeCliente}
                      className="h-10"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Salvando...' : 'Salvar com Simulação'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default FrameSuggestionPage;
