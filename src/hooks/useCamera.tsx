
import { useState, useRef, useCallback, useEffect } from 'react';

interface UseCameraProps {
  onCapture?: (imageData: string) => void;
}

export const useCamera = ({ onCapture }: UseCameraProps = {}) => {
  const [isActive, setIsActive] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      
      // Solicitar permissão para usar a câmera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user', // Câmera frontal para selfies
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsActive(true);
        setHasPermission(true);
      }
    } catch (err) {
      console.error('Erro ao acessar a câmera:', err);
      setHasPermission(false);
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('Permissão para usar a câmera foi negada. Por favor, permita o acesso à câmera.');
        } else if (err.name === 'NotFoundError') {
          setError('Nenhuma câmera foi encontrada no dispositivo.');
        } else {
          setError('Erro ao acessar a câmera. Verifique se ela está disponível.');
        }
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsActive(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isActive) {
      return null;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return null;

    // Configurar o canvas com as dimensões do vídeo
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Desenhar o frame atual do vídeo no canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Converter para base64
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageData);
    
    // Chamar callback se fornecido
    if (onCapture) {
      onCapture(imageData);
    }

    return imageData;
  }, [isActive, onCapture]);

  // Limpar recursos quando o componente for desmontado
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    canvasRef,
    isActive,
    hasPermission,
    error,
    capturedImage,
    startCamera,
    stopCamera,
    capturePhoto,
    setCapturedImage
  };
};
