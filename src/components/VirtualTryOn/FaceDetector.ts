export interface FaceDetection {
  leftEye: { x: number; y: number };
  rightEye: { x: number; y: number };
  eyeDistance: number;
  faceWidth: number;
  faceHeight: number;
  noseBridge: { x: number; y: number };
  confidence: number;
}

export interface FaceMeasurements {
  eyeDistancePixels: number;
  faceWidthPixels: number;
  faceHeightPixels: number;
  eyeLevel: number;
  centerX: number;
  centerY: number;
}

export class FaceDetector {
  static async detectFaceFeatures(image: HTMLImageElement): Promise<FaceDetection> {
    const imgWidth = image.naturalWidth || image.width;
    const imgHeight = image.naturalHeight || image.height;
    
    // Criar canvas para análise da imagem
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Não foi possível criar contexto do canvas');
    
    canvas.width = imgWidth;
    canvas.height = imgHeight;
    ctx.drawImage(image, 0, 0);
    
    // Analisar a imagem para encontrar características faciais
    const detection = await this.analyzeImageForFaceFeatures(ctx, imgWidth, imgHeight);
    
    console.log('Detecção facial PRECISÃO MÁXIMA:', detection);
    return detection;
  }
  
  private static async analyzeImageForFaceFeatures(
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number
  ): Promise<FaceDetection> {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Detectar região da face primeiro
    const faceRegion = this.detectFaceRegionPrecise(data, width, height);
    console.log('Região facial detectada:', faceRegion);
    
    // Detectar olhos com MÁXIMA PRECISÃO na região facial
    const eyePositions = this.detectEyesWithMaximumPrecision(data, width, height, faceRegion);
    console.log('Posições dos olhos PRECISAS:', eyePositions);
    
    // Calcular métricas faciais
    const eyeDistance = Math.sqrt(
      Math.pow(eyePositions.rightEye.x - eyePositions.leftEye.x, 2) +
      Math.pow(eyePositions.rightEye.y - eyePositions.leftEye.y, 2)
    );
    
    const centerX = (eyePositions.leftEye.x + eyePositions.rightEye.x) / 2;
    const eyeLineY = (eyePositions.leftEye.y + eyePositions.rightEye.y) / 2;
    
    return {
      leftEye: eyePositions.leftEye,
      rightEye: eyePositions.rightEye,
      eyeDistance: eyeDistance,
      faceWidth: faceRegion.width,
      faceHeight: faceRegion.height,
      noseBridge: { x: centerX, y: eyeLineY },
      confidence: eyePositions.confidence
    };
  }
  
  private static detectFaceRegionPrecise(data: Uint8ClampedArray, width: number, height: number) {
    // Detectar região com cor de pele usando múltiplos algoritmos
    let minX = width, maxX = 0, minY = height, maxY = 0;
    let skinPixels = 0;
    
    for (let y = 0; y < height; y += 2) { // Skip pixels para performance
      for (let x = 0; x < width; x += 2) {
        const i = (y * width + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        if (this.isSkinColorAdvanced(r, g, b)) {
          skinPixels++;
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      }
    }
    
    // Expandir região para incluir olhos
    const padding = Math.min(width, height) * 0.05;
    minX = Math.max(0, minX - padding);
    maxX = Math.min(width, maxX + padding);
    minY = Math.max(0, minY - padding);
    maxY = Math.min(height, maxY + padding);
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2
    };
  }
  
  private static detectEyesWithMaximumPrecision(
    data: Uint8ClampedArray, 
    width: number, 
    height: number, 
    faceRegion: any
  ) {
    // Região dos olhos: aproximadamente 30-45% da altura facial do topo
    const eyeRegionTop = faceRegion.y + faceRegion.height * 0.25;
    const eyeRegionBottom = faceRegion.y + faceRegion.height * 0.55;
    const eyeRegionHeight = eyeRegionBottom - eyeRegionTop;
    
    console.log('Procurando olhos na região PRECISA:', {
      top: eyeRegionTop,
      bottom: eyeRegionBottom,
      height: eyeRegionHeight,
      faceWidth: faceRegion.width
    });
    
    // Dividir em duas metades para olho esquerdo e direito
    const leftEyeRegion = {
      x: faceRegion.x + faceRegion.width * 0.1,
      y: eyeRegionTop,
      width: faceRegion.width * 0.35,
      height: eyeRegionHeight
    };
    
    const rightEyeRegion = {
      x: faceRegion.x + faceRegion.width * 0.55,
      y: eyeRegionTop,
      width: faceRegion.width * 0.35,
      height: eyeRegionHeight
    };
    
    // Encontrar centro EXATO de cada olho
    const leftEyeCenter = this.findEyeCenterUltraPrecise(data, width, height, leftEyeRegion);
    const rightEyeCenter = this.findEyeCenterUltraPrecise(data, width, height, rightEyeRegion);
    
    // Garantir que estão na mesma linha horizontal (média das alturas)
    const avgY = (leftEyeCenter.y + rightEyeCenter.y) / 2;
    
    console.log('CENTROS DOS OLHOS ULTRA PRECISOS:', {
      leftEye: { x: leftEyeCenter.x, y: avgY },
      rightEye: { x: rightEyeCenter.x, y: avgY },
      leftScore: leftEyeCenter.score,
      rightScore: rightEyeCenter.score
    });
    
    return {
      leftEye: { x: leftEyeCenter.x, y: avgY },
      rightEye: { x: rightEyeCenter.x, y: avgY },
      confidence: Math.min(0.95, (leftEyeCenter.score + rightEyeCenter.score) / 2)
    };
  }
  
  private static findEyeCenterUltraPrecise(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    region: { x: number; y: number; width: number; height: number }
  ) {
    let bestX = region.x + region.width / 2;
    let bestY = region.y + region.height / 2;
    let maxScore = 0;
    
    const endX = Math.min(width, region.x + region.width);
    const endY = Math.min(height, region.y + region.height);
    
    // Busca pixel por pixel com scoring avançado
    for (let y = Math.max(0, region.y); y < endY; y++) {
      for (let x = Math.max(0, region.x); x < endX; x++) {
        // Calcular score do olho baseado em padrões circulares
        const eyeScore = this.calculateAdvancedEyeScore(data, width, height, x, y);
        
        if (eyeScore > maxScore) {
          maxScore = eyeScore;
          bestX = x;
          bestY = y;
        }
      }
    }
    
    return {
      x: bestX,
      y: bestY,
      score: maxScore
    };
  }
  
  private static calculateAdvancedEyeScore(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    centerX: number,
    centerY: number
  ): number {
    let centerDarkness = 0;
    let innerRingBrightness = 0;
    let outerRingBrightness = 0;
    let edgeContrast = 0;
    
    // Analisar múltiplos anéis concêntricos
    for (let radius = 1; radius <= 12; radius++) {
      const circumference = Math.max(8, Math.floor(2 * Math.PI * radius));
      let ringBrightness = 0;
      let validPixels = 0;
      
      for (let i = 0; i < circumference; i++) {
        const angle = (2 * Math.PI * i) / circumference;
        const x = Math.round(centerX + radius * Math.cos(angle));
        const y = Math.round(centerY + radius * Math.sin(angle));
        
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const pixelIndex = (y * width + x) * 4;
          const r = data[pixelIndex];
          const g = data[pixelIndex + 1];
          const b = data[pixelIndex + 2];
          const brightness = (r + g + b) / 3;
          
          ringBrightness += brightness;
          validPixels++;
        }
      }
      
      if (validPixels > 0) {
        const avgBrightness = ringBrightness / validPixels;
        
        if (radius <= 3) {
          // Centro deve ser escuro (pupila)
          centerDarkness += (255 - avgBrightness) / 255;
        } else if (radius <= 6) {
          // Anel interno (iris) - moderadamente brilhante
          innerRingBrightness += avgBrightness / 255;
        } else if (radius <= 9) {
          // Anel externo (esclera) - mais brilhante
          outerRingBrightness += avgBrightness / 255;
        }
      }
    }
    
    // Calcular contraste entre centro e bordas
    const centerPixelBrightness = this.getPixelBrightness(data, width, height, centerX, centerY);
    const surroundingBrightness = this.getAverageBrightness(data, width, height, centerX, centerY, 8);
    edgeContrast = Math.abs(centerPixelBrightness - surroundingBrightness) / 255;
    
    // Score composto privilegiando centro escuro e bordas claras
    const finalScore = (
      centerDarkness * 0.4 +        // Centro escuro é crítico
      innerRingBrightness * 0.2 +   // Iris moderada
      outerRingBrightness * 0.2 +   // Esclera clara
      edgeContrast * 0.2            // Contraste geral
    );
    
    return finalScore;
  }
  
  private static getPixelBrightness(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    x: number,
    y: number
  ): number {
    if (x < 0 || x >= width || y < 0 || y >= height) return 128;
    
    const i = (Math.floor(y) * width + Math.floor(x)) * 4;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    return (r + g + b) / 3;
  }
  
  private static getAverageBrightness(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    centerX: number,
    centerY: number,
    radius: number
  ): number {
    let totalBrightness = 0;
    let pixelCount = 0;
    
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance <= radius) {
          const x = centerX + dx;
          const y = centerY + dy;
          
          if (x >= 0 && x < width && y >= 0 && y < height) {
            totalBrightness += this.getPixelBrightness(data, width, height, x, y);
            pixelCount++;
          }
        }
      }
    }
    
    return pixelCount > 0 ? totalBrightness / pixelCount : 128;
  }
  
  private static isSkinColorAdvanced(r: number, g: number, b: number): boolean {
    // Algoritmo RGB aprimorado
    const rgbCheck = r > 95 && g > 40 && b > 20 && 
                   Math.max(r, g, b) - Math.min(r, g, b) > 15 &&
                   Math.abs(r - g) > 15 && r > g && r > b;
    
    // Algoritmo YCbCr mais rigoroso
    const y = 0.299 * r + 0.587 * g + 0.114 * b;
    const cb = -0.169 * r - 0.331 * g + 0.5 * b + 128;
    const cr = 0.5 * r - 0.419 * g - 0.081 * b + 128;
    const ycbcrCheck = y > 70 && cb >= 77 && cb <= 127 && cr >= 133 && cr <= 173;
    
    // Algoritmo HSV refinado
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    
    let h = 0;
    if (delta !== 0) {
      if (max === r) h = ((g - b) / delta) % 6;
      else if (max === g) h = (b - r) / delta + 2;
      else h = (r - g) / delta + 4;
    }
    h = h * 60;
    if (h < 0) h += 360;
    
    const s = max === 0 ? 0 : delta / max;
    const v = max / 255;
    
    const hsvCheck = ((h >= 0 && h <= 60) || (h >= 320 && h <= 360)) && s >= 0.1 && v >= 0.2;
    
    return rgbCheck || ycbcrCheck || hsvCheck;
  }
  
  static calculateGlassesScale(faceMeasurements: FaceMeasurements): number {
    const { eyeDistancePixels, faceWidthPixels } = faceMeasurements;
    
    // Escala baseada na distância dos olhos (mais precisa)
    const idealGlassesWidthRatio = 0.75; // Óculos devem cobrir 75% da distância dos olhos
    const idealGlassesWidth = eyeDistancePixels * 2.2; // Largura total dos óculos
    
    const standardGlassesWidth = 180; // pixels para armação padrão
    const calculatedScale = idealGlassesWidth / standardGlassesWidth;
    
    // Limitar escala para evitar extremos
    const finalScale = Math.max(0.4, Math.min(2.0, calculatedScale));
    
    console.log('Cálculo de escala refinado:', {
      eyeDistancePixels,
      idealGlassesWidth,
      calculatedScale,
      finalScale
    });
    
    return finalScale;
  }
  
  static calculateGlassesPosition(faceDetection: FaceDetection): { x: number; y: number } {
    // Posicionar óculos exatamente na linha dos olhos
    const centerX = (faceDetection.leftEye.x + faceDetection.rightEye.x) / 2;
    const centerY = (faceDetection.leftEye.y + faceDetection.rightEye.y) / 2;
    
    console.log('Posição calculada dos óculos:', { centerX, centerY });
    
    return { x: centerX, y: centerY };
  }
}
