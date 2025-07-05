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

type GlassesModel = Tables<'modelos_oculos'>;

interface CorDisponivel {
  nome: string;
  codigo: string;
}

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
  
  const [adjustments, setAdjustments] = useState({
    position: { x: 0, y: -10 },
    scale: 1.2, // Aumentar escala padrão
    rotation: 0,
    opacity: 0.9
  });

  const getCoresDisponiveis = (model: GlassesModel): CorDisponivel[] => {
    try {
      const cores = model.cores_disponiveis as unknown as CorDisponivel[] | null;
      return Array.isArray(cores) ? cores : [];
    } catch (error) {
      console.error('Erro ao parsear cores:', error);
      return [];
    }
  };

  const fetchGlassesModels = useCallback(async () => {
    try {
      setLoadingModels(true);
      
      const categorias = suggestions.map(suggestion => {
        const tipo = suggestion.tipo.toLowerCase();
        if (tipo.includes('quadrada') || tipo.includes('angular')) return 'quadrada';
        if (tipo.includes('redonda') || tipo.includes('oval')) return 'redonda';
        if (tipo.includes('cat') || tipo.includes('felino')) return 'cat-eye';
        if (tipo.includes('aviador')) return 'aviador';
        if (tipo.includes('retangular')) return 'retangular';
        return 'oval';
      });

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

      const filteredModels = models?.filter(model => {
        if (!model.tom_pele_recomendado) return true;
        return model.tom_pele_recomendado.some(tom => 
          tomPele.includes(tom) || tom === 'médio'
        );
      }) || [];

      const finalModels = filteredModels.length > 0 ? filteredModels : (models || []);
      
      setAvailableModels(finalModels);
      
      if (finalModels.length > 0) {
        const firstModel = finalModels[0];
        setSelectedModel(firstModel.id);
        
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

  const detectFaceFeatures = useCallback(async () => {
    if (!canvasRef.current || !imageRef.current) return;
    
    setIsDetecting(true);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const img = imageRef.current;
    
    // Aumentar proporção para óculos maiores
    const eyeDistance = Math.min(img.width, img.height) * 0.18; // Aumentar de 0.12 para 0.18
    
    const mockDetection: FaceDetection = {
      leftEye: { 
        x: img.width * 0.37,
        y: img.height * 0.42
      },
      rightEye: { 
        x: img.width * 0.63,
        y: img.height * 0.42
      },
      eyeDistance: eyeDistance,
      faceWidth: img.width * 0.45, // Aumentar largura do rosto de 0.35 para 0.45
      confidence: 0.88
    };
    
    setFaceDetection(mockDetection);
    setIsDetecting(false);
  }, []);

  const calculateAutoPosition = useCallback(() => {
    if (!faceDetection || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const centerX = (faceDetection.leftEye.x + faceDetection.rightEye.x) / 2;
    const centerY = faceDetection.leftEye.y - 8;
    
    // Calcular escala mais generosa
    const eyeDistancePixels = Math.abs(faceDetection.rightEye.x - faceDetection.leftEye.x);
    const idealGlassesWidth = eyeDistancePixels * 1.8; // Aumentar de 1.4 para 1.8
    const baseGlassesWidth = 200;
    const calculatedScale = Math.max(0.8, Math.min(2.0, idealGlassesWidth / baseGlassesWidth)); // Aumentar mínimo
    
    console.log('Cálculos de escala (aumentados):', {
      eyeDistancePixels,
      idealGlassesWidth,
      calculatedScale,
      faceWidth: faceDetection.faceWidth
    });
    
    setAdjustments(prev => ({
      ...prev,
      position: { 
        x: (centerX / canvas.width) * 100 - 50,
        y: (centerY / canvas.height) * 100 - 50
      },
      scale: calculatedScale
    }));
  }, [faceDetection]);

  const renderSimulation = useCallback(async () => {
    if (!canvasRef.current || !imageRef.current || !selectedModel || !selectedColor) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = imageRef.current;
    
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    
    ctx.drawImage(img, 0, 0);
    
    const currentModel = availableModels.find(m => m.id === selectedModel);
    if (currentModel) {
      await renderGlassesImage(ctx, currentModel, canvas.width, canvas.height);
    }
    
  }, [selectedModel, selectedColor, adjustments, availableModels]);

  const renderGlassesImage = async (ctx: CanvasRenderingContext2D, model: GlassesModel, canvasWidth: number, canvasHeight: number) => {
    try {
      console.log('Carregando imagem da armação:', model.nome, model.imagem_url);
      
      const glassesImg = new Image();
      glassesImg.crossOrigin = 'anonymous';
      
      glassesImg.onload = () => {
        console.log('Imagem da armação carregada com sucesso:', model.nome);
        setImageLoadError(null);
        
        ctx.save();
        
        const centerX = canvasWidth / 2 + (adjustments.position.x * canvasWidth / 100);
        const centerY = canvasHeight / 2 + (adjustments.position.y * canvasHeight / 100);
        
        console.log('Posição calculada:', { centerX, centerY, canvasWidth, canvasHeight });
        
        ctx.translate(centerX, centerY);
        ctx.rotate((adjustments.rotation * Math.PI) / 180);
        ctx.scale(adjustments.scale, adjustments.scale);
        ctx.globalAlpha = adjustments.opacity;
        
        if (selectedColor && selectedColor !== '#000000') {
          ctx.globalCompositeOperation = 'source-over';
          ctx.filter = `hue-rotate(${getHueRotation(selectedColor)}deg) saturate(150%)`;
        }
        
        // Tamanho mais generoso dos óculos
        const baseFaceScale = Math.min(canvasWidth, canvasHeight) / 500; // Reduzir divisor de 800 para 500
        const glassesAspectRatio = glassesImg.width / glassesImg.height;
        
        let finalWidth, finalHeight;
        
        if (faceDetection) {
          const eyeDistance = Math.abs(faceDetection.rightEye.x - faceDetection.leftEye.x);
          finalWidth = eyeDistance * 1.8; // Aumentar de 1.3 para 1.8
          finalHeight = finalWidth / glassesAspectRatio;
        } else {
          // Fallback com tamanhos maiores
          finalWidth = Math.max(200, Math.min(400, glassesImg.width * baseFaceScale)); // Aumentar mínimo e máximo
          finalHeight = Math.max(80, Math.min(160, glassesImg.height * baseFaceScale)); // Aumentar mínimo e máximo
        }
        
        console.log('Dimensões finais dos óculos (aumentadas):', { finalWidth, finalHeight, baseFaceScale });
        
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
        console.error('Erro ao carregar imagem da armação:', error);
        setImageLoadError(`Erro ao carregar imagem do modelo ${model.nome}`);
        drawFallbackGlasses(ctx, canvasWidth, canvasHeight);
      };
      
      glassesImg.src = model.imagem_url;
      
    } catch (error) {
      console.error('Erro no processamento da imagem:', error);
      setImageLoadError(`Erro ao processar imagem do modelo ${model.nome}`);
      drawFallbackGlasses(ctx, canvasWidth, canvasHeight);
    }
  };

  const getHueRotation = (color: string): number => {
    switch (color) {
      case '#8B4513': return 30; // marrom
      case '#FFD700': return 50; // dourado
      case '#C0C0C0': return 0;  // prata
      case '#000080': return 240; // azul
      default: return 0;
    }
  };

  const drawFallbackGlasses = (ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number) => {
    ctx.save();
    
    const centerX = canvasWidth / 2 + (adjustments.position.x * canvasWidth / 100);
    const centerY = canvasWidth / 2 + (adjustments.position.y * canvasHeight / 100);
    
    ctx.translate(centerX, centerY);
    ctx.rotate((adjustments.rotation * Math.PI) / 180);
    ctx.scale(adjustments.scale, adjustments.scale);
    ctx.globalAlpha = adjustments.opacity;
    
    ctx.strokeStyle = selectedColor || '#000000';
    ctx.lineWidth = 3;
    
    // Lentes maiores para fallback
    const lensRadius = 40; // Aumentar de 28 para 40
    const lensDistance = 50; // Aumentar de 35 para 50
    
    // Lente esquerda
    ctx.beginPath();
    ctx.arc(-lensDistance, 0, lensRadius, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Lente direita
    ctx.beginPath();
    ctx.arc(lensDistance, 0, lensRadius, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Ponte
    ctx.beginPath();
    ctx.moveTo(-12, 0); // Aumentar ponte
    ctx.lineTo(12, 0);
    ctx.stroke();
    
    // Hastes proporcionais maiores
    ctx.beginPath();
    ctx.moveTo(-(lensDistance + lensRadius), 0);
    ctx.lineTo(-(lensDistance + lensRadius + 30), -8); // Hastes maiores
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo((lensDistance + lensRadius), 0);
    ctx.lineTo((lensDistance + lensRadius + 30), -8);
    ctx.stroke();
    
    ctx.restore();
  };

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

  useEffect(() => {
    fetchGlassesModels();
  }, [fetchGlassesModels]);

  useEffect(() => {
    if (faceDetection) {
      calculateAutoPosition();
    }
  }, [faceDetection, calculateAutoPosition]);

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
      scale: 1.2, // Escala padrão maior
      rotation: 0,
      opacity: 0.9
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
                ⚠️ {imageLoadError}. Usando visualização alternativa.
              </p>
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
                            className="w-12 h-8 object-contain opacity-80"
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
                      min={0.8}
                      max={2.0}
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
                      min={0.5}
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
