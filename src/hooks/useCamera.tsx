
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
      console.log('Tentando iniciar câmera...');
      
      // Verificar se getUserMedia está disponível
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('API de câmera não disponível neste navegador');
      }

      // Solicitar permissão para usar a câmera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        },
        audio: false
      });

      console.log('Stream obtido:', stream);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // Aguardar o vídeo carregar
        videoRef.current.onloadedmetadata = () => {
          console.log('Vídeo carregado, iniciando reprodução');
          videoRef.current?.play();
          setIsActive(true);
          setHasPermission(true);
        };
      }
    } catch (err) {
      console.error('Erro ao acessar a câmera:', err);
      setHasPermission(false);
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('Permissão para usar a câmera foi negada. Por favor, permita o acesso à câmera.');
        } else if (err.name === 'NotFoundError') {
          setError('Nenhuma câmera foi encontrada no dispositivo.');
        } else if (err.name === 'NotReadableError') {
          setError('A câmera está sendo usada por outro aplicativo.');
        } else {
          setError(`Erro ao acessar a câmera: ${err.message}`);
        }
      } else {
        setError('Erro desconhecido ao acessar a câmera');
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    console.log('Parando câmera...');
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('Track parado:', track.kind);
      });
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsActive(false);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isActive) {
      console.error('Elementos não disponíveis para captura');
      return null;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) {
      console.error('Contexto do canvas não disponível');
      return null;
    }

    console.log('Capturando foto...');

    // Configurar o canvas com as dimensões do vídeo
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Desenhar o frame atual do vídeo no canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Converter para base64
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageData);
    
    console.log('Foto capturada com sucesso');
    
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
