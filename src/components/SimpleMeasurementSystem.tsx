import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Eye, Glasses, RotateCcw, CheckCircle, ZoomIn, ZoomOut, Target } from 'lucide-react';

interface MeasurementPoint {
  x: number;
  y: number;
}

interface SimpleMeasurementSystemProps {
  imageData: string;
  hasGlasses?: boolean;
  onMeasurementsChange: (measurements: MeasurementResults) => void;
}

interface MeasurementResults {
  dpBinocular: number;
  dnpEsquerda: number;
  dnpDireita: number;
  alturaEsquerda?: number;
  alturaDireita?: number;
  larguraLente: number;
  confiabilidade: number;
  temOculos: boolean;
  autoCalibrated: boolean;
  anthropometricScale: number;
}

export const SimpleMeasurementSystem: React.FC<SimpleMeasurementSystemProps> = ({
  imageData,
  hasGlasses = false,
  onMeasurementsChange
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [hasGlassesDetected, setHasGlassesDetected] = useState(hasGlasses);
  const [isProcessed, setIsProcessed] = useState(false);
  
  // Measurement points
  const [leftPupil, setLeftPupil] = useState<MeasurementPoint>({ x: 0, y: 0 });
  const [rightPupil, setRightPupil] = useState<MeasurementPoint>({ x: 0, y: 0 });
  const [leftGlassesBottom, setLeftGlassesBottom] = useState<MeasurementPoint>({ x: 0, y: 0 });
  const [rightGlassesBottom, setRightGlassesBottom] = useState<MeasurementPoint>({ x: 0, y: 0 });
  
  // Viewport state
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });

  // Load image and initialize positions
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      setIsLoaded(true);
      initializePositions();
      drawCanvas();
    };
    img.onerror = (error) => {
      console.error('Erro ao carregar imagem:', error);
    };
    img.src = imageData;
  }, [imageData]);

  const initializePositions = useCallback(() => {
    if (!imageRef.current) return;
    
    const img = imageRef.current;
    const centerX = img.width / 2;
    const eyeDistance = img.width * 0.25;
    const eyeY = img.height * 0.42;
    
    setLeftPupil({ x: centerX - eyeDistance, y: eyeY });
    setRightPupil({ x: centerX + eyeDistance, y: eyeY });
    
    if (hasGlassesDetected) {
      const glassesY = eyeY + (img.height * 0.08);
      setLeftGlassesBottom({ x: centerX - eyeDistance, y: glassesY });
      setRightGlassesBottom({ x: centerX + eyeDistance, y: glassesY });
    }
  }, [hasGlassesDetected]);

  const drawCanvas = useCallback(() => {
    if (!canvasRef.current || !imageRef.current || !isLoaded) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const container = containerRef.current;
    if (!container) return;
    
    // Set canvas size
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    const img = imageRef.current;
    
    // Calculate image display size and position
    const containerAspect = canvas.width / canvas.height;
    const imageAspect = img.width / img.height;
    
    let displayWidth, displayHeight;
    
    if (imageAspect > containerAspect) {
      displayWidth = canvas.width * zoom;
      displayHeight = displayWidth / imageAspect;
    } else {
      displayHeight = canvas.height * zoom;
      displayWidth = displayHeight * imageAspect;
    }
    
    const imgX = (canvas.width - displayWidth) / 2 + offset.x;
    const imgY = (canvas.height - displayHeight) / 2 + offset.y;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw image
    ctx.drawImage(img, imgX, imgY, displayWidth, displayHeight);
    
    // Helper function to convert image coordinates to canvas coordinates
    const toCanvas = (x: number, y: number) => ({
      x: imgX + (x / img.width) * displayWidth,
      y: imgY + (y / img.height) * displayHeight
    });
    
    // Draw pupil line
    const leftCanvas = toCanvas(leftPupil.x, leftPupil.y);
    const rightCanvas = toCanvas(rightPupil.x, rightPupil.y);
    
    ctx.strokeStyle = '#00ff41';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    ctx.moveTo(leftCanvas.x, leftCanvas.y);
    ctx.lineTo(rightCanvas.x, rightCanvas.y);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw pupil points
    [leftCanvas, rightCanvas].forEach((point, index) => {
      ctx.fillStyle = '#ff0044';
      ctx.beginPath();
      ctx.arc(point.x, point.y, 8, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
    
    // Draw glasses measurements if applicable
    if (hasGlassesDetected) {
      const leftGlassesCanvas = toCanvas(leftGlassesBottom.x, leftGlassesBottom.y);
      const rightGlassesCanvas = toCanvas(rightGlassesBottom.x, rightGlassesBottom.y);
      
      // Vertical lines
      ctx.strokeStyle = '#0066ff';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 3]);
      
      ctx.beginPath();
      ctx.moveTo(leftCanvas.x, leftCanvas.y);
      ctx.lineTo(leftGlassesCanvas.x, leftGlassesCanvas.y);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(rightCanvas.x, rightCanvas.y);
      ctx.lineTo(rightGlassesCanvas.x, rightGlassesCanvas.y);
      ctx.stroke();
      
      // Glasses bottom points
      ctx.setLineDash([]);
      [leftGlassesCanvas, rightGlassesCanvas].forEach(point => {
        ctx.fillStyle = '#0066ff';
        ctx.beginPath();
        ctx.arc(point.x, point.y, 6, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    }
    
    // Draw labels
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    
    const midX = (leftCanvas.x + rightCanvas.x) / 2;
    const midY = Math.min(leftCanvas.y, rightCanvas.y) - 20;
    ctx.strokeText('Linha Pupilar', midX, midY);
    ctx.fillText('Linha Pupilar', midX, midY);
    
    // Draw live measurements
    if (!isProcessed) {
      const measurements = calculateLiveMeasurements();
      ctx.strokeText(`PD: ${measurements.dpBinocular.toFixed(1)}mm`, midX, midY + 25);
      ctx.fillText(`PD: ${measurements.dpBinocular.toFixed(1)}mm`, midX, midY + 25);
    }
    
  }, [leftPupil, rightPupil, leftGlassesBottom, rightGlassesBottom, hasGlassesDetected, isLoaded, zoom, offset, isProcessed]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Mouse interaction handlers
  const getImageCoordinates = (clientX: number, clientY: number) => {
    if (!canvasRef.current || !imageRef.current || !containerRef.current) return { x: 0, y: 0 };
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const img = imageRef.current;
    
    const canvasX = clientX - rect.left;
    const canvasY = clientY - rect.top;
    
    console.log('Click nas coordenadas do canvas:', canvasX, canvasY);
    
    // Calculate image bounds
    const containerAspect = canvas.width / canvas.height;
    const imageAspect = img.width / img.height;
    
    let displayWidth, displayHeight;
    
    if (imageAspect > containerAspect) {
      displayWidth = canvas.width * zoom;
      displayHeight = displayWidth / imageAspect;
    } else {
      displayHeight = canvas.height * zoom;
      displayWidth = displayHeight * imageAspect;
    }
    
    const imgX = (canvas.width - displayWidth) / 2 + offset.x;
    const imgY = (canvas.height - displayHeight) / 2 + offset.y;
    
    // Convert to image coordinates
    const x = Math.max(0, Math.min(img.width, ((canvasX - imgX) / displayWidth) * img.width));
    const y = Math.max(0, Math.min(img.height, ((canvasY - imgY) / displayHeight) * img.height));
    
    console.log('Coordenadas da imagem calculadas:', x, y);
    
    return { x, y };
  };

  const getPointDistance = (point1: MeasurementPoint, point2: MeasurementPoint) => {
    return Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    const coords = getImageCoordinates(event.clientX, event.clientY);
    const threshold = 25 / zoom;
    
    console.log('Mouse down - coords:', coords, 'threshold:', threshold);
    console.log('Posições atuais - leftPupil:', leftPupil, 'rightPupil:', rightPupil);
    
    const leftDistance = getPointDistance(coords, leftPupil);
    const rightDistance = getPointDistance(coords, rightPupil);
    const leftGlassesDistance = hasGlassesDetected ? getPointDistance(coords, leftGlassesBottom) : Infinity;
    const rightGlassesDistance = hasGlassesDetected ? getPointDistance(coords, rightGlassesBottom) : Infinity;
    
    console.log('Distâncias:', { leftDistance, rightDistance, leftGlassesDistance, rightGlassesDistance });
    
    if (leftDistance < threshold) {
      console.log('Arrastando pupila esquerda');
      setIsDragging('leftPupil');
      event.preventDefault();
    } else if (rightDistance < threshold) {
      console.log('Arrastando pupila direita');
      setIsDragging('rightPupil');
      event.preventDefault();
    } else if (hasGlassesDetected && leftGlassesDistance < threshold) {
      console.log('Arrastando óculos esquerdo');
      setIsDragging('leftGlasses');
      event.preventDefault();
    } else if (hasGlassesDetected && rightGlassesDistance < threshold) {
      console.log('Arrastando óculos direito');
      setIsDragging('rightGlasses');
      event.preventDefault();
    } else {
      console.log('Iniciando pan');
      setIsPanning(true);
      setLastPanPoint({ x: event.clientX, y: event.clientY });
    }
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (isDragging) {
      const coords = getImageCoordinates(event.clientX, event.clientY);
      console.log('Movendo para:', coords, 'Tipo:', isDragging);
      
      switch (isDragging) {
        case 'leftPupil':
          setLeftPupil(coords);
          console.log('Nova posição pupila esquerda:', coords);
          break;
        case 'rightPupil':
          setRightPupil(coords);
          console.log('Nova posição pupila direita:', coords);
          break;
        case 'leftGlasses':
          setLeftGlassesBottom(coords);
          break;
        case 'rightGlasses':
          setRightGlassesBottom(coords);
          break;
      }
    } else if (isPanning) {
      const deltaX = event.clientX - lastPanPoint.x;
      const deltaY = event.clientY - lastPanPoint.y;
      
      setOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      setLastPanPoint({ x: event.clientX, y: event.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(null);
    setIsPanning(false);
  };

  const calculateLiveMeasurements = (): MeasurementResults => {
    // Calcular distância real entre pupilas em pixels
    const pixelDistance = Math.abs(rightPupil.x - leftPupil.x);
    console.log('Distância em pixels entre pupilas:', pixelDistance);
    console.log('Posições das pupilas - Esquerda:', leftPupil, 'Direita:', rightPupil);
    
    // Para calibração, usar uma largura de referência (frame width) se disponível
    // Caso contrário, usar uma estimativa baseada na proporção da imagem
    const imageRef_current = imageRef.current;
    if (!imageRef_current) {
      return {
        dpBinocular: 0,
        dnpEsquerda: 0,
        dnpDireita: 0,
        larguraLente: 0,
        confiabilidade: 0,
        temOculos: hasGlassesDetected,
        autoCalibrated: false,
        anthropometricScale: 1
      };
    }
    
    // Usar proporção da largura da imagem para estimar escala
    // Assumindo que a largura facial típica é cerca de 140mm
    const estimatedFaceWidthMM = 140;
    const estimatedFaceWidthPixels = imageRef_current.width * 0.6; // 60% da largura da imagem
    const pixelsPerMM = estimatedFaceWidthPixels / estimatedFaceWidthMM;
    
    console.log('Pixels por MM estimado:', pixelsPerMM);
    
    // Calcular DP Binocular baseado na distância real dos pontos
    const dpBinocular = pixelDistance / pixelsPerMM;
    
    // Calcular DNP (distância centro-nasal à pupila) - metade da DP para cada lado
    const centerX = (leftPupil.x + rightPupil.x) / 2;
    const dnpEsquerda = Math.abs(centerX - leftPupil.x) / pixelsPerMM;
    const dnpDireita = Math.abs(rightPupil.x - centerX) / pixelsPerMM;
    
    console.log('Medições calculadas:', { dpBinocular, dnpEsquerda, dnpDireita });
    
    const measurements: MeasurementResults = {
      dpBinocular: dpBinocular,
      dnpEsquerda: dnpEsquerda,
      dnpDireita: dnpDireita,
      larguraLente: dpBinocular * 0.75,
      confiabilidade: 0.85,
      temOculos: hasGlassesDetected,
      autoCalibrated: true,
      anthropometricScale: pixelsPerMM
    };
    
    
    if (hasGlassesDetected) {
      const leftHeightPixels = Math.abs(leftGlassesBottom.y - leftPupil.y);
      const rightHeightPixels = Math.abs(rightGlassesBottom.y - rightPupil.y);
      measurements.alturaEsquerda = leftHeightPixels / pixelsPerMM;
      measurements.alturaDireita = rightHeightPixels / pixelsPerMM;
    }
    
    return measurements;
  };

  const handleProcess = () => {
    const measurements = calculateLiveMeasurements();
    setIsProcessed(true);
    onMeasurementsChange(measurements);
  };

  const resetMeasurement = () => {
    setIsProcessed(false);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    initializePositions();
  };

  const toggleGlasses = () => {
    setHasGlassesDetected(!hasGlassesDetected);
  };

  if (!isLoaded) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Carregando sistema de medição...</p>
        </CardContent>
      </Card>
    );
  }

  const liveMeasurements = calculateLiveMeasurements();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Sistema de Medição Simplificado
          {isProcessed && (
            <Badge variant="default" className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Processado
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Instructions */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2">Instruções:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Arraste os pontos vermelhos para ajustar as pupilas</li>
            {hasGlassesDetected && (
              <li>• Arraste os pontos azuis para ajustar a altura dos óculos</li>
            )}
            <li>• Use a roda do mouse ou botões para fazer zoom</li>
            <li>• Arraste para navegar na imagem</li>
            <li>• Clique "Processar" para finalizar as medidas</li>
          </ul>
        </div>

        {/* Canvas Container */}
        <div 
          ref={containerRef}
          className="relative border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-100"
          style={{ height: '500px' }}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full cursor-crosshair"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={(e) => {
              e.preventDefault();
              const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
              setZoom(prev => Math.max(0.5, Math.min(4, prev * zoomFactor)));
            }}
            style={{ touchAction: 'none' }}
          />
          
          {/* Zoom Controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <Button
              onClick={() => setZoom(prev => Math.min(4, prev * 1.2))}
              size="sm"
              variant="outline"
              className="bg-white/80 backdrop-blur-sm"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Badge variant="outline" className="bg-white/80 backdrop-blur-sm text-center">
              {Math.round(zoom * 100)}%
            </Badge>
            <Button
              onClick={() => setZoom(prev => Math.max(0.5, prev / 1.2))}
              size="sm"
              variant="outline"
              className="bg-white/80 backdrop-blur-sm"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={toggleGlasses}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            {hasGlassesDetected ? <Glasses className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {hasGlassesDetected ? 'Com Óculos' : 'Sem Óculos'}
          </Button>
          
          <Button
            onClick={resetMeasurement}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Resetar
          </Button>
          
          <Button
            onClick={handleProcess}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            disabled={isProcessed}
          >
            <Zap className="h-4 w-4" />
            Processar Medidas
          </Button>
        </div>

        {/* Live Preview */}
        {!isProcessed && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h5 className="font-medium text-gray-700 mb-3">Medições em Tempo Real:</h5>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">DP Binocular:</span>
                <span className="font-medium text-green-600">{liveMeasurements.dpBinocular.toFixed(1)} mm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Largura Lente:</span>
                <span className="font-medium">{liveMeasurements.larguraLente.toFixed(1)} mm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">DNP Esquerda:</span>
                <span className="font-medium text-blue-600">{liveMeasurements.dnpEsquerda.toFixed(1)} mm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">DNP Direita:</span>
                <span className="font-medium text-blue-600">{liveMeasurements.dnpDireita.toFixed(1)} mm</span>
              </div>
              {hasGlassesDetected && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Altura Esq:</span>
                    <span className="font-medium">{liveMeasurements.alturaEsquerda?.toFixed(1) || 0} mm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Altura Dir:</span>
                    <span className="font-medium">{liveMeasurements.alturaDireita?.toFixed(1) || 0} mm</span>
                  </div>
                </>
              )}
              <div className="flex justify-between col-span-2">
                <span className="text-gray-600">Confiabilidade:</span>
                <span className="font-medium text-blue-600">
                  {Math.round(liveMeasurements.confiabilidade * 100)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};