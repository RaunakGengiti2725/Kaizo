import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BarcodeScanner, { BarcodeScannerRef } from '@/components/BarcodeScanner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, X, CheckCircle, AlertTriangle, Leaf, Carrot, TreePine } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { lookupProductByBarcode } from '@/services/productLookup';
import { checkVeganStatusWithAI, type VeganCheckResult } from '@/utils/veganChecker';
import { useDietMode } from '@/contexts/DietModeContext';

interface VeganResult {
  isVegan: boolean;
  confidence: number;
  productName?: string;
  ingredients?: string[];
  problematicIngredients?: string[];
  proteinSources?: string[];
  allergens?: string[];
  ecoScore?: number;
  reasoning?: string;
}

const Scan = () => {
  const { mode } = useDietMode();
  const [activeTab, setActiveTab] = useState<'barcode'>('barcode');
  const [barcode, setBarcode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [veganResult, setVeganResult] = useState<VeganResult | null>(null);
  const [productName, setProductName] = useState<string>('');
  const [brandName, setBrandName] = useState<string>('');
  const [productImageUrl, setProductImageUrl] = useState<string>('');
  const [dietClass, setDietClass] = useState<'vegan' | 'vegetarian' | 'neither'>('vegan');
  const [analysis, setAnalysis] = useState<VeganCheckResult | null>(null);
  
  const barcodeScannerRef = useRef<BarcodeScannerRef | null>(null);

  const handleBarcodeDetected = async (detectedBarcode: string) => {
    if (loading) return;
    
    setBarcode(detectedBarcode);
    setLoading(true);
    
    try {
      console.log('Processing barcode:', detectedBarcode);
      
      const productData = await lookupProductByBarcode(detectedBarcode);
      
      if (productData) {
        setProductName(productData.productName || 'Unknown Product');
        setBrandName(productData.brand || 'Unknown Brand');
        setProductImageUrl(productData.imageUrl || '');
        
        // Analyze ingredients with Gemini AI / detailed pipeline
        if (productData.ingredientsText) {
          const detailed = await analyzeIngredientsForVegan(productData.ingredientsText);
          let mergedSummary = detailed.summary;
          // Fallback to OpenFoodFacts ecoscore (0-100) if AI score missing
          if (!mergedSummary.ecoScore && typeof productData.ecoscoreScore === 'number') {
            mergedSummary = { ...mergedSummary, ecoScore: Math.round(productData.ecoscoreScore / 10) };
          }
          setVeganResult(mergedSummary);
          setAnalysis(detailed.detail);
        } else {
          setVeganResult({
            isVegan: false,
            confidence: 0,
            reasoning: 'No ingredient information available for this product.'
          });
          setAnalysis(null);
        }
        
        setShowResultDialog(true);
      } else {
        toast({
          title: "Product Not Found",
          description: "Product not found in database. Try scanning a different barcode.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error processing barcode:', error);
      toast({
        title: "Error",
        description: "Failed to process barcode. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const analyzeIngredientsForVegan = async (ingredientsText: string): Promise<{ summary: VeganResult; detail: VeganCheckResult }> => {
    const ingredients = ingredientsText.toLowerCase();
    const problematicIngredients = [];
    const proteinSources = [];
    const allergens = [];
    
    // Check against selected diet mode
    const isVegetarianMode = mode === 'vegetarian';
    // Always non-vegetarian
    if (ingredients.includes('gelatin') || ingredients.includes('meat') || ingredients.includes('beef') || ingredients.includes('pork') || ingredients.includes('chicken') || ingredients.includes('fish') || ingredients.includes('shellfish')) {
      problematicIngredients.push('Meat/Fish/Gelatin');
    }
    // Non-vegan but allowed in vegetarian mode
    if (!isVegetarianMode) {
      if (ingredients.includes('milk') || ingredients.includes('dairy') || ingredients.includes('casein') || ingredients.includes('whey')) {
        problematicIngredients.push('Dairy products');
      }
      if (ingredients.includes('egg') || ingredients.includes('eggs') || ingredients.includes('albumin')) {
        problematicIngredients.push('Eggs');
      }
      if (ingredients.includes('honey')) {
        problematicIngredients.push('Honey');
      }
    }
    
    // Check for protein sources
    if (ingredients.includes('tofu') || ingredients.includes('tempeh')) {
      proteinSources.push('Soy-based proteins');
    }
    if (ingredients.includes('lentil') || ingredients.includes('bean')) {
      proteinSources.push('Legumes');
    }
    if (ingredients.includes('quinoa')) {
      proteinSources.push('Quinoa');
    }
    
    // Check for allergens
    if (ingredients.includes('nut') || ingredients.includes('peanut')) {
      allergens.push('Nuts');
    }
    if (ingredients.includes('wheat') || ingredients.includes('gluten')) {
      allergens.push('Gluten');
    }
    
    // Use full AI analysis for detailed reasoning
    const ai = await checkVeganStatusWithAI(ingredientsText);
    const isVegan = ai.result === 'vegan';
    const confidence = ai.confidence || (isVegan ? 0.9 : 0.7);
    const summary: VeganResult = {
      isVegan,
      confidence,
      problematicIngredients: ai.detectedIngredients.filter(d => d.category === 'notVegan').map(d => d.ingredient),
      proteinSources,
      allergens,
      // Normalize AI eco score (0-100) to 0-10 scale for grading
      ecoScore: ai.carbonFootprint?.score ? Math.round(ai.carbonFootprint.score / 10) : undefined,
      reasoning: ai.reasons?.[0]
    };
    return { summary, detail: ai };
  };

  const getDietClass = (result: VeganResult): 'vegan' | 'vegetarian' | 'neither' => {
    if (result.isVegan) return mode === 'vegetarian' ? 'vegetarian' : 'vegan';
    // If non-vegan ingredients are only eggs/dairy/honey, classify as vegetarian
    const low = (result.problematicIngredients || []).join(' ').toLowerCase();
    const onlyVegetarian = /egg|eggs|milk|dairy|casein|whey|honey/.test(low) && !/meat|beef|pork|chicken|fish|gelatin|shellfish/.test(low);
    if (onlyVegetarian) return 'vegetarian';
    return 'neither';
  };

  const getEcoGrade = (score: number): { grade: string; gradeColor: string; description: string } => {
    if (score >= 8) return { grade: 'A', gradeColor: 'text-green-600', description: 'Excellent environmental impact' };
    if (score >= 6) return { grade: 'B', gradeColor: 'text-blue-600', description: 'Good environmental impact' };
    if (score >= 4) return { grade: 'C', gradeColor: 'text-yellow-600', description: 'Moderate environmental impact' };
    return { grade: 'D', gradeColor: 'text-red-600', description: 'High environmental impact' };
  };

  const handleDialogClose = () => {
    setShowResultDialog(false);
    setBarcode(null);
    setVeganResult(null);
    setProductName('');
    setBrandName('');
    setProductImageUrl('');
    
    // Restart camera if on barcode tab
    if (activeTab === 'barcode') {
      setTimeout(() => {
        barcodeScannerRef.current?.start();
      }, 100);
    }
  };

  useEffect(() => {
    if (veganResult) {
      setDietClass(getDietClass(veganResult));
    }
  }, [veganResult]);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-foreground">Scan Product</h1>
        <p className="text-muted-foreground">Scan a barcode to determine if an item is {mode === 'vegan' ? 'vegan' : 'vegetarian'}-friendly.</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'barcode')}>
        <TabsList>
          <TabsTrigger value="barcode">Barcode Scanner</TabsTrigger>
        </TabsList>

        <TabsContent value="barcode" className="mt-4 space-y-4">
          <BarcodeScanner 
            ref={barcodeScannerRef}
            onDetected={handleBarcodeDetected} 
          />

          {/* Loading overlay when processing barcode */}
          {loading && (
            <Card className="border-primary/20">
              <CardContent className="py-8">
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 mx-auto border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Analyzing Product</h3>
                    <p className="text-sm text-muted-foreground">
                      {barcode ? `Barcode: ${barcode}` : 'Processing...'}
                    </p>
                    {productName && (
                      <p className="text-sm font-medium">
                        {brandName && `${brandName} • `}{productName}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Help text when no barcode scanned */}
          {!loading && !barcode && (
            <Card className="bg-muted/20">
              <CardContent className="py-8 text-center">
                <h3 className="font-semibold mb-2">Ready to Scan</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Point your camera at a product's barcode.
                  The scanner will automatically detect and analyze the product.
                </p>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div><strong>Tips for best results:</strong></div>
                  <div>• Hold the barcode steady, about 6-12 inches from camera</div>
                  <div>• Ensure good lighting and avoid shadows</div>
                  <div>• Try the "Manual Scan" button if auto-detection isn't working</div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Results Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {veganResult?.isVegan ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              )}
              Product Analysis Result
            </DialogTitle>
            <DialogDescription>
              Analysis of {brandName && `${brandName} • `}{productName}
            </DialogDescription>
          </DialogHeader>

          {veganResult && (
            <div className="space-y-6">
              {/* Header with Image, Status and Eco Score */}
              <div className="flex items-start gap-4 p-4 rounded-lg border-2 border-border/30">
                {/* Product Image */}
                {productImageUrl ? (
                  <img src={productImageUrl} alt={productName || 'Product image'} className="w-20 h-20 object-cover rounded-md border" />
                ) : (
                  <div className="w-20 h-20 rounded-md border bg-muted/30 flex items-center justify-center text-xs text-muted-foreground">No Image</div>
                )}

                {/* Status and Eco */}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-4xl">
                        {veganResult.isVegan ? '🌱' : dietClass === 'vegetarian' ? '🥬' : '❌'}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">
                          {mode === 'vegan' ? (veganResult.isVegan ? 'Vegan Safe!' : dietClass === 'vegetarian' ? 'Not Vegan (Vegetarian OK)' : 'Not Vegan') : (veganResult.isVegan ? 'Vegetarian Safe' : 'Not Vegetarian')}
                        </h3>
                        <p className="text-xs text-muted-foreground">Confidence: {Math.round((veganResult.confidence || 0) * 100)}%</p>
                      </div>
                    </div>

                    {/* Eco Score compact */}
                    {typeof veganResult.ecoScore === 'number' && (
                      <div className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <TreePine className="w-4 h-4 text-blue-600" />
                          <span className="text-xs text-blue-800 font-medium">Eco Score</span>
                        </div>
                        <div className={`text-xl font-bold ${getEcoGrade(veganResult.ecoScore).gradeColor}`}>
                          {getEcoGrade(veganResult.ecoScore).grade}
                        </div>
                        <div className="text-[10px] text-blue-700">{getEcoGrade(veganResult.ecoScore).description}</div>
                      </div>
                    )}
                  </div>

                  {veganResult.reasoning && (
                    <p className="mt-2 text-sm">{veganResult.reasoning}</p>
                  )}
                </div>
              </div>

              {/* Product Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  {/* Confirmed Vegan Ingredients */}
                  {analysis?.detectedIngredients && analysis.detectedIngredients.some(d => d.category === 'vegan') && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-semibold text-green-800 mb-2">Confirmed Vegan Ingredients</h4>
                      <ul className="text-sm text-green-800 space-y-1">
                        {analysis.detectedIngredients.filter(d => d.category === 'vegan').slice(0, 12).map((d, i) => (
                          <li key={i}>{d.ingredient}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {/* Problematic Ingredients */}
                  {veganResult.problematicIngredients && veganResult.problematicIngredients.length > 0 && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Problematic Ingredients
                      </h4>
                      <ul className="text-sm text-red-700 space-y-1">
                        {veganResult.problematicIngredients.map((ingredient, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <X className="w-3 h-3" />
                            {ingredient}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Why? */}
                  {veganResult.problematicIngredients && veganResult.problematicIngredients.length > 0 && (
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <h4 className="font-semibold text-orange-800 mb-2">Why?</h4>
                      {analysis?.detectedIngredients && analysis.detectedIngredients.length > 0 ? (
                        <ul className="list-disc pl-5 space-y-1 text-sm text-orange-800">
                          {analysis.detectedIngredients
                            .filter(d => d.category === 'notVegan')
                            .slice(0, 8)
                            .map((d, i) => (
                              <li key={i}>{d.ingredient}{d.explanation ? ` — ${d.explanation}` : ''}</li>
                            ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-orange-700">
                          These ingredients are derived from animals and are not suitable for vegan diets.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Key Reasons from AI */}
                  {analysis?.reasons && analysis.reasons.length > 0 && (
                    <div className="p-4 bg-muted/40 border border-border rounded-lg">
                      <h4 className="font-semibold mb-2">Key Reasons</h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                        {analysis.reasons.slice(0, 6).map((r, i) => (<li key={i}>{r}</li>))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Unclear Ingredients */}
                  {analysis?.aiAnalysis?.unclearIngredients && analysis.aiAnalysis.unclearIngredients.length > 0 && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="font-semibold text-yellow-800 mb-2">Unclear Ingredients</h4>
                      <ul className="text-sm text-yellow-800 space-y-1">
                        {analysis.aiAnalysis.unclearIngredients.slice(0, 8).map((u, i) => (
                          <li key={i}>{u.ingredient}: {u.reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {/* Protein Sources */}
                  {veganResult.proteinSources && veganResult.proteinSources.length > 0 && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                        <Carrot className="w-4 h-4" />
                        Protein Sources
                      </h4>
                      <ul className="text-sm text-green-700 space-y-1">
                        {veganResult.proteinSources.map((source, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <CheckCircle className="w-3 h-3" />
                            {source}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Allergens */}
                  {veganResult.allergens && veganResult.allergens.length > 0 && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Allergens
                      </h4>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        {veganResult.allergens.map((allergen, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <AlertTriangle className="w-3 h-3" />
                            {allergen}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Eco reasons (detailed) */}
              {typeof veganResult.ecoScore === 'number' && analysis?.carbonFootprint?.reasons && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                    <TreePine className="w-4 h-4 text-blue-600" />
                    Environmental Notes
                  </h4>
                  <ul className="mt-1 text-sm text-blue-800 list-disc pl-5">
                    {analysis.carbonFootprint.reasons.slice(0, 5).map((r, i) => (<li key={i}>{r}</li>))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handleDialogClose}>
              Scan Another
            </Button>
            <Button onClick={handleDialogClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Scan;
