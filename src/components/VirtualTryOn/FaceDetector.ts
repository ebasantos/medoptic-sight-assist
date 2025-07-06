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
    
    console.log('Detecção facial aprimorada:', detection);
    return detection;
  }
  
  private static async analyzeImageForFaceFeatures(
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number
  ): Promise<FaceDetection> {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Detectar região da face usando análise de cor de pele
    const faceRegion = this.detectFaceRegion(data, width, height);
    
    // Detectar olhos dentro da região facial com maior precisão
    const eyePositions = this.detectEyePositionsWithPrecision(data, width, height, faceRegion);
    
    // Calcular métricas faciais
    const eyeDistance = Math.sqrt(
      Math.pow(eyePositions.rightEye.x - eyePositions.leftEye.x, 2) +
      Math.pow(eyePositions.rightEye.y - eyePositions.leftEye.y, 2)
    );
    
    const centerX = (eyePositions.leftEye.x + eyePositions.rightEye.x) / 2;
    const noseBridgeY = eyePositions.leftEye.y + 8; // Ajustado para ficar mais próximo dos olhos
    
    return {
      leftEye: eyePositions.leftEye,
      rightEye: eyePositions.rightEye,
      eyeDistance: eyeDistance,
      faceWidth: faceRegion.width,
      faceHeight: faceRegion.height,
      noseBridge: { x: centerX, y: noseBridgeY },
      confidence: eyePositions.confidence
    };
  }
  
  private static detectFaceRegion(data: Uint8ClampedArray, width: number, height: number) {
    // Detectar região com cor de pele
    let minX = width, maxX = 0, minY = height, maxY = 0;
    let skinPixels = 0;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Detectar cor de pele usando múltiplos algoritmos
        if (this.isSkinColor(r, g, b)) {
          skinPixels++;
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      }
    }
    
    // Se não detectou pele suficiente, usar região central
    if (skinPixels < (width * height * 0.05)) {
      return {
        x: width * 0.25,
        y: height * 0.25,
        width: width * 0.5,
        height: height * 0.5,
        centerX: width * 0.5,
        centerY: height * 0.5
      };
    }
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2
    };
  }
  
  private static detectEyePositionsWithPrecision(
    data: Uint8ClampedArray, 
    width: number, 
    height: number, 
    faceRegion: any
  ) {
    // Região onde geralmente estão os olhos (terço superior da face)
    const eyeRegionY = faceRegion.y + faceRegion.height * 0.25; // Ajustado para ser mais alto
    const eyeRegionHeight = faceRegion.height * 0.25; // Região mais focada nos olhos
    
    // Buscar regiões escuras (olhos) na região dos olhos com maior precisão
    const leftEyeRegion = this.findEyeWithHighPrecision(
      data, width, height,
      faceRegion.x, 
      eyeRegionY,
      faceRegion.width * 0.45, // Metade esquerda
      eyeRegionHeight,
      'left'
    );
    
    const rightEyeRegion = this.findEyeWithHighPrecision(
      data, width, height,
      faceRegion.x + faceRegion.width * 0.55, // Metade direita
      eyeRegionY,
      faceRegion.width * 0.45,
      eyeRegionHeight,
      'right'
    );
    
    // Calcular confiança baseada na detecção
    const confidence = Math.min(0.95, Math.max(0.75, (leftEyeRegion.darkness + rightEyeRegion.darkness) / 2));
    
    console.log('Olhos detectados com alta precisão:', {
      leftEye: leftEyeRegion,
      rightEye: rightEyeRegion,
      confidence
    });
    
    return {
      leftEye: { x: leftEyeRegion.x, y: leftEyeRegion.y },
      rightEye: { x: rightEyeRegion.x, y: rightEyeRegion.y },
      confidence: confidence
    };
  }
  
  private static findEyeWithHighPrecision(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    startX: number,
    startY: number,
    regionWidth: number,
    regionHeight: number,
    side: 'left' | 'right'
  ) {
    let bestEyeX = startX + regionWidth / 2;
    let bestEyeY = startY + regionHeight / 2;
    let maxDarkness = 0;
    let totalDarkness = 0;
    let pixelCount = 0;
    
    const endX = Math.min(width, startX + regionWidth);
    const endY = Math.min(height, startY + regionHeight);
    
    // Procurar em uma grade mais fina para maior precisão
    const step = 2;
    for (let y = Math.max(0, startY); y < endY; y += step) {
      for (let x = Math.max(0, startX); x < endX; x += step) {
        const i = (Math.floor(y) * width + Math.floor(x)) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        const brightness = (r + g + b) / 3;
        const darkness = (255 - brightness) / 255;
        
        // Procurar padrões típicos de olhos (regiões escuras circulares)
        const eyeScore = this.calculateEyeScore(data, width, height, x, y, step);
        const combinedScore = darkness * 0.7 + eyeScore * 0.3;
        
        totalDarkness += darkness;
        pixelCount++;
        
        if (combinedScore > maxDarkness) {
          maxDarkness = combinedScore;
          bestEyeX = x;
          bestEyeY = y;
        }
      }
    }
    
    const avgDarkness = pixelCount > 0 ? totalDarkness / pixelCount : 0;
    
    return {
      x: bestEyeX,
      y: bestEyeY,
      darkness: avgDarkness,
      eyeScore: maxDarkness
    };
  }
  
  private static calculateEyeScore(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    centerX: number,
    centerY: number,
    radius: number = 8
  ): number {
    let darkPixels = 0;
    let totalPixels = 0;
    
    // Analisar uma pequena região circular ao redor do ponto
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance <= radius) {
          const x = centerX + dx;
          const y = centerY + dy;
          
          if (x >= 0 && x < width && y >= 0 && y < height) {
            const i = (Math.floor(y) * width + Math.floor(x)) * 4;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const brightness = (r + g + b) / 3;
            
            if (brightness < 100) { // Pixel escuro (típico de olho/pupila)
              darkPixels++;
            }
            totalPixels++;
          }
        }
      }
    }
    
    return totalPixels > 0 ? darkPixels / totalPixels : 0;
  }
  
  private static isSkinColor(r: number, g: number, b: number): boolean {
    // Múltiplos algoritmos de detecção de cor de pele
    
    // Algoritmo 1: RGB
    const rgbCheck = r > 95 && g > 40 && b > 20 && 
                   Math.max(r, g, b) - Math.min(r, g, b) > 15 &&
                   Math.abs(r - g) > 15 && r > g && r > b;
    
    // Algoritmo 2: YCbCr (aproximado)
    const y = 0.299 * r + 0.587 * g + 0.114 * b;
    const cb = -0.169 * r - 0.331 * g + 0.5 * b + 128;
    const cr = 0.5 * r - 0.419 * g - 0.081 * b + 128;
    
    const ycbcrCheck = y > 80 && cb >= 85 && cb <= 135 && cr >= 135 && cr <= 180;
    
    // Algoritmo 3: HSV
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
    
    const hsvCheck = (h >= 0 && h <= 50) || (h >= 340 && h <= 360);
    
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
