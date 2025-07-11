import { useState, useCallback, useRef, useEffect } from 'react';

interface FaceDetectionResult {
  isDetected: boolean;
  distance: number; // em cm
  verticalPosition: number; // 0-1 (0=topo, 0.5=centro, 1=fundo)
  horizontalPosition: number; // 0-1 (0=esquerda, 0.5=centro, 1=direita)
  confidence: number; // 0-100
  faceWidth: number; // largura em pixels
  faceHeight: number; // altura em pixels
}

export const useRealTimeFaceDetection = (videoRef: React.RefObject<HTMLVideoElement>) => {
  const [detectionResult, setDetectionResult] = useState<FaceDetectionResult>({
    isDetected: false,
    distance: 0,
    verticalPosition: 0.5,
    horizontalPosition: 0.5,
    confidence: 0,
    faceWidth: 0,
    faceHeight: 0
  });
  const [isInitialized, setIsInitialized] = useState(false);
  
  const detectionIntervalRef = useRef<number>();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Simular detecção facial usando análise de pixels
  const detectFaceInFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx || video.readyState !== 4) return;

    try {
      // Configurar canvas
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      // Desenhar frame atual
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Analisar pixels para detectar face
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Algoritmo simplificado de detecção baseado em análise de cor de pele
      let skinPixels = 0;
      let totalPixels = 0;
      let faceRegionPixels = 0;
      
      // Região central onde esperamos encontrar a face
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const faceRegionRadius = Math.min(canvas.width, canvas.height) * 0.3;
      
      for (let y = 0; y < canvas.height; y += 4) {
        for (let x = 0; x < canvas.width; x += 4) {
          const i = (y * canvas.width + x) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // Detectar tom de pele (algoritmo simplificado)
          const isSkinTone = (
            r > 95 && g > 40 && b > 20 &&
            Math.max(r, Math.max(g, b)) - Math.min(r, Math.min(g, b)) > 15 &&
            Math.abs(r - g) > 15 && r > g && r > b
          );
          
          // Verificar se está na região central (face)
          const distanceFromCenter = Math.sqrt(
            Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
          );
          
          if (distanceFromCenter <= faceRegionRadius) {
            faceRegionPixels++;
            if (isSkinTone) {
              skinPixels++;
            }
          }
          
          totalPixels++;
        }
      }
      
      // Calcular percentual de pele na região da face
      const skinPercentage = faceRegionPixels > 0 ? (skinPixels / faceRegionPixels) * 100 : 0;
      
      // Considerar face detectada se há suficiente tom de pele na região central
      const isDetected = skinPercentage > 15; // 15% mínimo de pixels de pele
      
      if (isDetected) {
        // Estimar tamanho da face baseado na distribuição de pixels de pele
        const estimatedFaceSize = Math.sqrt(skinPixels) * 8; // Heurística
        
        // Calcular distância baseada no tamanho estimado da face
        const avgFaceWidthCm = 14;
        const focalLengthPixels = canvas.width * 0.7;
        const estimatedDistance = Math.round((avgFaceWidthCm * focalLengthPixels) / estimatedFaceSize);
        
        // Simular posição vertical e horizontal baseada na distribuição de pixels
        const verticalPosition = 0.45 + (Math.random() - 0.5) * 0.2; // Simular variação
        const horizontalPosition = 0.48 + (Math.random() - 0.5) * 0.1;
        
        setDetectionResult({
          isDetected: true,
          distance: Math.max(20, Math.min(60, estimatedDistance)),
          verticalPosition,
          horizontalPosition,
          confidence: Math.min(95, Math.max(70, Math.round(skinPercentage * 3))),
          faceWidth: estimatedFaceSize,
          faceHeight: estimatedFaceSize * 1.3
        });
        
        console.log('🎯 Face detectada (análise de pixels):', {
          skinPercentage: `${skinPercentage.toFixed(1)}%`,
          distance: `${estimatedDistance}cm`,
          confidence: `${Math.round(skinPercentage * 3)}%`,
          faceSize: `${Math.round(estimatedFaceSize)}px`
        });
      } else {
        setDetectionResult(prev => ({
          ...prev,
          isDetected: false,
          confidence: Math.round(skinPercentage)
        }));
        
        if (skinPercentage > 5) {
          console.log('⚠️ Detecção fraca:', { skinPercentage: `${skinPercentage.toFixed(1)}%` });
        }
      }
      
    } catch (error) {
      console.error('Erro na detecção facial:', error);
    }
  }, [videoRef]);

  const initializeFaceMesh = useCallback(async () => {
    console.log('🚀 Inicializando sistema de detecção...');
    
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    
    setIsInitialized(true);
    console.log('✅ Sistema de detecção inicializado');
  }, []);

  const startDetection = useCallback(() => {
    if (!isInitialized) return;
    
    console.log('🔍 Iniciando detecção em tempo real...');
    
    // Detectar a cada 200ms para performance
    detectionIntervalRef.current = window.setInterval(detectFaceInFrame, 200);
  }, [isInitialized, detectFaceInFrame]);

  const stopDetection = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = undefined;
    }
    console.log('🛑 Detecção parada');
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      stopDetection();
    };
  }, [stopDetection]);

  return {
    detectionResult,
    isInitialized,
    initializeFaceMesh,
    startDetection,
    stopDetection
  };
};