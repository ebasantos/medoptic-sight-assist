import { FaceDetection } from './FaceDetector';
import { Tables } from '@/integrations/supabase/types';

type GlassesModel = Tables<'modelos_oculos'>;

export interface RenderOptions {
  position: { x: number; y: number };
  scale: number;
  rotation: number;
  opacity: number;
  color: string;
}

export class GlassesRenderer {
  static async renderGlasses(
    ctx: CanvasRenderingContext2D,
    model: GlassesModel,
    options: RenderOptions,
    canvasWidth: number,
    canvasHeight: number,
    faceDetection?: FaceDetection
  ): Promise<void> {
    try {
      const glassesImg = new Image();
      glassesImg.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        glassesImg.onload = () => resolve();
        glassesImg.onerror = () => reject(new Error('Falha ao carregar imagem'));
        glassesImg.src = model.imagem_url;
      });
      
      ctx.save();
      
      // Posicionamento preciso baseado na detecção facial
      let centerX, centerY;
      
      if (faceDetection) {
        // Usar posição EXATA dos olhos detectados - sem ajustes
        centerX = (faceDetection.leftEye.x + faceDetection.rightEye.x) / 2;
        centerY = (faceDetection.leftEye.y + faceDetection.rightEye.y) / 2;
        
        console.log('Renderizando óculos EXATAMENTE na posição dos olhos:', { centerX, centerY });
      } else {
        // Fallback para centro do canvas com ajustes do usuário
        centerX = canvasWidth / 2 + (options.position.x * canvasWidth / 100);
        centerY = canvasHeight / 2 + (options.position.y * canvasHeight / 100);
      }
      
      // Aplicar ajustes manuais do usuário sobre a posição detectada (com menor sensibilidade)
      centerX += (options.position.x * canvasWidth / 300);
      centerY += (options.position.y * canvasHeight / 300);
      
      ctx.translate(centerX, centerY);
      ctx.rotate((options.rotation * Math.PI) / 180);
      ctx.globalAlpha = options.opacity;
      
      // Aplicar filtro de cor se necessário
      if (options.color && options.color !== '#000000') {
        ctx.filter = `hue-rotate(${this.getHueRotation(options.color)}deg) saturate(120%)`;
      }
      
      // Calcular dimensões baseadas na detecção facial precisa
      let finalWidth, finalHeight;
      
      if (faceDetection) {
        // Usar distância exata dos olhos para dimensionamento
        const eyeDistance = faceDetection.eyeDistance;
        
        // Óculos devem ter largura proporcional à distância real dos olhos
        finalWidth = eyeDistance * 1.8; // Proporção ideal para armação
        finalHeight = finalWidth / (glassesImg.width / glassesImg.height);
        
        console.log('Dimensões baseadas na detecção precisa:', {
          eyeDistance,
          finalWidth,
          finalHeight,
          confidence: faceDetection.confidence
        });
      } else {
        // Fallback para dimensionamento genérico
        const baseFaceScale = Math.min(canvasWidth, canvasHeight) / 400;
        finalWidth = Math.max(120, Math.min(280, glassesImg.width * baseFaceScale));
        finalHeight = Math.max(60, Math.min(140, glassesImg.height * baseFaceScale));
      }
      
      // Aplicar escala adicional do usuário
      finalWidth *= options.scale;
      finalHeight *= options.scale;
      
      ctx.drawImage(
        glassesImg,
        -finalWidth / 2,
        -finalHeight / 2,
        finalWidth,
        finalHeight
      );
      
      ctx.restore();
      
    } catch (error) {
      console.error('Erro ao renderizar óculos:', error);
      this.drawFallbackGlasses(ctx, options, canvasWidth, canvasHeight, faceDetection);
    }
  }
  
  private static drawFallbackGlasses(
    ctx: CanvasRenderingContext2D,
    options: RenderOptions,
    canvasWidth: number,
    canvasHeight: number,
    faceDetection?: FaceDetection
  ): void {
    ctx.save();
    
    // Usar posição dos olhos detectados se disponível
    let centerX, centerY;
    
    if (faceDetection) {
      centerX = (faceDetection.leftEye.x + faceDetection.rightEye.x) / 2;
      centerY = (faceDetection.leftEye.y + faceDetection.rightEye.y) / 2;
      // SEM ajuste para o fallback também
    } else {
      centerX = canvasWidth / 2 + (options.position.x * canvasWidth / 100);
      centerY = canvasHeight / 2 + (options.position.y * canvasHeight / 100);
    }
    
    // Aplicar ajustes do usuário com menor sensibilidade
    centerX += (options.position.x * canvasWidth / 300);
    centerY += (options.position.y * canvasHeight / 300);
    
    ctx.translate(centerX, centerY);
    ctx.rotate((options.rotation * Math.PI) / 180);
    ctx.globalAlpha = options.opacity;
    
    ctx.strokeStyle = options.color || '#000000';
    ctx.lineWidth = 3;
    
    // Dimensões baseadas na detecção facial
    let lensRadius = 35;
    let lensDistance = 45;
    
    if (faceDetection) {
      const eyeDistance = faceDetection.eyeDistance;
      lensRadius = eyeDistance * 0.2;
      lensDistance = eyeDistance * 0.3;
    }
    
    // Aplicar escala
    lensRadius *= options.scale;
    lensDistance *= options.scale;
    
    // Desenhar lentes
    ctx.beginPath();
    ctx.arc(-lensDistance, 0, lensRadius, 0, 2 * Math.PI);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(lensDistance, 0, lensRadius, 0, 2 * Math.PI);
    ctx.stroke();
    
    // Ponte
    ctx.beginPath();
    ctx.moveTo(-lensRadius * 0.3, 0);
    ctx.lineTo(lensRadius * 0.3, 0);
    ctx.stroke();
    
    // Hastes
    ctx.beginPath();
    ctx.moveTo(-(lensDistance + lensRadius), 0);
    ctx.lineTo(-(lensDistance + lensRadius + 25), -5);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo((lensDistance + lensRadius), 0);
    ctx.lineTo((lensDistance + lensRadius + 25), -5);
    ctx.stroke();
    
    ctx.restore();
  }
  
  private static getHueRotation(color: string): number {
    switch (color) {
      case '#8B4513': return 30; // marrom
      case '#FFD700': return 50; // dourado
      case '#C0C0C0': return 0;  // prata
      case '#000080': return 240; // azul
      default: return 0;
    }
  }
}
