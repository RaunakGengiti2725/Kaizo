import Tesseract from 'tesseract.js';

export interface ProcessedText {
  text: string;
  confidence: number;
  source: 'front' | 'back' | 'ingredients' | 'additional';
  words: Array<{
    text: string;
    confidence: number;
    bbox: {
      x0: number;
      y0: number;
      x1: number;
      y1: number;
    };
  }>;
}

export interface ImageProcessingResult {
  extractedTexts: ProcessedText[];
  combinedText: string;
  overallConfidence: number;
  processingTime: number;
}

export class ImageProcessor {
  private static instance: ImageProcessor;
  private worker: Tesseract.Worker | null = null;

  private constructor() {}

  public static getInstance(): ImageProcessor {
    if (!ImageProcessor.instance) {
      ImageProcessor.instance = new ImageProcessor();
    }
    return ImageProcessor.instance;
  }

  public async initialize(): Promise<void> {
    if (this.worker) return;

    this.worker = await Tesseract.createWorker('eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      }
    });

    // Optimize for ingredient lists and food labels
    await this.worker.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,()%- ',
      preserve_interword_spaces: '1',
      tessedit_pageseg_mode: Tesseract.PSM.AUTO,
    });
  }

  public async processImages(images: Array<{ file: File; type: 'front' | 'back' | 'ingredients' | 'additional' }>): Promise<ImageProcessingResult> {
    const startTime = Date.now();
    
    if (!this.worker) {
      await this.initialize();
    }

    const extractedTexts: ProcessedText[] = [];

    for (const image of images) {
      try {
        // Preprocess image for better OCR
        const preprocessedImage = await this.preprocessImage(image.file);
        
        // Extract text with detailed results
        const result = await this.worker!.recognize(preprocessedImage);
        
        const processedText: ProcessedText = {
          text: result.data.text,
          confidence: result.data.confidence / 100,
          source: image.type,
          words: result.data.words.map(word => ({
            text: word.text,
            confidence: word.confidence / 100,
            bbox: word.bbox
          }))
        };

        extractedTexts.push(processedText);
      } catch (error) {
        console.error(`Error processing ${image.type} image:`, error);
        // Continue with other images even if one fails
        extractedTexts.push({
          text: '',
          confidence: 0,
          source: image.type,
          words: []
        });
      }
    }

    // Combine texts intelligently based on source priority
    const combinedText = this.combineTexts(extractedTexts);
    const overallConfidence = this.calculateOverallConfidence(extractedTexts);
    const processingTime = Date.now() - startTime;

    return {
      extractedTexts,
      combinedText,
      overallConfidence,
      processingTime
    };
  }

  private async preprocessImage(file: File): Promise<HTMLCanvasElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Set canvas size
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw original image
        ctx.drawImage(img, 0, 0);

        // Get image data for processing
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Apply image enhancements
        this.enhanceContrast(data);
        this.sharpenText(data, canvas.width, canvas.height);
        this.removeShadows(data);

        // Put processed data back
        ctx.putImageData(imageData, 0, 0);
        
        resolve(canvas);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  private enhanceContrast(data: Uint8ClampedArray): void {
    const factor = 1.5; // Contrast enhancement factor
    
    for (let i = 0; i < data.length; i += 4) {
      // Apply contrast enhancement to RGB channels
      data[i] = Math.min(255, Math.max(0, (data[i] - 128) * factor + 128));     // R
      data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * factor + 128)); // G
      data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * factor + 128)); // B
    }
  }

  private sharpenText(data: Uint8ClampedArray, width: number, height: number): void {
    const sharpenKernel = [
      0, -1, 0,
      -1, 5, -1,
      0, -1, 0
    ];

    const tempData = new Uint8ClampedArray(data);

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        for (let channel = 0; channel < 3; channel++) {
          let sum = 0;
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const pixelIndex = ((y + ky) * width + (x + kx)) * 4 + channel;
              const kernelIndex = (ky + 1) * 3 + (kx + 1);
              sum += tempData[pixelIndex] * sharpenKernel[kernelIndex];
            }
          }
          const currentIndex = (y * width + x) * 4 + channel;
          data[currentIndex] = Math.min(255, Math.max(0, sum));
        }
      }
    }
  }

  private removeShadows(data: Uint8ClampedArray): void {
    // Simple shadow removal by brightening dark areas
    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      
      if (avg < 100) { // Dark areas
        const boost = (100 - avg) * 0.3;
        data[i] = Math.min(255, data[i] + boost);     // R
        data[i + 1] = Math.min(255, data[i + 1] + boost); // G
        data[i + 2] = Math.min(255, data[i + 2] + boost); // B
      }
    }
  }

  private combineTexts(extractedTexts: ProcessedText[]): string {
    // Priority order for combining texts
    const priority = ['ingredients', 'back', 'front', 'additional'];
    
    let combinedText = '';
    
    for (const type of priority) {
      const textData = extractedTexts.find(et => et.source === type);
      if (textData && textData.text.trim()) {
        if (combinedText) combinedText += '\n\n';
        combinedText += `=== ${type.toUpperCase()} ===\n${textData.text.trim()}`;
      }
    }

    return combinedText || extractedTexts
      .filter(et => et.text.trim())
      .map(et => et.text.trim())
      .join('\n\n');
  }

  private calculateOverallConfidence(extractedTexts: ProcessedText[]): number {
    const validTexts = extractedTexts.filter(et => et.confidence > 0);
    
    if (validTexts.length === 0) return 0;
    
    // Weight confidence by text length and source importance
    const weights = {
      ingredients: 3,
      back: 2,
      front: 1.5,
      additional: 1
    };

    let weightedSum = 0;
    let totalWeight = 0;

    validTexts.forEach(et => {
      const weight = weights[et.source] * Math.log(et.text.length + 1);
      weightedSum += et.confidence * weight;
      totalWeight += weight;
    });

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  public async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}

// Enhanced text cleaning utilities
export const cleanExtractedText = (text: string): string => {
  return text
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Fix common OCR errors
    .replace(/\b0\b/g, 'O') // Zero to O
    .replace(/\b1\b/g, 'I') // One to I in ingredient names
    .replace(/\|/g, 'l') // Pipe to lowercase L
    // Normalize punctuation
    .replace(/[,;]+/g, ',')
    .replace(/\.\s*\./g, '.')
    // Remove line breaks within words
    .replace(/(\w)-\s*\n\s*(\w)/g, '$1$2')
    // Normalize ingredient separators
    .replace(/[,;]\s*/g, ', ')
    .trim();
};

export const extractIngredientsList = (text: string): string[] => {
  // Look for ingredients section
  const ingredientsMatch = text.match(/ingredients?:?\s*([^.]*?)(?:\n|$|\.)/i);
  let ingredientsText = ingredientsMatch ? ingredientsMatch[1] : text;

  // Clean and split ingredients
  const ingredients = ingredientsText
    .split(/[,;]/)
    .map(ingredient => 
      ingredient
        .trim()
        .replace(/^\d+\.?\s*/, '') // Remove numbering
        .replace(/\([^)]*\)/g, '') // Remove parenthetical content
        .trim()
    )
    .filter(ingredient => 
      ingredient.length > 2 && 
      !/^\d+$/.test(ingredient) && // Remove pure numbers
      !/^[%\-\s]*$/.test(ingredient) // Remove symbols-only strings
    );

  return ingredients;
};

// Singleton instance export
export const imageProcessor = ImageProcessor.getInstance();
