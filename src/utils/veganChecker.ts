import { VEGAN_RULES, VeganResult, CONFIDENCE_WEIGHTS, PRODUCT_CATEGORIES } from '@/data/veganData';
import { geminiAI, AIAnalysisResult } from '@/services/geminiAI';
import { userPreferences } from '@/services/userPreferences';

export interface IngredientMatch {
  ingredient: string;
  category: 'notVegan' | 'unclear' | 'vegan';
  confidence: number;
  context?: string;
  explanation?: string;
  severity?: 'high' | 'medium' | 'low';
  alternatives?: string[];
}

export interface VeganCheckResult {
  result: VeganResult;
  confidence: number;
  reasons: string[];
  extractedText: string;
  detectedIngredients: IngredientMatch[];
  productCategory?: string;
  brandName?: string;
  productName?: string;
  suggestions?: string[];
  aiAnalysis?: AIAnalysisResult;
  trustScore?: number;
  certifications?: string[];
  nutritionalInsights?: {
    proteinSources?: string[];
    allergens?: string[];
    additives?: string[];
  };
  environmentalImpact?: {
    carbonFootprint?: {
      score: number;
      level: 'low' | 'medium' | 'high';
      details: string;
      factors?: string[];
    };
    waterUsage?: {
      score: number;
      level: 'low' | 'medium' | 'high';
      details: string;
      estimatedLiters?: number;
    };
    packaging?: {
      recyclable: boolean;
      materials: string[];
      sustainabilityScore: number;
    };
  };
  /** AI-estimated carbon footprint summary (0-100, higher is better) */
  carbonFootprint?: {
    score: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'E';
    reasons: string[];
  };
  ethicalRating?: {
    overallScore: number;
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
      score: number;
      concerns?: string[];
      certifications?: string[];
    };
    animalTesting?: {
      policy: 'not-tested' | 'tested' | 'unclear';
      details?: string;
    };
  };
  veganScore?: number;
  overallScore?: number;
  negatives?: Array<{ label: string; value?: string; severity: 'high' | 'medium' | 'low' }>;
  positives?: Array<{ label: string; value?: string }>;
  alternatives?: Array<{ title: string; note?: string }>;
}

// AI-Powered Analysis (Primary Method)
export const checkVeganStatusWithAI = async (text: string, images?: Array<{ file: File; text: string; type: string }>, userId?: string): Promise<VeganCheckResult> => {
  try {
    let aiAnalysis: AIAnalysisResult;
    
    // Get user allergies for enhanced analysis
    const allergyWarnings = await userPreferences.getAllergyWarnings(userId);
    
    if (images && images.length > 0) {
      // Use batch analysis for multiple images
      aiAnalysis = await geminiAI.analyzeBatch(images, userId);
    } else {
      // Text-only analysis with user preferences
      aiAnalysis = await geminiAI.analyzeIngredients(text, undefined, userId);
    }

    // Convert AI analysis to VeganCheckResult format
    const detectedIngredients: IngredientMatch[] = [
      ...aiAnalysis.problematicIngredients.map(ing => ({
        ingredient: ing.ingredient,
        category: 'notVegan' as const,
        confidence: 0.95,
        explanation: ing.reason,
        severity: ing.severity,
        alternatives: ing.alternatives
      })),
      ...aiAnalysis.unclearIngredients.map(ing => ({
        ingredient: ing.ingredient,
        category: 'unclear' as const,
        confidence: 0.6,
        explanation: ing.reason
      })),
      ...aiAnalysis.veganIngredients.map(ing => ({
        ingredient: ing,
        category: 'vegan' as const,
        confidence: 0.9,
        explanation: 'Confirmed plant-based ingredient'
      }))
    ];

    // Compute carbon footprint score/grade from AI data when available
    const cfReasons: string[] = [];
    let cfScore: number | undefined = undefined;
    if (aiAnalysis.environmentalImpact?.carbonFootprint) {
      // AI returns score 0-100 where higher is better in our prompt
      cfScore = Math.max(0, Math.min(100, aiAnalysis.environmentalImpact.carbonFootprint.score ?? 50));
      const details = aiAnalysis.environmentalImpact.carbonFootprint.details;
      const factors = aiAnalysis.environmentalImpact.carbonFootprint.factors || [];
      if (details) cfReasons.push(details);
      if (factors.length > 0) cfReasons.push(...factors.map(f => `Factor: ${f}`));
    } else {
      // Lightweight heuristic fallback based on ingredients text
      const t = text.toLowerCase();
      cfScore = 70;
      if (t.includes('palm oil')) { cfScore -= 20; cfReasons.push('Contains palm oil (high deforestation risk)'); }
      if (t.includes('coconut oil')) { cfScore -= 5; cfReasons.push('Contains coconut oil (tropical import)'); }
      if (t.includes('chocolate') || t.includes('cocoa')) { cfScore -= 10; cfReasons.push('Contains cocoa (often high footprint)'); }
      if (t.includes('processed') || t.includes('artificial')) { cfScore -= 5; cfReasons.push('Highly processed ingredients'); }
      cfScore = Math.max(0, Math.min(100, cfScore));
    }

    const computeGrade = (score: number): 'A' | 'B' | 'C' | 'D' | 'E' => {
      if (score >= 90) return 'A';
      if (score >= 75) return 'B';
      if (score >= 60) return 'C';
      if (score >= 40) return 'D';
      return 'E';
    };

    return {
      result: aiAnalysis.isVegan,
      confidence: aiAnalysis.confidence,
      reasons: aiAnalysis.reasoning,
      extractedText: text,
      detectedIngredients,
      productCategory: aiAnalysis.productInfo.category,
      brandName: aiAnalysis.productInfo.brand,
      productName: aiAnalysis.productInfo.productName,
      suggestions: aiAnalysis.recommendations,
      aiAnalysis,
      trustScore: aiAnalysis.trustScore,
      certifications: aiAnalysis.productInfo.certifications,
      nutritionalInsights: aiAnalysis.nutritionalInsights,
      environmentalImpact: aiAnalysis.environmentalImpact,
      carbonFootprint: cfScore !== undefined ? { score: Math.round(cfScore), grade: computeGrade(cfScore), reasons: cfReasons.slice(0, 6) } : undefined,
      ethicalRating: aiAnalysis.ethicalRating,
      veganScore: Math.round(aiAnalysis.confidence * 100),
      overallScore: Math.max(0, Math.min(100, Math.round((aiAnalysis.trustScore || aiAnalysis.confidence) * 100))),
      negatives: [
        // Critical allergy warnings first
        ...allergyWarnings.map(allergy => {
          const hasAllergy = text.toLowerCase().includes(allergy.toLowerCase()) || 
                           aiAnalysis.problematicIngredients.some(ing => ing.ingredient.toLowerCase().includes(allergy.toLowerCase())) ||
                           aiAnalysis.veganIngredients.some(ing => ing.toLowerCase().includes(allergy.toLowerCase()));
          return hasAllergy ? { label: `⚠️ ALLERGY ALERT: Contains ${allergy}`, severity: 'high' as const } : null;
        }).filter(Boolean) as Array<{ label: string; severity: 'high' | 'medium' | 'low' }>,
        
        // Standard concerns
        ...(aiAnalysis.nutritionalInsights?.additives || []).map(add => ({ label: add, severity: 'medium' as const })),
        ...(aiAnalysis.ethicalRating?.palmOil?.concerns || []).map(concern => ({ label: concern, severity: 'high' as const })),
        ...(aiAnalysis.ethicalRating?.laborPractices?.concerns || []).map(concern => ({ label: concern, severity: 'medium' as const })),
        ...(aiAnalysis.environmentalImpact?.carbonFootprint?.level === 'high' ? [{ label: 'High carbon footprint', severity: 'medium' as const }] : []),
        ...(aiAnalysis.environmentalImpact?.waterUsage?.level === 'high' ? [{ label: 'High water usage', severity: 'medium' as const }] : [])
      ].slice(0, 8), // Increased to accommodate allergy warnings
      positives: [
        ...(aiAnalysis.nutritionalInsights?.proteinSources || []).map(p => ({ label: `Protein source: ${p}` })),
        ...(aiAnalysis.veganIngredients || []).slice(0, 2).map(v => ({ label: v })),
        ...(aiAnalysis.ethicalRating?.fairTrade?.certified ? [{ label: `Fair Trade: ${aiAnalysis.ethicalRating.fairTrade.certification}` }] : []),
        ...(aiAnalysis.ethicalRating?.animalTesting?.policy === 'not-tested' ? [{ label: 'Not tested on animals' }] : []),
        ...(aiAnalysis.environmentalImpact?.packaging?.recyclable ? [{ label: 'Recyclable packaging' }] : [])
      ].slice(0, 6),
      alternatives: (aiAnalysis.recommendations || []).slice(0, 3).map(r => ({ title: r }))
    };
  } catch (error) {
    console.error('AI analysis failed, falling back to pattern matching:', error);
    
    // Fallback to pattern matching if AI fails
    const fallbackResult = checkVeganStatusFallback(text);
    fallbackResult.reasons.unshift('AI analysis unavailable - using pattern matching');
    fallbackResult.suggestions?.unshift('For more accurate results, please check your API key configuration');
    return fallbackResult;
  }
};

// Enhanced Pattern Matching (Fallback Method)
export const checkVeganStatusFallback = (text: string): VeganCheckResult => {
  const cleanText = text.toLowerCase().replace(/[^\w\s]/g, ' ');
  const words = cleanText.split(/\s+/);
  
  const foundNotVegan: IngredientMatch[] = [];
  const foundUnclear: IngredientMatch[] = [];
  const foundVegan: IngredientMatch[] = [];

  // Enhanced ingredient detection with confidence scoring
  VEGAN_RULES.notVegan.forEach(ingredient => {
    const regex = new RegExp(`\\b${ingredient.toLowerCase()}\\b`, 'g');
    const matches = cleanText.match(regex);
    if (matches) {
      foundNotVegan.push({
        ingredient,
        category: 'notVegan',
        confidence: 0.85, // Reduced confidence for pattern matching
        explanation: getIngredientExplanation(ingredient, 'notVegan'),
        severity: getSeverity(ingredient) as 'high' | 'medium' | 'low'
      });
    }
  });

  VEGAN_RULES.unclear.forEach(ingredient => {
    const regex = new RegExp(`\\b${ingredient.toLowerCase()}\\b`, 'g');
    const matches = cleanText.match(regex);
    if (matches) {
      foundUnclear.push({
        ingredient,
        category: 'unclear',
        confidence: 0.5, // Lower confidence for pattern matching
        explanation: getIngredientExplanation(ingredient, 'unclear')
      });
    }
  });

  VEGAN_RULES.vegan.forEach(ingredient => {
    const regex = new RegExp(`\\b${ingredient.toLowerCase()}\\b`, 'g');
    const matches = cleanText.match(regex);
    if (matches) {
      foundVegan.push({
        ingredient,
        category: 'vegan',
        confidence: 0.8, // Good confidence for known vegan ingredients
        explanation: getIngredientExplanation(ingredient, 'vegan')
      });
    }
  });

  // Calculate overall confidence and result
  let result: VeganResult;
  let confidence: number;
  let reasons: string[] = [];
  let suggestions: string[] = [];

  if (foundNotVegan.length > 0) {
    result = 'not-vegan';
    confidence = Math.max(...foundNotVegan.map(item => item.confidence));
    reasons = foundNotVegan.map(item => `Contains ${item.ingredient} - ${item.explanation}`);
    suggestions = generateSuggestions(foundNotVegan, 'not-vegan');
  } else if (foundUnclear.length > 0) {
    result = 'unclear';
    confidence = Math.min(0.5, Math.max(...foundUnclear.map(item => item.confidence)));
    reasons = foundUnclear.map(item => `${item.ingredient} - ${item.explanation}`);
    suggestions = generateSuggestions(foundUnclear, 'unclear');
  } else if (foundVegan.length > 0) {
    result = 'vegan';
    confidence = 0.7; // Moderate confidence without AI verification
    reasons = ['Contains only recognized plant-based ingredients'];
    suggestions = ['This product appears to be vegan-friendly based on pattern matching'];
  } else {
    result = 'unclear';
    confidence = 0.2; // Low confidence if no ingredients detected
    reasons = ['Unable to identify sufficient ingredients for accurate analysis'];
    suggestions = ['Try taking a clearer photo of the ingredients list', 'Enable AI analysis for better results'];
  }

  // Detect product information
  const productInfo = extractProductInfo(text);

  return {
    result,
    confidence,
    reasons,
    extractedText: text,
    detectedIngredients: [...foundNotVegan, ...foundUnclear, ...foundVegan],
    productCategory: productInfo.category,
    brandName: productInfo.brand,
    productName: productInfo.name,
    suggestions,
    trustScore: confidence * 0.7, // Lower trust score for pattern matching
    carbonFootprint: (() => {
      // Very rough heuristic: fewer processed/additives -> better
      let score = 70;
      const reasonsCF: string[] = [];
      if (cleanText.includes('palm oil')) { score -= 20; reasonsCF.push('Contains palm oil'); }
      if (cleanText.includes('coconut oil')) { score -= 5; reasonsCF.push('Contains coconut oil'); }
      if (cleanText.includes('artificial') || cleanText.includes('additive')) { score -= 5; reasonsCF.push('Artificial additives'); }
      if (foundVegan.length > 5) { score += 5; reasonsCF.push('Many plant-based ingredients'); }
      const grade = (score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 40 ? 'D' : 'E') as 'A'|'B'|'C'|'D'|'E';
      return { score: Math.round(Math.max(0, Math.min(100, score))), grade, reasons: reasonsCF };
    })()
  };
};

// Legacy function for backward compatibility
export const checkVeganStatus = checkVeganStatusFallback;

const getIngredientExplanation = (ingredient: string, category: 'notVegan' | 'unclear' | 'vegan'): string => {
  const explanations: Record<string, Record<string, string>> = {
    notVegan: {
      'milk': 'Derived from dairy cows',
      'eggs': 'Animal-derived protein',
      'gelatin': 'Made from animal bones and skin',
      'honey': 'Produced by bees',
      'carmine': 'Red dye made from crushed insects',
      'whey': 'Milk protein byproduct',
      'casein': 'Milk protein',
      'rennet': 'Enzyme from animal stomach lining'
    },
    unclear: {
      'natural flavors': 'Could be plant or animal-derived',
      'vitamin d3': 'Often derived from sheep wool',
      'lecithin': 'Could be from soy or eggs',
      'sugar': 'May be processed with bone char',
      'glycerin': 'Could be plant or animal-derived'
    },
    vegan: {
      'soy': 'Plant-based protein source',
      'wheat': 'Plant-based grain',
      'coconut oil': 'Plant-based fat',
      'nutritional yeast': 'Vegan source of B vitamins'
    }
  };

  return explanations[category][ingredient.toLowerCase()] || 
         (category === 'notVegan' ? 'Animal-derived ingredient' : 
          category === 'unclear' ? 'Source unclear - may not be vegan' : 
          'Plant-based ingredient');
};

const getSeverity = (ingredient: string): string => {
  const highSeverity = ['milk', 'cheese', 'eggs', 'meat', 'beef', 'pork', 'chicken', 'fish', 'gelatin', 'honey'];
  const mediumSeverity = ['whey', 'casein', 'lactose', 'albumin', 'carmine', 'shellac'];
  
  if (highSeverity.some(severe => ingredient.toLowerCase().includes(severe.toLowerCase()))) {
    return 'high';
  } else if (mediumSeverity.some(medium => ingredient.toLowerCase().includes(medium.toLowerCase()))) {
    return 'medium';
  }
  return 'low';
};

const generateSuggestions = (ingredients: IngredientMatch[], result: 'not-vegan' | 'unclear'): string[] => {
  const suggestions: string[] = [];
  
  if (result === 'not-vegan') {
    suggestions.push('Look for certified vegan alternatives');
    suggestions.push('Check our recipes section for plant-based alternatives');
    
    if (ingredients.some(i => i.ingredient.includes('milk') || i.ingredient.includes('dairy'))) {
      suggestions.push('Try plant-based milk alternatives like oat, soy, or almond milk');
    }
    
    if (ingredients.some(i => i.ingredient.includes('egg'))) {
      suggestions.push('Look for egg-free versions or use flax/chia seeds as binding agents');
    }
  } else if (result === 'unclear') {
    suggestions.push('Contact the manufacturer to verify ingredient sources');
    suggestions.push('Look for products with certified vegan labels');
    suggestions.push('Check online vegan databases for this product');
  }
  
  return suggestions;
};

const extractProductInfo = (text: string): { category?: string, brand?: string, name?: string } => {
  // Simple pattern matching for common product categories
  const categories = Object.keys(PRODUCT_CATEGORIES);
  let detectedCategory: string | undefined;
  
  for (const category of categories) {
    const categoryIngredients = PRODUCT_CATEGORIES[category as keyof typeof PRODUCT_CATEGORIES];
    if (categoryIngredients.some(ingredient => 
      text.toLowerCase().includes(ingredient.toLowerCase())
    )) {
      detectedCategory = category;
      break;
    }
  }
  
  // Extract potential brand names (typically at the beginning of text)
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  const potentialBrand = lines[0]?.trim().split(' ')[0];
  
  return {
    category: detectedCategory,
    brand: potentialBrand && potentialBrand.length > 2 ? potentialBrand : undefined,
    name: lines[0]?.trim()
  };
};

export const highlightIngredients = (text: string): string => {
  let highlightedText = text;
  
  // Highlight non-vegan ingredients in red
  VEGAN_RULES.notVegan.forEach(ingredient => {
    const regex = new RegExp(`\\b${ingredient}\\b`, 'gi');
    highlightedText = highlightedText.replace(regex, `<mark class="bg-destructive/20 text-destructive">${ingredient}</mark>`);
  });

  // Highlight unclear ingredients in yellow
  VEGAN_RULES.unclear.forEach(ingredient => {
    const regex = new RegExp(`\\b${ingredient}\\b`, 'gi');
    highlightedText = highlightedText.replace(regex, `<mark class="bg-warning/20 text-warning-foreground">${ingredient}</mark>`);
  });

  return highlightedText;
};