import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Camera, Glasses, Brain, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import CameraCapture from '@/components/CameraCapture';
import { useFacialMeasurements } from '@/hooks/useFacialMeasurements';

const FrameSuggestionPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { isAnalyzing, faceAnalysis, error, analyzeFaceCharacteristics } = useFacialMeasurements();
  
  const [step, setStep] = useState<'camera' | 'analysis'>('camera');
  const [saving, setSaving] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    nomeCliente: ''
  });

  const handleImageCapture = async (imageData: string) => {
    console.log('Imagem capturada na página de sugestão');
    setCapturedImage(imageData);
    
    try {
      console.log('Iniciando análise automática das características faciais...');
      
      // Analisar características automaticamente
      const result = await analyzeFaceCharacteristics(imageData);
      console.log('Análise completada:', result);
      
      setStep('analysis');
      
      toast({
        title: "Análise Completada!",
        description: "Características faciais detectadas automaticamente"
      });
    } catch (error) {
      console.error('Erro na análise automática:', error);
      toast({
        title: "Erro na Análise",
        description: "Erro ao analisar características faciais. Tente novamente.",
        variant: "destructive"
      });
      
      // Ainda permitir ir para a próxima etapa mesmo com erro
      setStep('analysis');
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
        }
      ];
    }
    
    const suggestions = [];
    
    // Lógica de sugestões baseada no formato do rosto detectado
    switch (faceAnalysis.formatoRosto) {
      case 'oval':
        suggestions.push({
          tipo: 'Armação Quadrada',
          motivo: 'Complementa a harmonia natural do rosto oval'
        });
        suggestions.push({
          tipo: 'Armação Redonda',
          motivo: 'Mantém o equilíbrio das proporções'
        });
        break;
      case 'redondo':
        suggestions.push({
          tipo: 'Armação Quadrada/Angular',
          motivo: 'Adiciona definição e estrutura ao rosto'
        });
        suggestions.push({
          tipo: 'Armação Retangular',
          motivo: 'Alonga visualmente o rosto'
        });
        break;
      case 'quadrado':
        suggestions.push({
          tipo: 'Armação Redonda',
          motivo: 'Suaviza os ângulos marcantes'
        });
        suggestions.push({
          tipo: 'Armação Oval',
          motivo: 'Cria harmonia com as linhas faciais'
        });
        break;
      case 'coração':
        suggestions.push({
          tipo: 'Armação com Base Larga',
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
          tipo: 'Armação Cat-Eye',
          motivo: 'Equilibra as proporções do rosto'
        });
        break;
      case 'retangular':
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

    return suggestions;
  };

  const handleSave = async () => {
    if (!user || !capturedImage || !faceAnalysis) return;

    setSaving(true);
    try {
      // Upload da imagem
      const fotoUrl = await uploadImage(capturedImage);
      
      if (!fotoUrl) {
        toast({
          title: "Erro",
          description: "Erro ao fazer upload da imagem",
          variant: "destructive"
        });
        return;
      }

      const sugestoes = generateSuggestions();

      // Salvar análise no banco
      const { error } = await supabase
        .from('analises_faciais')
        .insert({
          optica_id: user.opticId!,
          usuario_id: user.id,
          nome_cliente: formData.nomeCliente,
          foto_url: fotoUrl,
          formato_rosto: faceAnalysis.formatoRosto,
          tom_pele: faceAnalysis.tomPele,
          distancia_olhos: faceAnalysis.distanciaOlhos,
          sugestoes
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
            onClick={() => step === 'analysis' ? setStep('camera') : navigate('/optica')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">
            {step === 'camera' ? 'Capturar Foto do Cliente' : 'Análise Facial Automática'}
          </h1>
        </div>

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
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isAnalyzing && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>Analisando características faciais...</span>
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <div>
                      <p className="text-red-600 text-sm font-medium">Análise automática falhou</p>
                      <p className="text-red-500 text-xs">{error}</p>
                      <p className="text-gray-600 text-xs mt-1">Sugestões genéricas serão exibidas</p>
                    </div>
                  </div>
                )}

                {faceAnalysis && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-green-600 mb-3">
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-medium">Análise Concluída</span>
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
                        <Label className="font-semibold text-yellow-900">Observações</Label>
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

                <Button 
                  onClick={handleSave}
                  disabled={saving || !formData.nomeCliente}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Salvando...' : 'Salvar Análise'}
                </Button>
              </CardContent>
            </Card>

            {/* Sugestões */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Glasses className="h-5 w-5" />
                  Sugestões de Armação 
                  {faceAnalysis ? 'Baseadas na Análise' : 'Genéricas'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sugestoes.map((sugestao, index) => (
                    <div key={index} className="p-4 bg-blue-50 rounded-lg">
                      <h3 className="font-semibold text-blue-900">{sugestao.tipo}</h3>
                      <p className="text-sm text-blue-700 mt-1">{sugestao.motivo}</p>
                    </div>
                  ))}
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
