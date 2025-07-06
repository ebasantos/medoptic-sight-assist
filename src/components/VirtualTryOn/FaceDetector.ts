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
    
    console.log('Detecção facial otimizada para óculos:', detection);
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
    
    // Detectar olhos com foco na linha exata dos olhos
    const eyePositions = this.detectExactEyePositions(data, width, height, faceRegion);
    
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
      noseBridge: { x: centerX, y: eyeLineY }, // Usar exatamente a linha dos olhos
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
  
  private static detectExactEyePositions(
    data: Uint8ClampedArray, 
    width: number, 
    height: number, 
    faceRegion: any
  ) {
    // Focar na região exata onde ficam os olhos (40% da altura da face)
    const eyeRegionY = faceRegion.y + faceRegion.height * 0.35;
    const eyeRegionHeight = faceRegion.height * 0.15; // Região muito específica
    
    console.log('Procurando olhos na região:', {
      y: eyeRegionY,
      height: eyeRegionHeight,
      faceWidth: faceRegion.width
    });
    
    // Buscar centro das pupilas com máxima precisão
    const leftEyeRegion = this.findEyeCenterPrecise(
      data, width, height,
      faceRegion.x, 
      eyeRegionY,
      faceRegion.width * 0.4, // Lado esquerdo
      eyeRegionHeight
    );
    
    const rightEyeRegion = this.findEyeCenterPrecise(
      data, width, height,
      faceRegion.x + faceRegion.width * 0.6, // Lado direito
      eyeRegionY,
      faceRegion.width * 0.4,
      eyeRegionHeight
    );
    
    // Garantir que os olhos estão na mesma linha horizontal
    const avgY = (leftEyeRegion.y + rightEyeRegion.y) / 2;
    
    const confidence = Math.min(0.95, Math.max(0.8, (leftEyeRegion.score + rightEyeRegion.score) / 2));
    
    console.log('Centros dos olhos detectados:', {
      leftEye: { x: leftEyeRegion.x, y: avgY },
      rightEye: { x: rightEyeRegion.x, y: avgY },
      confidence
    });
    
    return {
      leftEye: { x: leftEyeRegion.x, y: avgY },
      rightEye: { x: rightEyeRegion.x, y: avgY },
      confidence: confidence
    };
  }
  
  private static findEyeCenterPrecise(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    startX: number,
    startY: number,
    regionWidth: number,
    regionHeight: number
  ) {
    let bestX = startX + regionWidth / 2;
    let bestY = startY + regionHeight / 2;
    let maxScore = 0;
    
    const endX = Math.min(width, startX + regionWidth);
    const endY = Math.min(height, startY + regionHeight);
    
    // Procurar pelo centro do olho (iris/pupila)
    for (let y = Math.max(0, startY); y < endY; y += 2) {
      for (let x = Math.max(0, startX); x < endX; x += 2) {
        const eyeScore = this.calculateEyeCenterScore(data, width, height, x, y);
        
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
  
  private static calculateEyeCenterScore(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    centerX: number,
    centerY: number
  ): number {
    let darkCenter = 0;
    let lightSurround = 0;
    let totalPixels = 0;
    
    // Analisar padrão circular: centro escuro (pupila) com borda mais clara (iris/esclera)
    for (let dy = -8; dy <= 8; dy++) {
      for (let dx = -8; dx <= 8; dx++) {
        const distance = Math.sqrt(dx * dx + dy * dy);
        const x = centerX + dx;
        const y = centerY + dy;
        
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const i = (Math.floor(y) * width + Math.floor(x)) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const brightness = (r + g + b) / 3;
          
          if (distance <= 3) {
            // Centro deve ser escuro (pupila)
            if (brightness < 100) darkCenter++;
          } else if (distance <= 8) {
            // Ao redor deve ser mais claro (iris/esclera)
            if (brightness > 120) lightSurround++;
          }
          totalPixels++;
        }
      }
    }
    
    // Score baseado no contraste centro escuro vs borda clara
    const centerScore = darkCenter / 28; // ~28 pixels no centro
    const surroundScore = lightSurround / 100; // ~100 pixels na borda
    
    return (centerScore * 0.7) + (surroundScore * 0.3);
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
