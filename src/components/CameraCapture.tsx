
import React from 'react';
import { Camera, AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCamera } from '@/hooks/useCamera';

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
    capturePhoto
  } = useCamera({ onCapture });

  const handleCapture = () => {
    const result = capturePhoto();
    if (result) {
      stopCamera();
    }
  };

  if (capturedImage) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Card>
          <CardContent className="p-4">
            <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
              <img 
                src={capturedImage} 
                alt="Foto capturada" 
                className="w-full h-full object-cover"
              />
            </div>
          </CardContent>
        </Card>
        <div className="flex gap-2">
          <Button onClick={() => window.location.reload()} variant="outline" className="flex-1">
            Capturar Novamente
          </Button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Erro ao Acessar Câmera</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={startCamera} variant="outline">
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (hasPermission === false) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Permissão Necessária</h3>
          <p className="text-gray-600 mb-4">
            Para usar esta funcionalidade, é necessário permitir o acesso à câmera do seu dispositivo.
          </p>
          <Button onClick={startCamera}>
            Permitir Acesso à Câmera
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardContent className="p-4">
          <div className="aspect-video rounded-lg overflow-hidden bg-gray-900 relative">
            {/* Elemento de vídeo sempre presente */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${isActive ? 'block' : 'hidden'}`}
              style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
              onLoadedMetadata={() => console.log('Video onLoadedMetadata - componente')}
              onCanPlay={() => console.log('Video onCanPlay - componente')}
              onPlay={() => console.log('Video onPlay - componente')}
              onError={(e) => console.error('Video onError - componente:', e)}
            />
            
            {/* Placeholder quando câmera não está ativa */}
            {!isActive && (
              <div className="flex items-center justify-center h-full text-white">
                <div className="text-center">
                  <Camera className="h-16 w-16 mx-auto mb-4" />
                  <p className="text-lg">Pressione o botão para ativar a câmera</p>
                </div>
              </div>
            )}
            
            {/* Botão para trocar câmera */}
            {isActive && hasMultipleCameras && (
              <div className="absolute top-4 right-4">
                <Button
                  onClick={switchCamera}
                  size="sm"
                  variant="secondary"
                  className="bg-black/50 hover:bg-black/70 text-white border-0"
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  {facingMode === 'user' ? 'Traseira' : 'Frontal'}
                </Button>
              </div>
            )}
            
            {/* Guias visuais */}
            {showGuides && isActive && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Linhas centrais */}
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/30 transform -translate-x-1/2"></div>
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/30 transform -translate-y-1/2"></div>
                
                {guideType === 'measurement' && (
                  <>
                    {/* Linhas para alinhamento dos olhos */}
                    <div className="absolute top-1/3 left-1/4 right-1/4 h-0.5 bg-yellow-400/60"></div>
                    <div className="absolute top-2/3 left-1/4 right-1/4 h-0.5 bg-yellow-400/60"></div>
                  </>
                )}
                
                {guideType === 'face-analysis' && (
                  <>
                    {/* Oval para posicionamento do rosto */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                                    w-40 h-52 border-2 border-yellow-400/60 rounded-full"></div>
                  </>
                )}
              </div>
            )}
            
            {/* Indicador de status */}
            {isActive && (
              <div className="absolute top-4 left-4">
                <div className="flex items-center gap-2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Câmera {facingMode === 'user' ? 'Frontal' : 'Traseira'}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Canvas oculto para captura */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Controles */}
      <div className="flex gap-2">
        {!isActive ? (
          <Button onClick={startCamera} className="flex-1 h-14 text-lg">
            <Camera className="h-5 w-5 mr-2" />
            Ativar Câmera
          </Button>
        ) : (
          <>
            <Button onClick={stopCamera} variant="outline" className="h-14">
              Parar
            </Button>
            {hasMultipleCameras && (
              <Button onClick={switchCamera} variant="outline" className="h-14">
                <RotateCcw className="h-4 w-4 mr-2" />
                Trocar
              </Button>
            )}
            <Button onClick={handleCapture} className="flex-1 h-14 text-lg">
              <Camera className="h-5 w-5 mr-2" />
              Capturar Foto
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default CameraCapture;
