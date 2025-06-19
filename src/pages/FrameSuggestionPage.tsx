
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Camera, Glasses } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import CameraCapture from '@/components/CameraCapture';

const FrameSuggestionPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [step, setStep] = useState<'camera' | 'analysis'>('camera');
  const [loading, setSaving] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    nomeCliente: '',
    formatoRosto: '',
    tomPele: '',
    distanciaOlhos: ''
  });

  const handleImageCapture = (imageData: string) => {
    console.log('Imagem capturada na página de sugestão');
    setCapturedImage(imageData);
    setStep('analysis');
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
    const suggestions = [];
    
    // Lógica básica de sugestões baseada no formato do rosto
    switch (formData.formatoRosto.toLowerCase()) {
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
      default:
        suggestions.push({
          tipo: 'Armação Clássica',
          motivo: 'Versátil para diversos formatos'
        });
    }

    return suggestions;
  };

  const handleSave = async () => {
    if (!user || !capturedImage) return;

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
          formato_rosto: formData.formatoRosto,
          tom_pele: formData.tomPele,
          distancia_olhos: formData.distanciaOlhos,
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

  const sugestoes = formData.formatoRosto ? generateSuggestions() : [];

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
            {step === 'camera' ? 'Capturar Foto do Cliente' : 'Análise Facial'}
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

            {/* Formulário de análise */}
            <Card>
              <CardHeader>
                <CardTitle>Dados da Análise</CardTitle>
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
                  <Label htmlFor="formatoRosto">Formato do Rosto</Label>
                  <select
                    id="formatoRosto"
                    value={formData.formatoRosto}
                    onChange={(e) => setFormData({ ...formData, formatoRosto: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Selecione o formato</option>
                    <option value="oval">Oval</option>
                    <option value="redondo">Redondo</option>
                    <option value="quadrado">Quadrado</option>
                    <option value="coração">Coração</option>
                    <option value="losango">Losango</option>
                    <option value="retangular">Retangular</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="tomPele">Tom de Pele</Label>
                  <select
                    id="tomPele"
                    value={formData.tomPele}
                    onChange={(e) => setFormData({ ...formData, tomPele: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Selecione o tom</option>
                    <option value="claro">Claro</option>
                    <option value="medio">Médio</option>
                    <option value="escuro">Escuro</option>
                    <option value="bronzeado">Bronzeado</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="distanciaOlhos">Distância entre os Olhos</Label>
                  <select
                    id="distanciaOlhos"
                    value={formData.distanciaOlhos}
                    onChange={(e) => setFormData({ ...formData, distanciaOlhos: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Selecione a distância</option>
                    <option value="próximos">Próximos</option>
                    <option value="normais">Normais</option>
                    <option value="afastados">Afastados</option>
                  </select>
                </div>

                <Button 
                  onClick={handleSave}
                  disabled={loading || !formData.nomeCliente}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Salvando...' : 'Salvar Análise'}
                </Button>
              </CardContent>
            </Card>

            {/* Sugestões */}
            {sugestoes.length > 0 && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Glasses className="h-5 w-5" />
                    Sugestões de Armação
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
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FrameSuggestionPage;
