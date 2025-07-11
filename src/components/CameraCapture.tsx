import React from 'react';
import { Camera, AlertCircle, RotateCcw, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
  className = ''
}) => {
  const isMobile = useIsMobile();
  
  const {
    videoRef,
    isActive,
    hasPermission,
    error,
    capturedImage,
    facingMode,
    hasMultipleCameras,
    startCamera,
    stopCamera,
    switchCamera,
    capturePhoto
  } = useCamera({ onCapture });

  const handleCapture = () => {
    console.log('📸 Capturando foto...');
    const result = capturePhoto();
    if (result) {
      console.log('✅ Foto capturada com sucesso');
      stopCamera();
    }
  };

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
            
            {/* Botão Iniciar Câmera */}
            {!isActive && (
              <div className="flex items-center justify-center h-full text-white">
                <Button 
                  onClick={startCamera}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Camera className="h-6 w-6 mr-2" />
                  Ativar Câmera
                </Button>
              </div>
            )}
            
            {/* Guia simples - apenas um círculo */}
            {showGuides && isActive && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-48 h-60 rounded-full border-4 border-white opacity-50" />
                </div>
                <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg text-sm">
                  Posicione o rosto no círculo
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
            
            {/* Botão capturar - SEMPRE disponível quando câmera ativa */}
            {isActive && (
              <Button 
                onClick={handleCapture} 
                size="lg"
                className="absolute bottom-4 left-1/2 transform -translate-x-1/2 h-16 w-16 rounded-full bg-green-600 hover:bg-green-700"
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
              <p>• Posicione-se a aproximadamente 35cm da câmera</p>
              <p>• Alinhe seu rosto com o círculo branco</p>
              <p>• Clique no botão verde para capturar</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CameraCapture;