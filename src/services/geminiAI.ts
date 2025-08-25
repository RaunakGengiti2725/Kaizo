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
  environmentalImpact?: {
    carbonFootprint?: {
      score: number; // 0-100 (higher is better)
      level: 'low' | 'medium' | 'high';
      details: string;
      factors?: string[];
    };
    waterUsage?: {
      score: number; // 0-100 (higher is better) 
      level: 'low' | 'medium' | 'high';
      details: string;
      estimatedLiters?: number;
    };
    packaging?: {
      recyclable: boolean;
      materials: string[];
      sustainabilityScore: number; // 0-100
    };
  };
  ethicalRating?: {
    overallScore: number; // 0-100
    palmOil?: {
      present: boolean;
      sustainable: boolean | 'unclear';
      certification?: string;
      concerns?: string[];
    };
    fairTrade?: {
      certified: boolean;
      certification?: string;
      details?: string;
    };
    laborPractices?: {
      score: number; // 0-100
      concerns?: string[];
      certifications?: string[];
    };
    animalTesting?: {
      policy: 'not-tested' | 'tested' | 'unclear';
      details?: string;
    };
  };
  trustScore: number;
  recommendations: string[];
}

export interface GeneratedRecipeCandidate {
  id: string;
  title: string;
  shortDescription: string;
  timeMinutes: number;
  mealType?: string;
  proteinSource?: string;
  cuisine?: string;
}

export interface GeneratedRecipeDetail extends GeneratedRecipeCandidate {
  ingredients: string[];
  steps: string[];
  servings?: number;
  nutrition?: {
    calories?: number;
    proteinGrams?: number;
    carbsGrams?: number;
    fatGrams?: number;
  };
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

  async generateRecipes(params: {
    mealType?: string;
    proteinSource?: string;
    cuisineOrFlavor?: string;
    timeMinutes?: number;
  }): Promise<GeneratedRecipeCandidate[]> {
    if (!this.isConfigured()) {
      throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env file.');
    }

    const prompt = this.buildRecipePrompt(params);

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      return this.parseRecipeCandidates(text);
    } catch (error) {
      console.error('Gemini recipe generation failed:', error);
      throw new Error('Recipe generation failed. Please try again.');
    }
  }

  async expandRecipe(candidate: GeneratedRecipeCandidate): Promise<GeneratedRecipeDetail> {
    if (!this.isConfigured()) {
      throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env file.');
    }

    const prompt = this.buildRecipeDetailPrompt(candidate);
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      return this.parseRecipeDetail(text, candidate);
    } catch (error) {
      console.error('Gemini recipe detail generation failed:', error);
      throw new Error('Could not fetch full recipe. Please try another option.');
    }
  }

  private buildRecipePrompt(params: {
    mealType?: string;
    proteinSource?: string;
    cuisineOrFlavor?: string;
    timeMinutes?: number;
  }): string {
    const parts: string[] = [];
    if (params.mealType) parts.push(`Meal Type: ${params.mealType}`);
    if (params.proteinSource) parts.push(`Protein Source: ${params.proteinSource}`);
    if (params.cuisineOrFlavor) parts.push(`Cuisine/Flavor: ${params.cuisineOrFlavor}`);
    if (params.timeMinutes) parts.push(`Max Time: ${params.timeMinutes} minutes`);

    return `You are a helpful vegan chef. Generate exactly THREE distinct vegan recipe ideas that match the user's filters.

USER FILTERS:
${parts.join('\n') || 'None provided'}

Return JSON ONLY in this exact shape:
{
  "recipes": [
    {"id": "r1", "title": "...", "shortDescription": "...", "timeMinutes": 25, "mealType": "...", "proteinSource": "...", "cuisine": "..."},
    {"id": "r2", "title": "...", "shortDescription": "...", "timeMinutes": 35, "mealType": "...", "proteinSource": "...", "cuisine": "..."},
    {"id": "r3", "title": "...", "shortDescription": "...", "timeMinutes": 45, "mealType": "...", "proteinSource": "...", "cuisine": "..."}
  ]
}`;
  }

  private buildRecipeDetailPrompt(candidate: GeneratedRecipeCandidate): string {
    return `Create a complete VEGAN recipe based on this candidate.

CANDIDATE:
${JSON.stringify(candidate, null, 2)}

Return JSON ONLY in this exact shape:
{
  "id": "${candidate.id}",
  "title": "...",
  "shortDescription": "...",
  "timeMinutes": ${candidate.timeMinutes || 30},
  "mealType": "${candidate.mealType || ''}",
  "proteinSource": "${candidate.proteinSource || ''}",
  "cuisine": "${candidate.cuisine || ''}",
  "ingredients": ["..."],
  "steps": ["..."],
  "servings": 2,
  "nutrition": {"calories": 480, "proteinGrams": 25, "carbsGrams": 60, "fatGrams": 15}
}`;
  }

  private parseRecipeCandidates(aiText: string): GeneratedRecipeCandidate[] {
    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found for recipe candidates');
    }
    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.recipes || !Array.isArray(parsed.recipes)) {
      throw new Error('Invalid recipe candidates format');
    }
    return parsed.recipes.map((r: any, idx: number) => ({
      id: r.id || `r${idx + 1}`,
      title: r.title || `Recipe ${idx + 1}`,
      shortDescription: r.shortDescription || 'A tasty vegan dish.',
      timeMinutes: Number(r.timeMinutes) || 30,
      mealType: r.mealType,
      proteinSource: r.proteinSource,
      cuisine: r.cuisine,
    }));
  }

  private parseRecipeDetail(aiText: string, fallback: GeneratedRecipeCandidate): GeneratedRecipeDetail {
    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      // Fallback minimal detail
      return {
        ...fallback,
        ingredients: ['1 cup ingredient A', '1 cup ingredient B'],
        steps: ['Step 1', 'Step 2', 'Step 3'],
      };
    }
    const r = JSON.parse(jsonMatch[0]);
    return {
      id: r.id || fallback.id,
      title: r.title || fallback.title,
      shortDescription: r.shortDescription || fallback.shortDescription,
      timeMinutes: Number(r.timeMinutes) || fallback.timeMinutes,
      mealType: r.mealType || fallback.mealType,
      proteinSource: r.proteinSource || fallback.proteinSource,
      cuisine: r.cuisine || fallback.cuisine,
      ingredients: Array.isArray(r.ingredients) ? r.ingredients : ['Step 1', 'Step 2'],
      steps: Array.isArray(r.steps) ? r.steps : ['Mix and cook.'],
      servings: r.servings,
      nutrition: r.nutrition,
    };
  }

  private buildAnalysisPrompt(extractedText: string): string {
    return `You are an expert vegan nutritionist, environmental scientist, and ethical consumption specialist. Analyze the following product ingredients and provide a comprehensive assessment covering vegan status, environmental impact, and ethical considerations.

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
  "environmentalImpact": {
    "carbonFootprint": {
      "score": number (0-100, higher is better),
      "level": "low" | "medium" | "high",
      "details": "explanation of carbon impact",
      "factors": ["key factors affecting carbon footprint"]
    },
    "waterUsage": {
      "score": number (0-100, higher is better),
      "level": "low" | "medium" | "high", 
      "details": "explanation of water usage",
      "estimatedLiters": number (estimated liters per serving/unit)
    },
    "packaging": {
      "recyclable": boolean,
      "materials": ["packaging materials"],
      "sustainabilityScore": number (0-100)
    }
  },
  "ethicalRating": {
    "overallScore": number (0-100),
    "palmOil": {
      "present": boolean,
      "sustainable": boolean | "unclear",
      "certification": "RSPO" | "other certification" | null,
      "concerns": ["specific concerns about palm oil"]
    },
    "fairTrade": {
      "certified": boolean,
      "certification": "certification body name",
      "details": "details about fair trade practices"
    },
    "laborPractices": {
      "score": number (0-100),
      "concerns": ["labor practice concerns"],
      "certifications": ["relevant certifications"]
    },
    "animalTesting": {
      "policy": "not-tested" | "tested" | "unclear",
      "details": "details about animal testing policy"
    }
  },
  "trustScore": number (0-100),
  "recommendations": ["actionable recommendations for the user"]
}

ANALYSIS GUIDELINES:

VEGAN ANALYSIS:
1. Be extremely thorough and accurate - vegans depend on this information
2. Consider hidden animal products (like vitamin D3 from sheep wool, L-cysteine from hair/feathers)
3. Identify processing aids that might not be listed but could be used
4. Consider cross-contamination risks if mentioned
5. Provide specific alternatives for non-vegan ingredients
6. Explain the source and function of each problematic ingredient
7. Rate confidence based on ingredient clarity and completeness of information
8. Consider regional differences in ingredient sourcing
9. Flag ingredients that are sometimes vegan, sometimes not (like sugar, natural flavors)

ENVIRONMENTAL IMPACT ANALYSIS:
10. Assess carbon footprint based on ingredient types (e.g., tropical oils, imported ingredients, processed foods)
11. Consider water usage for ingredient production (nuts, tropical fruits, grains vs. processed items)
12. Evaluate packaging materials and recyclability from visible packaging
13. Factor in transportation impact for non-local ingredients
14. Consider processing intensity and energy requirements
15. Higher scores (80-100) for low-impact local plants, medium scores (40-79) for moderate impact, low scores (0-39) for high-impact ingredients

ETHICAL RATING ANALYSIS:
16. Check for palm oil and assess if sustainable (RSPO certification or alternatives)
17. Look for fair trade certifications (Fair Trade, Rainforest Alliance, etc.)
18. Consider labor practices based on ingredient origins and brand reputation
19. Assess animal testing policies (especially for additives, vitamins, artificial ingredients)
20. Evaluate corporate social responsibility indicators
21. Consider supply chain transparency and traceability

SCORING METHODOLOGY:
- Environmental scores: Higher is better (100 = excellent environmental impact)
- Ethical scores: Higher is better (100 = excellent ethical practices)
- Trust score: Based on transparency, certifications, and information completeness
- Be conservative with scores when information is limited

Be helpful, educational, and honest about uncertainties. If information is unclear, suggest how the user can get definitive answers. Prioritize consumer education about environmental and ethical impacts alongside vegan status.`;
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

  async chatAboutRecipe(recipe: GeneratedRecipeDetail, userMessage: string): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('Gemini API key not configured. Please add VITE_GEMINI_API_KEY to your .env file.');
    }

    const prompt = this.buildChatPrompt(recipe, userMessage);

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini chat failed:', error);
      throw new Error('Chat failed. Please try again.');
    }
  }

  private buildChatPrompt(recipe: GeneratedRecipeDetail, userMessage: string): string {
    const recipeInfo = `
RECIPE: ${recipe.title}
DESCRIPTION: ${recipe.shortDescription}
TIME: ${recipe.timeMinutes} minutes
MEAL TYPE: ${recipe.mealType || 'Not specified'}
PROTEIN: ${recipe.proteinSource || 'Not specified'}
CUISINE: ${recipe.cuisine || 'Not specified'}
INGREDIENTS: ${recipe.ingredients.join(', ')}
INSTRUCTIONS: ${recipe.steps.join(' | ')}
SERVINGS: ${recipe.servings || 'Not specified'}
NUTRITION: ${recipe.nutrition ? JSON.stringify(recipe.nutrition) : 'Not specified'}
`;

    return `You are a helpful vegan cooking assistant. A user is asking about this specific recipe:

${recipeInfo}

USER QUESTION: "${userMessage}"

Please provide a helpful, accurate response about this recipe. Be conversational and friendly. You can help with:
- Ingredient substitutions or alternatives
- Cooking techniques and tips
- Dietary modifications (allergies, preferences)
- Scaling the recipe
- Nutritional questions
- Serving suggestions
- Storage and reheating advice
- Variations and customizations

Keep your response concise but informative. If the question is about something not related to this recipe, politely redirect to recipe-related topics.`;
  }
}

export const geminiAI = new GeminiAIService();
