import { useState, useCallback, useRef } from 'react';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';

interface FaceLandmark {
  x: number;
  y: number;
  z: number;
}

export const useFaceMeshDetection = () => {
  const [isLoading, setIsLoading] = useState(false);
  const faceMeshRef = useRef<FaceMesh | null>(null);

  const initializeFaceMesh = useCallback(() => {
    if (faceMeshRef.current) return faceMeshRef.current;

    const faceMesh = new FaceMesh({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
      }
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    faceMeshRef.current = faceMesh;
    return faceMesh;
  }, []);

  const detectFaceLandmarks = useCallback(async (imageData: string): Promise<FaceLandmark[] | null> => {
    setIsLoading(true);
    
    try {
      console.log('🔍 Iniciando detecção facial...');
      const faceMesh = initializeFaceMesh();
      
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          console.log('🖼️ Imagem carregada:', img.width, 'x', img.height);
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            console.error('❌ Falha ao obter contexto do canvas');
            reject(new Error('Failed to get canvas context'));
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          faceMesh.onResults((results) => {
            console.log('🎯 Resultados da detecção:', results);
            setIsLoading(false);
            
            if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
              console.log('✅ Face detectada com', results.multiFaceLandmarks[0].length, 'landmarks');
              const landmarks = results.multiFaceLandmarks[0];
              
              // Convert normalized coordinates to pixel coordinates
              const pixelLandmarks = landmarks.map((landmark) => ({
                x: landmark.x * img.width,
                y: landmark.y * img.height,
                z: landmark.z * img.width // Approximate depth scaling
              }));
              
              resolve(pixelLandmarks);
            } else {
              console.log('⚠️ Nenhuma face detectada');
              resolve(null);
            }
          });

          // Send the image to MediaPipe
          console.log('📤 Enviando imagem para MediaPipe...');
          try {
            faceMesh.send({ image: canvas });
          } catch (sendError) {
            console.error('💥 Erro ao enviar para MediaPipe:', sendError);
            setIsLoading(false);
            reject(sendError);
          }
        };

        img.onerror = (error) => {
          console.error('💥 Erro ao carregar imagem:', error);
          setIsLoading(false);
          reject(new Error('Failed to load image'));
        };

        img.src = imageData;
      });
    } catch (error) {
      setIsLoading(false);
      console.error('💥 Erro geral na detecção facial:', error);
      throw error;
    }
  }, [initializeFaceMesh]);

  const cleanup = useCallback(() => {
    if (faceMeshRef.current) {
      faceMeshRef.current.close();
      faceMeshRef.current = null;
    }
  }, []);

  return {
    detectFaceLandmarks,
    isLoading,
    cleanup
  };
};