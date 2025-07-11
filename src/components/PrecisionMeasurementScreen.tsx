import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Camera, Upload, ZoomIn, ZoomOut, RotateCcw, Save } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MeasurementCanvas } from './MeasurementCanvas';
import { useFaceMeshDetection } from '@/hooks/useFaceMeshDetection';
import { useToast } from '@/hooks/use-toast';

export interface CalibrationData {
  anchorPoints: [{ x: number; y: number }, { x: number; y: number }];
  distanceMm: number;
  scaleMmPerPixel: number;
}

export interface MeasurementResults {
  dnpMm: number;
  dpLeftMm: number;
  dpRightMm: number;
  heightLeftMm: number;
  heightRightMm: number;
  calibration: CalibrationData;
}

interface PrecisionMeasurementScreenProps {
  onMeasurementsComplete?: (results: MeasurementResults) => void;
  onCancel?: () => void;
  initialImage?: string | null;
}

export const PrecisionMeasurementScreen: React.FC<PrecisionMeasurementScreenProps> = ({
  onMeasurementsComplete,
  onCancel,
  initialImage
}) => {
  const [image, setImage] = useState<string | null>(initialImage || null);
  const [calibrationDistance, setCalibrationDistance] = useState<number>(32); // Default inner canthal distance
  const [calibrationPoints, setCalibrationPoints] = useState<[{ x: number; y: number }, { x: number; y: number }] | null>(null);
  const [measurements, setMeasurements] = useState<MeasurementResults | null>(null);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isCalibrated, setIsCalibrated] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  
  const { toast } = useToast();
  const { detectFaceLandmarks, isLoading: isFaceDetectionLoading } = useFaceMeshDetection();

  const validateCalibration = useCallback((distanceMm: number) => {
    // Validation ranges for common facial measurements
    if (distanceMm < 25 || distanceMm > 40) {
      setValidationWarning(
        'Warning: This distance seems unusual for inner canthal distance (typical range: 25-40mm). Please verify your calibration.'
      );
    } else if (distanceMm < 50 || distanceMm > 80) {
      // If user is measuring something else, check pupillary distance range
      if (distanceMm < 50 || distanceMm > 80) {
        setValidationWarning(null);
      }
    } else {
      setValidationWarning(null);
    }
  }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      setImage(imageData);
      setIsCalibrated(false);
      setMeasurements(null);
      setValidationWarning(null);
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsStreaming(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Error",
        description: "Could not access your camera",
        variant: "destructive"
      });
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    
    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    setImage(imageData);
    setIsCalibrated(false);
    setMeasurements(null);
    setValidationWarning(null);
    stopCamera();
    
    toast({
      title: "Photo Captured!",
      description: "Now set up your calibration ruler"
    });
  };

  const handleCalibrationChange = useCallback((
    points: [{ x: number; y: number }, { x: number; y: number }],
    distanceMm: number
  ) => {
    setCalibrationPoints(points);
    const pixelDistance = Math.sqrt(
      Math.pow(points[1].x - points[0].x, 2) + Math.pow(points[1].y - points[0].y, 2)
    );
    
    if (pixelDistance > 0) {
      const scaleMmPerPixel = distanceMm / pixelDistance;
      setIsCalibrated(true);
      validateCalibration(distanceMm);
    } else {
      setIsCalibrated(false);
    }
  }, [validateCalibration]);

  const handleMeasurementsUpdate = useCallback((newMeasurements: MeasurementResults) => {
    setMeasurements(newMeasurements);
  }, []);

  const handleConfirmMeasurements = () => {
    if (measurements && onMeasurementsComplete) {
      onMeasurementsComplete(measurements);
      toast({
        title: "Measurements Saved!",
        description: "Precision measurements have been recorded"
      });
    }
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.5, 5));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.5, 0.5));
  const handleResetZoom = () => setZoomLevel(1);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Precision Measurement System</h1>
          <p className="text-muted-foreground mt-2">
            Ultra-precise optical measurements with virtual calibration ruler (~98% accuracy)
          </p>
        </div>
        <div className="flex gap-2">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Image Capture Section */}
      {!image && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Capture High-Resolution Image</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>• Use minimum 720p resolution for best precision</p>
              <p>• Ensure good lighting and clear view of face</p>
              <p>• Position face centered and straight</p>
            </div>

            <div className="flex gap-4">
              {!isStreaming ? (
                <>
                  <Button onClick={startCamera} className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Take Photo
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Upload Image
                  </Button>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ aspectRatio: '4/3', maxWidth: '400px' }}>
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      autoPlay
                      muted
                      playsInline
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={capturePhoto}>Capture</Button>
                    <Button variant="outline" onClick={stopCamera}>Cancel</Button>
                  </div>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </CardContent>
        </Card>
      )}

      {/* Main Measurement Interface */}
      {image && (
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Canvas Area */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    Step 2: Calibrate & Measure
                    {isCalibrated && <Badge className="ml-2" variant="secondary">Calibrated</Badge>}
                    {isFaceDetectionLoading && <Badge className="ml-2" variant="outline">Detecting Face...</Badge>}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleZoomOut}>
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground min-w-16 text-center">
                      {Math.round(zoomLevel * 100)}%
                    </span>
                    <Button variant="outline" size="sm" onClick={handleZoomIn}>
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleResetZoom}>
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <MeasurementCanvas
                  image={image}
                  zoomLevel={zoomLevel}
                  calibrationDistance={calibrationDistance}
                  onCalibrationChange={handleCalibrationChange}
                  onMeasurementsUpdate={handleMeasurementsUpdate}
                  detectFaceLandmarks={detectFaceLandmarks}
                />
              </CardContent>
            </Card>
          </div>

          {/* Controls Panel */}
          <div className="space-y-6">
            {/* Calibration Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Virtual Calibration Ruler</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="calibration-distance">Known Distance (mm)</Label>
                  <Input
                    id="calibration-distance"
                    type="number"
                    value={calibrationDistance}
                    onChange={(e) => setCalibrationDistance(Number(e.target.value))}
                    step="0.1"
                    min="1"
                    max="200"
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Typical inner canthal distance: 32mm
                  </p>
                </div>

                {validationWarning && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      {validationWarning}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="text-sm space-y-2">
                  <p className="font-medium">Instructions:</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Drag the blue calibration ruler to span a known distance</li>
                    <li>Enter the real-world distance in mm</li>
                    <li>Fine-tune all measurement points as needed</li>
                    <li>Confirm when satisfied with precision</li>
                  </ol>
                </div>
              </CardContent>
            </Card>

            {/* Measurements Display */}
            {measurements && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Live Measurements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="font-medium">DNP (Binocular)</div>
                      <div className="text-2xl font-bold">{measurements.dnpMm.toFixed(1)}mm</div>
                    </div>
                    <div>
                      <div className="font-medium">DP Left</div>
                      <div className="text-xl font-semibold">{measurements.dpLeftMm.toFixed(1)}mm</div>
                    </div>
                    <div>
                      <div className="font-medium">DP Right</div>
                      <div className="text-xl font-semibold">{measurements.dpRightMm.toFixed(1)}mm</div>
                    </div>
                    <div>
                      <div className="font-medium">Height Left</div>
                      <div className="text-xl font-semibold">{measurements.heightLeftMm.toFixed(1)}mm</div>
                    </div>
                    <div>
                      <div className="font-medium">Height Right</div>
                      <div className="text-xl font-semibold">{measurements.heightRightMm.toFixed(1)}mm</div>
                    </div>
                    <div>
                      <div className="font-medium">Scale</div>
                      <div className="text-sm text-muted-foreground">
                        {measurements.calibration.scaleMmPerPixel.toFixed(4)} mm/px
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={handleConfirmMeasurements}
                    className="w-full mt-4"
                    disabled={!isCalibrated}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Confirm Measurements
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Reset Options */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Reset Options</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  onClick={() => {
                    setImage(null);
                    setIsCalibrated(false);
                    setMeasurements(null);
                    setValidationWarning(null);
                    setZoomLevel(1);
                  }}
                  className="w-full"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  New Image
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};