import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Eye, Glasses, RotateCcw, CheckCircle, ZoomIn, ZoomOut, Move, Target } from 'lucide-react';
import { CalibrationGuide } from './CalibrationGuide';
import { OpenCVPupilDetector, PupilDetectionResult } from '@/utils/openCVPupilDetection';

interface PupilPoint {
  x: number;
  y: number;
  confidence?: number;
}

interface GlassesPoint {
  x: number;
  y: number;
}

interface CalibrationReference {
  x: number;
  y: number;
  width: number; // in pixels
  realSizeMM: number; // real size in millimeters
}

interface PrecisionMeasurementSystemProps {
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
  calibrationUsed: boolean;
  pixelsPerMM: number;
}

export const PrecisionMeasurementSystem: React.FC<PrecisionMeasurementSystemProps> = ({
  imageData,
  hasGlasses = false,
  onMeasurementsChange
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const detectorRef = useRef<OpenCVPupilDetector | null>(null);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [hasGlassesDetected, setHasGlassesDetected] = useState(hasGlasses);
  const [isProcessed, setIsProcessed] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [showCalibrationGuide, setShowCalibrationGuide] = useState(true);
  
  // Measurement points
  const [leftPupil, setLeftPupil] = useState<PupilPoint>({ x: 0, y: 0, confidence: 0 });
  const [rightPupil, setRightPupil] = useState<PupilPoint>({ x: 0, y: 0, confidence: 0 });
  const [leftGlassesBottom, setLeftGlassesBottom] = useState<GlassesPoint>({ x: 0, y: 0 });
  const [rightGlassesBottom, setRightGlassesBottom] = useState<GlassesPoint>({ x: 0, y: 0 });
  const [calibrationRef, setCalibrationRef] = useState<CalibrationReference | null>(null);
  
  // Navigation state
  const [viewport, setViewport] = useState({
    zoom: 1,
    offsetX: 0,
    offsetY: 0
  });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });

  // Initialize detector
  useEffect(() => {
    detectorRef.current = new OpenCVPupilDetector();
  }, []);

  // Load image and initialize
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      setIsLoaded(true);
      initializePositions();
      redrawCanvas();
    };
    img.src = imageData;
  }, [imageData]);

  const initializePositions = useCallback(() => {
    if (!imageRef.current) return;
    
    const img = imageRef.current;
    const centerX = img.width / 2;
    const eyeDistance = img.width * 0.25;
    const eyeY = img.height * 0.42;
    
    setLeftPupil({ x: centerX - eyeDistance, y: eyeY, confidence: 0 });
    setRightPupil({ x: centerX + eyeDistance, y: eyeY, confidence: 0 });
    
    if (hasGlassesDetected) {
      const glassesY = eyeY + (img.height * 0.12);
      setLeftGlassesBottom({ x: centerX - eyeDistance, y: glassesY });
      setRightGlassesBottom({ x: centerX + eyeDistance, y: glassesY });
    }
  }, [hasGlassesDetected]);

  const handleAutoDetect = async () => {
    if (!imageRef.current || !detectorRef.current) return;
    
    setIsDetecting(true);
    try {
      const result: PupilDetectionResult = await detectorRef.current.detectPupils(imageRef.current);
      
      if (result.leftPupil && result.rightPupil) {
        setLeftPupil(result.leftPupil);
        setRightPupil(result.rightPupil);
        redrawCanvas();
      }
    } catch (error) {
      console.warn('Auto-detection failed:', error);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleCalibrationSet = (sizeMM: number) => {
    if (!imageRef.current) return;
    
    // Set default calibration reference position
    const img = imageRef.current;
    setCalibrationRef({
      x: img.width * 0.1,
      y: img.height * 0.1,
      width: img.width * 0.15, // default width
      realSizeMM: sizeMM
    });
    setShowCalibrationGuide(false);
    redrawCanvas();
  };

  const redrawCanvas = useCallback(() => {
    if (!canvasRef.current || !imageRef.current || !isLoaded) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = imageRef.current;
    
    // Set canvas size to container size
    const container = canvas.parentElement;
    if (container) {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calculate image position and size to fit canvas
    const scale = Math.min(canvas.width / img.width, canvas.height / img.height) * viewport.zoom;
    const imgWidth = img.width * scale;
    const imgHeight = img.height * scale;
    const imgX = (canvas.width - imgWidth) / 2 + viewport.offsetX;
    const imgY = (canvas.height - imgHeight) / 2 + viewport.offsetY;
    
    // Draw image
    ctx.drawImage(img, imgX, imgY, imgWidth, imgHeight);
    
    // Helper function to convert image coordinates to canvas coordinates
    const toCanvas = (x: number, y: number) => ({
      x: imgX + (x / img.width) * imgWidth,
      y: imgY + (y / img.height) * imgHeight
    });
    
    // Draw calibration reference
    if (calibrationRef) {
      const refStart = toCanvas(calibrationRef.x, calibrationRef.y);
      const refEnd = toCanvas(calibrationRef.x + calibrationRef.width, calibrationRef.y);
      
      ctx.strokeStyle = '#ff6b35';
      ctx.lineWidth = 3;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(refStart.x, refStart.y);
      ctx.lineTo(refEnd.x, refEnd.y);
      ctx.stroke();
      
      // Calibration markers
      ctx.fillStyle = '#ff6b35';
      ctx.beginPath();
      ctx.arc(refStart.x, refStart.y, 6, 0, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(refEnd.x, refEnd.y, 6, 0, 2 * Math.PI);
      ctx.fill();
      
      // Label
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      const labelX = (refStart.x + refEnd.x) / 2;
      const labelY = refStart.y - 15;
      ctx.strokeText(`${calibrationRef.realSizeMM}mm`, labelX, labelY);
      ctx.fillText(`${calibrationRef.realSizeMM}mm`, labelX, labelY);
    }
    
    // Draw pupil line
    const leftCanvas = toCanvas(leftPupil.x, leftPupil.y);
    const rightCanvas = toCanvas(rightPupil.x, rightPupil.y);
    
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    ctx.moveTo(leftCanvas.x, leftCanvas.y);
    ctx.lineTo(rightCanvas.x, rightCanvas.y);
    ctx.stroke();
    
    // Draw pupil points
    ctx.setLineDash([]);
    const drawPupilPoint = (point: PupilPoint, canvas: { x: number; y: number }) => {
      const confidence = point.confidence || 0;
      const color = confidence > 0.7 ? '#00ff00' : confidence > 0.4 ? '#ffaa00' : '#ff0000';
      
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(canvas.x, canvas.y, 8, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Confidence indicator
      if (confidence > 0) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.round(confidence * 100)}%`, canvas.x, canvas.y + 20);
      }
    };
    
    drawPupilPoint(leftPupil, leftCanvas);
    drawPupilPoint(rightPupil, rightCanvas);
    
    // Draw glasses measurements if applicable
    if (hasGlassesDetected) {
      const leftGlassesCanvas = toCanvas(leftGlassesBottom.x, leftGlassesBottom.y);
      const rightGlassesCanvas = toCanvas(rightGlassesBottom.x, rightGlassesBottom.y);
      
      ctx.strokeStyle = '#0066ff';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 3]);
      
      // Vertical lines
      ctx.beginPath();
      ctx.moveTo(leftCanvas.x, leftCanvas.y);
      ctx.lineTo(leftGlassesCanvas.x, leftGlassesCanvas.y);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(rightCanvas.x, rightCanvas.y);
      ctx.lineTo(rightGlassesCanvas.x, rightGlassesCanvas.y);
      ctx.stroke();
      
      // Glasses points
      ctx.setLineDash([]);
      ctx.fillStyle = '#0066ff';
      ctx.beginPath();
      ctx.arc(leftGlassesCanvas.x, leftGlassesCanvas.y, 6, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      ctx.fillStyle = '#0066ff';
      ctx.beginPath();
      ctx.arc(rightGlassesCanvas.x, rightGlassesCanvas.y, 6, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }
    
    // Labels
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    
    const midX = (leftCanvas.x + rightCanvas.x) / 2;
    const midY = Math.min(leftCanvas.y, rightCanvas.y) - 20;
    ctx.strokeText('Linha Pupilar', midX, midY);
    ctx.fillText('Linha Pupilar', midX, midY);
  }, [leftPupil, rightPupil, leftGlassesBottom, rightGlassesBottom, hasGlassesDetected, isLoaded, viewport, calibrationRef]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Canvas interaction handlers
  const getImageCoordinates = (clientX: number, clientY: number) => {
    if (!canvasRef.current || !imageRef.current) return { x: 0, y: 0 };
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const img = imageRef.current;
    
    // Canvas coordinates
    const canvasX = clientX - rect.left;
    const canvasY = clientY - rect.top;
    
    // Calculate image bounds in canvas
    const scale = Math.min(canvas.width / img.width, canvas.height / img.height) * viewport.zoom;
    const imgWidth = img.width * scale;
    const imgHeight = img.height * scale;
    const imgX = (canvas.width - imgWidth) / 2 + viewport.offsetX;
    const imgY = (canvas.height - imgHeight) / 2 + viewport.offsetY;
    
    // Convert to image coordinates
    const x = ((canvasX - imgX) / imgWidth) * img.width;
    const y = ((canvasY - imgY) / imgHeight) * img.height;
    
    return { x, y };
  };

  const getPointDistance = (point1: { x: number; y: number }, point2: { x: number; y: number }) => {
    return Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    const coords = getImageCoordinates(event.clientX, event.clientY);
    const threshold = 20 / viewport.zoom; // Adjust threshold based on zoom
    
    // Check calibration reference
    if (calibrationRef) {
      const refStart = { x: calibrationRef.x, y: calibrationRef.y };
      const refEnd = { x: calibrationRef.x + calibrationRef.width, y: calibrationRef.y };
      
      if (getPointDistance(coords, refStart) < threshold) {
        setIsDragging('calibrationStart');
        return;
      }
      if (getPointDistance(coords, refEnd) < threshold) {
        setIsDragging('calibrationEnd');
        return;
      }
    }
    
    // Check pupil points
    if (getPointDistance(coords, leftPupil) < threshold) {
      setIsDragging('leftPupil');
    } else if (getPointDistance(coords, rightPupil) < threshold) {
      setIsDragging('rightPupil');
    } else if (hasGlassesDetected && getPointDistance(coords, leftGlassesBottom) < threshold) {
      setIsDragging('leftGlasses');
    } else if (hasGlassesDetected && getPointDistance(coords, rightGlassesBottom) < threshold) {
      setIsDragging('rightGlasses');
    } else {
      // Start panning
      setIsPanning(true);
      setLastPanPoint({ x: event.clientX, y: event.clientY });
    }
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (isDragging) {
      const coords = getImageCoordinates(event.clientX, event.clientY);
      
      switch (isDragging) {
        case 'leftPupil':
          setLeftPupil(prev => ({ ...prev, x: coords.x, y: coords.y }));
          break;
        case 'rightPupil':
          setRightPupil(prev => ({ ...prev, x: coords.x, y: coords.y }));
          break;
        case 'leftGlasses':
          setLeftGlassesBottom(coords);
          break;
        case 'rightGlasses':
          setRightGlassesBottom(coords);
          break;
        case 'calibrationStart':
          if (calibrationRef) {
            const newWidth = calibrationRef.width + (calibrationRef.x - coords.x);
            setCalibrationRef({
              ...calibrationRef,
              x: coords.x,
              width: Math.max(10, newWidth)
            });
          }
          break;
        case 'calibrationEnd':
          if (calibrationRef) {
            setCalibrationRef({
              ...calibrationRef,
              width: coords.x - calibrationRef.x
            });
          }
          break;
      }
    } else if (isPanning) {
      const deltaX = event.clientX - lastPanPoint.x;
      const deltaY = event.clientY - lastPanPoint.y;
      
      setViewport(prev => ({
        ...prev,
        offsetX: prev.offsetX + deltaX,
        offsetY: prev.offsetY + deltaY
      }));
      setLastPanPoint({ x: event.clientX, y: event.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(null);
    setIsPanning(false);
  };

  const handleZoom = (delta: number) => {
    setViewport(prev => ({
      ...prev,
      zoom: Math.max(0.5, Math.min(4, prev.zoom + delta))
    }));
  };

  const resetView = () => {
    setViewport({ zoom: 1, offsetX: 0, offsetY: 0 });
    setIsProcessed(false);
    initializePositions();
  };

  const calculateMeasurements = (): MeasurementResults => {
    if (!calibrationRef) {
      // Fallback without calibration
      const pupilDistancePixels = Math.abs(rightPupil.x - leftPupil.x);
      const estimatedPixelsPerMM = pupilDistancePixels / 63; // Assume 63mm average
      
      return {
        dpBinocular: 63,
        dnpEsquerda: 31.5,
        dnpDireita: 31.5,
        alturaEsquerda: hasGlassesDetected ? Math.abs(leftGlassesBottom.y - leftPupil.y) / estimatedPixelsPerMM : undefined,
        alturaDireita: hasGlassesDetected ? Math.abs(rightGlassesBottom.y - rightPupil.y) / estimatedPixelsPerMM : undefined,
        larguraLente: 47.25,
        confiabilidade: 0.3,
        temOculos: hasGlassesDetected,
        calibrationUsed: false,
        pixelsPerMM: estimatedPixelsPerMM
      };
    }
    
    // Accurate measurements with calibration
    const pixelsPerMM = calibrationRef.width / calibrationRef.realSizeMM;
    const pupilDistancePixels = Math.abs(rightPupil.x - leftPupil.x);
    const dpBinocular = pupilDistancePixels / pixelsPerMM;
    
    const avgConfidence = ((leftPupil.confidence || 0) + (rightPupil.confidence || 0)) / 2;
    const calibrationConfidence = 0.9; // High confidence with proper calibration
    const finalConfidence = Math.min(0.95, avgConfidence * 0.6 + calibrationConfidence * 0.4);
    
    return {
      dpBinocular,
      dnpEsquerda: dpBinocular / 2,
      dnpDireita: dpBinocular / 2,
      alturaEsquerda: hasGlassesDetected ? Math.abs(leftGlassesBottom.y - leftPupil.y) / pixelsPerMM : undefined,
      alturaDireita: hasGlassesDetected ? Math.abs(rightGlassesBottom.y - rightPupil.y) / pixelsPerMM : undefined,
      larguraLente: dpBinocular * 0.75,
      confiabilidade: finalConfidence,
      temOculos: hasGlassesDetected,
      calibrationUsed: true,
      pixelsPerMM
    };
  };

  const handleProcess = () => {
    const measurements = calculateMeasurements();
    setIsProcessed(true);
    onMeasurementsChange(measurements);
  };

  if (!isLoaded) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Carregando sistema de medição de precisão...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {showCalibrationGuide && (
        <CalibrationGuide onCalibrationSet={handleCalibrationSet} />
      )}
      
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Sistema de Medição de Precisão
            {isProcessed && (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Processado
              </Badge>
            )}
            {calibrationRef && (
              <Badge variant="outline" className="bg-blue-100 text-blue-800">
                Calibrado: {calibrationRef.realSizeMM}mm
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Navigation Controls */}
          <div className="flex gap-2 flex-wrap items-center">
            <Button
              onClick={() => handleZoom(-0.2)}
              size="sm"
              variant="outline"
              disabled={viewport.zoom <= 0.5}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Badge variant="outline">{Math.round(viewport.zoom * 100)}%</Badge>
            <Button
              onClick={() => handleZoom(0.2)}
              size="sm"
              variant="outline"
              disabled={viewport.zoom >= 4}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            
            <Button
              onClick={handleAutoDetect}
              size="sm"
              variant="outline"
              disabled={isDetecting}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              {isDetecting ? 'Detectando...' : 'Auto-Detectar'}
            </Button>
            
            <Button
              onClick={() => setHasGlassesDetected(!hasGlassesDetected)}
              variant="outline"
              size="sm"
            >
              {hasGlassesDetected ? <Glasses className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {hasGlassesDetected ? 'Com Óculos' : 'Sem Óculos'}
            </Button>
            
            <Button onClick={resetView} variant="outline" size="sm">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          {/* Canvas */}
          <div className="relative border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-100 h-96">
            <canvas
              ref={canvasRef}
              className="w-full h-full cursor-crosshair"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          </div>

          {/* Process Button */}
          <Button
            onClick={handleProcess}
            className="w-full flex items-center gap-2 bg-green-600 hover:bg-green-700"
            disabled={isProcessed || !calibrationRef}
          >
            <Zap className="h-4 w-4" />
            Processar Medidas Precisas
          </Button>

          {/* Live Measurements Preview */}
          {!isProcessed && calibrationRef && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h5 className="font-medium text-gray-700 mb-2">Prévia das Medidas:</h5>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {(() => {
                  const preview = calculateMeasurements();
                  return (
                    <>
                      <div>
                        <span className="text-gray-600">DP Binocular:</span>
                        <span className="ml-2 font-medium">{preview.dpBinocular.toFixed(1)} mm</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Confiabilidade:</span>
                        <span className="ml-2 font-medium">{Math.round(preview.confiabilidade * 100)}%</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Largura Lente:</span>
                        <span className="ml-2 font-medium">{preview.larguraLente.toFixed(1)} mm</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Calibração:</span>
                        <span className="ml-2 font-medium">{preview.pixelsPerMM.toFixed(2)} px/mm</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};