import { useState, useCallback, useRef, useEffect } from 'react';
import { FaceMesh } from '@mediapipe/face_mesh';

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
  
  const faceMeshRef = useRef<FaceMesh | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number>();
  const lastValidDetection = useRef<Date>();

  // Inicializar MediaPipe FaceMesh
  const initializeFaceMesh = useCallback(async () => {
    if (faceMeshRef.current) return;

    try {
      console.log('🚀 Inicializando MediaPipe FaceMesh...');
      
      const faceMesh = new FaceMesh({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        }
      });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5
      });

      // Canvas para processamento
      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas');
      }

      faceMesh.onResults((results) => {
        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
          const landmarks = results.multiFaceLandmarks[0];
          const imageWidth = results.image.width;
          const imageHeight = results.image.height;
          
          // Usar landmarks específicos para medições mais precisas
          // Landmark 10: topo da testa
          // Landmark 152: queixo
          // Landmark 234: orelha esquerda 
          // Landmark 454: orelha direita
          
          const foreheadTop = landmarks[10];
          const chin = landmarks[152];
          const leftEar = landmarks[234];
          const rightEar = landmarks[454];
          const noseTip = landmarks[1];
          const leftEyeCenter = landmarks[468] || landmarks[133];
          const rightEyeCenter = landmarks[473] || landmarks[362];
          
          // Calcular dimensões reais da face usando landmarks específicos
          const faceHeightPixels = Math.abs(chin.y - foreheadTop.y) * imageHeight;
          const faceWidthPixels = Math.abs(rightEar.x - leftEar.x) * imageWidth;
          
          // Posição do centro da face
          const faceCenterX = (leftEar.x + rightEar.x) / 2 * imageWidth;
          const faceCenterY = (foreheadTop.y + chin.y) / 2 * imageHeight;
          
          // Calcular posições normalizadas
          const horizontalPosition = faceCenterX / imageWidth;
          const verticalPosition = faceCenterY / imageHeight;
          
          // Cálculo ultra preciso da distância usando múltiplas referências
          const avgFaceHeightCm = 18.5; // Altura média do rosto humano (testa ao queixo)
          const avgFaceWidthCm = 14.5;  // Largura média do rosto humano (orelha a orelha)
          
          // Usar a maior das duas medidas para mais precisão
          const focalLengthPixels = Math.max(imageWidth, imageHeight) * 0.85;
          
          const distanceFromHeight = (avgFaceHeightCm * focalLengthPixels) / faceHeightPixels;
          const distanceFromWidth = (avgFaceWidthCm * focalLengthPixels) / faceWidthPixels;
          
          // Usar média ponderada das duas medidas
          const estimatedDistance = Math.round((distanceFromHeight * 0.6 + distanceFromWidth * 0.4));
          
          // Calcular confiança baseada em múltiplos fatores
          const landmarkQuality = (landmarks.length / 468) * 100;
          const faceSizeRatio = Math.min((faceWidthPixels / imageWidth) * 5, 1) * 100;
          const symmetryScore = Math.max(0, 100 - Math.abs(horizontalPosition - 0.5) * 200);
          
          const confidence = Math.round(
            (landmarkQuality * 0.4 + faceSizeRatio * 0.4 + symmetryScore * 0.2)
          );
          
          // Validar se a detecção é consistente
          const isConsistent = faceWidthPixels > 60 && faceHeightPixels > 80 && 
                              faceWidthPixels < imageWidth * 0.8 && 
                              faceHeightPixels < imageHeight * 0.9;
          
          if (isConsistent) {
            lastValidDetection.current = new Date();
            
            setDetectionResult({
              isDetected: true,
              distance: Math.max(15, Math.min(150, estimatedDistance)),
              verticalPosition,
              horizontalPosition,
              confidence: Math.min(100, confidence),
              faceWidth: faceWidthPixels,
              faceHeight: faceHeightPixels
            });
            
            console.log('🎯 ULTRA PRECISO - Face detectada:', {
              distance: `${estimatedDistance}cm`,
              verticalPos: `${(verticalPosition * 100).toFixed(1)}%`,
              horizontalPos: `${(horizontalPosition * 100).toFixed(1)}%`,
              confidence: `${confidence}%`,
              faceSize: `${Math.round(faceWidthPixels)}x${Math.round(faceHeightPixels)}px`,
              distanceFromHeight: `${distanceFromHeight.toFixed(1)}cm`,
              distanceFromWidth: `${distanceFromWidth.toFixed(1)}cm`,
              landmarkQuality: `${landmarkQuality.toFixed(1)}%`,
              symmetryScore: `${symmetryScore.toFixed(1)}%`
            });
          } else {
            console.warn('⚠️ Detecção inconsistente ignorada');
          }
        } else {
          // Verificar se perdemos a detecção há muito tempo
          const timeSinceLastDetection = lastValidDetection.current ? 
            new Date().getTime() - lastValidDetection.current.getTime() : Infinity;
          
          if (timeSinceLastDetection > 500) { // 500ms sem detecção
            setDetectionResult(prev => ({
              ...prev,
              isDetected: false,
              confidence: 0
            }));
          }
        }
      });

      faceMeshRef.current = faceMesh;
      setIsInitialized(true);
      console.log('✅ MediaPipe FaceMesh inicializado com sucesso');
      
    } catch (error) {
      console.error('💥 Erro ao inicializar MediaPipe:', error);
      setIsInitialized(false);
    }
  }, []);

  // Processar frame do vídeo
  const processVideoFrame = useCallback(() => {
    if (!faceMeshRef.current || !videoRef.current || !canvasRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx || video.readyState !== 4) {
      return;
    }

    // Configurar canvas com dimensões do vídeo
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    
    // Desenhar frame atual
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Enviar para MediaPipe
    try {
      faceMeshRef.current.send({ image: canvas });
    } catch (error) {
      console.error('Erro ao processar frame:', error);
    }
  }, [videoRef]);

  // Loop de processamento
  const startDetection = useCallback(() => {
    if (!isInitialized) return;
    
    const processFrame = () => {
      processVideoFrame();
      animationFrameRef.current = requestAnimationFrame(processFrame);
    };
    
    processFrame();
  }, [isInitialized, processVideoFrame]);

  const stopDetection = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = undefined;
    }
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      stopDetection();
      if (faceMeshRef.current) {
        faceMeshRef.current.close();
      }
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