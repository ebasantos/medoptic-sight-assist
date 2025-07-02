
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
  nose: { x: number; y: number };
  faceWidth: number;
  faceHeight: number;
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
  onSave?: (simulatedImage: string) => void;
}

interface FrameModel {
  id: string;
  name: string;
  category: string;
  colors: string[];
  recommended: boolean;
  svg: string;
  dimensions: {
    width: number;
    height: number;
    bridge: number;
    temple: number;
  };
}

const VirtualTryOn: React.FC<VirtualTryOnProps> = ({
  originalImage,
  faceAnalysis,
  onSave
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [faceDetection, setFaceDetection] = useState<FaceDetection | null>(null);
  const [selectedFrame, setSelectedFrame] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [adjustments, setAdjustments] = useState({
    position: { x: 0, y: 0 },
    scale: 1.0,
    rotation: 0,
    opacity: 0.9
  });

  // Modelos de armações mais realistas
  const frameModels: FrameModel[] = [
    {
      id: 'aviator',
      name: 'Aviador Clássico',
      category: 'aviator',
      colors: ['dourado', 'prateado', 'preto'],
      recommended: faceAnalysis.formatoRosto.toLowerCase() === 'quadrado',
      dimensions: { width: 140, height: 50, bridge: 14, temple: 140 },
      svg: `
        <g filter="url(#shadow)">
          <path d="M20,40 Q20,20 40,20 L100,20 Q120,20 120,40 L120,60 Q120,80 100,80 L40,80 Q20,80 20,60 Z" 
                fill="none" stroke="currentColor" stroke-width="2.5" opacity="0.9"/>
          <path d="M140,40 Q140,20 160,20 L220,20 Q240,20 240,40 L240,60 Q240,80 220,80 L160,80 Q140,80 140,60 Z" 
                fill="none" stroke="currentColor" stroke-width="2.5" opacity="0.9"/>
          <path d="M120,40 L140,40" stroke="currentColor" stroke-width="2"/>
          <path d="M20,45 L5,48" stroke="currentColor" stroke-width="2"/>
          <path d="M240,45 L255,48" stroke="currentColor" stroke-width="2"/>
        </g>
      `
    },
    {
      id: 'wayfarer',
      name: 'Wayfarer Moderno',
      category: 'square',
      colors: ['preto', 'tartaruga', 'azul'],
      recommended: faceAnalysis.formatoRosto.toLowerCase() === 'redondo',
      dimensions: { width: 145, height: 48, bridge: 20, temple: 145 },
      svg: `
        <g filter="url(#shadow)">
          <rect x="15" y="25" width="70" height="45" rx="8" 
                fill="none" stroke="currentColor" stroke-width="3" opacity="0.9"/>
          <rect x="135" y="25" width="70" height="45" rx="8" 
                fill="none" stroke="currentColor" stroke-width="3" opacity="0.9"/>
          <path d="M85,47 L135,47" stroke="currentColor" stroke-width="3"/>
          <path d="M15,47 L0,50" stroke="currentColor" stroke-width="2.5"/>
          <path d="M205,47 L220,50" stroke="currentColor" stroke-width="2.5"/>
        </g>
      `
    },
    {
      id: 'round',
      name: 'Redondo Vintage',
      category: 'round',
      colors: ['dourado', 'prateado', 'bronze'],
      recommended: faceAnalysis.formatoRosto.toLowerCase() === 'quadrado',
      dimensions: { width: 135, height: 50, bridge: 18, temple: 140 },
      svg: `
        <g filter="url(#shadow)">
          <circle cx="50" cy="47" r="30" 
                  fill="none" stroke="currentColor" stroke-width="2.5" opacity="0.9"/>
          <circle cx="170" cy="47" r="30" 
                  fill="none" stroke="currentColor" stroke-width="2.5" opacity="0.9"/>
          <path d="M80,47 L140,47" stroke="currentColor" stroke-width="2.5"/>
          <path d="M20,47 L5,50" stroke="currentColor" stroke-width="2"/>
          <path d="M200,47 L215,50" stroke="currentColor" stroke-width="2"/>
        </g>
      `
    },
    {
      id: 'cat-eye',
      name: 'Cat Eye Fashion',
      category: 'cat-eye',
      colors: ['preto', 'vermelho', 'leopardo'],
      recommended: faceAnalysis.formatoRosto.toLowerCase() === 'coração',
      dimensions: { width: 150, height: 45, bridge: 16, temple: 140 },
      svg: `
        <g filter="url(#shadow)">
          <path d="M10,50 Q15,30 45,35 L75,40 Q85,45 80,55 L70,65 Q50,70 35,65 Q20,60 10,50 Z" 
                fill="none" stroke="currentColor" stroke-width="2.5" opacity="0.9"/>
          <path d="M140,50 Q175,30 185,35 L215,40 Q225,45 220,55 L210,65 Q190,70 175,65 Q160,60 140,50 Z" 
                fill="none" stroke="currentColor" stroke-width="2.5" opacity="0.9"/>
          <path d="M80,47 L140,47" stroke="currentColor" stroke-width="2"/>
          <path d="M10,52 L-5,55" stroke="currentColor" stroke-width="2"/>
          <path d="M220,52 L235,55" stroke="currentColor" stroke-width="2"/>
        </g>
      `
    }
  ];

  const colorMap = {
    'dourado': '#FFD700',
    'prateado': '#C0C0C0',
    'preto': '#000000',
    'tartaruga': '#8B4513',
    'azul': '#000080',
    'vermelho': '#8B0000',
    'bronze': '#CD7F32',
    'leopardo': '#DEB887'
  };

  // Detectar características faciais automaticamente
  const detectFaceFeatures = useCallback(async () => {
    if (!canvasRef.current) return;
    
    setIsDetecting(true);
    
    // Simular detecção facial (em um app real, usaria bibliotecas como face-api.js)
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simular pontos faciais baseados na análise
    const mockDetection: FaceDetection = {
      leftEye: { x: 180, y: 150 },
      rightEye: { x: 280, y: 150 },
      nose: { x: 230, y: 180 },
      faceWidth: 200,
      faceHeight: 280,
      confidence: 0.92
    };
    
    setFaceDetection(mockDetection);
    setIsDetecting(false);
  }, []);

  // Calcular posição automática baseada na detecção facial
  const calculateAutoPosition = useCallback(() => {
    if (!faceDetection) return;
    
    const eyeDistance = Math.abs(faceDetection.rightEye.x - faceDetection.leftEye.x);
    const centerX = (faceDetection.leftEye.x + faceDetection.rightEye.x) / 2;
    const centerY = faceDetection.leftEye.y - 5; // Ligeiramente acima dos olhos
    
    setAdjustments(prev => ({
      ...prev,
      position: { 
        x: centerX - 130, // Ajustar para centralizar a armação
        y: centerY - 25 
      },
      scale: Math.max(0.8, Math.min(1.2, eyeDistance / 100))
    }));
  }, [faceDetection]);

  // Renderizar a simulação
  const renderSimulation = useCallback(async () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Carregar imagem original
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Desenhar imagem original
      ctx.drawImage(img, 0, 0);
      
      // Se há uma armação selecionada, renderizar
      if (selectedFrame && selectedColor) {
        const frame = frameModels.find(f => f.id === selectedFrame);
        if (frame) {
          renderFrame(ctx, frame, canvas.width, canvas.height);
        }
      }
      
      // Renderizar pontos de detecção facial se disponível
      if (faceDetection && faceDetection.confidence > 0.7) {
        renderFacePoints(ctx);
      }
    };
    img.src = originalImage;
  }, [originalImage, selectedFrame, selectedColor, adjustments, faceDetection]);

  const renderFrame = (ctx: CanvasRenderingContext2D, frame: FrameModel, canvasWidth: number, canvasHeight: number) => {
    ctx.save();
    
    // Aplicar transformações
    const centerX = canvasWidth / 2 + adjustments.position.x;
    const centerY = canvasHeight / 3 + adjustments.position.y;
    
    ctx.translate(centerX, centerY);
    ctx.rotate((adjustments.rotation * Math.PI) / 180);
    ctx.scale(adjustments.scale, adjustments.scale);
    ctx.globalAlpha = adjustments.opacity;
    
    // Criar SVG temporário
    const svgString = `
      <svg width="260" height="100" viewBox="0 0 260 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="1" dy="2" stdDeviation="2" flood-opacity="0.3"/>
          </filter>
          <linearGradient id="frameGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${colorMap[selectedColor as keyof typeof colorMap]};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${colorMap[selectedColor as keyof typeof colorMap]};stop-opacity:0.8" />
          </linearGradient>
        </defs>
        <g color="${colorMap[selectedColor as keyof typeof colorMap]}">
          ${frame.svg}
        </g>
      </svg>
    `;
    
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
    const svgUrl = URL.createObjectURL(svgBlob);
    
    const frameImg = new Image();
    frameImg.onload = () => {
      ctx.drawImage(frameImg, -130, -50, 260, 100);
      URL.revokeObjectURL(svgUrl);
    };
    frameImg.src = svgUrl;
    
    ctx.restore();
  };

  const renderFacePoints = (ctx: CanvasRenderingContext2D) => {
    if (!faceDetection) return;
    
    ctx.save();
    ctx.fillStyle = '#00FF00';
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 2;
    
    // Desenhar pontos dos olhos
    ctx.beginPath();
    ctx.arc(faceDetection.leftEye.x, faceDetection.leftEye.y, 3, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(faceDetection.rightEye.x, faceDetection.rightEye.y, 3, 0, 2 * Math.PI);
    ctx.fill();
    
    // Linha entre os olhos
    ctx.beginPath();
    ctx.moveTo(faceDetection.leftEye.x, faceDetection.leftEye.y);
    ctx.lineTo(faceDetection.rightEye.x, faceDetection.rightEye.y);
    ctx.stroke();
    
    ctx.restore();
  };

  // Inicializar com armação recomendada
  useEffect(() => {
    const recommendedFrame = frameModels.find(f => f.recommended);
    if (recommendedFrame) {
      setSelectedFrame(recommendedFrame.id);
      setSelectedColor(recommendedFrame.colors[0]);
    }
  }, []);

  // Detectar face automaticamente ao carregar
  useEffect(() => {
    detectFaceFeatures();
  }, [detectFaceFeatures]);

  // Auto-posicionar quando a detecção facial estiver pronta
  useEffect(() => {
    if (faceDetection) {
      calculateAutoPosition();
    }
  }, [faceDetection, calculateAutoPosition]);

  // Re-renderizar quando qualquer parâmetro mudar
  useEffect(() => {
    renderSimulation();
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
      position: { x: 0, y: 0 },
      scale: 1.0,
      rotation: 0,
      opacity: 0.9
    });
    if (faceDetection) {
      calculateAutoPosition();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Provador Virtual Inteligente
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
                      <span className="text-sm font-medium">Detectando características faciais...</span>
                    </div>
                  </div>
                )}
                
                <canvas
                  ref={canvasRef}
                  className="w-full h-auto max-h-[500px] object-contain"
                />
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
              {/* Seleção de Armação */}
              <div>
                <Label className="text-base font-semibold mb-3 block flex items-center gap-2">
                  <Glasses className="h-4 w-4" />
                  Modelos de Armação
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
                            Recomendado
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
                    Cores Disponíveis
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
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
                      Posição Horizontal: {adjustments.position.x}px
                    </Label>
                    <Slider
                      value={[adjustments.position.x]}
                      onValueChange={(value) => 
                        setAdjustments(prev => ({ 
                          ...prev, 
                          position: { ...prev.position, x: value[0] } 
                        }))
                      }
                      min={-100}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm mb-2 block">
                      Posição Vertical: {adjustments.position.y}px
                    </Label>
                    <Slider
                      value={[adjustments.position.y]}
                      onValueChange={(value) => 
                        setAdjustments(prev => ({ 
                          ...prev, 
                          position: { ...prev.position, y: value[0] } 
                        }))
                      }
                      min={-50}
                      max={50}
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
