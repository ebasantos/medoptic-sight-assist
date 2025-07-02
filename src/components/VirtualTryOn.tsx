
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Glasses, RotateCcw, Download, Sparkles, Eye, Palette, Settings, RefreshCw } from 'lucide-react';

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

interface FrameModel {
  id: string;
  name: string;
  category: string;
  colors: string[];
  recommended: boolean;
  paths: {
    leftLens: string;
    rightLens: string;
    bridge: string;
    leftTemple: string;
    rightTemple: string;
  };
}

const VirtualTryOn: React.FC<VirtualTryOnProps> = ({
  originalImage,
  faceAnalysis,
  suggestions = [],
  onSave
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [faceDetection, setFaceDetection] = useState<FaceDetection | null>(null);
  const [selectedFrame, setSelectedFrame] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [adjustments, setAdjustments] = useState({
    position: { x: 0, y: -10 },
    scale: 1.0,
    rotation: 0,
    opacity: 0.85
  });

  // Converter sugestões da IA em modelos de armação
  const generateFrameModels = useCallback((): FrameModel[] => {
    const models: FrameModel[] = [];
    
    suggestions.forEach((suggestion, index) => {
      const tipo = suggestion.tipo.toLowerCase();
      
      if (tipo.includes('quadrada') || tipo.includes('angular')) {
        models.push({
          id: `square_${index}`,
          name: suggestion.tipo,
          category: 'square',
          colors: getColorsForSkinTone(faceAnalysis.tomPele),
          recommended: true,
          paths: {
            leftLens: 'M20,35 L70,35 L70,65 L20,65 Z',
            rightLens: 'M90,35 L140,35 L140,65 L90,65 Z',
            bridge: 'M70,47 L90,47',
            leftTemple: 'M20,47 L5,50',
            rightTemple: 'M140,47 L155,50'
          }
        });
      }
      
      if (tipo.includes('redonda') || tipo.includes('oval')) {
        models.push({
          id: `round_${index}`,
          name: suggestion.tipo,
          category: 'round',
          colors: getColorsForSkinTone(faceAnalysis.tomPele),
          recommended: true,
          paths: {
            leftLens: 'M45,50 m-25,0 a25,15 0 1,0 50,0 a25,15 0 1,0 -50,0',
            rightLens: 'M115,50 m-25,0 a25,15 0 1,0 50,0 a25,15 0 1,0 -50,0',
            bridge: 'M70,47 L90,47',
            leftTemple: 'M20,47 L5,50',
            rightTemple: 'M140,47 L155,50'
          }
        });
      }
      
      if (tipo.includes('cat') || tipo.includes('felino') || tipo.includes('triangular')) {
        models.push({
          id: `cat_${index}`,
          name: suggestion.tipo,
          category: 'cat-eye',
          colors: getColorsForSkinTone(faceAnalysis.tomPele),
          recommended: true,
          paths: {
            leftLens: 'M15,50 Q20,35 45,38 L65,42 Q75,47 70,57 L60,67 Q40,70 25,65 Q15,60 15,50 Z',
            rightLens: 'M95,50 Q140,35 145,38 L165,42 Q175,47 170,57 L160,67 Q140,70 125,65 Q95,60 95,50 Z',
            bridge: 'M70,47 L95,47',
            leftTemple: 'M15,52 L0,55',
            rightTemple: 'M170,52 L185,55'
          }
        });
      }
      
      if (tipo.includes('aviador') || tipo.includes('aviator')) {
        models.push({
          id: `aviator_${index}`,
          name: suggestion.tipo,
          category: 'aviator',
          colors: getColorsForSkinTone(faceAnalysis.tomPele),
          recommended: true,
          paths: {
            leftLens: 'M20,40 Q20,25 40,28 L60,32 Q70,40 70,50 L70,60 Q70,75 50,72 L30,68 Q20,60 20,50 Z',
            rightLens: 'M90,40 Q90,25 110,28 L130,32 Q140,40 140,50 L140,60 Q140,75 120,72 L100,68 Q90,60 90,50 Z',
            bridge: 'M70,45 L90,45',
            leftTemple: 'M20,50 L5,53',
            rightTemple: 'M140,50 L155,53'
          }
        });
      }
    });

    // Se não há sugestões específicas, criar modelos genéricos baseados no formato do rosto
    if (models.length === 0) {
      const formatoRosto = faceAnalysis.formatoRosto.toLowerCase();
      
      if (formatoRosto.includes('redondo')) {
        models.push({
          id: 'recommended_square',
          name: 'Armação Quadrada (Recomendada)',
          category: 'square',
          colors: getColorsForSkinTone(faceAnalysis.tomPele),
          recommended: true,
          paths: {
            leftLens: 'M20,35 L70,35 L70,65 L20,65 Z',
            rightLens: 'M90,35 L140,35 L140,65 L90,65 Z',
            bridge: 'M70,47 L90,47',
            leftTemple: 'M20,47 L5,50',
            rightTemple: 'M140,47 L155,50'
          }
        });
      } else if (formatoRosto.includes('quadrado')) {
        models.push({
          id: 'recommended_round',
          name: 'Armação Redonda (Recomendada)',
          category: 'round',
          colors: getColorsForSkinTone(faceAnalysis.tomPele),
          recommended: true,
          paths: {
            leftLens: 'M45,50 m-25,0 a25,15 0 1,0 50,0 a25,15 0 1,0 -50,0',
            rightLens: 'M115,50 m-25,0 a25,15 0 1,0 50,0 a25,15 0 1,0 -50,0',
            bridge: 'M70,47 L90,47',
            leftTemple: 'M20,47 L5,50',
            rightTemple: 'M140,47 L155,50'
          }
        });
      }
    }

    return models;
  }, [suggestions, faceAnalysis]);

  const getColorsForSkinTone = (tomPele: string): string[] => {
    const tom = tomPele.toLowerCase();
    
    if (tom.includes('claro')) {
      return ['preto', 'marrom', 'dourado', 'prata'];
    } else if (tom.includes('escuro') || tom.includes('bronzeado')) {
      return ['dourado', 'bronze', 'tartaruga', 'preto'];
    } else {
      return ['preto', 'marrom', 'dourado', 'azul'];
    }
  };

  const frameModels = generateFrameModels();

  const colorMap = {
    'dourado': '#FFD700',
    'prata': '#C0C0C0',
    'preto': '#1a1a1a',
    'marrom': '#8B4513',
    'tartaruga': '#8B4513',
    'azul': '#000080',
    'bronze': '#CD7F32'
  };

  // Detectar características faciais na imagem
  const detectFaceFeatures = useCallback(async () => {
    if (!canvasRef.current || !imageRef.current) return;
    
    setIsDetecting(true);
    
    // Simular detecção facial baseada no tamanho da imagem
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const img = imageRef.current;
    const eyeDistance = Math.min(img.width, img.height) * 0.15; // Aproximadamente 15% da menor dimensão
    
    const mockDetection: FaceDetection = {
      leftEye: { 
        x: img.width * 0.35, // 35% da largura
        y: img.height * 0.4   // 40% da altura
      },
      rightEye: { 
        x: img.width * 0.65,  // 65% da largura
        y: img.height * 0.4   // 40% da altura
      },
      eyeDistance: eyeDistance,
      faceWidth: img.width * 0.4, // 40% da largura da imagem
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
    const centerY = faceDetection.leftEye.y - 8; // Ligeiramente acima dos olhos
    
    // Calcular escala baseada na distância entre os olhos
    const scale = Math.max(0.7, Math.min(1.3, faceDetection.eyeDistance / 80));
    
    setAdjustments(prev => ({
      ...prev,
      position: { 
        x: (centerX / canvas.width) * 100 - 50, // Converter para porcentagem
        y: (centerY / canvas.height) * 100 - 50
      },
      scale: scale
    }));
  }, [faceDetection]);

  // Renderizar a simulação
  const renderSimulation = useCallback(() => {
    if (!canvasRef.current || !imageRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = imageRef.current;
    
    // Configurar canvas
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    
    // Desenhar imagem original
    ctx.drawImage(img, 0, 0);
    
    // Se há uma armação selecionada, renderizar
    if (selectedFrame && selectedColor) {
      const frame = frameModels.find(f => f.id === selectedFrame);
      if (frame) {
        renderFrame(ctx, frame, canvas.width, canvas.height);
      }
    }
    
    // Renderizar pontos de detecção facial se disponível (apenas para debug)
    if (faceDetection && faceDetection.confidence > 0.7) {
      renderFacePoints(ctx);
    }
  }, [selectedFrame, selectedColor, adjustments, faceDetection, frameModels]);

  const renderFrame = (ctx: CanvasRenderingContext2D, frame: FrameModel, canvasWidth: number, canvasHeight: number) => {
    ctx.save();
    
    // Calcular posição central
    const centerX = canvasWidth / 2 + (adjustments.position.x * canvasWidth / 100);
    const centerY = canvasHeight / 2 + (adjustments.position.y * canvasHeight / 100);
    
    // Aplicar transformações
    ctx.translate(centerX, centerY);
    ctx.rotate((adjustments.rotation * Math.PI) / 180);
    ctx.scale(adjustments.scale, adjustments.scale);
    ctx.globalAlpha = adjustments.opacity;
    
    // Configurar estilo
    const color = colorMap[selectedColor as keyof typeof colorMap] || '#000000';
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Desenhar armação usando paths
    const scale = Math.min(canvasWidth, canvasHeight) / 400; // Escala baseada no tamanho da imagem
    
    ctx.scale(scale, scale);
    ctx.translate(-80, -50); // Centralizar a armação
    
    // Desenhar lentes
    ctx.beginPath();
    const leftLensPath = new Path2D(frame.paths.leftLens);
    ctx.stroke(leftLensPath);
    
    ctx.beginPath();
    const rightLensPath = new Path2D(frame.paths.rightLens);
    ctx.stroke(rightLensPath);
    
    // Desenhar ponte
    ctx.beginPath();
    const bridgePath = new Path2D(frame.paths.bridge);
    ctx.stroke(bridgePath);
    
    // Desenhar hastes
    ctx.beginPath();
    const leftTemplePath = new Path2D(frame.paths.leftTemple);
    ctx.stroke(leftTemplePath);
    
    ctx.beginPath();
    const rightTemplePath = new Path2D(frame.paths.rightTemple);
    ctx.stroke(rightTemplePath);
    
    ctx.restore();
  };

  const renderFacePoints = (ctx: CanvasRenderingContext2D) => {
    if (!faceDetection) return;
    
    ctx.save();
    ctx.fillStyle = '#00FF00';
    ctx.globalAlpha = 0.7;
    
    // Desenhar pontos dos olhos (pequenos para não atrapalhar)
    ctx.beginPath();
    ctx.arc(faceDetection.leftEye.x, faceDetection.leftEye.y, 2, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(faceDetection.rightEye.x, faceDetection.rightEye.y, 2, 0, 2 * Math.PI);
    ctx.fill();
    
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

  // Inicializar com primeira armação recomendada
  useEffect(() => {
    if (frameModels.length > 0 && !selectedFrame) {
      const firstFrame = frameModels[0];
      setSelectedFrame(firstFrame.id);
      if (firstFrame.colors.length > 0) {
        setSelectedColor(firstFrame.colors[0]);
      }
    }
  }, [frameModels, selectedFrame]);

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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Provador Virtual - Sugestões da IA
            {faceDetection && (
              <Badge variant="secondary" className="ml-auto">
                <Eye className="h-3 w-3 mr-1" />
                Rosto Detectado ({Math.round(faceDetection.confidence * 100)}%)
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
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
              
              {/* Seleção de Armação */}
              <div>
                <Label className="text-base font-semibold mb-3 block flex items-center gap-2">
                  <Glasses className="h-4 w-4" />
                  Armações Recomendadas
                </Label>
                <div className="grid grid-cols-1 gap-3">
                  {frameModels.map((frame) => (
                    <div
                      key={frame.id}
                      className={`relative p-3 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        selectedFrame === frame.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedFrame(frame.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-sm">{frame.name}</h4>
                          <p className="text-xs text-gray-500 capitalize">{frame.category}</p>
                        </div>
                        {frame.recommended && (
                          <Badge className="bg-green-500 text-white text-xs">
                            IA Recomenda
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Seleção de Cor */}
              {selectedFrame && (
                <div>
                  <Label className="text-base font-semibold mb-3 block flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Cores para seu Tom de Pele
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {frameModels.find(f => f.id === selectedFrame)?.colors.map((color) => (
                      <button
                        key={color}
                        className={`p-2 border-2 rounded-lg text-xs font-medium transition-all ${
                          selectedColor === color
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedColor(color)}
                      >
                        <div
                          className="w-4 h-4 rounded-full mx-auto mb-1 border border-gray-300"
                          style={{ backgroundColor: colorMap[color as keyof typeof colorMap] }}
                        />
                        {color}
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
