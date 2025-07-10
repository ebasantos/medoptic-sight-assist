// OpenCV-based pupil detection utilities
declare global {
  interface Window {
    cv: any;
  }
}

export interface PupilDetectionResult {
  leftPupil: { x: number; y: number; confidence: number } | null;
  rightPupil: { x: number; y: number; confidence: number } | null;
  faceCenter: { x: number; y: number } | null;
}

export class OpenCVPupilDetector {
  private cv: any;
  private isReady: boolean = false;

  constructor() {
    this.initializeOpenCV();
  }

  private async initializeOpenCV(): Promise<void> {
    return new Promise((resolve) => {
      if (window.cv && window.cv.Mat) {
        this.cv = window.cv;
        this.isReady = true;
        resolve();
        return;
      }

      // Load OpenCV.js
      const script = document.createElement('script');
      script.src = 'https://docs.opencv.org/4.8.0/opencv.js';
      script.onload = () => {
        window.cv['onRuntimeInitialized'] = () => {
          this.cv = window.cv;
          this.isReady = true;
          resolve();
        };
      };
      document.head.appendChild(script);
    });
  }

  async detectPupils(imageElement: HTMLImageElement): Promise<PupilDetectionResult> {
    if (!this.isReady) {
      await this.initializeOpenCV();
    }

    try {
      // Create canvas to extract image data
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      canvas.width = imageElement.width;
      canvas.height = imageElement.height;
      ctx.drawImage(imageElement, 0, 0);

      // Convert to OpenCV Mat
      const src = this.cv.imread(canvas);
      const gray = new this.cv.Mat();
      
      // Convert to grayscale
      this.cv.cvtColor(src, gray, this.cv.COLOR_RGBA2GRAY);
      
      // Apply Gaussian blur to reduce noise
      const blurred = new this.cv.Mat();
      this.cv.GaussianBlur(gray, blurred, new this.cv.Size(5, 5), 0);
      
      // Detect circles using HoughCircles for pupil detection
      const circles = new this.cv.Mat();
      this.cv.HoughCircles(
        blurred, 
        circles, 
        this.cv.HOUGH_GRADIENT,
        1, // dp - inverse ratio of accumulator resolution
        Math.min(imageElement.width, imageElement.height) * 0.1, // min distance between circles
        50, // higher threshold for edge detection
        30, // accumulator threshold for center detection
        Math.min(imageElement.width, imageElement.height) * 0.01, // min radius
        Math.min(imageElement.width, imageElement.height) * 0.05  // max radius
      );

      const pupils = this.processDetectedCircles(circles, imageElement.width, imageElement.height);
      
      // Clean up
      src.delete();
      gray.delete();
      blurred.delete();
      circles.delete();
      
      return pupils;
    } catch (error) {
      console.warn('OpenCV pupil detection failed:', error);
      return this.fallbackDetection(imageElement);
    }
  }

  private processDetectedCircles(circles: any, width: number, height: number): PupilDetectionResult {
    const detectedPupils: Array<{ x: number; y: number; confidence: number }> = [];
    
    // Extract circle data
    for (let i = 0; i < circles.cols; i++) {
      const x = circles.data32F[i * 3];
      const y = circles.data32F[i * 3 + 1];
      const radius = circles.data32F[i * 3 + 2];
      
      // Validate pupil position (should be in upper half and reasonable size)
      if (y < height * 0.7 && x > width * 0.2 && x < width * 0.8 && radius > 5 && radius < 50) {
        detectedPupils.push({
          x,
          y,
          confidence: this.calculateConfidence(x, y, radius, width, height)
        });
      }
    }

    // Sort by confidence and select best two
    detectedPupils.sort((a, b) => b.confidence - a.confidence);
    
    let leftPupil = null;
    let rightPupil = null;
    
    if (detectedPupils.length >= 2) {
      // Assign based on x position (left pupil has smaller x)
      const sorted = detectedPupils.slice(0, 2).sort((a, b) => a.x - b.x);
      leftPupil = sorted[0];
      rightPupil = sorted[1];
      
      // Validate pupil distance is reasonable
      const distance = Math.abs(rightPupil.x - leftPupil.x);
      const expectedDistance = width * 0.15; // approximately 15% of image width
      
      if (distance < expectedDistance * 0.5 || distance > expectedDistance * 2) {
        // Distance seems unreasonable, use fallback
        return this.fallbackDetection({ width, height } as HTMLImageElement);
      }
    }

    return {
      leftPupil,
      rightPupil,
      faceCenter: leftPupil && rightPupil ? {
        x: (leftPupil.x + rightPupil.x) / 2,
        y: (leftPupil.y + rightPupil.y) / 2
      } : null
    };
  }

  private calculateConfidence(x: number, y: number, radius: number, width: number, height: number): number {
    // Higher confidence for pupils in expected positions
    const centerX = width / 2;
    const expectedY = height * 0.4; // Eyes usually in upper 40% of image
    
    const xDistance = Math.abs(x - centerX) / (width / 2);
    const yDistance = Math.abs(y - expectedY) / (height / 2);
    const radiusScore = radius > 8 && radius < 25 ? 1 : 0.5;
    
    return (1 - Math.min(1, xDistance + yDistance)) * radiusScore;
  }

  private fallbackDetection(imageElement: HTMLImageElement): PupilDetectionResult {
    // Fallback to anatomical estimates
    const centerX = imageElement.width / 2;
    const eyeY = imageElement.height * 0.42;
    const eyeDistance = imageElement.width * 0.25;
    
    return {
      leftPupil: {
        x: centerX - eyeDistance,
        y: eyeY,
        confidence: 0.3
      },
      rightPupil: {
        x: centerX + eyeDistance,
        y: eyeY,
        confidence: 0.3
      },
      faceCenter: {
        x: centerX,
        y: eyeY
      }
    };
  }
}