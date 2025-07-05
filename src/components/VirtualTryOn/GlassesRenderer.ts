
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
      
      // Posicionamento mais preciso
      const centerX = canvasWidth / 2 + (options.position.x * canvasWidth / 100);
      const centerY = canvasHeight / 2 + (options.position.y * canvasHeight / 100);
      
      ctx.translate(centerX, centerY);
      ctx.rotate((options.rotation * Math.PI) / 180);
      ctx.globalAlpha = options.opacity;
      
      // Aplicar filtro de cor se necessário
      if (options.color && options.color !== '#000000') {
        ctx.filter = `hue-rotate(${this.getHueRotation(options.color)}deg) saturate(120%)`;
      }
      
      // Calcular dimensões baseadas na detecção facial
      let finalWidth, finalHeight;
      
      if (faceDetection) {
        // Usar detecção facial para dimensionamento preciso
        const eyeDistance = faceDetection.eyeDistance;
        
        // Óculos devem ter largura proporcional à distância dos olhos
        finalWidth = eyeDistance * 2.0; // Multiplicador ajustado
        finalHeight = finalWidth / (glassesImg.width / glassesImg.height);
        
        console.log('Dimensões baseadas na face:', {
          eyeDistance,
          finalWidth,
          finalHeight,
          glassesAspectRatio: glassesImg.width / glassesImg.height
        });
      } else {
        // Fallback para dimensões baseadas no canvas
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
    
    const centerX = canvasWidth / 2 + (options.position.x * canvasWidth / 100);
    const centerY = canvasHeight / 2 + (options.position.y * canvasHeight / 100);
    
    ctx.translate(centerX, centerY);
    ctx.rotate((options.rotation * Math.PI) / 180);
    ctx.globalAlpha = options.opacity;
    
    ctx.strokeStyle = options.color || '#000000';
    ctx.lineWidth = 3;
    
    // Dimensões proporcionais à face detectada
    let lensRadius = 35;
    let lensDistance = 45;
    
    if (faceDetection) {
      const eyeDistance = faceDetection.eyeDistance;
      lensRadius = eyeDistance * 0.25;
      lensDistance = eyeDistance * 0.35;
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
