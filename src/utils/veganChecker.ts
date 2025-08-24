import { VEGAN_RULES, VeganResult } from '@/data/veganData';

export interface VeganCheckResult {
  result: VeganResult;
  reasons: string[];
  extractedText: string;
}

export const checkVeganStatus = (text: string): VeganCheckResult => {
  const cleanText = text.toLowerCase().replace(/[^\w\s]/g, ' ');
  const words = cleanText.split(/\s+/);
  
  const foundNotVegan: string[] = [];
  const foundUnclear: string[] = [];

  // Check for non-vegan ingredients
  VEGAN_RULES.notVegan.forEach(ingredient => {
    if (cleanText.includes(ingredient.toLowerCase())) {
      foundNotVegan.push(ingredient);
    }
  });

  // Check for unclear ingredients
  VEGAN_RULES.unclear.forEach(ingredient => {
    if (cleanText.includes(ingredient.toLowerCase())) {
      foundUnclear.push(ingredient);
    }
  });

  let result: VeganResult;
  let reasons: string[] = [];

  if (foundNotVegan.length > 0) {
    result = 'not-vegan';
    reasons = foundNotVegan.map(item => `Contains ${item}`);
  } else if (foundUnclear.length > 0) {
    result = 'unclear';
    reasons = foundUnclear.map(item => `${item} - may not be vegan`);
  } else {
    result = 'vegan';
    reasons = ['No non-vegan ingredients detected'];
  }

  return {
    result,
    reasons,
    extractedText: text
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