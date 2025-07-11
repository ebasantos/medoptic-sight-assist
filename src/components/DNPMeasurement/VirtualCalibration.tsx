import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, RotateCcw } from 'lucide-react';
import { useCamera } from '@/hooks/useCamera';

interface Props {
  onCalibrationComplete: (pixelsPerMm: number) => void;
  isProcessing: boolean;
}

export const VirtualCalibration: React.FC<Props> = ({ onCalibrationComplete, isProcessing }) => {
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [endPoint, setEndPoint] = useState({ x: 0, y: 0 });
  const [realDistance, setRealDistance] = useState(50);
  const [isDragging, setIsDragging] = useState<'start' | 'end' | null>(null);
  const [isCalibrated, setIsCalibrated] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  
  const { 
    videoRef, 
    canvasRef, 
    isActive, 
    error: cameraError, 
    startCamera, 
    stopCamera 
  } = useCamera();

  // Inicializar pontos quando a câmera ativa
  React.useEffect(() => {
    if (isActive && videoRef.current && !isCalibrated) {
      const rect = videoRef.current.getBoundingClientRect();
      setStartPoint({ x: rect.width * 0.2, y: rect.height * 0.5 });
      setEndPoint({ x: rect.width * 0.8, y: rect.height * 0.5 });
    }
  }, [isActive, isCalibrated]);

  const handleMouseDown = useCallback((point: 'start' | 'end') => (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(point);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !overlayRef.current) return;
    
    const rect = overlayRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (isDragging === 'start') {
      setStartPoint({ x, y });
    } else {
      setEndPoint({ x, y });
    }
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
  }, []);

  const calculatePixelDistance = () => {
    const dx = endPoint.x - startPoint.x;
    const dy = endPoint.y - startPoint.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleConfirmCalibration = () => {
    const pixelDistance = calculatePixelDistance();
    const pixelsPerMm = pixelDistance / realDistance;
    setIsCalibrated(true);
    onCalibrationComplete(pixelsPerMm);
  };

  const handleRetake = () => {
    setIsCalibrated(false);
    startCamera();
  };

  const rulerLength = calculatePixelDistance();
  const angle = Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <Camera className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">Calibração Virtual com Régua</h3>
          <p className="text-muted-foreground">
            Arraste as extremidades da régua para pontos de referência conhecidos e ajuste a distância real.
          </p>
        </div>
      </div>

      {/* Camera/Ruler Display */}
      <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
        {/* Video Element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        
        {/* Virtual Ruler Overlay */}
        {isActive && (
          <div 
            ref={overlayRef}
            className="absolute inset-0 pointer-events-auto"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <svg className="w-full h-full">
              {/* Linha principal da régua */}
              <line
                x1={startPoint.x}
                y1={startPoint.y}
                x2={endPoint.x}
                y2={endPoint.y}
                stroke="#FFD700"
                strokeWidth="3"
              />
              
              {/* Marcações da régua */}
              {Array.from({ length: Math.floor(realDistance / 5) + 1 }, (_, i) => {
                const progress = (i * 5) / realDistance;
                const x = startPoint.x + (endPoint.x - startPoint.x) * progress;
                const y = startPoint.y + (endPoint.y - startPoint.y) * progress;
                const tickLength = i % 2 === 0 ? 15 : 8;
                
                return (
                  <g key={i}>
                    <line
                      x1={x + Math.cos(angle + Math.PI/2) * tickLength}
                      y1={y + Math.sin(angle + Math.PI/2) * tickLength}
                      x2={x - Math.cos(angle + Math.PI/2) * tickLength}
                      y2={y - Math.sin(angle + Math.PI/2) * tickLength}
                      stroke="#FFD700"
                      strokeWidth="2"
                    />
                    {i % 2 === 0 && (
                      <text
                        x={x + Math.cos(angle + Math.PI/2) * 25}
                        y={y + Math.sin(angle + Math.PI/2) * 25}
                        fill="#FFD700"
                        fontSize="12"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="select-none"
                      >
                        {i * 5}
                      </text>
                    )}
                  </g>
                );
              })}
              
              {/* Pontos de arrasto */}
              <circle
                cx={startPoint.x}
                cy={startPoint.y}
                r="8"
                fill="#FF4444"
                stroke="#FFF"
                strokeWidth="2"
                className="cursor-grab active:cursor-grabbing"
                onMouseDown={handleMouseDown('start')}
              />
              <circle
                cx={endPoint.x}
                cy={endPoint.y}
                r="8"
                fill="#FF4444"
                stroke="#FFF"
                strokeWidth="2"
                className="cursor-grab active:cursor-grabbing"
                onMouseDown={handleMouseDown('end')}
              />
            </svg>
            
            {/* Controles */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-background/90 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Distância real:</label>
                  <input
                    type="number"
                    value={realDistance}
                    onChange={(e) => setRealDistance(Number(e.target.value))}
                    className="w-20 px-2 py-1 border rounded text-center"
                    min="10"
                    max="200"
                    step="1"
                  />
                  <span className="text-sm">mm</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Pixels: {Math.round(rulerLength)}px
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Error Overlay */}
        {cameraError && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <div className="text-center text-destructive">
              <p className="font-medium">Erro na câmera</p>
              <p className="text-sm">{cameraError}</p>
            </div>
          </div>
        )}
        
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Controls */}
      <div className="flex gap-3 justify-center">
        {!isActive ? (
          <Button onClick={startCamera} disabled={isProcessing}>
            <Camera className="w-4 h-4 mr-2" />
            Iniciar Câmera
          </Button>
        ) : !isCalibrated ? (
          <Button 
            onClick={handleConfirmCalibration} 
            disabled={isProcessing || rulerLength < 50}
          >
            {isProcessing ? 'Processando...' : 'Confirmar Calibração'}
          </Button>
        ) : (
          <Button onClick={handleRetake} variant="outline" disabled={isProcessing}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Recalibrar
          </Button>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-medium mb-2">Instruções:</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Arraste os pontos vermelhos para objetos de referência conhecidos</li>
          <li>• Ajuste a distância real em milímetros no campo de entrada</li>
          <li>• Use objetos como cartões (86mm), moedas (20-25mm) ou réguas como referência</li>
          <li>• Certifique-se de que a iluminação seja uniforme</li>
          <li>• Mantenha a câmera estável durante a calibração</li>
        </ul>
      </div>
    </div>
  );
};