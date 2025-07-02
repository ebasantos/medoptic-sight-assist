
import { useState, useRef, useCallback, useEffect } from 'react';

interface UseCameraProps {
  onCapture?: (imageData: string) => void;
}

export const useCamera = ({ onCapture }: UseCameraProps = {}) => {
  const [isActive, setIsActive] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Detectar câmeras disponíveis
  const detectCameras = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setAvailableCameras(videoDevices);
      setHasMultipleCameras(videoDevices.length > 1);
      console.log('Câmeras detectadas:', videoDevices.length);
    } catch (err) {
      console.warn('Erro ao detectar câmeras:', err);
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      setHasPermission(null);
      console.log('Tentando iniciar câmera...', facingMode);
      
      // Verificar se getUserMedia está disponível
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('API de câmera não disponível neste navegador');
      }

      // Verificar se o elemento de vídeo existe
      if (!videoRef.current) {
        console.error('Elemento de vídeo não encontrado');
        throw new Error('Elemento de vídeo não encontrado');
      }

      const video = videoRef.current;
      console.log('Elemento de vídeo encontrado, solicitando stream...');

      // Parar stream anterior se existir
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      // Detectar câmeras disponíveis
      await detectCameras();

      // Solicitar permissão para usar a câmera com o facingMode correto
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        },
        audio: false
      });

      console.log('Stream obtido:', stream);
      console.log('Tracks do stream:', stream.getTracks());
      streamRef.current = stream;

      console.log('Configurando elemento de vídeo...');
      
      // Definir o stream como fonte do vídeo
      video.srcObject = stream;
      
      // Aguardar o vídeo carregar e então reproduzir
      video.onloadedmetadata = () => {
        console.log('Metadata carregada - dimensões:', video.videoWidth, 'x', video.videoHeight);
        
        // Tentar reproduzir o vídeo
        video.play()
          .then(() => {
            console.log('Vídeo iniciado com sucesso');
            setIsActive(true);
            setHasPermission(true);
          })
          .catch((playError) => {
            console.error('Erro ao reproduzir vídeo:', playError);
            setError(`Erro ao reproduzir vídeo: ${playError.message}`);
          });
      };
      
      video.onerror = (err) => {
        console.error('Erro no elemento de vídeo:', err);
        setError('Erro ao carregar vídeo');
      };

    } catch (err) {
      console.error('Erro ao acessar a câmera:', err);
      setHasPermission(false);
      setIsActive(false);
      
      // Limpar stream em caso de erro
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
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
  }, [facingMode, detectCameras]);

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
      videoRef.current.pause();
    }
    
    setIsActive(false);
  }, []);

  const switchCamera = useCallback(async () => {
    if (!hasMultipleCameras) return;
    
    console.log('Trocando câmera...');
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);
    
    // Se a câmera estiver ativa, reiniciar com a nova configuração
    if (isActive) {
      stopCamera();
      // Pequeno delay para garantir que a câmera anterior foi liberada
      setTimeout(() => {
        setFacingMode(newFacingMode);
      }, 100);
    }
  }, [facingMode, hasMultipleCameras, isActive, stopCamera]);

  // Reiniciar câmera quando facingMode mudar
  useEffect(() => {
    if (isActive && streamRef.current) {
      startCamera();
    }
  }, [facingMode]);

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

    // Verificar se o vídeo tem dimensões válidas
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.error('Vídeo não possui dimensões válidas');
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

  // Detectar câmeras quando o hook é inicializado
  useEffect(() => {
    detectCameras();
  }, [detectCameras]);

  return {
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
  };
};
