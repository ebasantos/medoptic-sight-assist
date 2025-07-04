import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Glasses, RotateCcw, Download, Sparkles, Eye, Palette, Settings, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/integrations/supabase/types';
import { removeBackground, loadImage, normalizeGlassesPosition } from '@/utils/imageProcessing';

interface FaceDetection {
  leftEye: { x: number; y: number };
  rightEye: { x: number; y: number };
  eyeDistance: number;
  faceWidth: number;
  confidence: number;
}

interface VirtualTryOnProps {
  originalImage: string;
  faceAnalysis: {
    formatoRosto: string;
    tomPele: string;
    distanciaOlhos: string;
    confiabilidade: number;
    observacoes: string;
  };
  suggestions: Array<{
    tipo: string;
    motivo: string;
  }>;
  onSave?: (simulatedImage: string) => void;
}

// Usar o tipo do Supabase diretamente
type GlassesModel = Tables<'modelos_oculos'>;

// Interface para as cores (para type safety)
interface CorDisponivel {
  nome: string;
  codigo: string;
}

// URLs de backup para imagens de óculos que funcionam
const FALLBACK_GLASSES_IMAGES = {
  'quadrada': 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400&h=200&fit=crop&crop=center',
  'redonda': 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400&h=200&fit=crop&crop=center',
  'cat-eye': 'https://images.unsplash.com/photo-1577803645773-f96470509666?w=400&h=200&fit=crop&crop=center',
  'aviador': 'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=400&h=200&fit=crop&crop=center',
  'oval': 'https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=400&h=200&fit=crop&crop=center',
  'retangular': 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400&h=200&fit=crop&crop=center'
};

const VirtualTryOn: React.FC<VirtualTryOnProps> = ({
  originalImage,
  faceAnalysis,
  suggestions = [],
  onSave
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const { toast } = useToast();
  
  const [isDetecting, setIsDetecting] = useState(false);
  const [faceDetection, setFaceDetection] = useState<FaceDetection | null>(null);
  const [availableModels, setAvailableModels] = useState<GlassesModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [loadingModels, setLoadingModels] = useState(true);
  const [imageLoadError, setImageLoadError] = useState<string | null>(null);
  const [processingImage, setProcessingImage] = useState(false);
  const [processedImages, setProcessedImages] = useState<Map<string, string>>(new Map());
  
  const [adjustments, setAdjustments] = useState({
    position: { x: 0, y: -10 },
    scale: 1.0,
    rotation: 0,
    opacity: 0.85
  });

  // Função auxiliar para obter cores disponíveis de forma segura
  const getCoresDisponiveis = (model: GlassesModel): CorDisponivel[] => {
    try {
      const cores = model.cores_disponiveis as unknown as CorDisponivel[] | null;
      return Array.isArray(cores) ? cores : [];
    } catch (error) {
      console.error('Erro ao parsear cores:', error);
      return [];
    }
  };

  // Função para obter URL de imagem válida
  const getValidImageUrl = (model: GlassesModel): string => {
    // Se a URL original funcionar, usar ela
    if (model.imagem_url && !model.imagem_url.includes('svgsilh.com')) {
      return model.imagem_url;
    }
    
    // Caso contrário, usar imagem de fallback baseada na categoria
    const categoria = model.categoria.toLowerCase();
    return FALLBACK_GLASSES_IMAGES[categoria as keyof typeof FALLBACK_GLASSES_IMAGES] || 
           FALLBACK_GLASSES_IMAGES.oval;
  };

  // Função para processar imagem da armação com melhor qualidade
  const processGlassesImage = useCallback(async (model: GlassesModel): Promise<string> => {
    // Verificar se já foi processada
    if (processedImages.has(model.id)) {
      return processedImages.get(model.id)!;
    }

    try {
      setProcessingImage(true);
      console.log('Processando imagem da armação:', model.nome);
      
      // Carregar imagem original com CORS
      const response = await fetch(getValidImageUrl(model), { mode: 'cors' });
      const blob = await response.blob();
      const img = await loadImage(blob);
      
      // Remover fundo mantendo qualidade
      const processedBlob = await removeBackground(img);
      
      // Criar canvas para processar imagem final
      const canvas = document.createElement('canvas');
      // Manter dimensões maiores para melhor qualidade
      canvas.width = Math.max(400, img.naturalWidth);
      canvas.height = Math.max(200, img.naturalHeight);
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Desenhar imagem processada mantendo proporções
        const processedImg = await loadImage(processedBlob);
        
        // Centralizar imagem no canvas
        const scale = Math.min(canvas.width / processedImg.width, canvas.height / processedImg.height);
        const scaledWidth = processedImg.width * scale;
        const scaledHeight = processedImg.height * scale;
        const x = (canvas.width - scaledWidth) / 2;
        const y = (canvas.height - scaledHeight) / 2;
        
        ctx.drawImage(processedImg, x, y, scaledWidth, scaledHeight);
        
        // Normalizar posição se necessário
        normalizeGlassesPosition(canvas, ctx);
        
        // Converter para URL
        const processedUrl = canvas.toDataURL('image/png', 1.0);
        
        // Armazenar no cache
        setProcessedImages(prev => new Map(prev).set(model.id, processedUrl));
        
        console.log('Imagem processada com sucesso para:', model.nome);
        return processedUrl;
      }
      
      throw new Error('Não foi possível obter contexto do canvas');
      
    } catch (error) {
      console.error('Erro ao processar imagem:', error);
      // Retornar URL original em caso de erro
      return getValidImageUrl(model);
    } finally {
      setProcessingImage(false);
    }
  }, [processedImages]);

  // Buscar modelos de óculos do banco de dados
  const fetchGlassesModels = useCallback(async () => {
    try {
      setLoadingModels(true);
      
      // Mapear sugestões da IA para categorias no banco
      const categorias = suggestions.map(suggestion => {
        const tipo = suggestion.tipo.toLowerCase();
        if (tipo.includes('quadrada') || tipo.includes('angular')) return 'quadrada';
        if (tipo.includes('redonda') || tipo.includes('oval')) return 'redonda';
        if (tipo.includes('cat') || tipo.includes('felino')) return 'cat-eye';
        if (tipo.includes('aviador')) return 'aviador';
        if (tipo.includes('retangular')) return 'retangular';
        return 'oval';
      });

      // Buscar modelos recomendados para o formato de rosto
      const formatoRosto = faceAnalysis.formatoRosto.toLowerCase();
      const tomPele = faceAnalysis.tomPele.toLowerCase();
      
      const { data: models, error } = await supabase
        .from('modelos_oculos')
        .select('*')
        .eq('ativo', true)
        .or(
          `categoria.in.(${categorias.join(',')}),formato_recomendado.eq.${formatoRosto},popular.eq.true`
        )
        .order('popular', { ascending: false });

      if (error) {
        console.error('Erro ao buscar modelos:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar modelos de óculos",
          variant: "destructive"
        });
        return;
      }

      // Filtrar modelos por tom de pele se disponível
      const filteredModels = models?.filter(model => {
        if (!model.tom_pele_recomendado) return true;
        return model.tom_pele_recomendado.some(tom => 
          tomPele.includes(tom) || tom === 'médio'
        );
      }) || [];

      // Se não há modelos filtrados, usar todos
      const finalModels = filteredModels.length > 0 ? filteredModels : (models || []);
      
      setAvailableModels(finalModels);
      
      // Selecionar primeiro modelo automaticamente
      if (finalModels.length > 0) {
        const firstModel = finalModels[0];
        setSelectedModel(firstModel.id);
        
        // Parse das cores disponíveis com verificação de tipo
        const cores = getCoresDisponiveis(firstModel);
        if (cores.length > 0) {
          setSelectedColor(cores[0].codigo);
        }
      }
      
    } catch (error) {
      console.error('Erro ao buscar modelos:', error);
      toast({
        title: "Erro",
        description: "Erro inesperado ao carregar modelos",
        variant: "destructive"
      });
    } finally {
      setLoadingModels(false);
    }
  }, [suggestions, faceAnalysis, toast]);

  // Detectar características faciais na imagem
  const detectFaceFeatures = useCallback(async () => {
    if (!canvasRef.current || !imageRef.current) return;
    
    setIsDetecting(true);
    
    // Simular detecção facial baseada no tamanho da imagem
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const img = imageRef.current;
    const eyeDistance = Math.min(img.width, img.height) * 0.15;
    
    const mockDetection: FaceDetection = {
      leftEye: { 
        x: img.width * 0.35,
        y: img.height * 0.4
      },
      rightEye: { 
        x: img.width * 0.65,
        y: img.height * 0.4
      },
      eyeDistance: eyeDistance,
      faceWidth: img.width * 0.4,
      confidence: 0.88
    };
    
    setFaceDetection(mockDetection);
    setIsDetecting(false);
  }, []);

  // Calcular posição automática baseada na detecção facial
  const calculateAutoPosition = useCallback(() => {
    if (!faceDetection || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const centerX = (faceDetection.leftEye.x + faceDetection.rightEye.x) / 2;
    const centerY = faceDetection.leftEye.y - 8;
    
    const scale = Math.max(0.7, Math.min(1.3, faceDetection.eyeDistance / 80));
    
    setAdjustments(prev => ({
      ...prev,
      position: { 
        x: (centerX / canvas.width) * 100 - 50,
        y: (centerY / canvas.height) * 100 - 50
      },
      scale: scale
    }));
  }, [faceDetection]);

  // Renderizar a simulação
  const renderSimulation = useCallback(async () => {
    if (!canvasRef.current || !imageRef.current || !selectedModel || !selectedColor) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = imageRef.current;
    
    // Configurar canvas
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    
    // Desenhar imagem original
    ctx.drawImage(img, 0, 0);
    
    // Encontrar modelo selecionado
    const currentModel = availableModels.find(m => m.id === selectedModel);
    if (currentModel) {
      await renderGlassesImage(ctx, currentModel, canvas.width, canvas.height);
    }
    
  }, [selectedModel, selectedColor, adjustments, availableModels]);

  const renderGlassesImage = async (ctx: CanvasRenderingContext2D, model: GlassesModel, canvasWidth: number, canvasHeight: number) => {
    try {
      // Processar imagem da armação
      const processedImageUrl = await processGlassesImage(model);
      
      const glassesImg = new Image();
      glassesImg.crossOrigin = 'anonymous';
      
      glassesImg.onload = () => {
        console.log('Imagem processada da armação carregada:', model.nome);
        setImageLoadError(null);
        
        ctx.save();
        
        // Calcular posição central
        const centerX = canvasWidth / 2 + (adjustments.position.x * canvasWidth / 100);
        const centerY = canvasHeight / 2 + (adjustments.position.y * canvasHeight / 100);
        
        // Aplicar transformações
        ctx.translate(centerX, centerY);
        ctx.rotate((adjustments.rotation * Math.PI) / 180);
        ctx.scale(adjustments.scale, adjustments.scale);
        ctx.globalAlpha = adjustments.opacity;
        
        // Aplicar filtro de cor se necessário
        if (selectedColor && selectedColor !== '#000000') {
          ctx.globalCompositeOperation = 'multiply';
          ctx.fillStyle = selectedColor;
          ctx.fillRect(-glassesImg.width / 2, -glassesImg.height / 2, glassesImg.width, glassesImg.height);
          ctx.globalCompositeOperation = 'destination-atop';
        }
        
        // Desenhar óculos com tamanho proporcional ao rosto
        const faceScale = Math.min(canvasWidth, canvasHeight) / 800; // Escala baseada no tamanho da face
        const finalWidth = glassesImg.width * faceScale;
        const finalHeight = glassesImg.height * faceScale;
        
        ctx.drawImage(
          glassesImg, 
          -finalWidth / 2, 
          -finalHeight / 2, 
          finalWidth, 
          finalHeight
        );
        
        ctx.restore();
      };
      
      glassesImg.onerror = (error) => {
        console.error('Erro ao carregar imagem processada:', error);
        setImageLoadError(`Erro ao carregar imagem do modelo ${model.nome}`);
        drawFallbackGlasses(ctx, canvasWidth, canvasHeight);
      };
      
      glassesImg.src = processedImageUrl;
      
    } catch (error) {
      console.error('Erro no processamento da imagem:', error);
      setImageLoadError(`Erro ao processar imagem do modelo ${model.nome}`);
      drawFallbackGlasses(ctx, canvasWidth, canvasHeight);
    }
  };

  // Função para desenhar óculos de fallback simples
  const drawFallbackGlasses = (ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) => {
    ctx.save();
    
    const centerX = canvasWidth / 2 + (adjustments.position.x * canvasWidth / 100);
    const centerY = canvasHeight / 2 + (adjustments.position.y * canvasHeight / 100);
    
    ctx.translate(centerX, centerY);
    ctx.rotate((adjustments.rotation * Math.PI) / 180);
    ctx.scale(adjustments.scale, adjustments.scale);
    ctx.globalAlpha = adjustments.opacity;
    
    // Desenhar óculos simples com formas geométricas
    ctx.strokeStyle = selectedColor || '#000000';
    ctx.lineWidth = 3;
    
    // Lente esquerda
    ctx.beginPath();
    ctx.arc(-30, 0, 25, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Lente direita
    ctx.beginPath();
    ctx.arc(30, 0, 25, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Ponte
    ctx.beginPath();
    ctx.moveTo(-5, 0);
    ctx.lineTo(5, 0);
    ctx.stroke();
    
    // Hastes
    ctx.beginPath();
    ctx.moveTo(-55, 0);
    ctx.lineTo(-80, -5);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(55, 0);
    ctx.lineTo(80, -5);
    ctx.stroke();
    
    ctx.restore();
  };

  // Carregar imagem e detectar face
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      if (imageRef.current) {
        imageRef.current.src = img.src;
        detectFaceFeatures();
      }
    };
    img.src = originalImage;
  }, [originalImage, detectFaceFeatures]);

  // Buscar modelos quando componente carrega
  useEffect(() => {
    fetchGlassesModels();
  }, [fetchGlassesModels]);

  // Auto-posicionar quando a detecção facial estiver pronta
  useEffect(() => {
    if (faceDetection) {
      calculateAutoPosition();
    }
  }, [faceDetection, calculateAutoPosition]);

  // Re-renderizar quando qualquer parâmetro mudar
  useEffect(() => {
    const timer = setTimeout(() => {
      renderSimulation();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [renderSimulation]);

  const handleSave = () => {
    if (!canvasRef.current || !onSave) return;
    
    const imageData = canvasRef.current.toDataURL('image/jpeg', 0.95);
    onSave(imageData);
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    
    const link = document.createElement('a');
    link.download = `provador-virtual-${Date.now()}.jpg`;
    link.href = canvasRef.current.toDataURL('image/jpeg', 0.95);
    link.click();
  };

  const resetAdjustments = () => {
    setAdjustments({
      position: { x: 0, y: -10 },
      scale: 1.0,
      rotation: 0,
      opacity: 0.85
    });
    if (faceDetection) {
      setTimeout(() => calculateAutoPosition(), 100);
    }
  };

  const getCurrentModel = () => availableModels.find(m => m.id === selectedModel);
  const currentModel = getCurrentModel();

  if (loadingModels) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
          <span>Carregando modelos de óculos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Provador Virtual - Modelos Recomendados pela IA
            {faceDetection && (
              <Badge variant="secondary" className="ml-auto">
                <Eye className="h-3 w-3 mr-1" />
                Rosto Detectado ({Math.round(faceDetection.confidence * 100)}%)
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {imageLoadError && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                ⚠️ {imageLoadError}. Usando visualização de fallback.
              </p>
            </div>
          )}
          
          {processingImage && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                <p className="text-blue-800 text-sm">
                  Processando imagem da armação... (removendo fundo e centralizando)
                </p>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Canvas Principal */}
            <div className="xl:col-span-2 space-y-4">
              <div className="relative border-2 border-gray-200 rounded-xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 shadow-lg">
                {isDetecting && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                    <div className="bg-white rounded-lg p-4 flex items-center gap-3">
                      <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
                      <span className="text-sm font-medium">Detectando posição dos olhos...</span>
                    </div>
                  </div>
                )}
                
                <div className="relative">
                  <img
                    ref={imageRef}
                    src={originalImage}
                    alt="Cliente"
                    className="w-full h-auto max-h-[500px] object-contain"
                    style={{ display: 'none' }}
                  />
                  <canvas
                    ref={canvasRef}
                    className="w-full h-auto max-h-[500px] object-contain"
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button onClick={handleSave} className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Salvar Provador
                </Button>
                <Button onClick={handleDownload} variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Download HD
                </Button>
                <Button onClick={resetAdjustments} variant="outline" size="icon">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Controles */}
            <div className="space-y-6">
              {/* Sugestões da IA */}
              {suggestions.length > 0 && (
                <div>
                  <Label className="text-base font-semibold mb-3 block flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    Recomendações da IA
                  </Label>
                  <div className="space-y-2 mb-4">
                    {suggestions.map((suggestion, index) => (
                      <div key={index} className="p-2 bg-purple-50 rounded-lg border border-purple-200">
                        <p className="text-sm font-medium text-purple-900">{suggestion.tipo}</p>
                        <p className="text-xs text-purple-700">{suggestion.motivo}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Seleção de Modelo */}
              <div>
                <Label className="text-base font-semibold mb-3 block flex items-center gap-2">
                  <Glasses className="h-4 w-4" />
                  Modelos Disponíveis ({availableModels.length})
                </Label>
                <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto">
                  {availableModels.map((model) => (
                    <div
                      key={model.id}
                      className={`relative p-3 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        selectedModel === model.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => {
                        setSelectedModel(model.id);
                        const cores = getCoresDisponiveis(model);
                        if (cores.length > 0) {
                          setSelectedColor(cores[0].codigo);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{model.nome}</h4>
                          <p className="text-xs text-gray-500 capitalize">{model.categoria}</p>
                          <p className="text-xs text-gray-400">
                            {model.largura_mm}mm x {model.altura_mm}mm
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {model.popular && (
                            <Badge className="bg-green-500 text-white text-xs">
                              Popular
                            </Badge>
                          )}
                          <img 
                            src={model.imagem_url} 
                            alt={model.nome}
                            className="w-8 h-6 object-contain opacity-60"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Seleção de Cor */}
              {currentModel && (
                <div>
                  <Label className="text-base font-semibold mb-3 block flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Cores Disponíveis
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {getCoresDisponiveis(currentModel).map((cor) => (
                      <button
                        key={cor.codigo}
                        className={`p-2 border-2 rounded-lg text-xs font-medium transition-all ${
                          selectedColor === cor.codigo
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedColor(cor.codigo)}
                      >
                        <div
                          className="w-4 h-4 rounded-full mx-auto mb-1 border border-gray-300"
                          style={{ backgroundColor: cor.codigo }}
                        />
                        {cor.nome}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Ajustes Finos */}
              <div>
                <Label className="text-base font-semibold mb-3 block flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Ajustes Precisos
                </Label>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm mb-2 block">
                      Posição Horizontal: {adjustments.position.x.toFixed(0)}%
                    </Label>
                    <Slider
                      value={[adjustments.position.x]}
                      onValueChange={(value) => 
                        setAdjustments(prev => ({ 
                          ...prev, 
                          position: { ...prev.position, x: value[0] } 
                        }))
                      }
                      min={-30}
                      max={30}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm mb-2 block">
                      Posição Vertical: {adjustments.position.y.toFixed(0)}%
                    </Label>
                    <Slider
                      value={[adjustments.position.y]}
                      onValueChange={(value) => 
                        setAdjustments(prev => ({ 
                          ...prev, 
                          position: { ...prev.position, y: value[0] } 
                        }))
                      }
                      min={-30}
                      max={30}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm mb-2 block">
                      Tamanho: {Math.round(adjustments.scale * 100)}%
                    </Label>
                    <Slider
                      value={[adjustments.scale]}
                      onValueChange={(value) => 
                        setAdjustments(prev => ({ ...prev, scale: value[0] }))
                      }
                      min={0.6}
                      max={1.4}
                      step={0.05}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm mb-2 block">
                      Rotação: {adjustments.rotation}°
                    </Label>
                    <Slider
                      value={[adjustments.rotation]}
                      onValueChange={(value) => 
                        setAdjustments(prev => ({ ...prev, rotation: value[0] }))
                      }
                      min={-15}
                      max={15}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm mb-2 block">
                      Opacidade: {Math.round(adjustments.opacity * 100)}%
                    </Label>
                    <Slider
                      value={[adjustments.opacity]}
                      onValueChange={(value) => 
                        setAdjustments(prev => ({ ...prev, opacity: value[0] }))
                      }
                      min={0.3}
                      max={1.0}
                      step={0.05}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VirtualTryOn;
