import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  onCalibrationComplete: (pixelsPerMm: number) => void;
  videoWidth: number;
  videoHeight: number;
}

export const VirtualRuler: React.FC<Props> = ({ onCalibrationComplete, videoWidth, videoHeight }) => {
  const [startPoint, setStartPoint] = useState({ x: videoWidth * 0.2, y: videoHeight * 0.5 });
  const [endPoint, setEndPoint] = useState({ x: videoWidth * 0.8, y: videoHeight * 0.5 });
  const [realDistance, setRealDistance] = useState(50); // 50mm por padrão
  const [isDragging, setIsDragging] = useState<'start' | 'end' | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const handleMouseDown = useCallback((point: 'start' | 'end') => (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(point);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !svgRef.current) return;
    
    const rect = svgRef.current.getBoundingClientRect();
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
    onCalibrationComplete(pixelsPerMm);
  };

  const rulerLength = calculatePixelDistance();
  const angle = Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x);

  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        className="absolute inset-0 pointer-events-auto"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
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
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-background/90 backdrop-blur-sm rounded-lg p-4 pointer-events-auto">
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
          <Button onClick={handleConfirmCalibration} size="sm">
            Confirmar Calibração
          </Button>
        </div>
      </div>
    </div>
  );
};