
import React, { useState, useEffect } from 'react';
import { Camera, AlertCircle, RotateCcw, CheckCircle, Eye, Zap } from 'lucide-react';
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
  const [faceDetectionScore, setFaceDetectionScore] = useState(0);
  const [positionFeedback, setPositionFeedback] = useState<string>('');
  const [distanceFeedback, setDistanceFeedback] = useState<string>('');
  const [estimatedDistance, setEstimatedDistance] = useState<number>(0);
  const [isOptimalPosition, setIsOptimalPosition] = useState(false);
  
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

  // Função para calcular distância estimada baseada no tamanho do rosto
  const calculateEstimatedDistance = (faceScore: number) => {
    // Simular tamanho do rosto detectado (baseado no score)
    const faceWidthInPixels = 100 + (faceScore * 2); // Simula largura facial em pixels
    const averageFaceWidthMM = 140; // Largura média facial real em mm
    const focalLengthPixels = 500; // Distância focal simulada da câmera
    
    // Fórmula: distância = (largura_real × distância_focal) / largura_em_pixels
    const estimatedDistanceMM = (averageFaceWidthMM * focalLengthPixels) / faceWidthInPixels;
    const estimatedDistanceCM = Math.round(estimatedDistanceMM / 10);
    
    return estimatedDistanceCM;
  };

  // Simular detecção de posição em tempo real
  useEffect(() => {
    if (!isActive || !videoRef.current) return;

    const interval = setInterval(() => {
      // Simular análise de posição facial
      const mockScore = Math.random() * 100;
      setFaceDetectionScore(mockScore);
      
      // Calcular distância estimada
      const distance = calculateEstimatedDistance(mockScore);
      setEstimatedDistance(distance);
      
      // Verificar se está na distância ideal (45-55cm) E com boa detecção facial
      const isIdealDistance = distance >= 45 && distance <= 55;
      const hasGoodDetection = mockScore > 85;
      
      if (hasGoodDetection && isIdealDistance) {
        setPositionFeedback('Posição perfeita! ✓');
        setDistanceFeedback(`${distance}cm - Distância ideal ✓`);
        setIsOptimalPosition(true);
      } else if (hasGoodDetection && !isIdealDistance) {
        setPositionFeedback('Rosto bem posicionado');
        if (distance > 55) {
          setDistanceFeedback(`${distance}cm - Aproxime-se mais (ideal: 45-55cm)`);
        } else if (distance < 45) {
          setDistanceFeedback(`${distance}cm - Afaste-se um pouco (ideal: 45-55cm)`);
        }
        setIsOptimalPosition(false);
      } else if (isIdealDistance && !hasGoodDetection) {
        setPositionFeedback('Centralize melhor seu rosto');
        setDistanceFeedback(`${distance}cm - Distância boa, ajuste posição`);
        setIsOptimalPosition(false);
      } else {
        setPositionFeedback('Ajuste posição e distância');
        if (distance > 55) {
          setDistanceFeedback(`${distance}cm - Aproxime-se (ideal: 45-55cm)`);
        } else if (distance < 45) {
          setDistanceFeedback(`${distance}cm - Afaste-se (ideal: 45-55cm)`);
        } else {
          setDistanceFeedback(`${distance}cm - Centralize o rosto`);
        }
        setIsOptimalPosition(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive]);

  // Removido - agora usamos apenas o sistema interativo

  const handleCapture = () => {
    console.log('📸 Iniciando captura...');
    const result = capturePhoto();
    if (result) {
      console.log('✅ Foto capturada - usando sistema interativo');
      // Não desenhar linha aqui - será feito no componente interativo
      stopCamera();
    } else {
      console.error('❌ Falha na captura da foto');
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
                alt="Foto capturada com linha de medição" 
                className="w-full h-auto object-contain max-h-[70vh]"
                style={{ display: 'block' }}
              />
            </div>
            <div className="mt-4 flex items-center justify-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-green-700 font-medium">Foto capturada!</span>
            </div>
          </CardContent>
        </Card>
        <div className="flex gap-2">
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline" 
            className="flex-1 h-12"
          >
            <Camera className="h-4 w-4 mr-2" />
            Nova Foto
          </Button>
        </div>
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
          <Button onClick={startCamera} variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
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
            Para usar esta funcionalidade, é necessário permitir o acesso à câmera do seu dispositivo.
          </p>
          <Button onClick={startCamera} className="bg-amber-600 hover:bg-amber-700">
            <Camera className="h-4 w-4 mr-2" />
            Permitir Acesso à Câmera
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Área principal da câmera com design inovador */}
      <Card className="overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 border-2 border-blue-200">
        <CardContent className="p-2">
          <div 
            className={`relative rounded-xl overflow-hidden bg-gray-900 ${
              isMobile ? 'aspect-[3/4]' : 'aspect-video'
            }`}
          >
            {/* Elemento de vídeo */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${isActive ? 'block' : 'hidden'}`}
              style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
            />
            
            {/* Placeholder quando câmera não está ativa */}
            {!isActive && (
              <div className="flex items-center justify-center h-full text-white">
                <div className="text-center">
                  <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Camera className="h-10 w-10" />
                  </div>
                  <p className="text-lg font-medium">Pressione para ativar a câmera</p>
                  <p className="text-sm text-gray-300 mt-2">Para uma medição precisa</p>
                </div>
              </div>
            )}
            
            {/* Guias visuais avançados */}
            {showGuides && isActive && (
              <>
                {/* Moldura principal de posicionamento */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Oval de posicionamento facial */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div 
                      className={`relative ${
                        isMobile ? 'w-52 h-64' : 'w-64 h-80'
                      } rounded-full border-4 transition-colors duration-300 ${
                        isOptimalPosition 
                          ? 'border-green-400 shadow-lg shadow-green-400/50' 
                          : 'border-yellow-400 shadow-lg shadow-yellow-400/30'
                      }`}
                      style={{
                        background: isOptimalPosition 
                          ? 'radial-gradient(ellipse, rgba(34, 197, 94, 0.1) 0%, transparent 70%)'
                          : 'radial-gradient(ellipse, rgba(234, 179, 8, 0.1) 0%, transparent 70%)'
                      }}
                    >
                      {/* Linha horizontal para alinhamento dos olhos */}
                      <div 
                        className={`absolute left-1/4 right-1/4 h-0.5 transition-colors duration-300 ${
                          isOptimalPosition ? 'bg-green-400' : 'bg-yellow-400'
                        }`}
                        style={{ top: '30%' }}
                      />
                      
                      {/* Marcadores de posição dos olhos */}
                      <div className="absolute left-1/4 top-[30%] transform -translate-x-1/2 -translate-y-1/2">
                        <div className={`w-3 h-3 rounded-full ${isOptimalPosition ? 'bg-green-400' : 'bg-yellow-400'}`} />
                      </div>
                      <div className="absolute right-1/4 top-[30%] transform translate-x-1/2 -translate-y-1/2">
                        <div className={`w-3 h-3 rounded-full ${isOptimalPosition ? 'bg-green-400' : 'bg-yellow-400'}`} />
                      </div>
                      
                      {/* Linha para boca/nariz */}
                      <div 
                        className={`absolute left-1/3 right-1/3 h-0.5 transition-colors duration-300 ${
                          isOptimalPosition ? 'bg-green-400' : 'bg-yellow-400'
                        }`}
                        style={{ top: '65%' }}
                      />
                    </div>
                  </div>
                  
                  {/* Cantos de enquadramento */}
                  <div className="absolute top-4 left-4">
                    <div className={`w-8 h-8 border-l-4 border-t-4 ${isOptimalPosition ? 'border-green-400' : 'border-yellow-400'}`} />
                  </div>
                  <div className="absolute top-4 right-4">
                    <div className={`w-8 h-8 border-r-4 border-t-4 ${isOptimalPosition ? 'border-green-400' : 'border-yellow-400'}`} />
                  </div>
                  <div className="absolute bottom-4 left-4">
                    <div className={`w-8 h-8 border-l-4 border-b-4 ${isOptimalPosition ? 'border-green-400' : 'border-yellow-400'}`} />
                  </div>
                  <div className="absolute bottom-4 right-4">
                    <div className={`w-8 h-8 border-r-4 border-b-4 ${isOptimalPosition ? 'border-green-400' : 'border-yellow-400'}`} />
                  </div>
                </div>
              </>
            )}
            
            {/* Botão para trocar câmera */}
            {isActive && hasMultipleCameras && (
              <div className="absolute top-4 right-4">
                <Button
                  onClick={switchCamera}
                  size="sm"
                  className="bg-black/70 hover:bg-black/90 text-white border-0 backdrop-blur-sm"
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  {facingMode === 'user' ? 'Traseira' : 'Frontal'}
                </Button>
              </div>
            )}
            
            {/* Indicador de status com design moderno */}
            {isActive && (
              <div className="absolute top-4 left-4">
                <Badge className="bg-black/70 text-white border-0 backdrop-blur-sm">
                  <div className={`w-2 h-2 rounded-full mr-2 ${isOptimalPosition ? 'bg-green-400 animate-pulse' : 'bg-yellow-400 animate-pulse'}`} />
                  Câmera {facingMode === 'user' ? 'Frontal' : 'Traseira'}
                </Badge>
              </div>
            )}
            
            {/* Botão de captura sobreposto ao vídeo */}
            {isActive && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <Button 
                  onClick={handleCapture} 
                  disabled={!isOptimalPosition}
                  size="lg"
                  className={`h-16 w-16 rounded-full shadow-2xl transition-all duration-300 ${
                    isOptimalPosition 
                      ? 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 scale-100' 
                      : 'bg-gray-400 cursor-not-allowed scale-90'
                  }`}
                >
                  <Camera className="h-6 w-6" />
                </Button>
              </div>
            )}
          </div>
          
          {/* Feedback em tempo real */}
          {isActive && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Score de detecção */}
              <div className="flex items-center gap-2 p-3 bg-white rounded-lg border">
                <Zap className={`h-4 w-4 ${faceDetectionScore > 60 ? 'text-green-600' : 'text-yellow-600'}`} />
                <div className="flex-1">
                  <div className="text-xs font-medium text-gray-600">Detecção Facial</div>
                  <div className={`text-sm font-bold ${faceDetectionScore > 60 ? 'text-green-700' : 'text-yellow-700'}`}>
                    {Math.round(faceDetectionScore)}%
                  </div>
                </div>
              </div>
              
              {/* Feedback de posição */}
              <div className="flex items-center gap-2 p-3 bg-white rounded-lg border">
                <Eye className={`h-4 w-4 ${isOptimalPosition ? 'text-green-600' : 'text-yellow-600'}`} />
                <div className="flex-1">
                  <div className="text-xs font-medium text-gray-600">Posição</div>
                  <div className={`text-xs font-medium ${isOptimalPosition ? 'text-green-700' : 'text-yellow-700'}`}>
                    {positionFeedback}
                  </div>
                </div>
              </div>
              
              {/* Feedback de distância */}
              <div className="flex items-center gap-2 p-3 bg-white rounded-lg border">
                <Camera className={`h-4 w-4 ${isOptimalPosition ? 'text-green-600' : 'text-yellow-600'}`} />
                <div className="flex-1">
                  <div className="text-xs font-medium text-gray-600">Distância</div>
                  <div className={`text-xs font-medium ${isOptimalPosition ? 'text-green-700' : 'text-yellow-700'}`}>
                    {distanceFeedback}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Canvas oculto para captura */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Controles com design moderno */}
      <div className="flex gap-3">
        {!isActive ? (
          <Button 
            onClick={startCamera} 
            className="flex-1 h-14 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
          >
            <Camera className="h-5 w-5 mr-2" />
            Ativar Câmera
          </Button>
        ) : (
          <>
            <Button 
              onClick={stopCamera} 
              variant="outline" 
              className="h-14 px-6 border-2"
            >
              Parar
            </Button>
            {hasMultipleCameras && (
              <Button 
                onClick={switchCamera} 
                variant="outline" 
                className="h-14 px-6 border-2"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Trocar
              </Button>
            )}
            <Button 
              onClick={handleCapture} 
              disabled={!isOptimalPosition}
              className={`flex-1 h-14 text-lg shadow-lg transition-all duration-300 ${
                isOptimalPosition 
                  ? 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700' 
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              <Camera className="h-5 w-5 mr-2" />
              {isOptimalPosition ? 'Capturar Foto' : 'Posicione-se Corretamente'}
            </Button>
          </>
        )}
      </div>
      
      {/* Dicas de posicionamento */}
      {isActive && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Dicas para uma foto perfeita
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Posicione seu rosto dentro do oval amarelo/verde</li>
              <li>• Alinhe seus olhos com a linha horizontal</li>
              <li>• Mantenha uma distância de aproximadamente 60cm da tela</li>
              <li>• Aguarde o indicador ficar verde antes de capturar</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CameraCapture;
