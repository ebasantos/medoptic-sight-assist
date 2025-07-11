import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas as FabricCanvas, Circle, Line, Text, FabricImage } from 'fabric';
import { CalibrationData, MeasurementResults } from './PrecisionMeasurementScreen';

interface FaceLandmarks {
  leftPupil: { x: number; y: number };
  rightPupil: { x: number; y: number };
  leftInnerCorner: { x: number; y: number };
  rightInnerCorner: { x: number; y: number };
  noseTip: { x: number; y: number };
  frameBottom?: { x: number; y: number }[];
}

interface MeasurementCanvasProps {
  image: string;
  zoomLevel: number;
  calibrationDistance: number;
  onCalibrationChange: (points: [{ x: number; y: number }, { x: number; y: number }], distanceMm: number) => void;
  onMeasurementsUpdate: (measurements: MeasurementResults) => void;
  detectFaceLandmarks: (imageData: string) => Promise<any>;
}

export const MeasurementCanvas: React.FC<MeasurementCanvasProps> = ({
  image,
  zoomLevel,
  calibrationDistance,
  onCalibrationChange,
  onMeasurementsUpdate,
  detectFaceLandmarks
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);
  const [faceLandmarks, setFaceLandmarks] = useState<FaceLandmarks | null>(null);
  const [calibrationPoints, setCalibrationPoints] = useState<[Circle, Circle] | null>(null);
  const [calibrationLine, setCalibrationLine] = useState<Line | null>(null);
  const [measurementElements, setMeasurementElements] = useState<any[]>([]);

  // Initialize fabric canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: '#f0f0f0',
      selection: false
    });

    fabricCanvasRef.current = canvas;

    return () => {
      canvas.dispose();
    };
  }, []);

  // Load image and detect face landmarks
  useEffect(() => {
    if (!fabricCanvasRef.current || !image) return;

    const canvas = fabricCanvasRef.current;
    canvas.clear();

    // Load background image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      // Calculate canvas size maintaining aspect ratio
      const maxWidth = 800;
      const maxHeight = 600;
      const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
      const scaledWidth = img.width * ratio;
      const scaledHeight = img.height * ratio;

      canvas.setDimensions({ width: scaledWidth, height: scaledHeight });

      // Set background image
      const fabricImage = new FabricImage(img, {
        scaleX: ratio,
        scaleY: ratio,
        originX: 'left',
        originY: 'top',
        selectable: false,
        evented: false
      });
      
      canvas.add(fabricImage);
      canvas.renderAll();

      // Detect face landmarks
      try {
        console.log('Tentando detectar landmarks faciais...');
        const landmarks = await detectFaceLandmarks(image);
        console.log('Landmarks detectados:', landmarks);
        if (landmarks && landmarks.length > 0) {
          const processedLandmarks = processFaceLandmarks(landmarks, ratio);
          console.log('Landmarks processados:', processedLandmarks);
          setFaceLandmarks(processedLandmarks);
          setupInitialCalibration(processedLandmarks);
        } else {
          console.log('Nenhum landmark detectado, configurando calibração manual...');
          setupManualCalibration(canvas, scaledWidth, scaledHeight);
        }
      } catch (error) {
        console.error('Falha na detecção facial:', error);
        console.log('Configurando calibração manual devido ao erro...');
        setupManualCalibration(canvas, scaledWidth, scaledHeight);
      }
    };
    img.src = image;
  }, [image, detectFaceLandmarks]);

  // Handle zoom level changes
  useEffect(() => {
    if (!fabricCanvasRef.current) return;
    
    const canvas = fabricCanvasRef.current;
    canvas.setZoom(zoomLevel);
    canvas.renderAll();
  }, [zoomLevel]);

  const processFaceLandmarks = (landmarks: any, imageScale: number): FaceLandmarks => {
    // Convert Mediapipe landmarks to canvas coordinates
    // Mediapipe Face Mesh landmark indices:
    // Left eye: 468, Right eye: 473 (approximate pupil centers)
    // Inner corners: 133 (left), 362 (right)
    // Nose tip: 1

    const getScaledPoint = (landmark: { x: number; y: number }) => ({
      x: landmark.x * imageScale,
      y: landmark.y * imageScale
    });

    return {
      leftPupil: getScaledPoint(landmarks[468] || landmarks[133]), // fallback to inner corner
      rightPupil: getScaledPoint(landmarks[473] || landmarks[362]), // fallback to inner corner
      leftInnerCorner: getScaledPoint(landmarks[133]),
      rightInnerCorner: getScaledPoint(landmarks[362]),
      noseTip: getScaledPoint(landmarks[1])
    };
  };

  const setupInitialCalibration = (landmarks: FaceLandmarks) => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;

    // Create calibration points at inner eye corners (typical 32mm distance)
    const leftPoint = new Circle({
      left: landmarks.leftInnerCorner.x,
      top: landmarks.leftInnerCorner.y,
      radius: 8,
      fill: '#3b82f6',
      stroke: '#1e40af',
      strokeWidth: 2,
      selectable: true,
      hasControls: false,
      hasBorders: false,
      hoverCursor: 'move',
      moveCursor: 'move'
    });

    const rightPoint = new Circle({
      left: landmarks.rightInnerCorner.x,
      top: landmarks.rightInnerCorner.y,
      radius: 8,
      fill: '#3b82f6',
      stroke: '#1e40af',
      strokeWidth: 2,
      selectable: true,
      hasControls: false,
      hasBorders: false,
      hoverCursor: 'move',
      moveCursor: 'move'
    });

    const line = new Line([
      landmarks.leftInnerCorner.x,
      landmarks.leftInnerCorner.y,
      landmarks.rightInnerCorner.x,
      landmarks.rightInnerCorner.y
    ], {
      stroke: '#3b82f6',
      strokeWidth: 3,
      selectable: false,
      evented: false
    });

    // Add event listeners for calibration point movement
    const updateCalibration = () => {
      const leftCenter = leftPoint.getCenterPoint();
      const rightCenter = rightPoint.getCenterPoint();
      
      line.set({
        x1: leftCenter.x,
        y1: leftCenter.y,
        x2: rightCenter.x,
        y2: rightCenter.y
      });

      onCalibrationChange(
        [{ x: leftCenter.x, y: leftCenter.y }, { x: rightCenter.x, y: rightCenter.y }],
        calibrationDistance
      );

      canvas.renderAll();
      updateMeasurements();
    };

    leftPoint.on('moving', updateCalibration);
    rightPoint.on('moving', updateCalibration);

    canvas.add(line, leftPoint, rightPoint);
    setCalibrationPoints([leftPoint, rightPoint]);
    setCalibrationLine(line);

    // Initial calibration
    updateCalibration();
    setupMeasurementPoints(landmarks);
  };

  const setupMeasurementPoints = (landmarks: FaceLandmarks) => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;

    // Create draggable points for pupils and nose
    const leftPupilPoint = new Circle({
      left: landmarks.leftPupil.x,
      top: landmarks.leftPupil.y,
      radius: 6,
      fill: '#ef4444',
      stroke: '#dc2626',
      strokeWidth: 2,
      selectable: true,
      hasControls: false,
      hasBorders: false,
      hoverCursor: 'move',
      moveCursor: 'move'
    });

    const rightPupilPoint = new Circle({
      left: landmarks.rightPupil.x,
      top: landmarks.rightPupil.y,
      radius: 6,
      fill: '#ef4444',
      stroke: '#dc2626',
      strokeWidth: 2,
      selectable: true,
      hasControls: false,
      hasBorders: false,
      hoverCursor: 'move',
      moveCursor: 'move'
    });

    const noseTipPoint = new Circle({
      left: landmarks.noseTip.x,
      top: landmarks.noseTip.y,
      radius: 6,
      fill: '#10b981',
      stroke: '#059669',
      strokeWidth: 2,
      selectable: true,
      hasControls: false,
      hasBorders: false,
      hoverCursor: 'move',
      moveCursor: 'move'
    });

    // Create measurement lines
    const dnpLine = new Line([
      landmarks.leftPupil.x,
      landmarks.leftPupil.y,
      landmarks.rightPupil.x,
      landmarks.rightPupil.y
    ], {
      stroke: '#ef4444',
      strokeWidth: 2,
      strokeDashArray: [5, 5],
      selectable: false,
      evented: false
    });

    const dpLeftLine = new Line([
      landmarks.leftPupil.x,
      landmarks.leftPupil.y,
      landmarks.noseTip.x,
      landmarks.noseTip.y
    ], {
      stroke: '#f59e0b',
      strokeWidth: 2,
      strokeDashArray: [3, 3],
      selectable: false,
      evented: false
    });

    const dpRightLine = new Line([
      landmarks.rightPupil.x,
      landmarks.rightPupil.y,
      landmarks.noseTip.x,
      landmarks.noseTip.y
    ], {
      stroke: '#f59e0b',
      strokeWidth: 2,
      strokeDashArray: [3, 3],
      selectable: false,
      evented: false
    });

    // Add labels
    const dnpLabel = new Text('DNP', {
      left: (landmarks.leftPupil.x + landmarks.rightPupil.x) / 2,
      top: landmarks.leftPupil.y - 25,
      fontSize: 14,
      fill: '#ef4444',
      backgroundColor: 'rgba(255,255,255,0.8)',
      selectable: false,
      evented: false
    });

    // Store measurement elements
    const elements = [
      leftPupilPoint, rightPupilPoint, noseTipPoint,
      dnpLine, dpLeftLine, dpRightLine, dnpLabel
    ];

    setMeasurementElements(elements);
    canvas.add(...elements);

    // Add movement listeners
    const updateMeasurementLines = () => {
      const leftPupilCenter = leftPupilPoint.getCenterPoint();
      const rightPupilCenter = rightPupilPoint.getCenterPoint();
      const noseTipCenter = noseTipPoint.getCenterPoint();

      dnpLine.set({
        x1: leftPupilCenter.x,
        y1: leftPupilCenter.y,
        x2: rightPupilCenter.x,
        y2: rightPupilCenter.y
      });

      dpLeftLine.set({
        x1: leftPupilCenter.x,
        y1: leftPupilCenter.y,
        x2: noseTipCenter.x,
        y2: noseTipCenter.y
      });

      dpRightLine.set({
        x1: rightPupilCenter.x,
        y1: rightPupilCenter.y,
        x2: noseTipCenter.x,
        y2: noseTipCenter.y
      });

      dnpLabel.set({
        left: (leftPupilCenter.x + rightPupilCenter.x) / 2,
        top: Math.min(leftPupilCenter.y, rightPupilCenter.y) - 25
      });

      canvas.renderAll();
      updateMeasurements();
    };

    leftPupilPoint.on('moving', updateMeasurementLines);
    rightPupilPoint.on('moving', updateMeasurementLines);
    noseTipPoint.on('moving', updateMeasurementLines);

    // Initial measurement update
    updateMeasurements();
  };

  const calculateDistance = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  };

  const setupManualCalibration = (canvas: FabricCanvas, width: number, height: number) => {
    console.log('Configurando calibração manual...');
    // Setup manual calibration points when face detection fails
    const leftX = width * 0.3;
    const rightX = width * 0.7;
    const centerY = height * 0.4;

    const landmarks: FaceLandmarks = {
      leftPupil: { x: leftX - 30, y: centerY },
      rightPupil: { x: rightX + 30, y: centerY },
      leftInnerCorner: { x: leftX, y: centerY },
      rightInnerCorner: { x: rightX, y: centerY },
      noseTip: { x: width * 0.5, y: centerY + 30 }
    };

    setFaceLandmarks(landmarks);
    setupInitialCalibration(landmarks);
  };

  const updateMeasurements = useCallback(() => {
    console.log('Atualizando medições...');
    console.log('Pontos de calibração:', calibrationPoints);
    console.log('Elementos de medição:', measurementElements);
    
    if (!calibrationPoints || !measurementElements.length) {
      console.log('Dados insuficientes para cálculo');
      return;
    }

    const [leftCalibration, rightCalibration] = calibrationPoints;
    const leftCalibrationCenter = leftCalibration.getCenterPoint();
    const rightCalibrationCenter = rightCalibration.getCenterPoint();
    
    const calibrationPixelDistance = calculateDistance(leftCalibrationCenter, rightCalibrationCenter);
    const scaleMmPerPixel = calibrationDistance / calibrationPixelDistance;

    console.log('Distância de calibração (pixels):', calibrationPixelDistance);
    console.log('Escala (mm/pixel):', scaleMmPerPixel);

    // Get current positions of measurement points
    const leftPupilCenter = measurementElements[0]?.getCenterPoint?.() || { x: 0, y: 0 };
    const rightPupilCenter = measurementElements[1]?.getCenterPoint?.() || { x: 0, y: 0 };
    const noseTipCenter = measurementElements[2]?.getCenterPoint?.() || { x: 0, y: 0 };

    // Calculate measurements in mm
    const dnpPixels = calculateDistance(leftPupilCenter, rightPupilCenter);
    const dpLeftPixels = calculateDistance(leftPupilCenter, noseTipCenter);
    const dpRightPixels = calculateDistance(rightPupilCenter, noseTipCenter);

    console.log('Medições em pixels - DNP:', dnpPixels, 'DP Esq:', dpLeftPixels, 'DP Dir:', dpRightPixels);

    const measurements: MeasurementResults = {
      dnpMm: dnpPixels * scaleMmPerPixel,
      dpLeftMm: dpLeftPixels * scaleMmPerPixel,
      dpRightMm: dpRightPixels * scaleMmPerPixel,
      heightLeftMm: 15, // Default height
      heightRightMm: 15, // Default height
      calibration: {
        anchorPoints: [leftCalibrationCenter, rightCalibrationCenter],
        distanceMm: calibrationDistance,
        scaleMmPerPixel
      }
    };

    console.log('Medições finais:', measurements);
    onMeasurementsUpdate(measurements);
  }, [calibrationPoints, measurementElements, calibrationDistance, onMeasurementsUpdate]);

  // Update measurements when calibration distance changes
  useEffect(() => {
    updateMeasurements();
  }, [calibrationDistance, updateMeasurements]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="border border-gray-200 rounded-lg shadow-sm"
      />
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Calibration Ruler</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Pupil Centers</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Nose Tip</span>
          </div>
        </div>
      </div>
    </div>
  );
};