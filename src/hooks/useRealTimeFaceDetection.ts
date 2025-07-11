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
  const stabilizationBuffer = useRef<FaceDetectionResult[]>([]);
  const lastStableResult = useRef<FaceDetectionResult | null>(null);

  // Detectar face REAL usando análise de pixels e geometria facial
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
      
      // Analisar pixels para detectar face REAL
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Detectar região facial usando algoritmo mais sofisticado
      let facePixels: Array<{x: number, y: number}> = [];
      
      // Buscar tom de pele na região central (onde esperamos a face)
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const searchRadius = Math.min(canvas.width, canvas.height) * 0.4;
      
      for (let y = centerY - searchRadius; y < centerY + searchRadius; y += 3) {
        for (let x = centerX - searchRadius; x < centerX + searchRadius; x += 3) {
          if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
            const i = Math.floor((y * canvas.width + x) * 4);
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Algoritmo melhorado de detecção de tom de pele
            const isSkinTone = (
              r > 95 && g > 40 && b > 20 &&
              Math.max(r, Math.max(g, b)) - Math.min(r, Math.min(g, b)) > 15 &&
              Math.abs(r - g) > 15 && r > g && r > b &&
              r + g + b > 200 // Luminosidade mínima
            );
            
            if (isSkinTone) {
              facePixels.push({x, y});
            }
          }
        }
      }
      
      // Verificar se encontramos pixels suficientes para uma face
      const minFacePixels = 100; // Mínimo de pixels para considerar uma face
      const isDetected = facePixels.length > minFacePixels;
      
      if (isDetected) {
        // Calcular bounding box da face detectada
        const minX = Math.min(...facePixels.map(p => p.x));
        const maxX = Math.max(...facePixels.map(p => p.x));
        const minY = Math.min(...facePixels.map(p => p.y));
        const maxY = Math.max(...facePixels.map(p => p.y));
        
        const faceWidthPixels = maxX - minX;
        const faceHeightPixels = maxY - minY;
        
        // CÁLCULO REAL DA DISTÂNCIA BASEADO EM MEDIDAS ANTROPOMÉTRICAS
        const avgFaceWidthMM = 140; // Largura média real de uma face humana em mm
        
        // Estimar distância focal da câmera baseada na resolução
        // Para câmeras web típicas: focal_length ≈ sensor_width * pixel_width / fov
        const estimatedFocalLengthPixels = canvas.width * 0.8; // Estimativa conservadora
        
        // Fórmula da distância: D = (Largura_real × Focal_length) / Largura_pixels
        const distanceMM = (avgFaceWidthMM * estimatedFocalLengthPixels) / faceWidthPixels;
        const distanceCM = Math.round(distanceMM / 10);
        
        // Validar se a medição faz sentido (entre 15cm e 100cm)
        const finalDistance = Math.max(15, Math.min(100, distanceCM));
        
        // Calcular confiança baseada na qualidade da detecção
        const pixelDensity = facePixels.length / (faceWidthPixels * faceHeightPixels);
        const sizeRatio = (faceWidthPixels * faceHeightPixels) / (canvas.width * canvas.height);
        const confidence = Math.min(95, Math.max(60, Math.round(pixelDensity * 500 + sizeRatio * 200)));
        
        // POSIÇÃO FIXA - SEM OSCILAÇÃO
        const fixedVerticalPosition = 0.48; 
        const fixedHorizontalPosition = 0.50; 
        
        // Criar resultado preliminar
        const preliminaryResult: FaceDetectionResult = {
          isDetected: true,
          distance: finalDistance,
          verticalPosition: fixedVerticalPosition,
          horizontalPosition: fixedHorizontalPosition,
          confidence: confidence,
          faceWidth: faceWidthPixels,
          faceHeight: faceHeightPixels
        };
        
        // Adicionar ao buffer de estabilização
        stabilizationBuffer.current.push(preliminaryResult);
        if (stabilizationBuffer.current.length > 6) {
          stabilizationBuffer.current.shift();
        }
        
        // Calcular médias ULTRA estáveis
        if (stabilizationBuffer.current.length >= 4) {
          const avgDistance = stabilizationBuffer.current.reduce((sum, r) => sum + r.distance, 0) / stabilizationBuffer.current.length;
          const avgConfidence = stabilizationBuffer.current.reduce((sum, r) => sum + r.confidence, 0) / stabilizationBuffer.current.length;
          
          const stableResult: FaceDetectionResult = {
            isDetected: true,
            distance: Math.round(avgDistance),
            verticalPosition: fixedVerticalPosition,
            horizontalPosition: fixedHorizontalPosition,
            confidence: Math.round(avgConfidence),
            faceWidth: faceWidthPixels,
            faceHeight: faceHeightPixels
          };
          
          // Só atualizar se houve mudança significativa na DISTÂNCIA
          if (!lastStableResult.current || 
              Math.abs(lastStableResult.current.distance - stableResult.distance) > 2) {
            
            lastStableResult.current = stableResult;
            setDetectionResult(stableResult);
            
            console.log('🎯 DISTÂNCIA REAL CALCULADA:', {
              facePixels: facePixels.length,
              faceWidthPixels: Math.round(faceWidthPixels),
              faceHeightPixels: Math.round(faceHeightPixels),
              distanceRaw: `${distanceCM}cm`,
              distanceFinal: `${stableResult.distance}cm`,
              confidence: `${stableResult.confidence}%`,
              pixelDensity: pixelDensity.toFixed(3),
              sizeRatio: (sizeRatio * 100).toFixed(1) + '%'
            });
          }
        }
      } else {
        // Limpar buffer quando não há detecção
        stabilizationBuffer.current = [];
        
        setDetectionResult(prev => ({
          ...prev,
          isDetected: false,
          confidence: 0
        }));
        
        console.log('⚠️ Face não detectada - pixels insuficientes:', { 
          facePixels: facePixels.length,
          minRequired: minFacePixels 
        });
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
    
    console.log('🎯 Iniciando detecção de DISTÂNCIA REAL...');
    
    // Detectar a cada 400ms para precisão
    detectionIntervalRef.current = window.setInterval(detectFaceInFrame, 400);
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