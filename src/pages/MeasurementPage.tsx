import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Camera, Brain, AlertTriangle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import CameraCapture from '@/components/CameraCapture';
import { useFacialMeasurements } from '@/hooks/useFacialMeasurements';

const MeasurementPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [step, setStep] = useState<'camera' | 'measurements'>('camera');
  const [loading, setSaving] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [measurementCalculated, setMeasurementCalculated] = useState(false);
  
  const { isAnalyzing, measurements, error: analysisError, analyzeFacialMeasurements } = useFacialMeasurements();
  
  const [formData, setFormData] = useState({
    nomeCliente: '',
    larguraArmacao: ''
  });

  const handleImageCapture = (imageData: string) => {
    console.log('Imagem capturada na página de medição');
    setCapturedImage(imageData);
    setStep('measurements');
    setMeasurementCalculated(false);
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

    if (!formData.larguraArmacao || parseFloat(formData.larguraArmacao) <= 0) {
      toast({
        title: "Informações incompletas",
        description: "É necessário informar a largura da armação (valor maior que 0) antes da análise automática",
        variant: "destructive"
      });
      return;
    }

    try {
      await analyzeFacialMeasurements(capturedImage, parseFloat(formData.larguraArmacao));
      setMeasurementCalculated(true);
      
      toast({
        title: "Medições calculadas automaticamente",
        description: `Análise concluída com ${Math.round((measurements?.confiabilidade || 0) * 100)}% de confiança`,
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
      console.log('Usuário atual:', user);
      
      if (!user?.id) {
        console.error('Usuário não autenticado');
        throw new Error('Usuário não autenticado');
      }
      
      // Converter base64 para blob
      const base64Data = imageData.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });
      
      const fileName = `afericao_${user.id}_${Date.now()}.jpg`;
      console.log('Nome do arquivo:', fileName);
      console.log('Tamanho do arquivo:', blob.size, 'bytes');
      
      // Verificar se o usuário está autenticado
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Sessão atual:', session ? 'Ativa' : 'Não encontrada');
      
      if (!session) {
        throw new Error('Sessão não encontrada. Faça login novamente.');
      }
      
      // Fazer upload para o storage
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

      // Obter URL pública
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
      console.log('Dados para inserir:', {
        optica_id: user.opticId,
        usuario_id: user.id,
        nome_cliente: formData.nomeCliente.trim(),
        foto_url: fotoUrl,
        largura_armacao: parseFloat(formData.larguraArmacao),
        dp_binocular: measurements.dpBinocular,
        dnp_esquerda: measurements.dnpEsquerda,
        dnp_direita: measurements.dnpDireita,
        altura_esquerda: measurements.alturaEsquerda,
        altura_direita: measurements.alturaDireita,
        largura_lente: measurements.larguraLente
      });

      const { error } = await supabase
        .from('afericoes')
        .insert({
          optica_id: user.opticId!,
          usuario_id: user.id,
          nome_cliente: formData.nomeCliente.trim(),
          foto_url: fotoUrl,
          largura_armacao: parseFloat(formData.larguraArmacao),
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

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => step === 'measurements' ? setStep('camera') : navigate('/optica')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
            {step === 'camera' ? 'Capturar Foto do Cliente' : 'Dados da Aferição'}
          </h1>
        </div>

        {step === 'camera' && (
          <CameraCapture
            onCapture={handleImageCapture}
            showGuides={true}
            guideType="measurement"
          />
        )}

        {step === 'measurements' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

            <Card>
              <CardHeader>
                <CardTitle>Dados da Aferição</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="nomeCliente">Nome do Cliente *</Label>
                  <Input
                    id="nomeCliente"
                    value={formData.nomeCliente}
                    onChange={(e) => setFormData({ ...formData, nomeCliente: e.target.value })}
                    placeholder="Digite o nome do cliente"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="larguraArmacao">Largura da Armação (mm) *</Label>
                  <Input
                    id="larguraArmacao"
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={formData.larguraArmacao}
                    onChange={(e) => setFormData({ ...formData, larguraArmacao: e.target.value })}
                    placeholder="Ex: 52.5"
                    required
                  />
                </div>

                {!measurementCalculated && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Brain className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium text-blue-900 mb-1">Análise Automática com IA</h4>
                          <p className="text-sm text-blue-700 mb-3">
                            Clique para calcular automaticamente todas as medidas faciais a partir da foto.
                          </p>
                          <Button 
                            onClick={handleAutoAnalysis}
                            disabled={isAnalyzing || !capturedImage || !formData.larguraArmacao || parseFloat(formData.larguraArmacao) <= 0}
                            variant="outline"
                            size="sm"
                            className="border-blue-300 text-blue-700 hover:bg-blue-100"
                          >
                            <Brain className="h-4 w-4 mr-2" />
                            {isAnalyzing ? 'Analisando...' : 'Calcular Medidas'}
                          </Button>
                        </div>
                      </div>
                      
                      {analysisError && (
                        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700 flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 mt-0.5" />
                          <span>{analysisError}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {measurementCalculated && measurements && (
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <h4 className="font-medium text-green-900">Medidas Calculadas Automaticamente</h4>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <Label className="text-gray-600">DP Binocular</Label>
                          <div className="font-mono font-semibold text-green-800">
                            {measurements.dpBinocular.toFixed(1)} mm
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-gray-600">Largura da Lente</Label>
                          <div className="font-mono font-semibold text-green-800">
                            {measurements.larguraLente.toFixed(1)} mm
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-gray-600">DNP Esquerda</Label>
                          <div className="font-mono font-semibold text-green-800">
                            {measurements.dnpEsquerda.toFixed(1)} mm
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-gray-600">DNP Direita</Label>
                          <div className="font-mono font-semibold text-green-800">
                            {measurements.dnpDireita.toFixed(1)} mm
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-gray-600">Altura Esquerda</Label>
                          <div className="font-mono font-semibold text-green-800">
                            {measurements.alturaEsquerda.toFixed(1)} mm
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-gray-600">Altura Direita</Label>
                          <div className="font-mono font-semibold text-green-800">
                            {measurements.alturaDireita.toFixed(1)} mm
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 p-2 bg-white rounded border">
                        <div className="text-xs text-gray-600 mb-1">
                          <strong>Confiança:</strong> {Math.round(measurements.confiabilidade * 100)}%
                        </div>
                        {measurements.observacoes && (
                          <div className="text-xs text-gray-600">
                            <strong>Observações:</strong> {measurements.observacoes}
                          </div>
                        )}
                      </div>
                      
                      <Button 
                        onClick={() => {
                          setMeasurementCalculated(false);
                        }}
                        variant="outline"
                        size="sm"
                        className="mt-3 w-full"
                      >
                        Recalcular Medidas
                      </Button>
                    </CardContent>
                  </Card>
                )}

                <Button 
                  onClick={handleSave}
                  disabled={loading || !formData.nomeCliente.trim() || !formData.larguraArmacao || !measurementCalculated}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Salvando...' : 'Salvar Aferição'}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeasurementPage;
