export interface ProductLookupResult {
  barcode: string;
  brand?: string;
  productName?: string;
  ingredientsText?: string;
  imageUrl?: string;
  category?: string;
  packaging?: string;
  quantity?: string;
  success: boolean;
  source: 'OpenFoodFacts';
}

/**
 * Look up product information by barcode using OpenFoodFacts.
 * Returns basic fields including ingredients text if available.
 */
export async function lookupProductByBarcode(barcode: string): Promise<ProductLookupResult> {
  console.log('ProductLookup: Looking up barcode:', barcode);

  try {
    const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`;
    console.log('ProductLookup: Fetching from:', url);

    const res = await fetch(url, {
      timeout: 10000, // 10 second timeout
    });

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


