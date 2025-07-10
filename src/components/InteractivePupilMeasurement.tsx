import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Eye, Glasses, RotateCcw, CheckCircle } from 'lucide-react';

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

  // Initialize pupil and glasses detection positions
  const initializePositions = useCallback(() => {
    if (!imageRef.current) return;
    
    const img = imageRef.current;
    const faceWidth = img.width * 0.6;
    const centerX = img.width / 2;
    const eyeDistance = faceWidth * 0.3;
    
    // Initialize pupil positions - corrigido para posição dos olhos
    const leftPupilX = centerX - eyeDistance / 2;
    const rightPupilX = centerX + eyeDistance / 2;
    const pupilY = img.height * 0.45; // Posição dos olhos (não da testa)
    
    setLeftPupil({ x: leftPupilX, y: pupilY });
    setRightPupil({ x: rightPupilX, y: pupilY });
    
    // Initialize glasses bottom positions if glasses detected
    if (hasGlassesDetected) {
      const glassesBottomY = pupilY + (img.height * 0.15); // Estimate glasses bottom
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
    
    // Clear and draw image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    
    // Draw pupil line
    ctx.save();
    
    // Horizontal line between pupils
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
  }, [leftPupil, rightPupil, leftGlassesBottom, rightGlassesBottom, hasGlassesDetected, isLoaded]);

  // Redraw when positions change
  useEffect(() => {
    drawMeasurements();
  }, [drawMeasurements]);

  // Mouse/touch event handlers
  const getCanvasCoordinates = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
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
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const getPointDistance = (point1: { x: number; y: number }, point2: { x: number; y: number }) => {
    return Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoordinates(event);
    const threshold = 20;
    
    // Check which point is being clicked
    if (getPointDistance(coords, leftPupil) < threshold) {
      setIsDragging('leftPupil');
    } else if (getPointDistance(coords, rightPupil) < threshold) {
      setIsDragging('rightPupil');
    } else if (hasGlassesDetected && getPointDistance(coords, leftGlassesBottom) < threshold) {
      setIsDragging('leftGlasses');
    } else if (hasGlassesDetected && getPointDistance(coords, rightGlassesBottom) < threshold) {
      setIsDragging('rightGlasses');
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    
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
  };

  const handleMouseUp = () => {
    setIsDragging(null);
  };

  // Touch event handlers
  const handleTouchStart = (event: React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const mouseEvent = {
      ...event,
      clientX: event.touches[0].clientX,
      clientY: event.touches[0].clientY
    } as any;
    handleMouseDown(mouseEvent);
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    if (!isDragging) return;
    const mouseEvent = {
      ...event,
      clientX: event.touches[0].clientX,
      clientY: event.touches[0].clientY
    } as any;
    handleMouseMove(mouseEvent);
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    handleMouseUp();
  };

  // Calculate measurements
  const calculateMeasurements = (): MeasurementResults => {
    const pixelsPerMM = frameWidth / 50; // Assuming 50mm default frame width
    
    // Calculate distances in pixels
    const pupilDistancePixels = Math.sqrt(
      Math.pow(rightPupil.x - leftPupil.x, 2) + 
      Math.pow(rightPupil.y - leftPupil.y, 2)
    );
    
    // Convert to millimeters
    const dpBinocular = pupilDistancePixels / pixelsPerMM;
    const dnpEsquerda = dpBinocular / 2;
    const dnpDireita = dpBinocular / 2;
    const larguraLente = dpBinocular * 0.8; // Estimate lens width
    
    let alturaEsquerda, alturaDireita;
    
    if (hasGlassesDetected) {
      const leftHeightPixels = Math.abs(leftGlassesBottom.y - leftPupil.y);
      const rightHeightPixels = Math.abs(rightGlassesBottom.y - rightPupil.y);
      
      alturaEsquerda = leftHeightPixels / pixelsPerMM;
      alturaDireita = rightHeightPixels / pixelsPerMM;
    }
    
    return {
      dpBinocular,
      dnpEsquerda,
      dnpDireita,
      alturaEsquerda,
      alturaDireita,
      larguraLente,
      confiabilidade: 0.95, // High confidence for manual adjustment
      temOculos: hasGlassesDetected
    };
  };

  const handleProcess = () => {
    const measurements = calculateMeasurements();
    setIsProcessed(true);
    onMeasurementsChange(measurements);
  };

  const handleReset = () => {
    setIsProcessed(false);
    initializePositions();
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
            <li>• Clique "Processar" para calcular as medidas precisas</li>
          </ul>
        </div>

        {/* Canvas container */}
        <div className="relative border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-100">
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
            style={{ touchAction: 'none' }}
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
                <span className="ml-2 font-medium">{calculateMeasurements().dpBinocular.toFixed(1)} mm</span>
              </div>
              <div>
                <span className="text-gray-600">Largura Lente:</span>
                <span className="ml-2 font-medium">{calculateMeasurements().larguraLente.toFixed(1)} mm</span>
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