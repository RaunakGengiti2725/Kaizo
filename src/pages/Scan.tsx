import { useCallback, useMemo, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import BarcodeScanner from '@/components/BarcodeScanner';
import CameraCapture from '@/components/CameraCapture';
import { lookupProductByBarcode } from '@/services/productLookup';
import { imageProcessor, ImageProcessingResult } from '@/utils/imageProcessor';
import { checkVeganStatusWithAI, VeganCheckResult } from '@/utils/veganChecker';

type DietClass = 'vegan' | 'vegetarian' | 'neither' | 'unclear';

const VEGETARIAN_ONLY_TERMS = [
  'milk','dairy','butter','cheese','cream','whey','casein','lactose','yogurt','ghee',
  'egg','eggs','albumin','egg white','egg yolk','mayonnaise','honey','beeswax'
];
const NON_VEGETARIAN_TERMS = [
  'meat','beef','pork','chicken','turkey','duck','lamb','veal','bacon','ham','sausage','pepperoni',
  'fish','salmon','tuna','cod','anchovy','sardine','crab','lobster','shrimp','prawns','oyster','mussel','clam','scallop',
  'gelatin','collagen','carmine','cochineal','isinglass','lard','tallow','suet','rennet'
];

function classifyDiet(result: VeganCheckResult): DietClass {
  if (result.result === 'vegan') return 'vegan';
  if (result.result === 'unclear') return 'unclear';

  const nonVegan = (result.detectedIngredients || []).filter(d => d.category === 'notVegan');
  if (nonVegan.length === 0) return 'unclear';

  const hasNonVegetarian = nonVegan.some(d =>
    NON_VEGETARIAN_TERMS.some(t => d.ingredient.toLowerCase().includes(t))
  );
  if (hasNonVegetarian) return 'neither';

  const allVegetarianOnly = nonVegan.every(d =>
    VEGETARIAN_ONLY_TERMS.some(t => d.ingredient.toLowerCase().includes(t))
  );
  return allVegetarianOnly ? 'vegetarian' : 'neither';
}

const Scan = () => {
  const [activeTab, setActiveTab] = useState<'barcode' | 'photos'>('barcode');
  const [loading, setLoading] = useState(false);
  const [barcode, setBarcode] = useState<string | null>(null);
  const [productName, setProductName] = useState<string | undefined>();
  const [brandName, setBrandName] = useState<string | undefined>();
  const [productImage, setProductImage] = useState<string | undefined>();
  const [veganResult, setVeganResult] = useState<VeganCheckResult | null>(null);
  const [dietClass, setDietClass] = useState<DietClass>('unclear');
  const [processingResult, setProcessingResult] = useState<ImageProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showResultDialog, setShowResultDialog] = useState(false);

  const handleBarcodeDetected = useCallback(async (code: string) => {
    if (loading) return;

    console.log('Scan: Barcode detected:', code);
    setLoading(true);
    setError(null);
    setBarcode(code);
    setProductName(undefined);
    setBrandName(undefined);
    setProductImage(undefined);
    setVeganResult(null);
    setDietClass('unclear');

    try {
      console.log('Scan: Looking up product info...');
      const info = await lookupProductByBarcode(code);

      if (!info.success) {
        console.warn('Scan: Product lookup failed');
        setError('Product not found in database. Try photo analysis for detailed ingredients.');
        setShowResultDialog(true);
        return;
      }

      console.log('Scan: Product found:', info.productName);
      setProductName(info.productName);
      setBrandName(info.brand);
      setProductImage(info.imageUrl);

      if (!info.ingredientsText || info.ingredientsText.trim().length === 0) {
        console.warn('Scan: No ingredients found');
        setError('No ingredients available for this product. Try photo analysis.');
        setShowResultDialog(true);
        return;
      }

      console.log('Scan: Analyzing ingredients with AI...');
      const result = await checkVeganStatusWithAI(info.ingredientsText);
      setVeganResult(result);
      setDietClass(classifyDiet(result));

      console.log('Scan: Analysis complete:', result.result);
      setShowResultDialog(true);

    } catch (e: any) {
      console.error('Scan: Error during barcode analysis:', e);
      setError(e?.message || 'Failed to analyze barcode. Please try again.');
      setVeganResult(null);
      setDietClass('unclear');
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const handleImagesCapture = useCallback(async (images: Array<{ id: string; file: File; url: string; type: 'front' | 'back' | 'ingredients' | 'additional'; timestamp: number }>) => {
    setActiveTab('photos');
    setLoading(true);
    setError(null);
    setBarcode(null);
    setProductName(undefined);
    setBrandName(undefined);
    try {
      const result = await imageProcessor.processImages(images.map(i => ({ file: i.file, type: i.type })));
      setProcessingResult(result);

      const ai = await checkVeganStatusWithAI(result.combinedText, images.map(i => ({ file: i.file, text: result.extractedTexts.find(et => et.source === i.type)?.text || '', type: i.type })));
      setVeganResult(ai);
      setDietClass(classifyDiet(ai));
      setShowResultDialog(true);
    } catch (e: any) {
      setError(e?.message || 'Failed to analyze images');
      setVeganResult(null);
      setDietClass('unclear');
    } finally {
      setLoading(false);
    }
  }, []);

  const headline = useMemo(() => {
    switch (dietClass) {
      case 'vegan': return 'Vegan ✅';
      case 'vegetarian': return 'Vegetarian ⚠️ (Not Vegan)';
      case 'neither': return 'Not Vegan/Vegetarian ❌';
      default: return 'Analysis Pending';
    }
  }, [dietClass]);

    return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Scan Product</h1>
        <p className="text-muted-foreground">Scan a barcode or analyze photos to determine if an item is vegan, vegetarian, or neither.</p>
          </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'barcode' | 'photos')}>
        <TabsList>
          <TabsTrigger value="barcode">Barcode</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
          </TabsList>

                <TabsContent value="barcode" className="mt-4 space-y-4">
          <BarcodeScanner onDetected={handleBarcodeDetected} />

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

          {/* Results moved to modal dialog */}

          {/* Help text when no barcode scanned */}
          {!loading && !barcode && (
            <Card className="bg-muted/20">
              <CardContent className="py-8 text-center">
                <div className="text-4xl mb-4">📷</div>
                <h3 className="font-semibold mb-2">Ready to Scan</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Click "Start Barcode Scanner" above and point your camera at a product's barcode.
                  The scanner will automatically detect and analyze the product.
                </p>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div>💡 <strong>Tips for best results:</strong></div>
                  <div>• Hold the barcode steady, about 6-12 inches from camera</div>
                  <div>• Ensure good lighting and avoid shadows</div>
                  <div>• Try the "Manual Scan" button if auto-detection isn't working</div>
                  <div>• Check browser console (F12) for debugging info</div>
                            </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    console.log('=== BARCODE SCANNER DEBUG ===');
                    console.log('Available cameras:');
                    navigator.mediaDevices.enumerateDevices().then(devices => {
                      devices.filter(d => d.kind === 'videoinput').forEach((device, i) => {
                        console.log(`${i + 1}. ${device.label || 'Camera'} (${device.deviceId})`);
                      });
                    });
                    console.log('Permissions:');
                    navigator.permissions.query({ name: 'camera' as PermissionName }).then(result => {
                      console.log('Camera permission:', result.state);
                    }).catch(err => console.log('Permission check failed:', err));
                  }}
                >
                  🔧 Debug Info
                </Button>
              </CardContent>
            </Card>
          )}
          </TabsContent>

        <TabsContent value="photos" className="mt-4 space-y-4">
          <CameraCapture onImagesCapture={handleImagesCapture} isProcessing={loading} />

          <Card>
              <CardHeader>
              <CardTitle>Result</CardTitle>
              <CardDescription>{processingResult ? 'From photo analysis' : 'Capture or upload photos to analyze'}</CardDescription>
              </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="text-sm text-destructive">{error}</div>
              )}
              {veganResult && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                      <Badge variant={dietClass === 'vegan' ? 'default' : dietClass === 'vegetarian' ? 'secondary' : 'destructive'} className="capitalize">
                        {dietClass}
                          </Badge>
                      {veganResult.brandName && <span className="text-sm text-muted-foreground">{veganResult.brandName}</span>}
                      {veganResult.productName && <span className="text-sm text-foreground font-medium">{veganResult.productName}</span>}
                        </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Confidence</div>
                      <div className="text-sm font-semibold">{Math.round((veganResult.confidence || 0) * 100)}%</div>
                      <Progress value={(veganResult.confidence || 0) * 100} className="h-2 w-40" />
                            </div>
                          </div>
                  {veganResult.reasons && veganResult.reasons.length > 0 && (
                    <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                      {veganResult.reasons.slice(0, 6).map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                        )}
                      </div>
                    )}
              {!veganResult && !error && (
                <div className="text-sm text-muted-foreground">Take photos of the front, back, and ingredients list for best results.</div>
              )}
              {veganResult && (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { setVeganResult(null); setProcessingResult(null); }}>Clear</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      
      {/* Analysis Modal */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {error && !veganResult && '❌ Item Unrecognized'}
              {veganResult && dietClass === 'vegan' && '🌱 Vegan'}
              {veganResult && dietClass === 'neither' && '❌ Not Vegan'}
              {veganResult && dietClass === 'vegetarian' && '🥕 Not Vegan (Vegetarian)'}
              {veganResult && dietClass === 'unclear' && '🤔 Status Unavailable'}
            </DialogTitle>
            <DialogDescription>
              {barcode && `Barcode: ${barcode}`} {productName && `• ${productName}`} {brandName && `• ${brandName}`}
            </DialogDescription>
          </DialogHeader>

                <div className="space-y-4">
            {veganResult && (
              <>
                      <div className="flex items-center justify-between">
                  <Badge variant={dietClass === 'vegan' ? 'default' : dietClass === 'vegetarian' ? 'secondary' : 'destructive'} className="capitalize px-3 py-1 text-sm">
                    {dietClass}
                            </Badge>
                        <div className="text-right">
                    <div className="text-xs text-muted-foreground">AI Confidence</div>
                    <div className="text-sm font-semibold">{Math.round((veganResult.confidence || 0) * 100)}%</div>
                        </div>
                      </div>
                      
                {productImage && (
                  <div className="flex items-center gap-3">
                    <img
                      src={productImage}
                      alt={productName || 'Scanned product'}
                      className="w-20 h-20 object-cover rounded-md border shadow-sm"
                    />
                        <div className="text-sm">
                      {productName && <div className="font-medium leading-tight">{productName}</div>}
                      {brandName && <div className="text-muted-foreground leading-tight">{brandName}</div>}
                    </div>
                    </div>
                  )}

                {/* Health score removed */}

                {veganResult.detectedIngredients && veganResult.detectedIngredients.some(d => d.category === 'notVegan') && (
                  <div>
                    <div className="text-sm font-medium mb-2">Problematic Ingredients</div>
                    <div className="flex flex-wrap gap-2">
                      {veganResult.detectedIngredients.filter(d => d.category === 'notVegan').slice(0, 6).map((d, i) => (
                        <span key={i} className="px-2 py-1 rounded border text-destructive border-destructive/30 bg-destructive/10 text-xs">
                          {d.ingredient}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {veganResult.reasons && veganResult.reasons.length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-2">Why?</div>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {veganResult.reasons.slice(0, 4).map((r, i) => (
                        <li key={i}>• {r}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {(veganResult.nutritionalInsights?.proteinSources?.length || veganResult.nutritionalInsights?.allergens?.length) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {veganResult.nutritionalInsights?.proteinSources?.length ? (
                      <div className="p-3 rounded border bg-muted/10">
                        <div className="text-sm font-medium mb-1">Protein Sources</div>
                        <div className="text-xs text-muted-foreground">{veganResult.nutritionalInsights?.proteinSources?.join(', ')}</div>
      </div>
                    ) : null}
                    {veganResult.nutritionalInsights?.allergens?.length ? (
                      <div className="p-3 rounded border bg-destructive/5">
                        <div className="text-sm font-medium text-destructive mb-1">Allergens</div>
                        <div className="text-xs text-destructive/80">{veganResult.nutritionalInsights?.allergens?.join(', ')}</div>
                  </div>
                    ) : null}
                  </div>
                )}
              </>
            )}

            {error && (
              <div className="p-3 rounded border bg-destructive/10 text-destructive text-sm">{error}</div>
            )}
            </div>
            
          <DialogFooter className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => { setShowResultDialog(false); setBarcode(null); }}>Scan Another</Button>
            <Button onClick={() => setShowResultDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Scan;
