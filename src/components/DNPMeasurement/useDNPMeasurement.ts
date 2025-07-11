import { useState, useCallback } from 'react';
import { FaceMesh } from '@mediapipe/face_mesh';

interface DNPMeasurements {
  binocularPd: number;
  pdLeft: number;
  pdRight: number;
  confidence: number;
  samples: number;
  imageBase64?: string;
  validation: string;
}

interface FaceLandmark {
  x: number;
  y: number;
  z: number;
}

export const useDNPMeasurement = () => {
  const [pixelsPerMm, setPixelsPerMm] = useState<number | null>(null);
  const [measurements, setMeasurements] = useState<DNPMeasurements | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calibração com cartão de referência ou valor direto (régua virtual)
  const calibrateWithCard = useCallback(async (imageDataOrValue: string | number): Promise<void> => {
    setIsProcessing(true);
    setError(null);
    
    try {
      // Se for um número, é calibração direta da régua virtual
      if (typeof imageDataOrValue === 'number') {
        setPixelsPerMm(imageDataOrValue);
        console.log(`Calibração virtual concluída: ${imageDataOrValue.toFixed(3)} pixels/mm`);
        return;
      }

      // Calibração tradicional com imagem de cartão
      const img = new Image();
      img.src = imageDataOrValue;
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Erro ao criar contexto do canvas');
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Detecção simples de bordas para o cartão
      const canvasImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const cardWidth = detectCardWidth(canvasImageData);
      
      if (!cardWidth) {
        throw new Error('Cartão não detectado. Posicione o cartão claramente na imagem.');
      }

      // Cartão padrão: 86mm de largura
      const calculatedPixelsPerMm = cardWidth / 86;
      setPixelsPerMm(calculatedPixelsPerMm);
      
      console.log(`Calibração concluída: ${calculatedPixelsPerMm.toFixed(3)} pixels/mm`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro na calibração');
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Processamento de imagem facial com MediaPipe
  const processFaceImage = useCallback(async (imageData: string): Promise<DNPMeasurements> => {
    if (!pixelsPerMm) {
      throw new Error('Calibração necessária antes da medição');
    }

    setIsProcessing(true);
    setError(null);

    try {
      const faceMesh = new FaceMesh({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
      });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.85,
        minTrackingConfidence: 0.85
      });

      const img = new Image();
      img.src = imageData;
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Erro ao criar contexto do canvas');
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      return new Promise((resolve, reject) => {
        faceMesh.onResults((results) => {
          try {
            if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
              throw new Error('Nenhuma face detectada. Posicione seu rosto claramente na câmera.');
            }

            const landmarks = results.multiFaceLandmarks[0];
            
            // Landmarks principais para medições
            const leftPupil = landmarks[468]; // Aproximação do centro da pupila esquerda
            const rightPupil = landmarks[473]; // Aproximação do centro da pupila direita
            const noseTip = landmarks[1]; // Ponta do nariz

            // Validação de alinhamento horizontal
            const pupilHeightDiff = Math.abs(leftPupil.y - rightPupil.y) * img.height;
            if (pupilHeightDiff > 10) { // Tolerância de 10 pixels
              throw new Error('Cabeça não está alinhada. Mantenha a cabeça reta e tente novamente.');
            }

            // Conversão para coordenadas de pixel
            const leftPupilPx = {
              x: leftPupil.x * img.width,
              y: leftPupil.y * img.height
            };
            
            const rightPupilPx = {
              x: rightPupil.x * img.width,
              y: rightPupil.y * img.height
            };
            
            const noseTipPx = {
              x: noseTip.x * img.width,
              y: noseTip.y * img.height
            };

            // Cálculo das distâncias em pixels
            const binocularPdPx = Math.sqrt(
              Math.pow(rightPupilPx.x - leftPupilPx.x, 2) + 
              Math.pow(rightPupilPx.y - leftPupilPx.y, 2)
            );

            const pdLeftPx = Math.sqrt(
              Math.pow(leftPupilPx.x - noseTipPx.x, 2) + 
              Math.pow(leftPupilPx.y - noseTipPx.y, 2)
            );

            const pdRightPx = Math.sqrt(
              Math.pow(rightPupilPx.x - noseTipPx.x, 2) + 
              Math.pow(rightPupilPx.y - noseTipPx.y, 2)
            );

            // Conversão para milímetros
            const binocularPd = parseFloat((binocularPdPx / pixelsPerMm).toFixed(2));
            const pdLeft = parseFloat((pdLeftPx / pixelsPerMm).toFixed(2));
            const pdRight = parseFloat((pdRightPx / pixelsPerMm).toFixed(2));

            // Validação de simetria
            const asymmetry = Math.abs(pdLeft - pdRight);
            let validation = 'OK';
            if (asymmetry > 3) {
              validation = 'ATENÇÃO: Assimetria detectada. Verifique o posicionamento.';
            }

            const result: DNPMeasurements = {
              binocularPd,
              pdLeft,
              pdRight,
              confidence: 0.95, // Placeholder - em produção calcular baseado na detecção
              samples: 1,
              imageBase64: imageData,
              validation
            };

            setMeasurements(result);
            resolve(result);
          } catch (err) {
            reject(err);
          }
        });

        faceMesh.send({ image: canvas });
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro no processamento facial');
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, [pixelsPerMm]);

  const reset = useCallback(() => {
    setPixelsPerMm(null);
    setMeasurements(null);
    setError(null);
    setIsProcessing(false);
  }, []);

  return {
    pixelsPerMm,
    measurements,
    isProcessing,
    error,
    calibrateWithCard,
    processFaceImage,
    reset
  };
};

// Função auxiliar para detectar largura do cartão
// Implementação simplificada - em produção usar OpenCV.js
function detectCardWidth(imageData: ImageData): number | null {
  // Placeholder para detecção de cartão
  // Em produção, implementar:
  // 1. Detecção de bordas (Canny)
  // 2. Transformada de Hough para linhas
  // 3. Detecção de retângulos
  // 4. Validação de proporção 86:54
  
  // Por enquanto, retornar largura estimada baseada na imagem
  // Assumindo que o cartão ocupa ~30% da largura da imagem
  return Math.floor(imageData.width * 0.3);
}