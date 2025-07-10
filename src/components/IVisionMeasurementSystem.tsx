import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, Eye, Glasses, RotateCcw, CheckCircle, ZoomIn, ZoomOut, Target, Activity } from 'lucide-react';

interface LandmarkPoint {
  x: number;
  y: number;
  z?: number;
  confidence: number;
}

interface MeasurementAnchor {
  x: number;
  y: number;
  type: 'pupil_left' | 'pupil_right' | 'frame_left' | 'frame_right';
  draggable: boolean;
}

interface IVisionMeasurementSystemProps {
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

interface ViewportState {
  zoom: number;
  offsetX: number;
  offsetY: number;
  scale: number;
  imgX: number;
  imgY: number;
  imgWidth: number;
  imgHeight: number;
}

// Anthropometric constants for automatic calibration
const FACIAL_CONSTANTS = {
  AVERAGE_INTERCANTHAL_DISTANCE: 32, // mm - distance between inner eye corners
  AVERAGE_PUPILLARY_DISTANCE: 63, // mm - average PD
  EYE_WIDTH_RATIO: 0.3, // ratio of eye width to face width
  PUPIL_TO_INNER_CORNER_RATIO: 0.4 // pupil position within eye
};

export const IVisionMeasurementSystem: React.FC<IVisionMeasurementSystemProps> = ({
  imageData,
  hasGlasses = false,
  onMeasurementsChange
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const faceMeshRef = useRef<any>(null);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [hasGlassesDetected, setHasGlassesDetected] = useState(hasGlasses);
  const [isProcessed, setIsProcessed] = useState(false);
  
  // Facial landmarks
  const [facialLandmarks, setFacialLandmarks] = useState<LandmarkPoint[]>([]);
  const [calibrationScale, setCalibrationScale] = useState<number>(1);
  
  // Measurement anchors
  const [anchors, setAnchors] = useState<MeasurementAnchor[]>([]);
  
  // Advanced viewport with inertial panning
  const [viewport, setViewport] = useState<ViewportState>({
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
    scale: 1,
    imgX: 0,
    imgY: 0,
    imgWidth: 0,
    imgHeight: 0
  });
  
  const [panVelocity, setPanVelocity] = useState({ x: 0, y: 0 });
  const [lastPanTime, setLastPanTime] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });

  // Initialize MediaPipe Face Mesh
  useEffect(() => {
    const initializeFaceMesh = async () => {
      try {
        const { FaceMesh } = await import('@mediapipe/face_mesh');
        const { Camera } = await import('@mediapipe/camera_utils');
        
        faceMeshRef.current = new FaceMesh({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
        });
        
        faceMeshRef.current.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });
        
        faceMeshRef.current.onResults(handleFaceMeshResults);
      } catch (error) {
        console.warn('MediaPipe initialization failed:', error);
      }
    };
    
    initializeFaceMesh();
  }, []);

  // Load image and setup canvas
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      setIsLoaded(true);
      updateViewport();
      performAutomaticDetection(img);
    };
    img.src = imageData;
  }, [imageData]);

  const updateViewport = useCallback(() => {
    if (!canvasRef.current || !imageRef.current || !containerRef.current) return;
    
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const img = imageRef.current;
    
    // Set canvas size to container
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    // Calculate image display dimensions
    const containerAspect = canvas.width / canvas.height;
    const imageAspect = img.width / img.height;
    
    let scale = viewport.zoom;
    let imgWidth, imgHeight;
    
    if (imageAspect > containerAspect) {
      imgWidth = canvas.width * scale;
      imgHeight = imgWidth / imageAspect;
    } else {
      imgHeight = canvas.height * scale;
      imgWidth = imgHeight * imageAspect;
    }
    
    const imgX = (canvas.width - imgWidth) / 2 + viewport.offsetX;
    const imgY = (canvas.height - imgHeight) / 2 + viewport.offsetY;
    
    setViewport(prev => ({
      ...prev,
      scale,
      imgX,
      imgY,
      imgWidth,
      imgHeight
    }));
  }, [viewport.zoom, viewport.offsetX, viewport.offsetY]);

  const performAutomaticDetection = async (img: HTMLImageElement) => {
    if (!faceMeshRef.current) return;
    
    setIsDetecting(true);
    try {
      // Create a temporary canvas for MediaPipe processing
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (!tempCtx) return;
      
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;
      tempCtx.drawImage(img, 0, 0);
      
      await faceMeshRef.current.send({ image: tempCanvas });
    } catch (error) {
      console.warn('Automatic detection failed:', error);
      initializeDefaultAnchors();
    } finally {
      setIsDetecting(false);
    }
  };

  const handleFaceMeshResults = (results: any) => {
    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      initializeDefaultAnchors();
      return;
    }
    
    const landmarks = results.multiFaceLandmarks[0];
    setFacialLandmarks(landmarks.map((point: any, index: number) => ({
      x: point.x * (imageRef.current?.width || 1),
      y: point.y * (imageRef.current?.height || 1),
      z: point.z,
      confidence: 0.9
    })));
    
    // Extract key points for measurement
    extractMeasurementAnchors(landmarks);
    calculateAnthropometricScale(landmarks);
  };

  const extractMeasurementAnchors = (landmarks: any[]) => {
    if (!imageRef.current) return;
    
    const img = imageRef.current;
    
    // Key landmark indices for facial features
    const LEFT_EYE_CENTER = 468; // Left pupil approximation
    const RIGHT_EYE_CENTER = 473; // Right pupil approximation
    const LEFT_EYE_INNER = 133;
    const RIGHT_EYE_INNER = 362;
    const NOSE_TIP = 1;
    
    const newAnchors: MeasurementAnchor[] = [];
    
    // Extract pupil positions (refined using eye landmarks)
    const leftEyeLandmarks = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246];
    const rightEyeLandmarks = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398];
    
    const leftEyeCenter = calculateEyeCenter(leftEyeLandmarks, landmarks, img);
    const rightEyeCenter = calculateEyeCenter(rightEyeLandmarks, landmarks, img);
    
    newAnchors.push({
      x: leftEyeCenter.x,
      y: leftEyeCenter.y,
      type: 'pupil_left',
      draggable: true
    });
    
    newAnchors.push({
      x: rightEyeCenter.x,
      y: rightEyeCenter.y,
      type: 'pupil_right',
      draggable: true
    });
    
    // If glasses are detected, add frame bottom points
    if (hasGlassesDetected) {
      newAnchors.push({
        x: leftEyeCenter.x,
        y: leftEyeCenter.y + img.height * 0.08,
        type: 'frame_left',
        draggable: true
      });
      
      newAnchors.push({
        x: rightEyeCenter.x,
        y: rightEyeCenter.y + img.height * 0.08,
        type: 'frame_right',
        draggable: true
      });
    }
    
    setAnchors(newAnchors);
  };

  const calculateEyeCenter = (eyeLandmarkIndices: number[], landmarks: any[], img: HTMLImageElement) => {
    let sumX = 0, sumY = 0;
    
    eyeLandmarkIndices.forEach(index => {
      if (landmarks[index]) {
        sumX += landmarks[index].x * img.width;
        sumY += landmarks[index].y * img.height;
      }
    });
    
    return {
      x: sumX / eyeLandmarkIndices.length,
      y: sumY / eyeLandmarkIndices.length
    };
  };

  const calculateAnthropometricScale = (landmarks: any[]) => {
    if (!imageRef.current) return;
    
    const img = imageRef.current;
    
    // Calculate intercanthal distance (inner eye corner to inner eye corner)
    const leftInnerCorner = landmarks[133];
    const rightInnerCorner = landmarks[362];
    
    if (leftInnerCorner && rightInnerCorner) {
      const pixelDistance = Math.abs(
        (rightInnerCorner.x - leftInnerCorner.x) * img.width
      );
      
      // Scale based on average intercanthal distance
      const scale = FACIAL_CONSTANTS.AVERAGE_INTERCANTHAL_DISTANCE / pixelDistance;
      setCalibrationScale(scale);
    }
  };

  const initializeDefaultAnchors = () => {
    if (!imageRef.current) return;
    
    const img = imageRef.current;
    const centerX = img.width / 2;
    const eyeY = img.height * 0.42;
    const eyeDistance = img.width * 0.25;
    
    const defaultAnchors: MeasurementAnchor[] = [
      {
        x: centerX - eyeDistance,
        y: eyeY,
        type: 'pupil_left',
        draggable: true
      },
      {
        x: centerX + eyeDistance,
        y: eyeY,
        type: 'pupil_right',
        draggable: true
      }
    ];
    
    if (hasGlassesDetected) {
      defaultAnchors.push(
        {
          x: centerX - eyeDistance,
          y: eyeY + img.height * 0.08,
          type: 'frame_left',
          draggable: true
        },
        {
          x: centerX + eyeDistance,
          y: eyeY + img.height * 0.08,
          type: 'frame_right',
          draggable: true
        }
      );
    }
    
    setAnchors(defaultAnchors);
    
    // Set default scale
    const estimatedPixelDistance = Math.abs(defaultAnchors[1].x - defaultAnchors[0].x);
    setCalibrationScale(FACIAL_CONSTANTS.AVERAGE_PUPILLARY_DISTANCE / estimatedPixelDistance);
  };

  // Advanced drawing with real-time updates
  const drawCanvas = useCallback(() => {
    if (!canvasRef.current || !imageRef.current || !isLoaded) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw image
    ctx.drawImage(
      imageRef.current,
      viewport.imgX,
      viewport.imgY,
      viewport.imgWidth,
      viewport.imgHeight
    );
    
    // Convert image coordinates to canvas coordinates
    const toCanvas = (x: number, y: number) => ({
      x: viewport.imgX + (x / imageRef.current!.width) * viewport.imgWidth,
      y: viewport.imgY + (y / imageRef.current!.height) * viewport.imgHeight
    });
    
    // Draw measurement lines and anchors
    drawMeasurementLines(ctx, toCanvas);
    drawAnchors(ctx, toCanvas);
    drawLiveValues(ctx, toCanvas);
    
  }, [viewport, anchors, isLoaded]);

  const drawMeasurementLines = (ctx: CanvasRenderingContext2D, toCanvas: (x: number, y: number) => {x: number, y: number}) => {
    const pupilLeft = anchors.find(a => a.type === 'pupil_left');
    const pupilRight = anchors.find(a => a.type === 'pupil_right');
    
    if (pupilLeft && pupilRight) {
      const leftCanvas = toCanvas(pupilLeft.x, pupilLeft.y);
      const rightCanvas = toCanvas(pupilRight.x, pupilRight.y);
      
      // Pupillary distance line
      ctx.strokeStyle = '#00ff41';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 4]);
      ctx.beginPath();
      ctx.moveTo(leftCanvas.x, leftCanvas.y);
      ctx.lineTo(rightCanvas.x, rightCanvas.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    
    // Height measurement lines for glasses
    if (hasGlassesDetected) {
      const frameLeft = anchors.find(a => a.type === 'frame_left');
      const frameRight = anchors.find(a => a.type === 'frame_right');
      
      if (pupilLeft && frameLeft) {
        const pupilCanvas = toCanvas(pupilLeft.x, pupilLeft.y);
        const frameCanvas = toCanvas(frameLeft.x, frameLeft.y);
        
        ctx.strokeStyle = '#0066ff';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 3]);
        ctx.beginPath();
        ctx.moveTo(pupilCanvas.x, pupilCanvas.y);
        ctx.lineTo(frameCanvas.x, frameCanvas.y);
        ctx.stroke();
      }
      
      if (pupilRight && frameRight) {
        const pupilCanvas = toCanvas(pupilRight.x, pupilRight.y);
        const frameCanvas = toCanvas(frameRight.x, frameRight.y);
        
        ctx.strokeStyle = '#0066ff';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 3]);
        ctx.beginPath();
        ctx.moveTo(pupilCanvas.x, pupilCanvas.y);
        ctx.lineTo(frameCanvas.x, frameCanvas.y);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }
  };

  const drawAnchors = (ctx: CanvasRenderingContext2D, toCanvas: (x: number, y: number) => {x: number, y: number}) => {
    anchors.forEach(anchor => {
      const canvas = toCanvas(anchor.x, anchor.y);
      
      // Color coding based on type
      let color = '#ff0044';
      if (anchor.type.includes('pupil')) color = '#00ff41';
      if (anchor.type.includes('frame')) color = '#0066ff';
      
      // Draw anchor point
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(canvas.x, canvas.y, 8 / viewport.zoom, 0, 2 * Math.PI);
      ctx.fill();
      
      // White border for visibility
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2 / viewport.zoom;
      ctx.stroke();
      
      // Drag indicator
      if (anchor.draggable) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(canvas.x, canvas.y, 12 / viewport.zoom, 0, 2 * Math.PI);
        ctx.stroke();
      }
    });
  };

  const drawLiveValues = (ctx: CanvasRenderingContext2D, toCanvas: (x: number, y: number) => {x: number, y: number}) => {
    if (isProcessed) return;
    
    const measurements = calculateLiveMeasurements();
    
    // Display live PD value
    const pupilLeft = anchors.find(a => a.type === 'pupil_left');
    const pupilRight = anchors.find(a => a.type === 'pupil_right');
    
    if (pupilLeft && pupilRight) {
      const leftCanvas = toCanvas(pupilLeft.x, pupilLeft.y);
      const rightCanvas = toCanvas(pupilRight.x, pupilRight.y);
      const midX = (leftCanvas.x + rightCanvas.x) / 2;
      const midY = Math.min(leftCanvas.y, rightCanvas.y) - 25;
      
      ctx.font = `bold ${16 / viewport.zoom}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeText(`PD: ${measurements.dpBinocular.toFixed(1)}mm`, midX, midY);
      ctx.fillText(`PD: ${measurements.dpBinocular.toFixed(1)}mm`, midX, midY);
    }
  };

  useEffect(() => {
    updateViewport();
  }, [updateViewport]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Advanced interaction handlers
  const getImageCoordinates = (clientX: number, clientY: number) => {
    if (!canvasRef.current || !imageRef.current) return { x: 0, y: 0 };
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    const canvasX = clientX - rect.left;
    const canvasY = clientY - rect.top;
    
    // Convert to image coordinates
    const x = ((canvasX - viewport.imgX) / viewport.imgWidth) * imageRef.current.width;
    const y = ((canvasY - viewport.imgY) / viewport.imgHeight) * imageRef.current.height;
    
    return { x, y };
  };

  const getPointDistance = (point1: { x: number; y: number }, point2: { x: number; y: number }) => {
    return Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    const coords = getImageCoordinates(event.clientX, event.clientY);
    const threshold = 20 / viewport.zoom;
    
    // Check if clicking on an anchor
    const clickedAnchor = anchors.find(anchor => 
      getPointDistance(coords, anchor) < threshold
    );
    
    if (clickedAnchor) {
      setIsDragging(clickedAnchor.type);
      event.preventDefault();
    } else {
      // Start inertial panning
      setIsPanning(true);
      setLastPanPoint({ x: event.clientX, y: event.clientY });
      setLastPanTime(Date.now());
      setPanVelocity({ x: 0, y: 0 });
    }
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (isDragging) {
      const coords = getImageCoordinates(event.clientX, event.clientY);
      
      setAnchors(prev => prev.map(anchor => 
        anchor.type === isDragging
          ? { ...anchor, x: coords.x, y: coords.y }
          : anchor
      ));
    } else if (isPanning) {
      const now = Date.now();
      const deltaTime = now - lastPanTime;
      const deltaX = event.clientX - lastPanPoint.x;
      const deltaY = event.clientY - lastPanPoint.y;
      
      // Calculate velocity for inertial panning
      setPanVelocity({
        x: deltaX / deltaTime,
        y: deltaY / deltaTime
      });
      
      setViewport(prev => ({
        ...prev,
        offsetX: prev.offsetX + deltaX,
        offsetY: prev.offsetY + deltaY
      }));
      
      setLastPanPoint({ x: event.clientX, y: event.clientY });
      setLastPanTime(now);
    }
  };

  const handleMouseUp = () => {
    if (isPanning && (Math.abs(panVelocity.x) > 0.1 || Math.abs(panVelocity.y) > 0.1)) {
      // Apply inertial panning
      const decay = 0.95;
      const animate = () => {
        setPanVelocity(prev => {
          const newVelX = prev.x * decay;
          const newVelY = prev.y * decay;
          
          if (Math.abs(newVelX) > 0.01 || Math.abs(newVelY) > 0.01) {
            setViewport(current => ({
              ...current,
              offsetX: current.offsetX + newVelX * 10,
              offsetY: current.offsetY + newVelY * 10
            }));
            requestAnimationFrame(animate);
            return { x: newVelX, y: newVelY };
          }
          return { x: 0, y: 0 };
        });
      };
      requestAnimationFrame(animate);
    }
    
    setIsDragging(null);
    setIsPanning(false);
  };

  const handleWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(10, viewport.zoom * zoomFactor));
    
    // Zoom towards mouse position
    const rect = canvasRef.current!.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    const zoomRatio = newZoom / viewport.zoom;
    const newOffsetX = mouseX - (mouseX - viewport.offsetX) * zoomRatio;
    const newOffsetY = mouseY - (mouseY - viewport.offsetY) * zoomRatio;
    
    setViewport(prev => ({
      ...prev,
      zoom: newZoom,
      offsetX: newOffsetX,
      offsetY: newOffsetY
    }));
  };

  const calculateLiveMeasurements = (): MeasurementResults => {
    const pupilLeft = anchors.find(a => a.type === 'pupil_left');
    const pupilRight = anchors.find(a => a.type === 'pupil_right');
    
    if (!pupilLeft || !pupilRight) {
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
    
    const pixelDistance = Math.abs(pupilRight.x - pupilLeft.x);
    const realDistance = pixelDistance * calibrationScale;
    
    const frameLeft = anchors.find(a => a.type === 'frame_left');
    const frameRight = anchors.find(a => a.type === 'frame_right');
    
    const measurements: MeasurementResults = {
      dpBinocular: realDistance,
      dnpEsquerda: realDistance / 2,
      dnpDireita: realDistance / 2,
      larguraLente: realDistance * 0.75,
      confiabilidade: facialLandmarks.length > 0 ? 0.92 : 0.75,
      temOculos: hasGlassesDetected,
      autoCalibrated: facialLandmarks.length > 0,
      anthropometricScale: calibrationScale
    };
    
    if (hasGlassesDetected && frameLeft && frameRight) {
      measurements.alturaEsquerda = Math.abs(frameLeft.y - pupilLeft.y) * calibrationScale;
      measurements.alturaDireita = Math.abs(frameRight.y - pupilRight.y) * calibrationScale;
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
    setViewport({ zoom: 1, offsetX: 0, offsetY: 0, scale: 1, imgX: 0, imgY: 0, imgWidth: 0, imgHeight: 0 });
    if (imageRef.current) {
      performAutomaticDetection(imageRef.current);
    }
  };

  const toggleGlasses = () => {
    setHasGlassesDetected(!hasGlassesDetected);
    
    if (!hasGlassesDetected) {
      // Add frame anchors
      const pupilLeft = anchors.find(a => a.type === 'pupil_left');
      const pupilRight = anchors.find(a => a.type === 'pupil_right');
      
      if (pupilLeft && pupilRight) {
        const newAnchors = [...anchors];
        newAnchors.push(
          {
            x: pupilLeft.x,
            y: pupilLeft.y + (imageRef.current?.height || 0) * 0.08,
            type: 'frame_left',
            draggable: true
          },
          {
            x: pupilRight.x,
            y: pupilRight.y + (imageRef.current?.height || 0) * 0.08,
            type: 'frame_right',
            draggable: true
          }
        );
        setAnchors(newAnchors);
      }
    } else {
      // Remove frame anchors
      setAnchors(prev => prev.filter(a => !a.type.includes('frame')));
    }
  };

  if (!isLoaded) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Carregando sistema IVision...</p>
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
          Sistema de Medição IVision
          {isProcessed && (
            <Badge variant="default" className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              Processado
            </Badge>
          )}
          {isDetecting && (
            <Badge variant="outline">
              <Activity className="h-3 w-3 mr-1 animate-pulse" />
              Detectando...
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Instructions */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-2">Sistema IVision - Medição Automática:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Detecção automática de marcos faciais usando IA</li>
            <li>• Calibração antropométrica automatizada</li>
            <li>• Arraste os pontos âncora para ajustes precisos</li>
            <li>• Zoom até 10x com navegação fluida</li>
            <li>• Valores atualizados em tempo real</li>
          </ul>
        </div>

        {/* Canvas Container */}
        <div 
          ref={containerRef}
          className="relative border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-900"
          style={{ height: '500px' }}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full cursor-crosshair"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            style={{ touchAction: 'none' }}
          />
          
          {/* Zoom Controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <Button
              onClick={() => setViewport(prev => ({ ...prev, zoom: Math.min(10, prev.zoom * 1.2) }))}
              size="sm"
              variant="outline"
              className="bg-white/80 backdrop-blur-sm"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Badge variant="outline" className="bg-white/80 backdrop-blur-sm text-center">
              {Math.round(viewport.zoom * 100)}%
            </Badge>
            <Button
              onClick={() => setViewport(prev => ({ ...prev, zoom: Math.max(0.1, prev.zoom / 1.2) }))}
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
            disabled={isProcessed || isDetecting}
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
                  {liveMeasurements.autoCalibrated && ' (Auto-calibrado)'}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};