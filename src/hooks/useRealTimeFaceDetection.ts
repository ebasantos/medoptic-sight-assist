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
          
          // Calcular bounding box da face
          const facePoints = landmarks.map(landmark => ({
            x: landmark.x * imageWidth,
            y: landmark.y * imageHeight
          }));
          
          const minX = Math.min(...facePoints.map(p => p.x));
          const maxX = Math.max(...facePoints.map(p => p.x));
          const minY = Math.min(...facePoints.map(p => p.y));
          const maxY = Math.max(...facePoints.map(p => p.y));
          
          const faceWidth = maxX - minX;
          const faceHeight = maxY - minY;
          const faceCenterX = (minX + maxX) / 2;
          const faceCenterY = (minY + maxY) / 2;
          
          // Calcular posições normalizadas
          const horizontalPosition = faceCenterX / imageWidth;
          const verticalPosition = faceCenterY / imageHeight;
          
          // Calcular distância estimada baseada na largura da face
          // Largura média de uma face humana: ~14cm
          // Distância = (largura_real_cm * distancia_focal_pixels) / largura_face_pixels
          const avgFaceWidthCm = 14;
          const focalLengthPixels = imageWidth * 0.8; // Estimativa da distância focal
          const estimatedDistance = Math.round((avgFaceWidthCm * focalLengthPixels) / faceWidth);
          
          // Calcular confiança baseada na qualidade da detecção
          const confidence = Math.min(100, Math.round(
            (landmarks.length / 468) * 100 * // Proporção de landmarks detectados
            (faceWidth / imageWidth) * 10    // Tamanho relativo da face
          ));
          
          setDetectionResult({
            isDetected: true,
            distance: Math.max(15, Math.min(100, estimatedDistance)), // Limitar entre 15-100cm
            verticalPosition,
            horizontalPosition,
            confidence,
            faceWidth,
            faceHeight
          });
          
          console.log('📊 Face detectada:', {
            distance: estimatedDistance,
            verticalPos: verticalPosition.toFixed(2),
            horizontalPos: horizontalPosition.toFixed(2),
            confidence,
            faceSize: `${Math.round(faceWidth)}x${Math.round(faceHeight)}`
          });
        } else {
          // Nenhuma face detectada
          setDetectionResult(prev => ({
            ...prev,
            isDetected: false,
            confidence: 0
          }));
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