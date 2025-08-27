import type { } from '';

export interface ProductLookupResult {
  barcode: string;
  brand?: string;
  productName?: string;
  ingredientsText?: string;
  imageUrl?: string;
  category?: string;
  packaging?: string;
  quantity?: string;
  nutriments?: {
    energyKcal_100g?: number;
    proteins_100g?: number;
    carbohydrates_100g?: number;
    fat_100g?: number;
    saturatedFat_100g?: number;
    sugars_100g?: number;
    fiber_100g?: number;
    salt_100g?: number;
    sodium_100g?: number;
  };
  ecoscoreScore?: number;
  ecoscoreGrade?: string;
  carbonFootprint_100g?: number;
  success: boolean;
  source: 'OpenFoodFacts';
}

/**
 * Look up product information by barcode using OpenFoodFacts.
 * Returns basic fields including ingredients text if available.
 */
export async function lookupProductByBarcode(barcode: string): Promise<ProductLookupResult> {
  console.log('ProductLookup: Looking up barcode:', barcode);

  const BASE = (import.meta as any).env?.VITE_OFF_BASE_URL || 'https://world.openfoodfacts.org';
  const url = `${BASE}/api/v2/product/${encodeURIComponent(barcode)}.json`;
  console.log('ProductLookup: Fetching from:', url);

  const attemptFetch = async (attempt: number): Promise<Response> => {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 10000);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'VeganVisionAI/1.0 (dev)'
        }
      } as RequestInit);
      return res;
    } finally {
      clearTimeout(t);
    }
  };

  try {
    // simple retry for transient CORS/CDN flakiness
    let res: Response | null = null;
    let lastErr: any = null;
    for (let i = 0; i < 3; i++) {
      try {
        res = await attemptFetch(i + 1);
        break;
      } catch (err) {
        lastErr = err;
        await new Promise(r => setTimeout(r, 250 * Math.pow(2, i))); // backoff
      }
    }

    if (!res) throw lastErr || new Error('Network error');

    if (!res.ok) {
      console.warn('ProductLookup: API returned status:', res.status);
      return {
        barcode,
        success: false,
        source: 'OpenFoodFacts'
      };
    }

    const data = await res.json();
    console.log('ProductLookup: API response status:', data.status);

    if (!data || data.status !== 1 || !data.product) {
      console.warn('ProductLookup: No product data found');
      return {
        barcode,
        success: false,
        source: 'OpenFoodFacts'
      };
    }

    const p = data.product;
    console.log('ProductLookup: Product found:', p.product_name);

    const result: ProductLookupResult = {
      barcode,
      brand: p.brands || p.brand_owner || p.manufacturer,
      productName: p.product_name || p.generic_name,
      ingredientsText: p.ingredients_text_en || p.ingredients_text,
      imageUrl: p.image_front_url || p.image_url || p.image_small_url,
      category: p.categories || p.category,
      packaging: p.packaging,
      quantity: p.quantity,
      nutriments: p.nutriments ? {
        energyKcal_100g: p.nutriments['energy-kcal_100g'] ?? p.nutriments['energy-kcal_value'] ?? p.nutriments['energy-kcal'],
        proteins_100g: p.nutriments['proteins_100g'],
        carbohydrates_100g: p.nutriments['carbohydrates_100g'],
        fat_100g: p.nutriments['fat_100g'],
        saturatedFat_100g: p.nutriments['saturated-fat_100g'],
        sugars_100g: p.nutriments['sugars_100g'],
        fiber_100g: p.nutriments['fiber_100g'],
        salt_100g: p.nutriments['salt_100g'],
        sodium_100g: p.nutriments['sodium_100g'],
      } : undefined,
      ecoscoreScore: p.ecoscore_score,
      ecoscoreGrade: p.ecoscore_grade,
      carbonFootprint_100g: p.nutriments ? (p.nutriments['carbon-footprint_100g'] || p.nutriments['carbon-footprint-from-meat-or-fish_100g']) : undefined,
      success: true,
      source: 'OpenFoodFacts'
    };

    console.log('ProductLookup: Successfully parsed product:', {
      name: result.productName,
      brand: result.brand,
      hasIngredients: !!result.ingredientsText
    });

    return result;

  } catch (error) {
    console.error('ProductLookup: Error during lookup:', error);
    return {
      barcode,
      success: false,
      source: 'OpenFoodFacts'
    };
  }
}


