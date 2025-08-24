import { GoogleGenerativeAI } from '@google/generative-ai';

export interface AIAnalysisResult {
  isVegan: 'vegan' | 'not-vegan' | 'unclear';
  confidence: number;
  reasoning: string[];
  problematicIngredients: Array<{
    ingredient: string;
    reason: string;
    severity: 'high' | 'medium' | 'low';
    alternatives?: string[];
  }>;
  veganIngredients: string[];
  unclearIngredients: Array<{
    ingredient: string;
    reason: string;
    recommendation: string;
  }>;
  productInfo: {
    brand?: string;
    productName?: string;
    category?: string;
    certifications?: string[];
  };
  nutritionalInsights?: {
    proteinSources?: string[];
    allergens?: string[];
    additives?: string[];
  };
  trustScore: number;
  recommendations: string[];
}

class GeminiAIService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;

  constructor() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (apiKey && apiKey !== 'your_gemini_api_key_here') {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    }
  }

  isConfigured(): boolean {
    return this.genAI !== null && this.model !== null;
  }

  async analyzeIngredients(extractedText: string, imageBase64?: string): Promise<AIAnalysisResult> {
    if (!this.isConfigured()) {
      throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env file.');
    }

    const prompt = this.buildAnalysisPrompt(extractedText);

    try {
      let result;
      
      if (imageBase64) {
        // Multi-modal analysis with image
        const imageParts = [
          {
            inlineData: {
              data: imageBase64.split(',')[1], // Remove data:image/jpeg;base64, prefix
              mimeType: 'image/jpeg'
            }
          }
        ];
        
        result = await this.model.generateContent([prompt, ...imageParts]);
      } else {
        // Text-only analysis
        result = await this.model.generateContent(prompt);
      }

      const response = await result.response;
      const analysisText = response.text();
      
      return this.parseAIResponse(analysisText, extractedText);
      
    } catch (error) {
      console.error('Gemini AI analysis failed:', error);
      throw new Error('AI analysis failed. Please try again.');
    }
  }

  private buildAnalysisPrompt(extractedText: string): string {
    return `You are an expert vegan nutritionist and food scientist. Analyze the following product ingredients and provide a comprehensive vegan assessment.

EXTRACTED TEXT FROM PRODUCT:
"${extractedText}"

Please provide a detailed analysis in JSON format with the following structure:

{
  "isVegan": "vegan" | "not-vegan" | "unclear",
  "confidence": number (0-100),
  "reasoning": ["detailed reason 1", "detailed reason 2"],
  "problematicIngredients": [
    {
      "ingredient": "ingredient name",
      "reason": "why it's not vegan",
      "severity": "high" | "medium" | "low",
      "alternatives": ["alternative 1", "alternative 2"]
    }
  ],
  "veganIngredients": ["list of confirmed vegan ingredients"],
  "unclearIngredients": [
    {
      "ingredient": "ingredient name",
      "reason": "why it's unclear",
      "recommendation": "what to do about it"
    }
  ],
  "productInfo": {
    "brand": "detected brand name",
    "productName": "detected product name",
    "category": "food category",
    "certifications": ["any vegan certifications found"]
  },
  "nutritionalInsights": {
    "proteinSources": ["protein sources found"],
    "allergens": ["allergens present"],
    "additives": ["artificial additives"]
  },
  "trustScore": number (0-100),
  "recommendations": ["actionable recommendations for the user"]
}

ANALYSIS GUIDELINES:
1. Be extremely thorough and accurate - vegans depend on this information
2. Consider hidden animal products (like vitamin D3 from sheep wool, L-cysteine from hair/feathers)
3. Identify processing aids that might not be listed but could be used
4. Consider cross-contamination risks if mentioned
5. Provide specific alternatives for non-vegan ingredients
6. Explain the source and function of each problematic ingredient
7. Rate confidence based on ingredient clarity and completeness of information
8. Include trust score based on transparency of labeling and ingredient sourcing
9. Consider regional differences in ingredient sourcing
10. Flag ingredients that are sometimes vegan, sometimes not (like sugar, natural flavors)

Be helpful, educational, and honest about uncertainties. If information is unclear, suggest how the user can get definitive answers.`;
  }

  private parseAIResponse(aiResponse: string, originalText: string): AIAnalysisResult {
    try {
      // Extract JSON from the response (AI might include extra text)
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response');
      }

      const parsedResult = JSON.parse(jsonMatch[0]);
      
      // Validate and normalize the response
      return {
        isVegan: parsedResult.isVegan || 'unclear',
        confidence: Math.min(100, Math.max(0, parsedResult.confidence || 50)) / 100,
        reasoning: Array.isArray(parsedResult.reasoning) ? parsedResult.reasoning : ['AI analysis completed'],
        problematicIngredients: Array.isArray(parsedResult.problematicIngredients) ? parsedResult.problematicIngredients : [],
        veganIngredients: Array.isArray(parsedResult.veganIngredients) ? parsedResult.veganIngredients : [],
        unclearIngredients: Array.isArray(parsedResult.unclearIngredients) ? parsedResult.unclearIngredients : [],
        productInfo: parsedResult.productInfo || {},
        nutritionalInsights: parsedResult.nutritionalInsights || {},
        trustScore: Math.min(100, Math.max(0, parsedResult.trustScore || 50)) / 100,
        recommendations: Array.isArray(parsedResult.recommendations) ? parsedResult.recommendations : []
      };
      
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      
      // Fallback response if parsing fails
      return {
        isVegan: 'unclear',
        confidence: 0.3,
        reasoning: ['AI analysis failed to parse properly'],
        problematicIngredients: [],
        veganIngredients: [],
        unclearIngredients: [],
        productInfo: {},
        nutritionalInsights: {},
        trustScore: 0.2,
        recommendations: ['Please try again with a clearer image', 'Consider using the manual ingredient checker']
      };
    }
  }

  async analyzeWithImage(imageFile: File, extractedText: string): Promise<AIAnalysisResult> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64String = reader.result as string;
          const result = await this.analyzeIngredients(extractedText, base64String);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(imageFile);
    });
  }

  // Batch analysis for multiple images
  async analyzeBatch(images: Array<{ file: File; text: string; type: string }>): Promise<AIAnalysisResult> {
    if (!this.isConfigured()) {
      throw new Error('Gemini API key not configured');
    }

    // Combine all extracted text
    const combinedText = images
      .map(img => `=== ${img.type.toUpperCase()} ===\n${img.text}`)
      .join('\n\n');

    // Use the primary ingredients image if available, otherwise use the first image
    const primaryImage = images.find(img => img.type === 'ingredients') || images[0];
    
    if (primaryImage) {
      return this.analyzeWithImage(primaryImage.file, combinedText);
    } else {
      return this.analyzeIngredients(combinedText);
    }
  }
}

export const geminiAI = new GeminiAIService();
