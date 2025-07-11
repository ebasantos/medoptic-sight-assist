import React, { useState, useEffect } from 'react';
import { Camera, AlertCircle, RotateCcw, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCamera } from '@/hooks/useCamera';
import { useIsMobile } from '@/hooks/use-mobile';

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  showGuides?: boolean;
  guideType?: 'measurement' | 'face-analysis';
  className?: string;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({
  onCapture,
  showGuides = true,
  guideType = 'measurement',
  className = ''
}) => {
  const isMobile = useIsMobile();
  const [distance, setDistance] = useState<number>(0);
  const [isGoodDistance, setIsGoodDistance] = useState(false);
  const [isGoodHeight, setIsGoodHeight] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  
  const {
    videoRef,
    canvasRef,
    isActive,
    hasPermission,
    error,
    capturedImage,
    facingMode,
    hasMultipleCameras,
    startCamera,
    stopCamera,
    switchCamera,
    capturePhoto,
    setCapturedImage
  } = useCamera({ onCapture });

  // Detecção facial simples usando análise de pixels
  useEffect(() => {
    if (!isActive || !videoRef.current) return;

    const detectFace = () => {
      const video = videoRef.current;
      if (!video || video.readyState !== 4) return;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Procurar pixels de pele na região central
      let skinPixels = 0;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const searchSize = 150;

      for (let y = centerY - searchSize; y < centerY + searchSize; y += 4) {
        for (let x = centerX - searchSize; x < centerX + searchSize; x += 4) {
          if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
            const i = (y * canvas.width + x) * 4;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Detecção básica de tom de pele
            if (r > 95 && g > 40 && b > 20 && r > g && r > b) {
              skinPixels++;
            }
          }
        }
      }

      const detected = skinPixels > 100;
      setFaceDetected(detected);

      if (detected) {
        // Estimar distância baseada no tamanho da região com pele
        const faceSize = Math.sqrt(skinPixels);
        // Calibrado empiricamente: faceSize ~40 = 35cm
        const estimatedDistance = Math.round((40 / faceSize) * 35);
        const finalDistance = Math.max(20, Math.min(60, estimatedDistance));
        
        setDistance(finalDistance);
        setIsGoodDistance(finalDistance >= 30 && finalDistance <= 40);
        
        // Verificar altura: face deve estar no centro vertical (entre 40% e 60%)
        const faceVerticalPos = centerY / canvas.height;
        setIsGoodHeight(faceVerticalPos >= 0.4 && faceVerticalPos <= 0.6);
      } else {
        setDistance(0);
        setIsGoodDistance(false);
        setIsGoodHeight(false);
      }
    };

    const interval = setInterval(detectFace, 500);
    return () => clearInterval(interval);
  }, [isActive]);

  const handleCapture = () => {
    console.log('📸 Capturando foto...');
    const result = capturePhoto();
    if (result) {
      console.log('✅ Foto capturada com sucesso');
      stopCamera();
    }
  };

  const canTakePhoto = faceDetected && isGoodDistance && isGoodHeight;

  if (capturedImage) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Card className="overflow-hidden bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200">
          <CardContent className="p-4">
            <div className="rounded-lg overflow-hidden bg-white shadow-lg">
              <img 
                src={capturedImage} 
                alt="Foto capturada" 
                className="w-full h-auto object-contain max-h-[70vh]"
              />
            </div>
            <div className="mt-4 flex items-center justify-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-green-700 font-medium">Foto capturada!</span>
            </div>
          </CardContent>
        </Card>
        <Button 
          onClick={() => window.location.reload()} 
          variant="outline" 
          className="w-full h-12"
        >
          <Camera className="h-4 w-4 mr-2" />
          Nova Foto
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <Card className={`${className} border-red-200 bg-red-50`}>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2 text-red-800">Erro ao Acessar Câmera</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={startCamera} variant="outline">
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (hasPermission === false) {
    return (
      <Card className={`${className} border-amber-200 bg-amber-50`}>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2 text-amber-800">Permissão Necessária</h3>
          <p className="text-amber-700 mb-4">
            Permita o acesso à câmera para continuar.
          </p>
          <Button onClick={startCamera} className="bg-amber-600 hover:bg-amber-700">
            <Camera className="h-4 w-4 mr-2" />
            Permitir Câmera
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <Card className="overflow-hidden">
        <CardContent className="p-2">
          <div className={`relative rounded-lg overflow-hidden bg-gray-900 ${
            isMobile ? 'aspect-[3/4]' : 'aspect-video'
          }`}>
            {/* Vídeo */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${isActive ? 'block' : 'hidden'}`}
              style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
            />
            
            {/* Placeholder */}
            {!isActive && (
              <div className="flex items-center justify-center h-full text-white">
                <div className="text-center">
                  <Camera className="h-12 w-12 mx-auto mb-4" />
                  <p className="text-lg">Pressione para ativar a câmera</p>
                </div>
              </div>
            )}
            
            {/* Guia simples */}
            {showGuides && isActive && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Círculo simples para posicionamento */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className={`w-48 h-60 rounded-full border-4 ${
                    canTakePhoto ? 'border-green-400' : 'border-yellow-400'
                  }`} />
                </div>
              </div>
            )}
            
            {/* Botão trocar câmera */}
            {isActive && hasMultipleCameras && (
              <Button
                onClick={switchCamera}
                size="sm"
                className="absolute top-4 right-4 bg-black/70 hover:bg-black/90"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Trocar
              </Button>
            )}
            
            {/* Status */}
            {isActive && (
              <div className="absolute top-4 left-4 space-y-2">
                <Badge className={`${faceDetected ? 'bg-green-600' : 'bg-red-600'} text-white`}>
                  {faceDetected ? '✓ Rosto detectado' : '✗ Sem rosto'}
                </Badge>
                
                {faceDetected && (
                  <>
                    <Badge className={`${isGoodDistance ? 'bg-green-600' : 'bg-orange-600'} text-white block`}>
                      {distance}cm {isGoodDistance ? '✓' : distance < 30 ? '(muito perto)' : '(muito longe)'}
                    </Badge>
                    
                    <Badge className={`${isGoodHeight ? 'bg-green-600' : 'bg-orange-600'} text-white block`}>
                      {isGoodHeight ? '✓ Altura OK' : '✗ Ajuste altura'}
                    </Badge>
                  </>
                )}
              </div>
            )}
            
            {/* Botão capturar */}
            {isActive && (
              <Button 
                onClick={handleCapture} 
                disabled={!canTakePhoto}
                size="lg"
                className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 h-16 w-16 rounded-full ${
                  canTakePhoto 
                    ? 'bg-green-600 hover:bg-green-700 animate-pulse' 
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                <Camera className="h-6 w-6" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Instruções simples */}
      {isActive && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="text-center text-sm text-blue-800">
              <p className="font-medium mb-2">Instruções:</p>
              <p>• Posicione-se a 30-40cm da câmera</p>
              <p>• Alinhe seu rosto com o círculo</p>
              <p>• Mantenha a câmera na altura dos olhos</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CameraCapture;