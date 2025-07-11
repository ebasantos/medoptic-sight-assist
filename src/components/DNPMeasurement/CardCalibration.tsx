import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, CreditCard, RotateCcw } from 'lucide-react';
import { useCamera } from '@/hooks/useCamera';

interface Props {
  onCalibrationComplete: (imageData: string) => void;
  isProcessing: boolean;
}

export const CardCalibration: React.FC<Props> = ({ onCalibrationComplete, isProcessing }) => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const { 
    isActive, 
    error: cameraError, 
    startCamera, 
    stopCamera 
  } = useCamera();

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(imageData);
    stopCamera();
  }, [stopCamera]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  const confirmCalibration = useCallback(() => {
    if (capturedImage) {
      onCalibrationComplete(capturedImage);
    }
  }, [capturedImage, onCalibrationComplete]);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <CreditCard className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">Calibração com Cartão de Referência</h3>
          <p className="text-muted-foreground">
            Posicione um cartão de crédito padrão (86×54 mm) na imagem para calibrar a escala de medição.
          </p>
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
                {/* Card Guide Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="border-2 border-primary border-dashed rounded-lg bg-primary/5 backdrop-blur-sm">
                    <div className="w-48 h-32 flex items-center justify-center text-primary">
                      <div className="text-center">
                        <CreditCard className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm font-medium">Posicione o cartão aqui</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <img
                src={capturedImage}
                alt="Cartão capturado"
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
              onClick={capturePhoto} 
              disabled={!isActive || isProcessing}
              variant="default"
            >
              Capturar Cartão
            </Button>
          </>
        ) : (
          <>
            <Button onClick={retakePhoto} variant="outline" disabled={isProcessing}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
            <Button 
              onClick={confirmCalibration} 
              disabled={isProcessing}
              className="bg-primary text-primary-foreground"
            >
              {isProcessing ? 'Processando...' : 'Confirmar Calibração'}
            </Button>
          </>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-medium mb-2">Dicas de Qualidade:</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Use um cartão de crédito ou débito padrão</li>
          <li>• Certifique-se de que o cartão está completamente visível</li>
          <li>• Mantenha o cartão paralelo à câmera</li>
          <li>• Evite sombras ou reflexos sobre o cartão</li>
          <li>• Use iluminação uniforme</li>
        </ul>
      </div>
    </div>
  );
};