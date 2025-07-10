import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Camera, Brain, AlertTriangle, CheckCircle, Glasses, Eye, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import CameraCapture from '@/components/CameraCapture';
import { useFacialMeasurements } from '@/hooks/useFacialMeasurements';
import { InteractivePupilMeasurement } from '@/components/InteractivePupilMeasurement';

const MeasurementPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [step, setStep] = useState<'camera' | 'measurements' | 'interactive'>('camera');
  const [loading, setSaving] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [measurementCalculated, setMeasurementCalculated] = useState(false);
  const [useInteractiveMode, setUseInteractiveMode] = useState(true);
  const [interactiveMeasurements, setInteractiveMeasurements] = useState<any>(null);
  
  const { isAnalyzing, measurements: aiMeasurements, error: analysisError, analyzeFacialMeasurements } = useFacialMeasurements();
  
  // Use interactive measurements if available, otherwise use AI measurements
  const measurements = interactiveMeasurements || aiMeasurements;
  
  const [formData, setFormData] = useState({
    nomeCliente: '',
    larguraArmacao: ''
  });

  const handleImageCapture = (imageData: string) => {
    console.log('Imagem capturada na página de medição');
    setCapturedImage(imageData);
    setStep(useInteractiveMode ? 'interactive' : 'measurements');
    setMeasurementCalculated(false);
  };

  const handleInteractiveMeasurements = (measurementData: any) => {
    console.log('Medições interativas recebidas:', measurementData);
    setInteractiveMeasurements(measurementData);
    setMeasurementCalculated(true);
    setStep('measurements');
  };

  const handleAutoAnalysis = async () => {
    if (!capturedImage) {
      toast({
        title: "Foto necessária",
        description: "É necessário capturar uma foto antes da análise automática",
        variant: "destructive"
      });
      return;
    }

    try {
      const frameWidth = formData.larguraArmacao ? parseFloat(formData.larguraArmacao) : 50;
      
      await analyzeFacialMeasurements(capturedImage, frameWidth);
      setMeasurementCalculated(true);
      
      toast({
        title: "Medições calculadas automaticamente",
        description: `Análise concluída com ${Math.round((aiMeasurements?.confiabilidade || 0) * 100)}% de confiança`,
      });
    } catch (error) {
      toast({
        title: "Erro na análise",
        description: "Não foi possível analisar a imagem automaticamente. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const uploadImage = async (imageData: string): Promise<string | null> => {
    try {
      console.log('Iniciando upload da imagem...');
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Erro ao verificar sessão:', sessionError);
        throw new Error('Erro ao verificar autenticação');
      }
      
      if (!session?.user) {
        console.error('Usuário não autenticado');
        throw new Error('Usuário não autenticado. Faça login novamente.');
      }
      
      console.log('Usuário autenticado:', session.user.id);
      
      const base64Data = imageData.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });
      
      const fileName = `afericao_${session.user.id}_${Date.now()}.jpg`;
      console.log('Nome do arquivo:', fileName);
      console.log('Tamanho do arquivo:', blob.size, 'bytes');
      
      console.log('Fazendo upload para o bucket fotos-clientes...');
      const { data, error } = await supabase.storage
        .from('fotos-clientes')
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/jpeg'
        });

      if (error) {
        console.error('Erro detalhado no upload:', error);
        console.error('Mensagem do erro:', error.message);
        
        if (error.message?.includes('row-level security')) {
          throw new Error('Erro de permissão no storage. Verifique as políticas RLS.');
        }
        
        throw new Error(`Erro no upload: ${error.message}`);
      }

      console.log('Upload realizado com sucesso:', data);

      const { data: publicData } = supabase.storage
        .from('fotos-clientes')
        .getPublicUrl(fileName);

      console.log('URL pública gerada:', publicData.publicUrl);
      return publicData.publicUrl;
    } catch (error) {
      console.error('Erro ao processar upload:', error);
      throw error;
    }
  };

  const handleSave = async () => {
    if (!user || !capturedImage || !measurements) {
      toast({
        title: "Dados incompletos",
        description: "É necessário ter uma foto e medições calculadas para salvar",
        variant: "destructive"
      });
      return;
    }

    if (!formData.nomeCliente.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "É necessário informar o nome do cliente",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast({
          title: "Sessão expirada",
          description: "Sua sessão expirou. Faça login novamente.",
          variant: "destructive"
        });
        navigate('/');
        return;
      }

      console.log('Fazendo upload da imagem...');
      const fotoUrl = await uploadImage(capturedImage);
      
      if (!fotoUrl) {
        toast({
          title: "Erro no upload",
          description: "Erro ao fazer upload da imagem. Tente novamente.",
          variant: "destructive"
        });
        return;
      }

      console.log('Salvando aferição no banco de dados...');
      
      const larguraArmacao = formData.larguraArmacao ? parseFloat(formData.larguraArmacao) : 50;
      
      const { error } = await supabase
        .from('afericoes')
        .insert({
          optica_id: user.opticId!,
          usuario_id: session.user.id,
          nome_cliente: formData.nomeCliente.trim(),
          foto_url: fotoUrl,
          largura_armacao: larguraArmacao,
          dp_binocular: measurements.dpBinocular,
          dnp_esquerda: measurements.dnpEsquerda,
          dnp_direita: measurements.dnpDireita,
          altura_esquerda: measurements.alturaEsquerda,
          altura_direita: measurements.alturaDireita,
          largura_lente: measurements.larguraLente
        });

      if (error) {
        console.error('Erro ao salvar aferição:', error);
        toast({
          title: "Erro ao salvar",
          description: `Erro ao salvar aferição: ${error.message}`,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Aferição salva com sucesso!"
      });

      navigate('/optica');
    } catch (error) {
      console.error('Erro:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro inesperado ao salvar aferição';
      
      if (errorMessage.includes('não autenticado')) {
        navigate('/');
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Acesso Restrito</h3>
            <p className="text-gray-600 mb-4">Você precisa estar logado para acessar esta página.</p>
            <Button onClick={() => navigate('/')} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Fazer Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-blue-100 sticky top-0 z-40">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (step === 'measurements') setStep('interactive');
                  else if (step === 'interactive') setStep('camera');
                  else navigate('/optica');
                }}
                className="border-blue-200 hover:bg-blue-50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-gray-900`}>
                  {step === 'camera' ? 'Captura de Foto' : 
                   step === 'interactive' ? 'Medição Interativa' : 'Dados da Aferição'}
                </h1>
                {!isMobile && (
                  <p className="text-sm text-gray-600">
                    {step === 'camera' ? 'Posicione o cliente para uma foto padronizada' : 
                     step === 'interactive' ? 'Ajuste manualmente as posições das pupilas' : 'Análise automática com IA'}
                  </p>
                )}
              </div>
            </div>
            <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <Sparkles className="w-3 h-3 mr-1" />
              IA Ativa
            </Badge>
          </div>
          
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
              <span className={step === 'camera' ? 'text-blue-600 font-medium' : ''}>Captura</span>
              <span className={step === 'interactive' ? 'text-blue-600 font-medium' : ''}>Ajuste</span>
              <span className={step === 'measurements' ? 'text-blue-600 font-medium' : ''}>Medições</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                style={{ 
                  width: step === 'camera' ? '33%' : 
                         step === 'interactive' ? '66%' : '100%' 
                }}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-6">
        {step === 'camera' && (
          <div className="max-w-2xl mx-auto">
            <CameraCapture
              onCapture={handleImageCapture}
              showGuides={true}
              guideType="measurement"
            />
          </div>
        )}

        {step === 'interactive' && capturedImage && (
          <div className="max-w-4xl mx-auto">
            <InteractivePupilMeasurement
              imageData={capturedImage}
              frameWidth={formData.larguraArmacao ? parseFloat(formData.larguraArmacao) : 50}
              hasGlasses={false} // Will be detected automatically in the component
              onMeasurementsChange={handleInteractiveMeasurements}
            />
          </div>
        )}

        {step === 'measurements' && (
          <div className={`${isMobile ? 'space-y-6' : 'grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto'}`}>
            <Card className="overflow-hidden bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <Camera className="h-5 w-5" />
                  Foto Capturada
                  <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                {capturedImage && (
                  <div className="aspect-video rounded-lg overflow-hidden bg-white shadow-lg">
                    <img 
                      src={capturedImage} 
                      alt="Cliente" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-2 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-blue-800">Dados da Aferição</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="nomeCliente" className="text-sm font-medium">Nome do Cliente *</Label>
                    <Input
                      id="nomeCliente"
                      value={formData.nomeCliente}
                      onChange={(e) => setFormData({ ...formData, nomeCliente: e.target.value })}
                      placeholder="Digite o nome do cliente"
                      className="mt-1"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="larguraArmacao" className="text-sm font-medium">Largura da Armação (mm) - Opcional</Label>
                    <Input
                      id="larguraArmacao"
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={formData.larguraArmacao}
                      onChange={(e) => setFormData({ ...formData, larguraArmacao: e.target.value })}
                      placeholder="Ex: 52.5 (padrão: 50mm)"
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Se não informada, será usado o valor padrão de 50mm
                    </p>
                  </div>
                </CardContent>
              </Card>

              {!measurementCalculated && (
                <div className="space-y-4">
                  <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                          <Eye className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-purple-900 mb-2">Medição Interativa (Recomendado)</h4>
                          <p className="text-purple-700 mb-4">
                            Ajuste manualmente as posições das pupilas para máxima precisão nas medidas.
                          </p>
                          <Button 
                            onClick={() => setStep('interactive')}
                            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Usar Medição Interativa
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                          <Brain className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-blue-900 mb-2">Análise Automática com IA</h4>
                          <p className="text-blue-700 mb-4">
                            Nossa IA analisará automaticamente a foto para calcular as medidas faciais.
                          </p>
                          <Button 
                            onClick={handleAutoAnalysis}
                            disabled={isAnalyzing || !capturedImage}
                            variant="outline"
                            className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
                          >
                            <Brain className="h-4 w-4 mr-2" />
                            {isAnalyzing ? 'Analisando...' : 'Calcular Medidas com IA'}
                          </Button>
                        </div>
                      </div>
                      
                      {analysisError && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 mt-0.5" />
                          <span>{analysisError}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {measurementCalculated && measurements && (
                <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-6">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                      <h4 className="font-bold text-green-900">Medidas Calculadas com Sucesso</h4>
                      <div className="ml-auto flex items-center gap-2">
                        {measurements.temOculos ? (
                          <>
                            <Glasses className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-700 font-medium">Com óculos</span>
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 text-blue-600" />
                            <span className="text-sm text-blue-700 font-medium">Sem óculos</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-white p-3 rounded-lg border">
                        <Label className="text-xs text-gray-600">DP Binocular</Label>
                        <div className="text-lg font-bold text-green-800">
                          {measurements.dpBinocular.toFixed(1)} mm
                        </div>
                      </div>
                      
                      <div className="bg-white p-3 rounded-lg border">
                        <Label className="text-xs text-gray-600">Largura da Lente</Label>
                        <div className="text-lg font-bold text-green-800">
                          {measurements.larguraLente.toFixed(1)} mm
                        </div>
                      </div>
                      
                      <div className="bg-white p-3 rounded-lg border">
                        <Label className="text-xs text-gray-600">DNP Esquerda</Label>
                        <div className="text-lg font-bold text-green-800">
                          {measurements.dnpEsquerda.toFixed(1)} mm
                        </div>
                      </div>
                      
                      <div className="bg-white p-3 rounded-lg border">
                        <Label className="text-xs text-gray-600">DNP Direita</Label>
                        <div className="text-lg font-bold text-green-800">
                          {measurements.dnpDireita.toFixed(1)} mm
                        </div>
                      </div>
                      
                      {measurements.temOculos && (
                        <>
                          <div className="bg-white p-3 rounded-lg border">
                            <Label className="text-xs text-gray-600">Altura Esquerda</Label>
                            <div className="text-lg font-bold text-green-800">
                              {measurements.alturaEsquerda.toFixed(1)} mm
                            </div>
                          </div>
                          
                          <div className="bg-white p-3 rounded-lg border">
                            <Label className="text-xs text-gray-600">Altura Direita</Label>
                            <div className="text-lg font-bold text-green-800">
                              {measurements.alturaDireita.toFixed(1)} mm
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    
                    {!measurements.temOculos && (
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          <span>Medidas de altura não disponíveis - pessoa sem óculos</span>
                        </div>
                      </div>
                    )}
                    
                    <div className="bg-white p-3 rounded-lg border mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Confiança da IA:</span>
                        <Badge className="bg-green-100 text-green-800">
                          {Math.round(measurements.confiabilidade * 100)}%
                        </Badge>
                      </div>
                      {measurements.observacoes && (
                        <p className="text-xs text-gray-600 mt-2">
                          <strong>Observações:</strong> {measurements.observacoes}
                        </p>
                      )}
                    </div>
                    
                    <Button 
                      onClick={() => setMeasurementCalculated(false)}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      Recalcular Medidas
                    </Button>
                  </CardContent>
                </Card>
              )}

              <Button 
                onClick={handleSave}
                disabled={loading || !formData.nomeCliente.trim() || !measurementCalculated}
                className="w-full h-14 text-lg bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 shadow-lg"
              >
                <Save className="h-5 w-5 mr-2" />
                {loading ? 'Salvando...' : 'Salvar Aferição'}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MeasurementPage;
