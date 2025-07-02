
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Glasses, RotateCcw, ZoomIn, ZoomOut, Move, Download } from 'lucide-react';

interface FrameSimulationProps {
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

const FrameSimulation: React.FC<FrameSimulationProps> = ({
  originalImage,
  faceAnalysis,
  onSave
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [framePosition, setFramePosition] = useState({ x: 0, y: 0 });
  const [frameSize, setFrameSize] = useState(100);
  const [frameRotation, setFrameRotation] = useState(0);
  const [selectedFrameType, setSelectedFrameType] = useState<string>('');
  const [selectedFrameColor, setSelectedFrameColor] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Determinar armação recomendada baseada na análise
  const getRecommendedFrame = () => {
    const formato = faceAnalysis.formatoRosto.toLowerCase();
    const tomPele = faceAnalysis.tomPele.toLowerCase();
    
    let frameType = '';
    let frameColor = '';
    
    // Lógica para tipo de armação
    switch (formato) {
      case 'oval':
        frameType = 'quadrada';
        break;
      case 'redondo':
        frameType = 'angular';
        break;
      case 'quadrado':
        frameType = 'redonda';
        break;
      case 'coração':
      case 'triangular':
        frameType = 'base-larga';
        break;
      case 'losango':
        frameType = 'oval-larga';
        break;
      case 'retangular':
      case 'alongado':
        frameType = 'redonda-grande';
        break;
      default:
        frameType = 'classica';
    }
    
    // Lógica para cor da armação
    if (tomPele.includes('claro')) {
      frameColor = 'marrom-claro';
    } else if (tomPele.includes('escuro') || tomPele.includes('bronzeado')) {
      frameColor = 'preto';
    } else {
      frameColor = 'tartaruga';
    }
    
    return { frameType, frameColor };
  };

  const recommendedFrame = getRecommendedFrame();

  useEffect(() => {
    setSelectedFrameType(recommendedFrame.frameType);
    setSelectedFrameColor(recommendedFrame.frameColor);
  }, []);

  // Gerar armação SVG baseado no tipo selecionado
  const generateFrameSVG = (type: string, color: string) => {
    const colors = {
      'preto': '#000000',
      'marrom-claro': '#8B4513',
      'tartaruga': '#654321',
      'azul-marinho': '#000080',
      'vermelho': '#8B0000'
    };
    
    const frameColor = colors[color as keyof typeof colors] || '#000000';
    
    // SVG básico de óculos - seria melhor ter designs reais
    const svgContent = `
      <svg width="200" height="80" viewBox="0 0 200 80" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="2" dy="2" stdDeviation="2" flood-opacity="0.3"/>
          </filter>
        </defs>
        
        ${type === 'redonda' ? `
          <circle cx="50" cy="40" r="30" fill="none" stroke="${frameColor}" stroke-width="3" filter="url(#shadow)"/>
          <circle cx="150" cy="40" r="30" fill="none" stroke="${frameColor}" stroke-width="3" filter="url(#shadow)"/>
          <line x1="80" y1="40" x2="120" y2="40" stroke="${frameColor}" stroke-width="3"/>
        ` : type === 'quadrada' ? `
          <rect x="20" y="15" width="60" height="50" rx="5" fill="none" stroke="${frameColor}" stroke-width="3" filter="url(#shadow)"/>
          <rect x="120" y="15" width="60" height="50" rx="5" fill="none" stroke="${frameColor}" stroke-width="3" filter="url(#shadow)"/>
          <line x1="80" y1="40" x2="120" y2="40" stroke="${frameColor}" stroke-width="3"/>
        ` : `
          <ellipse cx="50" cy="40" rx="35" ry="25" fill="none" stroke="${frameColor}" stroke-width="3" filter="url(#shadow)"/>
          <ellipse cx="150" cy="40" rx="35" ry="25" fill="none" stroke="${frameColor}" stroke-width="3" filter="url(#shadow)"/>
          <line x1="85" y1="40" x2="115" y2="40" stroke="${frameColor}" stroke-width="3"/>
        `}
        
        <!-- Hastes -->
        <line x1="180" y1="40" x2="200" y2="35" stroke="${frameColor}" stroke-width="3"/>
        <line x1="20" y1="40" x2="0" y2="35" stroke="${frameColor}" stroke-width="3"/>
      </svg>
    `;
    
    return svgContent;
  };

  // Desenhar a simulação no canvas
  const drawSimulation = async () => {
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
      
      // Criar e desenhar armação
      const frameSVG = generateFrameSVG(selectedFrameType, selectedFrameColor);
      const svgBlob = new Blob([frameSVG], { type: 'image/svg+xml' });
      const svgUrl = URL.createObjectURL(svgBlob);
      
      const frameImg = new Image();
      frameImg.onload = () => {
        ctx.save();
        
        // Aplicar transformações
        const centerX = canvas.width / 2 + framePosition.x;
        const centerY = canvas.height / 3 + framePosition.y;
        
        ctx.translate(centerX, centerY);
        ctx.rotate((frameRotation * Math.PI) / 180);
        ctx.scale(frameSize / 100, frameSize / 100);
        
        // Desenhar armação centralizada
        ctx.drawImage(frameImg, -frameImg.width / 2, -frameImg.height / 2);
        
        ctx.restore();
        URL.revokeObjectURL(svgUrl);
      };
      frameImg.src = svgUrl;
    };
    img.src = originalImage;
  };

  useEffect(() => {
    drawSimulation();
  }, [originalImage, selectedFrameType, selectedFrameColor, framePosition, frameSize, frameRotation]);

  const handleSaveSimulation = () => {
    if (!canvasRef.current) return;
    
    const imageData = canvasRef.current.toDataURL('image/jpeg', 0.9);
    if (onSave) {
      onSave(imageData);
    }
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    
    const link = document.createElement('a');
    link.download = 'simulacao-armacao.jpg';
    link.href = canvasRef.current.toDataURL('image/jpeg', 0.9);
    link.click();
  };

  const frameTypes = [
    { id: 'quadrada', name: 'Quadrada', recommended: recommendedFrame.frameType === 'quadrada' },
    { id: 'redonda', name: 'Redonda', recommended: recommendedFrame.frameType === 'redonda' },
    { id: 'angular', name: 'Angular', recommended: recommendedFrame.frameType === 'angular' },
    { id: 'oval-larga', name: 'Oval Larga', recommended: recommendedFrame.frameType === 'oval-larga' },
    { id: 'base-larga', name: 'Base Larga', recommended: recommendedFrame.frameType === 'base-larga' },
    { id: 'redonda-grande', name: 'Redonda Grande', recommended: recommendedFrame.frameType === 'redonda-grande' },
    { id: 'classica', name: 'Clássica', recommended: recommendedFrame.frameType === 'classica' }
  ];

  const frameColors = [
    { id: 'preto', name: 'Preto', recommended: recommendedFrame.frameColor === 'preto' },
    { id: 'marrom-claro', name: 'Marrom Claro', recommended: recommendedFrame.frameColor === 'marrom-claro' },
    { id: 'tartaruga', name: 'Tartaruga', recommended: recommendedFrame.frameColor === 'tartaruga' },
    { id: 'azul-marinho', name: 'Azul Marinho', recommended: false },
    { id: 'vermelho', name: 'Vermelho', recommended: false }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Glasses className="h-5 w-5" />
            Simulação de Armação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Canvas de simulação */}
            <div className="space-y-4">
              <div className="relative border rounded-lg overflow-hidden bg-gray-50">
                <canvas
                  ref={canvasRef}
                  className="max-w-full h-auto"
                  style={{ maxHeight: '400px' }}
                />
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleSaveSimulation} className="flex-1">
                  Salvar Simulação
                </Button>
                <Button onClick={handleDownload} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
            
            {/* Controles */}
            <div className="space-y-6">
              {/* Tipo de armação */}
              <div>
                <Label className="text-base font-semibold mb-3 block">
                  Tipo de Armação
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {frameTypes.map((type) => (
                    <Button
                      key={type.id}
                      variant={selectedFrameType === type.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedFrameType(type.id)}
                      className="relative"
                    >
                      {type.name}
                      {type.recommended && (
                        <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                          ✓
                        </span>
                      )}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Cor da armação */}
              <div>
                <Label className="text-base font-semibold mb-3 block">
                  Cor da Armação
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {frameColors.map((color) => (
                    <Button
                      key={color.id}
                      variant={selectedFrameColor === color.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedFrameColor(color.id)}
                      className="relative"
                    >
                      {color.name}
                      {color.recommended && (
                        <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                          ✓
                        </span>
                      )}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Ajustes */}
              <div className="space-y-4">
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Move className="h-4 w-4" />
                    Posição Horizontal: {framePosition.x}px
                  </Label>
                  <Slider
                    value={[framePosition.x]}
                    onValueChange={(value) => setFramePosition({ ...framePosition, x: value[0] })}
                    min={-100}
                    max={100}
                    step={1}
                  />
                </div>
                
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Move className="h-4 w-4" />
                    Posição Vertical: {framePosition.y}px
                  </Label>
                  <Slider
                    value={[framePosition.y]}
                    onValueChange={(value) => setFramePosition({ ...framePosition, y: value[0] })}
                    min={-50}
                    max={50}
                    step={1}
                  />
                </div>
                
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <ZoomIn className="h-4 w-4" />
                    Tamanho: {frameSize}%
                  </Label>
                  <Slider
                    value={[frameSize]}
                    onValueChange={(value) => setFrameSize(value[0])}
                    min={50}
                    max={150}
                    step={5}
                  />
                </div>
                
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <RotateCcw className="h-4 w-4" />
                    Rotação: {frameRotation}°
                  </Label>
                  <Slider
                    value={[frameRotation]}
                    onValueChange={(value) => setFrameRotation(value[0])}
                    min={-15}
                    max={15}
                    step={1}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FrameSimulation;
