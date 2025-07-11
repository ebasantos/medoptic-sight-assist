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
      const faceMesh = initializeFaceMesh();
      
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          faceMesh.onResults((results) => {
            setIsLoading(false);
            
            if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
              const landmarks = results.multiFaceLandmarks[0];
              
              // Convert normalized coordinates to pixel coordinates
              const pixelLandmarks = landmarks.map((landmark) => ({
                x: landmark.x * img.width,
                y: landmark.y * img.height,
                z: landmark.z * img.width // Approximate depth scaling
              }));
              
              resolve(pixelLandmarks);
            } else {
              resolve(null);
            }
          });

          // Send the image to MediaPipe
          faceMesh.send({ image: canvas });
        };

        img.onerror = () => {
          setIsLoading(false);
          reject(new Error('Failed to load image'));
        };

        img.src = imageData;
      });
    } catch (error) {
      setIsLoading(false);
      console.error('Face detection error:', error);
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