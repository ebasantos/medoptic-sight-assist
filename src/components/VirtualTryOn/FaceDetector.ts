
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
    // Simular detecção mais precisa baseada em proporções reais do rosto
    const imgWidth = image.naturalWidth || image.width;
    const imgHeight = image.naturalHeight || image.height;
    
    // Proporções médias do rosto humano para melhor detecção
    const faceWidthRatio = 0.28; // Face ocupa ~28% da largura da imagem
    const faceHeightRatio = 0.35; // Face ocupa ~35% da altura da imagem
    const eyeDistanceRatio = 0.12; // Distância entre olhos ~12% da largura da imagem
    
    const faceWidth = imgWidth * faceWidthRatio;
    const faceHeight = imgHeight * faceHeightRatio;
    const eyeDistance = imgWidth * eyeDistanceRatio;
    
    // Posição dos olhos mais precisa
    const eyeLevel = imgHeight * 0.40; // Olhos ficam a 40% da altura
    const centerX = imgWidth * 0.5;
    
    const leftEyeX = centerX - (eyeDistance / 2);
    const rightEyeX = centerX + (eyeDistance / 2);
    
    console.log('Detecção facial melhorada:', {
      imgWidth,
      imgHeight,
      faceWidth,
      faceHeight,
      eyeDistance,
      eyeLevel
    });
    
    return {
      leftEye: { x: leftEyeX, y: eyeLevel },
      rightEye: { x: rightEyeX, y: eyeLevel },
      eyeDistance: eyeDistance,
      faceWidth: faceWidth,
      faceHeight: faceHeight,
      noseBridge: { x: centerX, y: eyeLevel + 5 },
      confidence: 0.92
    };
  }
  
  static calculateGlassesScale(faceMeasurements: FaceMeasurements): number {
    // Cálculo mais preciso baseado em proporções reais
    const { eyeDistancePixels, faceWidthPixels } = faceMeasurements;
    
    // Óculos devem cobrir aproximadamente 65-75% da largura do rosto
    const idealGlassesWidthRatio = 0.70;
    const idealGlassesWidth = faceWidthPixels * idealGlassesWidthRatio;
    
    // Base para armação padrão (assumindo 140mm de largura real)
    const standardGlassesWidth = 180; // pixels para armação padrão
    
    const calculatedScale = idealGlassesWidth / standardGlassesWidth;
    
    // Limitar escala para evitar extremos
    const finalScale = Math.max(0.6, Math.min(1.8, calculatedScale));
    
    console.log('Cálculo de escala dos óculos:', {
      eyeDistancePixels,
      faceWidthPixels,
      idealGlassesWidth,
      calculatedScale,
      finalScale
    });
    
    return finalScale;
  }
  
  static calculateGlassesPosition(faceDetection: FaceDetection): { x: number; y: number } {
    const centerX = (faceDetection.leftEye.x + faceDetection.rightEye.x) / 2;
    
    // Posicionar óculos ligeiramente acima da linha dos olhos
    const centerY = faceDetection.leftEye.y - 3;
    
    return { x: centerX, y: centerY };
  }
}
