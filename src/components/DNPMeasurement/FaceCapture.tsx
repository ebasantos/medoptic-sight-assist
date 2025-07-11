import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, Eye, RotateCcw, CheckCircle } from 'lucide-react';
import { useCamera } from '@/hooks/useCamera';

interface Props {
  pixelsPerMm: number | null;
  onCaptureComplete: (imageData: string) => void;
  isProcessing: boolean;
}

export const FaceCapture: React.FC<Props> = ({ pixelsPerMm, onCaptureComplete, isProcessing }) => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  const { 
    videoRef,
    canvasRef,
    isActive, 
    error: cameraError, 
    startCamera, 
    stopCamera,
    capturePhoto 
  } = useCamera();

  const handleCapture = useCallback(() => {
    const imageData = capturePhoto();
    if (imageData) {
      setCapturedImage(imageData);
      stopCamera();
    }
  }, [capturePhoto, stopCamera]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  const confirmCapture = useCallback(() => {
    if (capturedImage) {
      onCaptureComplete(capturedImage);
    }
  }, [capturedImage, onCaptureComplete]);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <Eye className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">Captura Facial para Medição DNP</h3>
          <p className="text-muted-foreground">
            Posicione seu rosto centralizado e olhe diretamente para a câmera.
          </p>
          {pixelsPerMm && (
            <Badge variant="secondary" className="mt-2">
              Calibração: {pixelsPerMm.toFixed(3)} pixels/mm
            </Badge>
          )}
        </div>
      </div>

      {/* Camera/Image Display */}
      <Card>
        <CardContent className="p-6">
          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
            {!capturedImage ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Face Guide Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    {/* Face outline */}
                    <div className="w-64 h-80 border-2 border-primary border-dashed rounded-full bg-primary/5 backdrop-blur-sm flex items-center justify-center">
                      <div className="text-center text-primary">
                        <Eye className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm font-medium">Centralize seu rosto</p>
                      </div>
                    </div>
                    {/* Eye guides */}
                    <div className="absolute top-24 left-16 w-3 h-3 border-2 border-primary rounded-full"></div>
                    <div className="absolute top-24 right-16 w-3 h-3 border-2 border-primary rounded-full"></div>
                    {/* Nose guide */}
                    <div className="absolute top-36 left-1/2 transform -translate-x-1/2 w-2 h-2 border-2 border-primary rounded-full"></div>
                  </div>
                </div>
              </>
            ) : (
              <img
                src={capturedImage}
                alt="Face capturada"
                className="w-full h-full object-cover"
              />
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
          </div>
          
          <canvas ref={canvasRef} className="hidden" />
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="flex gap-3 justify-center">
        {!capturedImage ? (
          <>
            <Button onClick={startCamera} disabled={isActive || isProcessing}>
              <Camera className="w-4 h-4 mr-2" />
              {isActive ? 'Câmera Ativa' : 'Iniciar Câmera'}
            </Button>
            <Button 
              onClick={handleCapture} 
              disabled={!isActive || isProcessing}
              variant="default"
            >
              <Camera className="w-4 h-4 mr-2" />
              Capturar Face
            </Button>
          </>
        ) : (
          <>
            <Button onClick={retakePhoto} variant="outline" disabled={isProcessing}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
            <Button 
              onClick={confirmCapture} 
              disabled={isProcessing}
              className="bg-primary text-primary-foreground"
            >
              {isProcessing ? (
                'Processando...'
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirmar e Medir
                </>
              )}
            </Button>
          </>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-medium mb-2">Instruções para Medição Precisa:</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Mantenha o rosto centralizado na câmera</li>
          <li>• Olhe diretamente para a câmera</li>
          <li>• Mantenha os olhos bem abertos</li>
          <li>• Evite inclinação da cabeça</li>
          <li>• Use iluminação uniforme</li>
          <li>• Remova óculos se possível para maior precisão</li>
        </ul>
      </div>
    </div>
  );
};