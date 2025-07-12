import { useState, useRef, useCallback, useEffect } from 'react';

interface UseCameraProps {
  onCapture?: (imageData: string) => void;
  timeout?: number; // Timeout personalizado em ms
}

export const useCamera = ({ onCapture, timeout = 10000 }: UseCameraProps = {}) => {
  const [isActive, setIsActive] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Limpar timeout anterior
  const clearCurrentTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Detectar câmeras disponíveis com timeout
  const detectCameras = useCallback(async () => {
    try {
      // Timeout para detecção de câmeras
      const detectPromise = navigator.mediaDevices.enumerateDevices();
      const timeoutPromise = new Promise<MediaDeviceInfo[]>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout ao detectar câmeras')), 5000);
      });

      const devices = await Promise.race([detectPromise, timeoutPromise]);
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setAvailableCameras(videoDevices);
      setHasMultipleCameras(videoDevices.length > 1);
      console.log('Câmeras detectadas:', videoDevices.length);
      return videoDevices;
    } catch (err) {
      console.warn('Erro ao detectar câmeras:', err);
      return [];
    }
  }, []);

  // Aguardar elemento de vídeo estar pronto
  const waitForVideoElement = useCallback((): Promise<HTMLVideoElement> => {
    return new Promise((resolve, reject) => {
      if (videoRef.current) {
        resolve(videoRef.current);
        return;
      }

      let attempts = 0;
      const maxAttempts = 30; // 3 segundos
      
      const checkElement = () => {
        if (videoRef.current) {
          console.log('Elemento de vídeo encontrado');
          resolve(videoRef.current);
        } else if (attempts < maxAttempts) {
          attempts++;
          setTimeout(checkElement, 100);
        } else {
          reject(new Error('Elemento de vídeo não encontrado'));
        }
      };
      
      checkElement();
    });
  }, []);

  // Aguardar vídeo carregar completamente
  const waitForVideoLoad = useCallback((video: HTMLVideoElement): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (video.readyState >= 2) { // HAVE_CURRENT_DATA
        resolve();
        return;
      }

      const onLoadedData = () => {
        console.log('Metadata carregada - dimensões:', video.videoWidth, 'x', video.videoHeight);
        video.removeEventListener('loadeddata', onLoadedData);
        video.removeEventListener('error', onError);
        resolve();
      };

      const onError = (err: Event) => {
        video.removeEventListener('loadeddata', onLoadedData);
        video.removeEventListener('error', onError);
        reject(new Error('Erro ao carregar vídeo'));
      };

      video.addEventListener('loadeddata', onLoadedData);
      video.addEventListener('error', onError);

      // Timeout para carregamento do vídeo
      setTimeout(() => {
        video.removeEventListener('loadeddata', onLoadedData);
        video.removeEventListener('error', onError);
        reject(new Error('Timeout ao carregar vídeo'));
      }, 8000);
    });
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setHasPermission(null);
      clearCurrentTimeout();

      console.log('Tentando iniciar câmera...', facingMode);
      
      // Verificar suporte do navegador
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Câmera não suportada neste navegador');
      }

      // Parar stream anterior
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      // Aguardar elemento de vídeo com timeout
      const video = await Promise.race([
        waitForVideoElement(),
        new Promise<never>((_, reject) => {
          timeoutRef.current = setTimeout(() => {
            reject(new Error('Timeout: elemento de vídeo não encontrado'));
          }, 5000);
        })
      ]);

      clearCurrentTimeout();

      // Detectar câmeras
      await detectCameras();

      // Configurações otimizadas para menor latência
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 720, min: 480 },
          height: { ideal: 480, min: 360 },
          frameRate: { ideal: 30, min: 15 }
        },
        audio: false
      };

      // Solicitar stream com timeout
      const streamPromise = navigator.mediaDevices.getUserMedia(constraints);
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutRef.current = setTimeout(() => {
          reject(new Error('Timeout ao acessar câmera'));
        }, timeout);
      });

      const stream = await Promise.race([streamPromise, timeoutPromise]);
      clearCurrentTimeout();

      console.log('Stream obtido:', stream.getTracks().length, 'tracks');
      streamRef.current = stream;
      video.srcObject = stream;

      // Aguardar vídeo carregar com timeout
      await Promise.race([
        waitForVideoLoad(video),
        new Promise<never>((_, reject) => {
          timeoutRef.current = setTimeout(() => {
            reject(new Error('Timeout ao carregar vídeo'));
          }, 8000);
        })
      ]);

      clearCurrentTimeout();

      // Reproduzir vídeo
      await video.play();
      
      console.log('Câmera iniciada com sucesso');
      setIsActive(true);
      setHasPermission(true);
      setIsLoading(false);

    } catch (err) {
      clearCurrentTimeout();
      setIsLoading(false);
      setHasPermission(false);
      setIsActive(false);
      
      // Limpar recursos
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      console.error('Erro ao iniciar câmera:', err);
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('Acesso à câmera negado. Permita o acesso e tente novamente.');
        } else if (err.name === 'NotFoundError') {
          setError('Nenhuma câmera encontrada no dispositivo.');
        } else if (err.name === 'NotReadableError') {
          setError('Câmera está sendo usada por outro aplicativo.');
        } else if (err.message.includes('Timeout')) {
          setError('Timeout ao conectar com a câmera. Tente novamente.');
        } else {
          setError(`Erro: ${err.message}`);
        }
      } else {
        setError('Erro desconhecido ao acessar câmera');
      }
    }
  }, [facingMode, detectCameras, timeout, waitForVideoElement, waitForVideoLoad, clearCurrentTimeout]);

  const stopCamera = useCallback(() => {
    console.log('Parando câmera...');
    clearCurrentTimeout();
    setIsLoading(false);
    
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
  }, [clearCurrentTimeout]);

  const switchCamera = useCallback(async () => {
    if (!hasMultipleCameras) return;
    
    console.log('Trocando câmera...');
    const wasActive = isActive;
    
    if (wasActive) {
      stopCamera();
    }
    
    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacingMode);
    
    if (wasActive) {
      // Pequeno delay para liberar recursos
      setTimeout(() => {
        startCamera();
      }, 500);
    }
  }, [facingMode, hasMultipleCameras, isActive, stopCamera, startCamera]);

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

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.error('Vídeo sem dimensões válidas');
      return null;
    }

    console.log('Capturando foto...');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(imageData);
    
    console.log('Foto capturada com sucesso');
    
    onCapture?.(imageData);
    return imageData;
  }, [isActive, onCapture]);

  // Limpar recursos ao desmontar
  useEffect(() => {
    return () => {
      clearCurrentTimeout();
      stopCamera();
    };
  }, [stopCamera, clearCurrentTimeout]);

  // Inicializar detecção de câmeras
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
    isLoading,
    startCamera,
    stopCamera,
    switchCamera,
    capturePhoto,
    setCapturedImage
  };
};