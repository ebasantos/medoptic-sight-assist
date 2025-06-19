
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import CameraCapture from '@/components/CameraCapture';

const MeasurementPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [step, setStep] = useState<'camera' | 'measurements'>('camera');
  const [loading, setSaving] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    nomeCliente: '',
    larguraArmacao: '',
    dpBinocular: '',
    dnpEsquerda: '',
    dnpDireita: '',
    alturaEsquerda: '',
    alturaDireita: '',
    larguraLente: ''
  });

  const handleImageCapture = (imageData: string) => {
    console.log('Imagem capturada na página de medição');
    setCapturedImage(imageData);
    setStep('measurements');
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
      const fileName = `afericao_${Date.now()}.jpg`;
      
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

      // Salvar aferição no banco
      const { error } = await supabase
        .from('afericoes')
        .insert({
          optica_id: user.opticId!,
          usuario_id: user.id,
          nome_cliente: formData.nomeCliente,
          foto_url: fotoUrl,
          largura_armacao: parseFloat(formData.larguraArmacao),
          dp_binocular: formData.dpBinocular ? parseFloat(formData.dpBinocular) : null,
          dnp_esquerda: formData.dnpEsquerda ? parseFloat(formData.dnpEsquerda) : null,
          dnp_direita: formData.dnpDireita ? parseFloat(formData.dnpDireita) : null,
          altura_esquerda: formData.alturaEsquerda ? parseFloat(formData.alturaEsquerda) : null,
          altura_direita: formData.alturaDireita ? parseFloat(formData.alturaDireita) : null,
          largura_lente: formData.larguraLente ? parseFloat(formData.larguraLente) : null
        });

      if (error) {
        console.error('Erro ao salvar aferição:', error);
        toast({
          title: "Erro",
          description: "Erro ao salvar aferição",
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

            {/* Formulário de medições */}
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
                    value={formData.larguraArmacao}
                    onChange={(e) => setFormData({ ...formData, larguraArmacao: e.target.value })}
                    placeholder="Ex: 52.5"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="dpBinocular">DP Binocular (mm)</Label>
                  <Input
                    id="dpBinocular"
                    type="number"
                    step="0.1"
                    value={formData.dpBinocular}
                    onChange={(e) => setFormData({ ...formData, dpBinocular: e.target.value })}
                    placeholder="Ex: 64.0"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dnpEsquerda">DNP Esquerda (mm)</Label>
                    <Input
                      id="dnpEsquerda"
                      type="number"
                      step="0.1"
                      value={formData.dnpEsquerda}
                      onChange={(e) => setFormData({ ...formData, dnpEsquerda: e.target.value })}
                      placeholder="Ex: 32.0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dnpDireita">DNP Direita (mm)</Label>
                    <Input
                      id="dnpDireita"
                      type="number"
                      step="0.1"
                      value={formData.dnpDireita}
                      onChange={(e) => setFormData({ ...formData, dnpDireita: e.target.value })}
                      placeholder="Ex: 32.0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="alturaEsquerda">Altura Esquerda (mm)</Label>
                    <Input
                      id="alturaEsquerda"
                      type="number"
                      step="0.1"
                      value={formData.alturaEsquerda}
                      onChange={(e) => setFormData({ ...formData, alturaEsquerda: e.target.value })}
                      placeholder="Ex: 28.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="alturaDireita">Altura Direita (mm)</Label>
                    <Input
                      id="alturaDireita"
                      type="number"
                      step="0.1"
                      value={formData.alturaDireita}
                      onChange={(e) => setFormData({ ...formData, alturaDireita: e.target.value })}
                      placeholder="Ex: 28.5"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="larguraLente">Largura da Lente (mm)</Label>
                  <Input
                    id="larguraLente"
                    type="number"
                    step="0.1"
                    value={formData.larguraLente}
                    onChange={(e) => setFormData({ ...formData, larguraLente: e.target.value })}
                    placeholder="Ex: 50.0"
                  />
                </div>

                <Button 
                  onClick={handleSave}
                  disabled={loading || !formData.nomeCliente || !formData.larguraArmacao}
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
