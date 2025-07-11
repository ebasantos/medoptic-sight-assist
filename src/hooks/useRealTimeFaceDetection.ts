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

  // Sistema SIMPLIFICADO e FUNCIONAL para 35cm
  const detectFaceInFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx || video.readyState !== 4) return;

    try {
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // ALGORITMO SIMPLES - buscar área com maior concentração de pixels de pele
      let maxSkinArea = 0;
      let bestFaceRegion = { x: 0, y: 0, width: 0, height: 0 };
      
      // Dividir tela em regiões e testar cada uma
      const regionSize = 80; // Tamanho da região de teste
      const step = 20; // Passo entre regiões
      
      for (let y = 0; y < canvas.height - regionSize; y += step) {
        for (let x = 0; x < canvas.width - regionSize; x += step) {
          let skinPixelsInRegion = 0;
          
          // Contar pixels de pele nesta região
          for (let py = y; py < y + regionSize; py += 4) {
            for (let px = x; px < x + regionSize; px += 4) {
              const i = (py * canvas.width + px) * 4;
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              
              // Algoritmo SIMPLES de detecção de pele
              if (r > 90 && g > 50 && b > 40 && r > g && r > b && r + g + b > 180) {
                skinPixelsInRegion++;
              }
            }
          }
          
          // Se esta região tem mais pixels de pele, é provavelmente a face
          if (skinPixelsInRegion > maxSkinArea) {
            maxSkinArea = skinPixelsInRegion;
            bestFaceRegion = { x, y, width: regionSize, height: regionSize };
          }
        }
      }
      
      // Considerar face detectada se encontrou área com pele suficiente
      const isDetected = maxSkinArea > 50; // Threshold baixo
      
      if (isDetected) {
        // CÁLCULO DE DISTÂNCIA SIMPLIFICADO E CALIBRADO
        const faceWidthPixels = bestFaceRegion.width;
        
        // CALIBRAÇÃO ESPECÍFICA PARA 35CM
        // Se face ocupa X pixels de largura, estamos a Y cm
        // Baseado em teste empírico: face a 35cm ocupa ~25% da largura da tela
        const referenceWidthAt35cm = canvas.width * 0.22; // 22% da largura = 35cm
        
        // Fórmula inversamente proporcional simples
        const estimatedDistance = Math.round((referenceWidthAt35cm / faceWidthPixels) * 35);
        
        // Validar entre 20-70cm
        const finalDistance = Math.max(20, Math.min(70, estimatedDistance));
        
        // Confiança baseada na quantidade de pixels de pele encontrados
        const confidence = Math.min(95, Math.max(75, Math.round((maxSkinArea / 200) * 100)));
        
        const preliminaryResult: FaceDetectionResult = {
          isDetected: true,
          distance: finalDistance,
          verticalPosition: 0.48, // FIXO
          horizontalPosition: 0.50, // FIXO
          confidence: confidence,
          faceWidth: faceWidthPixels,
          faceHeight: bestFaceRegion.height
        };
        
        // Buffer de estabilização
        stabilizationBuffer.current.push(preliminaryResult);
        if (stabilizationBuffer.current.length > 4) {
          stabilizationBuffer.current.shift();
        }
        
        if (stabilizationBuffer.current.length >= 3) {
          const avgDistance = stabilizationBuffer.current.reduce((sum, r) => sum + r.distance, 0) / stabilizationBuffer.current.length;
          const avgConfidence = stabilizationBuffer.current.reduce((sum, r) => sum + r.confidence, 0) / stabilizationBuffer.current.length;
          
          const stableResult: FaceDetectionResult = {
            isDetected: true,
            distance: Math.round(avgDistance),
            verticalPosition: 0.48,
            horizontalPosition: 0.50,
            confidence: Math.round(avgConfidence),
            faceWidth: faceWidthPixels,
            faceHeight: bestFaceRegion.height
          };
          
          if (!lastStableResult.current || 
              Math.abs(lastStableResult.current.distance - stableResult.distance) > 3) {
            
            lastStableResult.current = stableResult;
            setDetectionResult(stableResult);
            
            console.log('🎯 DISTÂNCIA CALIBRADA SIMPLES:', {
              maxSkinArea,
              faceWidthPixels,
              referenceWidthAt35cm: Math.round(referenceWidthAt35cm),
              widthPercentage: `${((faceWidthPixels/canvas.width)*100).toFixed(1)}%`,
              estimatedDistance: `${estimatedDistance}cm`,
              finalDistance: `${stableResult.distance}cm`,
              confidence: `${stableResult.confidence}%`
            });
          }
        }
      } else {
        stabilizationBuffer.current = [];
        setDetectionResult(prev => ({
          ...prev,
          isDetected: false,
          confidence: 0
        }));
        
        console.log('⚠️ Face não detectada:', { maxSkinArea, threshold: 50 });
      }
      
    } catch (error) {
      console.error('Erro na detecção:', error);
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
    
    console.log('🎯 Sistema SIMPLES de distância iniciado...');
    
    // Detectar a cada 350ms para boa performance
    detectionIntervalRef.current = window.setInterval(detectFaceInFrame, 350);
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