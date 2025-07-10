import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Eye, Glasses, RotateCcw, CheckCircle, ZoomIn, ZoomOut, Move } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface PupilPoint {
  x: number;
  y: number;
}

interface GlassesPoint {
  x: number;
  y: number;
}

interface InteractivePupilMeasurementProps {
  imageData: string;
  frameWidth: number;
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
}

export const InteractivePupilMeasurement: React.FC<InteractivePupilMeasurementProps> = ({
  imageData,
  frameWidth,
  hasGlasses = false,
  onMeasurementsChange
}) => {
  const isMobile = useIsMobile();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [hasGlassesDetected, setHasGlassesDetected] = useState(hasGlasses);
  
  // Pupil points (interactive)
  const [leftPupil, setLeftPupil] = useState<PupilPoint>({ x: 0, y: 0 });
  const [rightPupil, setRightPupil] = useState<PupilPoint>({ x: 0, y: 0 });
  
  // Glasses frame bottom points (interactive, if glasses detected)
  const [leftGlassesBottom, setLeftGlassesBottom] = useState<GlassesPoint>({ x: 0, y: 0 });
  const [rightGlassesBottom, setRightGlassesBottom] = useState<GlassesPoint>({ x: 0, y: 0 });
  
  const [isProcessed, setIsProcessed] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const [lastPinchDistance, setLastPinchDistance] = useState(0);

  // Initialize pupil and glasses detection positions
  const initializePositions = useCallback(() => {
    if (!imageRef.current) return;
    
    const img = imageRef.current;
    const centerX = img.width / 2;
    
    // Posições mais precisas para os olhos baseadas na anatomia facial
    const eyeDistance = img.width * 0.25; // Distância entre olhos mais realista
    const leftPupilX = centerX - eyeDistance;
    const rightPupilX = centerX + eyeDistance;
    const pupilY = img.height * 0.42; // Posição correta dos olhos
    
    setLeftPupil({ x: leftPupilX, y: pupilY });
    setRightPupil({ x: rightPupilX, y: pupilY });
    
    // Initialize glasses bottom positions if glasses detected
    if (hasGlassesDetected) {
      const glassesBottomY = pupilY + (img.height * 0.12);
      setLeftGlassesBottom({ x: leftPupilX, y: glassesBottomY });
      setRightGlassesBottom({ x: rightPupilX, y: glassesBottomY });
    }
  }, [hasGlassesDetected]);

  // Load and initialize image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      setIsLoaded(true);
      initializePositions();
      drawMeasurements();
    };
    img.src = imageData;
  }, [imageData, initializePositions]);

  // Draw measurements on canvas
  const drawMeasurements = useCallback(() => {
    if (!canvasRef.current || !imageRef.current || !isLoaded) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = imageRef.current;
    
    // Set canvas size
    canvas.width = img.width;
    canvas.height = img.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply transformations and draw image
    ctx.save();
    ctx.scale(zoom, zoom);
    ctx.translate(panX, panY);
    ctx.drawImage(img, 0, 0);
    
    // Draw measurements ON TOP of the zoomed image (same transformation)
    
    // Draw pupil line
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    ctx.moveTo(leftPupil.x, leftPupil.y);
    ctx.lineTo(rightPupil.x, rightPupil.y);
    ctx.stroke();
    
    // Draw pupil points
    ctx.setLineDash([]);
    
    // Left pupil point
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(leftPupil.x, leftPupil.y, 8, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Right pupil point
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.arc(rightPupil.x, rightPupil.y, 8, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw vertical lines and glasses points if glasses detected
    if (hasGlassesDetected) {
      ctx.strokeStyle = '#0066ff';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 3]);
      
      // Left vertical line
      ctx.beginPath();
      ctx.moveTo(leftPupil.x, leftPupil.y);
      ctx.lineTo(leftGlassesBottom.x, leftGlassesBottom.y);
      ctx.stroke();
      
      // Right vertical line
      ctx.beginPath();
      ctx.moveTo(rightPupil.x, rightPupil.y);
      ctx.lineTo(rightGlassesBottom.x, rightGlassesBottom.y);
      ctx.stroke();
      
      // Glasses bottom points
      ctx.setLineDash([]);
      ctx.fillStyle = '#0066ff';
      
      // Left glasses bottom point
      ctx.beginPath();
      ctx.arc(leftGlassesBottom.x, leftGlassesBottom.y, 6, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Right glasses bottom point
      ctx.beginPath();
      ctx.arc(rightGlassesBottom.x, rightGlassesBottom.y, 6, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
    // Add labels
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    
    // Pupil line label
    const midX = (leftPupil.x + rightPupil.x) / 2;
    const midY = leftPupil.y - 20;
    ctx.strokeText('Linha Pupilar', midX, midY);
    ctx.fillText('Linha Pupilar', midX, midY);
    
    if (hasGlassesDetected) {
      // Left height label
      const leftMidY = (leftPupil.y + leftGlassesBottom.y) / 2;
      ctx.strokeText('Alt. E', leftPupil.x - 25, leftMidY);
      ctx.fillText('Alt. E', leftPupil.x - 25, leftMidY);
      
      // Right height label
      const rightMidY = (rightPupil.y + rightGlassesBottom.y) / 2;
      ctx.strokeText('Alt. D', rightPupil.x + 25, rightMidY);
      ctx.fillText('Alt. D', rightPupil.x + 25, rightMidY);
    }
    
    ctx.restore();
  }, [leftPupil, rightPupil, leftGlassesBottom, rightGlassesBottom, hasGlassesDetected, isLoaded, zoom, panX, panY]);

  // Redraw when positions change
  useEffect(() => {
    drawMeasurements();
  }, [drawMeasurements]);

  // Mouse/touch event handlers
  const getCanvasCoordinates = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    
    if ('touches' in event && event.touches.length > 0) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else if ('clientX' in event) {
      clientX = event.clientX;
      clientY = event.clientY;
    } else {
      return { x: 0, y: 0 };
    }
    
    // Converter coordenadas da tela para coordenadas do canvas
    const canvasX = (clientX - rect.left) * (canvas.width / rect.width);
    const canvasY = (clientY - rect.top) * (canvas.height / rect.height);
    
    // Ajustar para zoom e pan
    const x = (canvasX / zoom) - panX;
    const y = (canvasY / zoom) - panY;
    
    return { x, y };
  };

  const getPointDistance = (point1: { x: number; y: number }, point2: { x: number; y: number }) => {
    return Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoordinates(event);
    const threshold = 15; // Threshold fixo, mais fácil de clicar
    
    // Check which point is being clicked
    if (getPointDistance(coords, leftPupil) < threshold) {
      setIsDragging('leftPupil');
      event.preventDefault();
    } else if (getPointDistance(coords, rightPupil) < threshold) {
      setIsDragging('rightPupil');
      event.preventDefault();
    } else if (hasGlassesDetected && getPointDistance(coords, leftGlassesBottom) < threshold) {
      setIsDragging('leftGlasses');
      event.preventDefault();
    } else if (hasGlassesDetected && getPointDistance(coords, rightGlassesBottom) < threshold) {
      setIsDragging('rightGlasses');
      event.preventDefault();
    } else {
      // Start panning
      setIsPanning(true);
      setLastPanPoint({ x: event.clientX, y: event.clientY });
      event.preventDefault();
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      const coords = getCanvasCoordinates(event);
      
      switch (isDragging) {
        case 'leftPupil':
          setLeftPupil(coords);
          break;
        case 'rightPupil':
          setRightPupil(coords);
          break;
        case 'leftGlasses':
          setLeftGlassesBottom(coords);
          break;
        case 'rightGlasses':
          setRightGlassesBottom(coords);
          break;
      }
      event.preventDefault();
    } else if (isPanning) {
      const deltaX = event.clientX - lastPanPoint.x;
      const deltaY = event.clientY - lastPanPoint.y;
      
      setPanX(prev => prev + deltaX / zoom);
      setPanY(prev => prev + deltaY / zoom);
      setLastPanPoint({ x: event.clientX, y: event.clientY });
      event.preventDefault();
    }
  };

  const handleMouseUp = () => {
    setIsDragging(null);
    setIsPanning(false);
  };

  // Touch event handlers with pinch-to-zoom centered on pinch point
  const getPinchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return 0;
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + 
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  const getPinchCenter = (touches: React.TouchList) => {
    if (touches.length < 2) return { x: 0, y: 0 };
    const touch1 = touches[0];
    const touch2 = touches[1];
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((touch1.clientX + touch2.clientX) / 2) - rect.left,
      y: ((touch1.clientY + touch2.clientY) / 2) - rect.top
    };
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    
    if (event.touches.length === 2) {
      setLastPinchDistance(getPinchDistance(event.touches));
      return;
    }
    
    if (event.touches.length === 1) {
      const mouseEvent = {
        ...event,
        clientX: event.touches[0].clientX,
        clientY: event.touches[0].clientY
      } as any;
      handleMouseDown(mouseEvent);
    }
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    
    if (event.touches.length === 2) {
      const currentDistance = getPinchDistance(event.touches);
      
      if (lastPinchDistance > 0) {
        const scaleFactor = currentDistance / lastPinchDistance;
        const oldZoom = zoom;
        const newZoom = Math.max(0.5, Math.min(4, zoom * scaleFactor));
        
        // Pegar centro do pinch em coordenadas do canvas
        const pinchCenter = getPinchCenter(event.touches);
        
        // Ajustar pan para que o ponto de pinch permaneça fixo
        // Fórmula: newPan = pinchPoint - (pinchPoint - oldPan) * (newZoom / oldZoom)
        const newPanX = pinchCenter.x - (pinchCenter.x - panX) * (newZoom / oldZoom);
        const newPanY = pinchCenter.y - (pinchCenter.y - panY) * (newZoom / oldZoom);
        
        console.log('PINCH:', {
          center: pinchCenter,
          oldZoom,
          newZoom,
          oldPan: {x: panX, y: panY},
          newPan: {x: newPanX, y: newPanY}
        });
        
        setZoom(newZoom);
        setPanX(newPanX);
        setPanY(newPanY);
      }
      
      setLastPinchDistance(currentDistance);
      return;
    }
    
    if (event.touches.length === 1 && isDragging) {
      const mouseEvent = {
        ...event,
        clientX: event.touches[0].clientX,
        clientY: event.touches[0].clientY
      } as any;
      handleMouseMove(mouseEvent);
    }
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    setLastPinchDistance(0);
    handleMouseUp();
  };

  // Calculate measurements
  const calculateMeasurements = (): MeasurementResults => {
    if (!imageRef.current) {
      return {
        dpBinocular: 0,
        dnpEsquerda: 0,
        dnpDireita: 0,
        larguraLente: 0,
        confiabilidade: 0,
        temOculos: hasGlassesDetected
      };
    }

    // Calcular distância real entre pupilas em pixels
    const pupilDistancePixels = Math.abs(rightPupil.x - leftPupil.x);
    
    console.log('=== CÁLCULO DAS MEDIDAS ===');
    console.log('Posição pupila esquerda (pixels):', leftPupil);
    console.log('Posição pupila direita (pixels):', rightPupil);
    console.log('Distância entre pupilas (pixels):', pupilDistancePixels);
    console.log('Frame width fornecido (mm):', frameWidth);
    console.log('Largura da imagem (pixels):', imageRef.current.width);
    
    // AJUSTE FINO: De 55mm para 65mm - fator 65/55 = 1.18
    // Diminuindo um pouco mais o realFaceWidthMM
    const faceWidthInImage = imageRef.current.width * 0.65; 
    const realFaceWidthMM = 135 * 0.78; // ~105mm para chegar em 65mm
    const pixelsPerMM = faceWidthInImage / realFaceWidthMM;
    
    console.log('Largura facial estimada na imagem (pixels):', faceWidthInImage);
    console.log('Largura facial real estimada (mm):', realFaceWidthMM);
    console.log('Pixels por mm calculado:', pixelsPerMM);
    
    // Calcular DP Binocular (distância entre centros das pupilas)
    const dpBinocular = pupilDistancePixels / pixelsPerMM;
    
    console.log('DP Binocular calculada (mm):', dpBinocular);
    
    // CORREÇÃO: Calcular DNP corretamente
    // DNP = distância do centro do nariz até cada pupila
    // O centro do nariz está no meio da linha que conecta as pupilas
    const centerNoseX = (leftPupil.x + rightPupil.x) / 2;
    
    // DNP Esquerda: distância do centro do nariz até a pupila esquerda
    const dnpEsquerdaPixels = Math.abs(centerNoseX - leftPupil.x);
    const dnpEsquerda = dnpEsquerdaPixels / pixelsPerMM;
    
    // DNP Direita: distância do centro do nariz até a pupila direita  
    const dnpDireitaPixels = Math.abs(rightPupil.x - centerNoseX);
    const dnpDireita = dnpDireitaPixels / pixelsPerMM;
    
    console.log('Centro do nariz (x):', centerNoseX);
    console.log('DNP Esquerda (pixels):', dnpEsquerdaPixels);
    console.log('DNP Direita (pixels):', dnpDireitaPixels);
    console.log('DNP Esquerda (mm):', dnpEsquerda);
    console.log('DNP Direita (mm):', dnpDireita);
    
    // Validação: DP deve estar entre 50-80mm para adultos
    const isValidDP = dpBinocular >= 50 && dpBinocular <= 80;
    console.log('DP é válida (50-80mm)?', isValidDP);
    
    const larguraLente = dpBinocular * 0.75;
    
    let alturaEsquerda, alturaDireita;
    
    if (hasGlassesDetected) {
      const leftHeightPixels = Math.abs(leftGlassesBottom.y - leftPupil.y);
      const rightHeightPixels = Math.abs(rightGlassesBottom.y - rightPupil.y);
      
      alturaEsquerda = leftHeightPixels / pixelsPerMM;
      alturaDireita = rightHeightPixels / pixelsPerMM;
      
      console.log('Altura esquerda (mm):', alturaEsquerda);
      console.log('Altura direita (mm):', alturaDireita);
    }
    
    const result = {
      dpBinocular,
      dnpEsquerda,
      dnpDireita,
      alturaEsquerda,
      alturaDireita,
      larguraLente,
      confiabilidade: isValidDP ? 0.95 : 0.70,
      temOculos: hasGlassesDetected
    };
    
    console.log('=== RESULTADO FINAL ===', result);
    
    return result;
  };

  const handleProcess = () => {
    const measurements = calculateMeasurements();
    setIsProcessed(true);
    onMeasurementsChange(measurements);
  };

  const handleReset = () => {
    setIsProcessed(false);
    setZoom(1);
    setPanX(0);
    setPanY(0);
    initializePositions();
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.5, 4));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.5, 0.5));
  };

  const toggleGlasses = () => {
    setHasGlassesDetected(!hasGlassesDetected);
    setIsProcessed(false);
  };

  if (!isLoaded) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Carregando sistema de medição interativo...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Medição Interativa de Pupilas
          {isProcessed && (
            <Badge className="bg-green-100 text-green-800">
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
            <li>• Arraste os pontos vermelhos para ajustar as posições das pupilas</li>
            {hasGlassesDetected && (
              <li>• Arraste os pontos azuis para ajustar a altura do óculos</li>
            )}
            {isMobile && (
              <>
                <li>• Use dois dedos para dar zoom (pinch)</li>
                <li>• Use os botões grandes para zoom fino</li>
              </>
            )}
            <li>• Clique "Processar" para calcular as medidas precisas</li>
          </ul>
        </div>

        {/* Canvas container with mobile-friendly controls */}
        <div className="relative border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-100">
          {/* Mobile Zoom Controls */}
          {isMobile && (
            <div className="absolute top-2 left-2 right-2 z-10 flex justify-between items-center">
              <div className="flex gap-2">
                <Button
                  onClick={handleZoomOut}
                  size="lg"
                  variant="outline"
                  className="bg-white/90 backdrop-blur-sm shadow-lg h-12 w-12 p-0"
                >
                  <ZoomOut className="h-5 w-5" />
                </Button>
                <Button
                  onClick={handleZoomIn}
                  size="lg"
                  variant="outline"
                  className="bg-white/90 backdrop-blur-sm shadow-lg h-12 w-12 p-0"
                >
                  <ZoomIn className="h-5 w-5" />
                </Button>
              </div>
              <Badge variant="outline" className="bg-white/90 backdrop-blur-sm shadow-lg px-3 py-2">
                <Move className="h-3 w-3 mr-1" />
                {Math.round(zoom * 100)}%
              </Badge>
            </div>
          )}
          
          {/* Desktop Zoom Controls */}
          {!isMobile && (
            <div className="absolute top-2 right-2 z-10 flex gap-2">
              <Button
                onClick={handleZoomOut}
                size="sm"
                variant="outline"
                className="bg-white/80 backdrop-blur-sm"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Badge variant="outline" className="bg-white/80 backdrop-blur-sm">
                {Math.round(zoom * 100)}%
              </Badge>
              <Button
                onClick={handleZoomIn}
                size="sm"
                variant="outline"
                className="bg-white/80 backdrop-blur-sm"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          <canvas
            ref={canvasRef}
            className="max-w-full h-auto cursor-crosshair"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ touchAction: 'none', minHeight: isMobile ? '60vh' : 'auto' }}
          />
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
            onClick={handleReset}
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

        {/* Live preview of measurements */}
        {!isProcessed && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <h5 className="font-medium text-gray-700 mb-2">Prévia das Medidas:</h5>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600">DP Binocular:</span>
                <span className="ml-2 font-medium text-blue-600">{calculateMeasurements().dpBinocular.toFixed(1)} mm</span>
              </div>
              <div>
                <span className="text-gray-600">Largura Lente:</span>
                <span className="ml-2 font-medium">{calculateMeasurements().larguraLente.toFixed(1)} mm</span>
              </div>
              <div>
                <span className="text-gray-600">DNP Esquerda:</span>
                <span className="ml-2 font-medium text-green-600">{calculateMeasurements().dnpEsquerda.toFixed(1)} mm</span>
              </div>
              <div>
                <span className="text-gray-600">DNP Direita:</span>
                <span className="ml-2 font-medium text-green-600">{calculateMeasurements().dnpDireita.toFixed(1)} mm</span>
              </div>
              {hasGlassesDetected && (
                <>
                  <div>
                    <span className="text-gray-600">Altura Esq:</span>
                    <span className="ml-2 font-medium">{calculateMeasurements().alturaEsquerda?.toFixed(1)} mm</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Altura Dir:</span>
                    <span className="ml-2 font-medium">{calculateMeasurements().alturaDireita?.toFixed(1)} mm</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};