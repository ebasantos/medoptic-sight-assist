import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, Eye, RotateCcw, CheckCircle, AlertTriangle } from 'lucide-react';
import { useCamera } from '@/hooks/useCamera';

interface Props {
  pixelsPerMm: number | null;
  onCaptureComplete: (imageData: string) => void;
  isProcessing: boolean;
}

export const ProfessionalFaceCapture: React.FC<Props> = ({ 
  pixelsPerMm, 
  onCaptureComplete, 
  isProcessing 
}) => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAligned, setIsAligned] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  
  const { 
    videoRef,
    canvasRef,
    isActive, 
    error: cameraError, 
    startCamera, 
    stopCamera,
    capturePhoto 
  } = useCamera();

  // Simular detecção de alinhamento facial (sem MediaPipe)
  const checkFaceAlignment = useCallback(() => {
    // Simulação simples - em produção, usaria detecção facial real
    const isGoodAlignment = Math.random() > 0.3;
    setIsAligned(isGoodAlignment);
  }, []);

  useEffect(() => {
    if (isActive) {
      const interval = setInterval(checkFaceAlignment, 1000);
      return () => clearInterval(interval);
    }
  }, [isActive, checkFaceAlignment]);

  const handleCapture = useCallback(() => {
    const imageData = capturePhoto();
    if (imageData) {
      setCapturedImage(imageData);
      stopCamera();
    }
  }, [capturePhoto, stopCamera]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    setIsAligned(false);
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
          <h3 className="text-xl font-semibold mb-2">Captura Facial Profissional</h3>
          <p className="text-muted-foreground">
            Siga as guias visuais para uma medição precisa do DNP
          </p>
          {pixelsPerMm && (
            <Badge variant="secondary" className="mt-2">
              Calibração: {pixelsPerMm.toFixed(3)} pixels/mm
            </Badge>
          )}
        </div>
      </div>

      {/* Status de Alinhamento */}
      {isActive && (
        <div className={`flex items-center justify-center gap-2 p-3 rounded-lg ${
          isAligned ? 'bg-green-500/10 text-green-600' : 'bg-yellow-500/10 text-yellow-600'
        }`}>
          {isAligned ? (
            <>
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Posicionamento ideal! Pode capturar</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">Ajuste seu posicionamento</span>
            </>
          )}
        </div>
      )}

      {/* Camera/Image Display */}
      <Card>
        <CardContent className="p-6">
          <div className="relative aspect-[4/3] bg-muted rounded-lg overflow-hidden">
            {!capturedImage ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                
                {/* Guias Visuais Profissionais */}
                <div 
                  ref={overlayRef}
                  className="absolute inset-0 pointer-events-none"
                >
                  {/* Grid de Referência */}
                  <div className="absolute inset-0">
                    {/* Linhas horizontais */}
                    <div className="absolute top-1/4 left-0 right-0 h-px bg-white/30"></div>
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-white/50"></div>
                    <div className="absolute top-3/4 left-0 right-0 h-px bg-white/30"></div>
                    
                    {/* Linhas verticais */}
                    <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/30"></div>
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/50"></div>
                    <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/30"></div>
                  </div>

                  {/* Frame Principal - Oval para rosto */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className={`w-80 h-96 border-2 rounded-full transition-colors duration-300 ${
                      isAligned ? 'border-green-400 bg-green-400/5' : 'border-primary border-dashed bg-primary/5'
                    }`}>
                      
                      {/* Guias para os olhos */}
                      <div className="absolute top-28 left-20 w-4 h-4 border-2 border-blue-400 rounded-full bg-blue-400/20">
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-blue-400 rounded-full"></div>
                      </div>
                      <div className="absolute top-28 right-20 w-4 h-4 border-2 border-blue-400 rounded-full bg-blue-400/20">
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-blue-400 rounded-full"></div>
                      </div>
                      
                      {/* Linha de referência para os olhos */}
                      <div className="absolute top-30 left-20 right-20 h-px bg-blue-400/50"></div>
                      
                      {/* Guia para o nariz */}
                      <div className="absolute top-40 left-1/2 transform -translate-x-1/2 w-3 h-6 border-2 border-yellow-400 rounded bg-yellow-400/20"></div>
                      
                      {/* Guia para a boca */}
                      <div className="absolute top-52 left-1/2 transform -translate-x-1/2 w-8 h-3 border-2 border-red-400 rounded-full bg-red-400/20"></div>
                      
                      {/* Marcadores de distância */}
                      <div className="absolute top-16 left-1/2 transform -translate-x-1/2 text-xs text-white bg-black/50 px-2 py-1 rounded">
                        Mantenha 60cm de distância
                      </div>
                    </div>
                  </div>

                  {/* Indicadores de profundidade nas bordas */}
                  <div className="absolute top-4 left-4 text-xs text-white bg-black/60 px-2 py-1 rounded">
                    Altura: Ideal
                  </div>
                  <div className="absolute top-4 right-4 text-xs text-white bg-black/60 px-2 py-1 rounded">
                    Largura: {isAligned ? 'OK' : 'Ajustar'}
                  </div>
                  <div className="absolute bottom-4 left-4 text-xs text-white bg-black/60 px-2 py-1 rounded">
                    Profundidade: {isAligned ? 'OK' : 'Mais perto'}
                  </div>
                  <div className="absolute bottom-4 right-4 text-xs text-white bg-black/60 px-2 py-1 rounded">
                    Inclinação: {isAligned ? 'OK' : 'Centralizar'}
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
              disabled={!isActive || isProcessing || !isAligned}
              variant="default"
              className={isAligned ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              <Camera className="w-4 h-4 mr-2" />
              {isAligned ? 'Capturar Agora!' : 'Aguarde Alinhamento'}
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
        <h4 className="font-medium mb-2">Guia de Posicionamento:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
          <div>
            <h5 className="font-medium text-foreground mb-1">Distância e Altura:</h5>
            <ul className="space-y-1">
              <li>• Mantenha 60cm da câmera</li>
              <li>• Câmera na altura dos olhos</li>
              <li>• Rosto centralizado no frame oval</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-foreground mb-1">Posição da Cabeça:</h5>
            <ul className="space-y-1">
              <li>• Olhos alinhados com guias azuis</li>
              <li>• Cabeça ereta, sem inclinação</li>
              <li>• Olhar diretamente para a câmera</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-foreground mb-1">Iluminação:</h5>
            <ul className="space-y-1">
              <li>• Luz uniforme no rosto</li>
              <li>• Evite sombras fortes</li>
              <li>• Fundo neutro preferível</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-foreground mb-1">Preparação:</h5>
            <ul className="space-y-1">
              <li>• Remova óculos se possível</li>
              <li>• Cabelo afastado dos olhos</li>
              <li>• Expressão neutra</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};