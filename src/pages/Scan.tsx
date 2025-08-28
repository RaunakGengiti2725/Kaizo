import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BarcodeScanner, { BarcodeScannerRef } from '@/components/BarcodeScanner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, X, CheckCircle, AlertTriangle, Leaf, Carrot, TreePine, Shield, Award, Clock, Info, Search, History as HistoryIcon } from 'lucide-react';
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
  healthScore?: number;
  certifications?: string[];
  crossContactRisk?: 'low' | 'medium' | 'high';
  crossContactDetails?: string;
  verificationDate?: string;
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
  const [dietClass, setDietClass] = useState<'vegan' | 'vegetarian' | 'neither'>('vegan');
  const [analysis, setAnalysis] = useState<VeganCheckResult | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [scanHistory, setScanHistory] = useState<Array<{
    id: string;
    timestamp: Date;
    barcode: string;
    productName: string;
    brandName: string;
    isVegan: boolean;
    dietClass: 'vegan' | 'vegetarian' | 'neither';
    healthScore?: number;
  }>>(() => {
    // Load from localStorage on component mount
    try {
      const saved = localStorage.getItem('veganVisionScanHistory');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Convert timestamp strings back to Date objects
        return parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
      }
    } catch (error) {
      console.error('Error loading scan history:', error);
    }
    return [];
  });
  const [showHistory, setShowHistory] = useState(false);
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<typeof scanHistory[0] | null>(null);
  const [showHistoryDetails, setShowHistoryDetails] = useState(false);
  
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
        
        // Analyze ingredients with Gemini AI / detailed pipeline
        if (productData.ingredientsText) {
          const detailed = await analyzeIngredientsForVegan(productData.ingredientsText);
          setVeganResult(detailed.summary);
          setAnalysis(detailed.detail);
        } else {
          setVeganResult({
            isVegan: false,
            confidence: 0,
            reasoning: 'No ingredient information available for this product.',
            healthScore: 0,
            certifications: [],
            crossContactRisk: 'medium',
            crossContactDetails: 'Unable to determine due to missing ingredient data',
            verificationDate: new Date().toLocaleDateString()
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
    const certifications = [];
    let crossContactRisk: 'low' | 'medium' | 'high' = 'low';
    let crossContactDetails = '';
    let healthScore = 85; // Base health score
    
    // Check against selected diet mode
    const isVegetarianMode = mode === 'vegetarian';
    
    // Always non-vegetarian
    if (ingredients.includes('gelatin') || ingredients.includes('meat') || ingredients.includes('beef') || ingredients.includes('pork') || ingredients.includes('chicken') || ingredients.includes('fish') || ingredients.includes('shellfish')) {
      problematicIngredients.push('Meat/Fish/Gelatin');
      healthScore -= 20;
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
    
    // Check for risky ingredients that need explanation
    const riskyIngredients = [];
    if (ingredients.includes('natural flavors') || ingredients.includes('natural flavoring')) {
      riskyIngredients.push({ ingredient: 'Natural Flavors', risk: 'medium', explanation: 'May contain animal-derived ingredients', source: 'FDA allows animal sources' });
      healthScore -= 5;
    }
    if (ingredients.includes('mono- and diglycerides') || ingredients.includes('monoglycerides') || ingredients.includes('diglycerides')) {
      riskyIngredients.push({ ingredient: 'Mono- and Diglycerides', risk: 'medium', explanation: 'Can be derived from animal fats', source: 'Common in processed foods' });
      healthScore -= 3;
    }
    if (ingredients.includes('lecithin') && !ingredients.includes('soy lecithin')) {
      riskyIngredients.push({ ingredient: 'Lecithin', risk: 'low', explanation: 'Usually soy-based, but can be egg-derived', source: 'Check with manufacturer' });
    }
    if (ingredients.includes('vitamin d3') && !ingredients.includes('vitamin d3 from lichen')) {
      riskyIngredients.push({ ingredient: 'Vitamin D3', risk: 'high', explanation: 'Typically derived from sheep wool (lanolin)', source: 'Most D3 is animal-derived' });
      healthScore -= 10;
    }
    
    // Check for cross-contact risks
    if (ingredients.includes('dairy') || ingredients.includes('milk') || ingredients.includes('egg')) {
      crossContactRisk = 'high';
      crossContactDetails = 'Product contains dairy/egg ingredients';
    } else if (ingredients.includes('may contain') || ingredients.includes('processed in facility')) {
      crossContactRisk = 'medium';
      crossContactDetails = 'Manufactured on shared equipment';
    }
    
    // Check for certifications and positive indicators
    if (ingredients.includes('organic') || ingredients.includes('certified organic')) {
      certifications.push('USDA Organic');
      healthScore += 5;
    }
    if (ingredients.includes('non-gmo') || ingredients.includes('gmo-free')) {
      certifications.push('Non-GMO Project');
      healthScore += 3;
    }
    if (ingredients.includes('gluten-free')) {
      certifications.push('Gluten-Free Certified');
    }
    
    // Adjust health score based on ingredient quality
    if (ingredients.includes('preservative') || ingredients.includes('artificial')) {
      healthScore -= 8;
    }
    if (ingredients.includes('high fructose corn syrup')) {
      healthScore -= 15;
    }
    if (ingredients.includes('trans fat') || ingredients.includes('partially hydrogenated')) {
      healthScore -= 20;
    }
    
    // Use full AI analysis for detailed reasoning
    let ai: VeganCheckResult;
    try {
      ai = await checkVeganStatusWithAI(ingredientsText);
    } catch (error) {
      console.error('AI analysis failed:', error);
      // Fallback to basic analysis
      ai = {
        result: 'notVegan',
        confidence: 0.5,
        detectedIngredients: [],
        reasons: ['AI analysis unavailable, using basic ingredient checking'],
        carbonFootprint: { score: 50, reasons: ['Analysis incomplete'] },
        aiAnalysis: {
          unclearIngredients: []
        }
      };
    }
    
    const isVegan = ai.result === 'vegan';
    const confidence = ai.confidence || (isVegan ? 0.9 : 0.7);
    
    const summary: VeganResult = {
      isVegan,
      confidence,
      problematicIngredients: ai.detectedIngredients?.filter(d => d.category === 'notVegan')?.map(d => d.ingredient) || [],
      proteinSources,
      allergens,
      ecoScore: ai.carbonFootprint?.score ? Math.round(ai.carbonFootprint.score / 20) : undefined,
      reasoning: ai.reasons?.[0],
      healthScore: Math.max(0, Math.min(100, healthScore)),
      certifications,
      crossContactRisk,
      crossContactDetails,
      verificationDate: new Date().toLocaleDateString()
    };
    return { summary, detail: ai };
  };

  const getDietClass = (result: VeganResult): 'vegan' | 'vegetarian' | 'neither' => {
    if (!result || !result.problematicIngredients) return 'neither';
    if (result.isVegan) return mode === 'vegetarian' ? 'vegetarian' : 'vegan';
    // If non-vegan ingredients are only eggs/dairy/honey, classify as vegetarian
    const low = result.problematicIngredients.join(' ').toLowerCase();
    const onlyVegetarian = /egg|eggs|milk|dairy|casein|whey|honey/.test(low) && !/meat|beef|pork|chicken|fish|gelatin|shellfish/.test(low);
    if (onlyVegetarian) return 'vegetarian';
    return 'neither';
  };

  const getEcoGrade = (score: number): { grade: string; gradeColor: string; description: string } => {
    if (score === undefined || score === null || isNaN(score)) {
      return { grade: 'N/A', gradeColor: 'text-gray-600', description: 'Environmental impact not available' };
    }
    if (score >= 8) return { grade: 'A', gradeColor: 'text-green-600', description: 'Excellent environmental impact' };
    if (score >= 6) return { grade: 'B', gradeColor: 'text-blue-600', description: 'Good environmental impact' };
    if (score >= 4) return { grade: 'C', gradeColor: 'text-yellow-600', description: 'Moderate environmental impact' };
    return { grade: 'D', gradeColor: 'text-red-600', description: 'High environmental impact' };
  };

  const getHealthGrade = (score: number): { grade: string; gradeColor: string; description: string; category: string } => {
    if (score === undefined || score === null || isNaN(score)) {
      return { grade: 'N/A', gradeColor: 'text-gray-600', description: 'Health score not available', category: 'Not Available' };
    }
    if (score >= 90) return { grade: 'A+', gradeColor: 'text-green-600', description: 'Excellent nutritional quality', category: 'Excellent' };
    if (score >= 80) return { grade: 'A', gradeColor: 'text-green-600', description: 'Very good nutritional quality', category: 'Very Good' };
    if (score >= 70) return { grade: 'B+', gradeColor: 'text-blue-600', description: 'Good nutritional quality', category: 'Good' };
    if (score >= 60) return { grade: 'B', gradeColor: 'text-blue-600', description: 'Above average nutritional quality', category: 'Above Average' };
    if (score >= 50) return { grade: 'C', gradeColor: 'text-yellow-600', description: 'Average nutritional quality', category: 'Average' };
    if (score >= 40) return { grade: 'C-', gradeColor: 'text-orange-600', description: 'Below average nutritional quality', category: 'Below Average' };
    return { grade: 'D', gradeColor: 'text-red-600', description: 'Poor nutritional quality', category: 'Poor' };
  };

  const getCrossContactColor = (risk: 'low' | 'medium' | 'high' | undefined): string => {
    if (!risk) return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30';
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
      case 'high': return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30';
    }
  };

  const handleDialogClose = () => {
    setShowResultDialog(false);
    setBarcode(null);
    setVeganResult(null);
    setProductName('');
    setBrandName('');
    setAnalysis(null);
    
    // Add to scan history if we have a result
    if (veganResult) {
      addToScanHistory(veganResult);
    }
    
    // Restart camera if on barcode tab
    if (activeTab === 'barcode') {
      // Use a longer delay to ensure dialog is fully closed
      setTimeout(() => {
        if (barcodeScannerRef.current) {
          console.log('Restarting camera after dialog close');
          barcodeScannerRef.current.start();
          setIsCameraActive(true);
        }
      }, 300);
    }
  };



  const handleCameraError = (error: string) => {
    console.log('Camera error detected:', error);
    
    // Handle AbortError specially - it's usually transient
    if (error.includes('interrupted') || error.includes('AbortError')) {
      console.log('Camera start was interrupted, will retry automatically');
      // Don't set camera as inactive for transient errors
      return;
    }
    
    setIsCameraActive(false);
  };

  const handleCameraStateChange = (isActive: boolean) => {
    console.log('Camera state changed:', isActive);
    setIsCameraActive(isActive);
  };

  const isRestarting = !isCameraActive && barcode;

  const addToScanHistory = (result: VeganResult) => {
    const historyItem = {
      id: Date.now().toString(),
      timestamp: new Date(),
      barcode: barcode || '',
      productName: result.productName || productName || 'Unknown Product',
      brandName: result.brandName || brandName || 'Unknown Brand',
      isVegan: result.isVegan,
      dietClass: getDietClass(result),
      healthScore: result.healthScore,
    };
    
    setScanHistory(prev => [historyItem, ...prev.slice(0, 49)]); // Keep last 50 scans
  };

  const removeFromHistory = (id: string) => {
    setScanHistory(prev => prev.filter(item => item.id !== id));
  };

  const viewHistoryDetails = (item: typeof scanHistory[0]) => {
    setSelectedHistoryItem(item);
    setShowHistoryDetails(true);
  };

  useEffect(() => {
    if (veganResult) {
      setDietClass(getDietClass(veganResult));
    }
  }, [veganResult]);

  // Update camera state when dialog opens/closes
  useEffect(() => {
    if (showResultDialog) {
      setIsCameraActive(false);
    }
  }, [showResultDialog]);

  // Save scan history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('veganVisionScanHistory', JSON.stringify(scanHistory));
    } catch (error) {
      console.error('Error saving scan history:', error);
    }
  }, [scanHistory]);

  // Monitor camera state and provide better feedback
  useEffect(() => {
    if (!isCameraActive && !loading && !showResultDialog) {
      // Camera is not active, show helpful message
      console.log('Camera inactive, checking for issues...');
    }
  }, [isCameraActive, loading, showResultDialog]);

  // Ensure camera is running when component mounts and when dialog closes
  useEffect(() => {
    if (!showResultDialog && !loading && barcodeScannerRef.current) {
      // Longer delay to ensure the component is stable and ready
      const timer = setTimeout(() => {
        if (barcodeScannerRef.current && !showResultDialog && !loading && !isCameraActive) {
          console.log('Auto-restarting camera after dialog state change');
          barcodeScannerRef.current.start();
          // Don't set camera as active immediately - let the BarcodeScanner handle state
        }
      }, 800); // Increased delay for stability
      
      return () => clearTimeout(timer);
    }
  }, [showResultDialog, loading, isCameraActive]);

  // Initialize camera when component mounts
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;
    
    const initCamera = () => {
      if (barcodeScannerRef.current && !showResultDialog && !loading) {
        setTimeout(() => {
          if (barcodeScannerRef.current) {
            console.log(`Initializing camera on component mount (attempt ${retryCount + 1})`);
            barcodeScannerRef.current.start();
            // Don't set as active immediately - let the BarcodeScanner handle state
          }
        }, 200 + (retryCount * 100)); // Increasing delay for retries
      }
    };

    const retryCamera = () => {
      if (retryCount < maxRetries && !isCameraActive) {
        retryCount++;
        console.log(`Retrying camera initialization (attempt ${retryCount})`);
        setTimeout(initCamera, 500 * retryCount); // Exponential backoff
      }
    };

    // Initial camera start
    initCamera();

    // Set up retry mechanism
    const retryTimer = setTimeout(retryCamera, 2000); // First retry after 2 seconds

    // Cleanup function
    return () => {
      clearTimeout(retryTimer);
      if (barcodeScannerRef.current) {
        console.log('Cleaning up camera on component unmount');
        // Note: Don't call stop() here as it's handled by the BarcodeScanner component
      }
    };
  }, [isCameraActive, showResultDialog, loading]); // Add dependencies for retry logic

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Scan Product</h1>
          <p className="text-muted-foreground">Scan a barcode to determine if an item is {mode === 'vegan' ? 'vegan' : 'vegetarian'}-friendly.</p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowHistory(true)}
          className="gap-2"
        >
          <HistoryIcon className="w-4 h-4" />
          Scan History ({scanHistory.length})
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'barcode')}>
        <TabsList>
          <TabsTrigger value="barcode">Barcode Scanner</TabsTrigger>
        </TabsList>

        <TabsContent value="barcode" className="mt-4 space-y-4">
          <BarcodeScanner 
            ref={barcodeScannerRef}
            onDetected={handleBarcodeDetected}
            onError={handleCameraError}
            onStateChange={handleCameraStateChange}
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

          {/* Help text when no barcode scanned or after scanning */}
          {!loading && (
            <Card className="bg-muted/20">
              <CardContent className="py-8 text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className={`w-3 h-3 rounded-full ${
                    isRestarting ? 'bg-blue-500 animate-pulse' : 
                    isCameraActive ? 'bg-green-500' : 'bg-yellow-500'
                  }`}></div>
                  <span className="text-sm font-medium">
                    {isRestarting ? 'Camera Restarting...' : 
                     isCameraActive ? 'Camera Active' : 'Camera Needs Attention'}
                  </span>
                </div>
                
                {/* Camera Error Help */}
                {!isCameraActive && !isRestarting && (
                  <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <div className="text-sm text-amber-800 dark:text-amber-200">
                      <div className="font-medium mb-1">Camera Access Required</div>
                      <div className="text-xs space-y-1">
                        <div>• Ensure camera permissions are granted</div>
                        <div>• Check if other apps are using the camera</div>
                        <div>• Try refreshing the page if issues persist</div>
                      </div>
                    </div>
                  </div>
                )}
                <h3 className="font-semibold mb-2">
                  {barcode ? 'Ready to Scan Again' : 'Ready to Scan'}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {barcode 
                    ? 'Camera restarted. Point your camera at another product\'s barcode.'
                    : 'Point your camera at a product\'s barcode. The scanner will automatically detect and analyze the product.'
                  }
                </p>
                <div className="space-y-2 text-xs text-muted-foreground mb-4">
                  <div><strong>Tips for best results:</strong></div>
                  <div>• Hold the barcode steady, about 6-12 inches from camera</div>
                  <div>• Ensure good lighting and avoid shadows</div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Results Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="text-center mb-4">
              <DialogTitle className="text-3xl font-bold mb-2">
                Product Analysis
              </DialogTitle>
              <div className="space-y-2">
                <div className="text-xl font-semibold text-foreground">
                  {brandName && `${brandName}`}
                </div>
                <div className="text-lg text-muted-foreground">
                  {productName}
                </div>
              </div>
            </div>
            <DialogDescription className="text-base text-center">
              Comprehensive ingredient analysis and dietary suitability assessment
            </DialogDescription>
          </DialogHeader>

          {veganResult ? (
            <div className="space-y-8">
              {/* Main Result Banner */}
              <div className={`p-6 rounded-xl border-2 ${
                veganResult.isVegan 
                  ? 'border-green-200 bg-green-50 dark:bg-green-950/20' 
                  : 'border-orange-200 bg-orange-50 dark:bg-orange-950/20'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${
                      veganResult.isVegan 
                        ? 'bg-green-100 dark:bg-green-900/30' 
                        : 'bg-orange-100 dark:bg-orange-900/30'
                    }`}>
                      {veganResult.isVegan ? (
                        <CheckCircle className="w-8 h-8 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-8 h-8 text-orange-600" />
                      )}
                    </div>
                    <div>
                      <h2 className={`text-2xl font-bold ${
                        veganResult.isVegan ? 'text-green-800 dark:text-green-200' : 'text-orange-800 dark:text-orange-200'
                      }`}>
                        {veganResult.isVegan ? 'Vegan Safe' : 'Not Vegan'}
                      </h2>
                      <p className="text-muted-foreground">
                        Confidence: {Math.round((veganResult.confidence || 0) * 100)}%
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Diet Mode</div>
                    <Badge variant="outline" className="text-sm">
                      {mode === 'vegan' ? 'Vegan' : 'Vegetarian'}
                    </Badge>
                  </div>
                </div>
                {veganResult.reasoning && (
                  <div className="mt-4 p-4 bg-white/60 dark:bg-gray-800/60 rounded-lg">
                    <h3 className="font-semibold mb-2">Analysis Summary</h3>
                    <p className="text-sm text-muted-foreground">{veganResult.reasoning}</p>
                  </div>
                )}
              </div>

              {/* Health Score & Certifications Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Health Score */}
                <div className="p-5 bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-800 rounded-xl shadow-sm">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200 mb-2">Health Score</h3>
                    {veganResult.healthScore !== undefined && veganResult.healthScore !== null ? (
                      <>
                        <div className={`text-4xl font-bold mb-2 ${getHealthGrade(veganResult.healthScore).gradeColor}`}>
                          {veganResult.healthScore}
                        </div>
                        <div className={`text-lg font-semibold mb-1 ${getHealthGrade(veganResult.healthScore).gradeColor}`}>
                          {getHealthGrade(veganResult.healthScore).grade}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {getHealthGrade(veganResult.healthScore).description}
                        </p>
                      </>
                    ) : (
                      <div className="text-muted-foreground">
                        <div className="text-2xl mb-2">--</div>
                        <p className="text-sm">Analysis incomplete</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Certifications */}
                <div className="p-5 bg-white dark:bg-gray-800 border border-emerald-200 dark:border-emerald-800 rounded-xl shadow-sm">
                  <h3 className="text-lg font-semibold text-emerald-800 dark:text-emerald-200 mb-3 flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Certifications & Standards
                  </h3>
                  <div className="space-y-2">
                    {veganResult.certifications && veganResult.certifications.length > 0 ? (
                      veganResult.certifications.map((cert, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 rounded-lg">
                          <Shield className="w-4 h-4" />
                          {cert}
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-muted-foreground bg-muted/30 px-3 py-2 rounded-lg">
                        No specific certifications detected
                      </div>
                    )}
                  </div>
                </div>

                {/* Cross-Contact Risk */}
                <div className="p-5 bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-800 rounded-xl shadow-sm">
                  <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Cross-Contact Risk
                  </h3>
                  {veganResult.crossContactRisk && veganResult.crossContactRisk !== 'low' ? (
                    <>
                      <div className={`inline-block px-3 py-2 rounded-lg text-sm font-medium mb-3 ${getCrossContactColor(veganResult.crossContactRisk)}`}>
                        {veganResult.crossContactRisk.charAt(0).toUpperCase() + veganResult.crossContactRisk.slice(1)} Risk
                      </div>
                      {veganResult.crossContactDetails && (
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                          {veganResult.crossContactDetails}
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground bg-muted/30 px-3 py-2 rounded-lg">
                      Low risk - No significant cross-contact concerns detected
                    </div>
                  )}
                </div>
              </div>

              {/* Verification Date */}
              {veganResult.verificationDate && (
                <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Analysis Timestamp</span>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Verified on {veganResult.verificationDate}
                  </p>
                </div>
              )}

              {/* Detailed Analysis Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Vegan Status */}
                <div className="space-y-6">
                  {/* Vegan Ingredients */}
                  {analysis?.detectedIngredients && analysis.detectedIngredients.some(d => d.category === 'vegan') && (
                    <div className="p-5 bg-white dark:bg-gray-800 border border-green-200 dark:border-green-800 rounded-xl shadow-sm">
                      <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-3 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Vegan Ingredients
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {analysis.detectedIngredients.filter(d => d.category === 'vegan').slice(0, 16).map((d, i) => (
                          <div key={i} className="text-sm text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/30 px-3 py-2 rounded-lg">
                            {d.ingredient}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Problematic Ingredients */}
                  {veganResult.problematicIngredients && veganResult.problematicIngredients.length > 0 && (
                    <div className="p-5 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 rounded-xl shadow-sm">
                      <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        Non-Vegan Ingredients
                      </h3>
                      <div className="space-y-3">
                        {veganResult.problematicIngredients.map((ingredient, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
                            <X className="w-4 h-4 text-red-600" />
                            <div>
                              <div className="font-medium text-red-800 dark:text-red-200">{ingredient}</div>
                              {analysis?.detectedIngredients?.find(d => d.ingredient.toLowerCase().includes(ingredient.toLowerCase()))?.explanation && (
                                <div className="text-sm text-red-600 dark:text-red-400">
                                  {analysis.detectedIngredients.find(d => d.ingredient.toLowerCase().includes(ingredient.toLowerCase()))?.explanation}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Risky Ingredients with Explanations */}
                  {analysis?.detectedIngredients && analysis.detectedIngredients.some(d => d.category === 'risky') && (
                    <div className="p-5 bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-800 rounded-xl shadow-sm">
                      <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        Risky Ingredients
                      </h3>
                      <div className="space-y-3">
                        {analysis.detectedIngredients.filter(d => d.category === 'risky').slice(0, 8).map((ingredient, index) => (
                          <div key={index} className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                            <div className="flex items-start justify-between mb-2">
                              <div className="font-medium text-orange-800 dark:text-orange-200">{ingredient.ingredient}</div>
                              <Badge variant="outline" className="text-xs">
                                {ingredient.risk || 'Medium'} Risk
                              </Badge>
                            </div>
                            <div className="text-sm text-orange-700 dark:text-orange-300 mb-1">
                              {ingredient.explanation}
                            </div>
                            <div className="text-xs text-orange-600 dark:text-orange-400">
                              Source: {ingredient.source || 'Industry standard'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Protein Sources */}
                  {veganResult.proteinSources && veganResult.proteinSources.length > 0 && (
                    <div className="p-5 bg-white dark:bg-gray-800 border border-emerald-200 dark:border-emerald-800 rounded-xl shadow-sm">
                      <h3 className="text-lg font-semibold text-emerald-800 dark:text-emerald-200 mb-3 flex items-center gap-2">
                        <Carrot className="w-5 h-5" />
                        Protein Sources
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {veganResult.proteinSources.map((source, index) => (
                          <div key={index} className="text-sm text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 rounded-lg">
                            {source}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column - Additional Info */}
                <div className="space-y-6">
                  {/* Allergens */}
                  {veganResult.allergens && veganResult.allergens.length > 0 && (
                    <div className="p-5 bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-800 rounded-xl shadow-sm">
                      <h3 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        Allergens
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {veganResult.allergens.map((allergen, index) => (
                          <div key={index} className="text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 rounded-lg">
                            {allergen}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Unclear Ingredients */}
                  {analysis?.aiAnalysis?.unclearIngredients && analysis.aiAnalysis.unclearIngredients.length > 0 && (
                    <div className="p-5 bg-white dark:bg-gray-800 border border-yellow-200 dark:border-yellow-800 rounded-xl shadow-sm">
                      <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-3">
                        Unclear Ingredients
                      </h3>
                      <div className="space-y-2">
                        {analysis.aiAnalysis.unclearIngredients.slice(0, 6).map((u, i) => (
                          <div key={i} className="text-sm text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-950/30 p-3 rounded-lg">
                            <div className="font-medium">{u.ingredient}</div>
                            <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">{u.reason}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Key Insights */}
                  {analysis?.reasons && analysis.reasons.length > 0 && (
                    <div className="p-5 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 rounded-xl shadow-sm">
                      <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3">
                        Key Insights
                      </h3>
                      <div className="space-y-2">
                        {analysis.reasons.slice(0, 5).map((r, i) => (
                          <div key={i} className="text-sm text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg">
                            {r}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Eco Score */}
              {veganResult.ecoScore !== undefined && veganResult.ecoScore !== null && (
                <div className="p-6 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 rounded-xl shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 flex items-center gap-2">
                      <TreePine className="w-5 h-5" />
                      Environmental Impact
                    </h3>
                    <div className={`text-3xl font-bold ${getEcoGrade(veganResult.ecoScore).gradeColor}`}>
                      {getEcoGrade(veganResult.ecoScore).grade}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {getEcoGrade(veganResult.ecoScore).description}
                  </p>
                  {analysis?.carbonFootprint?.reasons && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {analysis.carbonFootprint.reasons.slice(0, 6).map((r, i) => (
                        <div key={i} className="text-sm text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg">
                          {r}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Analysis Error</h3>
              <p className="text-muted-foreground">
                Unable to analyze product. Please try scanning again.
              </p>
            </div>
          )}

          <DialogFooter className="flex gap-3 pt-6">
            <Button variant="outline" onClick={handleDialogClose} className="flex-1">
              Scan Another Product
            </Button>
            <Button onClick={handleDialogClose} className="flex-1">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scan History Modal */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HistoryIcon className="w-5 h-5" />
              Scan History
            </DialogTitle>
            <DialogDescription>
              Your recent product scans and analysis results
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {scanHistory.length > 0 && (
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search products, brands, or barcodes..."
                    value={historySearchTerm}
                    onChange={(e) => setHistorySearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                {historySearchTerm && (
                  <div className="text-sm text-muted-foreground">
                    Showing {scanHistory.filter(item => 
                      historySearchTerm === '' ||
                      item.productName.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
                      item.brandName.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
                      item.barcode.includes(historySearchTerm)
                    ).length} of {scanHistory.length} scans
                  </div>
                )}
              </div>
            )}
            
            {scanHistory.length === 0 ? (
              <div className="text-center py-8">
                <HistoryIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Scan History</h3>
                <p className="text-muted-foreground">
                  Scan your first product to see it appear here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {(() => {
                  const filteredHistory = scanHistory.filter(item => 
                    historySearchTerm === '' ||
                    item.productName.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
                    item.brandName.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
                    item.barcode.includes(historySearchTerm)
                  );
                  
                  if (filteredHistory.length === 0 && historySearchTerm !== '') {
                    return (
                      <div className="text-center py-8">
                        <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
                        <p className="text-muted-foreground">
                          No scan history matches "{historySearchTerm}"
                        </p>
                      </div>
                    );
                  }
                  
                  return filteredHistory.map((item) => (
                  <Card key={item.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge 
                              variant={item.isVegan ? 'default' : 'destructive'}
                              className="text-xs"
                            >
                              {item.isVegan ? 'Vegan Safe' : 'Not Vegan'}
                            </Badge>
                            <Badge 
                              variant="outline" 
                              className="text-xs"
                            >
                              {item.dietClass}
                            </Badge>
                            {item.healthScore !== undefined && (
                              <Badge 
                                variant="secondary" 
                                className="text-xs"
                              >
                                Health: {item.healthScore}/100
                              </Badge>
                            )}
                          </div>
                          <h4 className="font-semibold text-sm truncate">
                            {item.productName}
                          </h4>
                          <p className="text-xs text-muted-foreground truncate">
                            {item.brandName}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.timestamp.toLocaleDateString()} at {item.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="flex-shrink-0 ml-4 flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewHistoryDetails(item)}
                            className="text-xs"
                          >
                            View Details
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromHistory(item.id)}
                            className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ));
              })()}
            </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowHistory(false);
              setHistorySearchTerm('');
            }}>
              Close
            </Button>
            {scanHistory.length > 0 && (
              <Button 
                variant="destructive" 
                onClick={() => {
                  setScanHistory([]);
                  setShowHistory(false);
                  setHistorySearchTerm('');
                }}
              >
                Clear History
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Details Modal */}
      <Dialog open={showHistoryDetails} onOpenChange={(open) => {
        setShowHistoryDetails(open);
        if (!open) {
          setSelectedHistoryItem(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HistoryIcon className="w-5 h-5" />
              Scan Details
            </DialogTitle>
            <DialogDescription>
              Detailed information about this scan
            </DialogDescription>
          </DialogHeader>

          {selectedHistoryItem ? (
            <div className="space-y-6">
              {/* Product Information */}
              <div className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      {selectedHistoryItem.productName}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {selectedHistoryItem.brandName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Barcode</p>
                    <p className="font-mono text-sm">{selectedHistoryItem.barcode}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {selectedHistoryItem.isVegan ? '✅' : '❌'}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedHistoryItem.isVegan ? 'Vegan Safe' : 'Not Vegan'}
                    </div>
                  </div>
                  
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {selectedHistoryItem.dietClass.charAt(0).toUpperCase() + selectedHistoryItem.dietClass.slice(1)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Diet Type</div>
                  </div>
                  
                  {selectedHistoryItem.healthScore !== undefined && (
                    <div className="text-center p-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {selectedHistoryItem.healthScore}/100
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Health Score</div>
                    </div>
                  )}
                  
                  <div className="text-center p-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {selectedHistoryItem.timestamp.toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Scanned On</div>
                  </div>
                </div>
              </div>

              {/* Scan Information */}
              <div className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Scan Information
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Scan ID:</span>
                    <span className="font-mono text-sm">{selectedHistoryItem.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Timestamp:</span>
                    <span className="text-sm">
                      {selectedHistoryItem.timestamp.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Barcode:</span>
                    <span className="font-mono text-sm">{selectedHistoryItem.barcode}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    // Could implement re-scan functionality here
                    setShowHistoryDetails(false);
                  }}
                  className="flex-1"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Re-scan Product
                </Button>
                <Button
                  onClick={() => setShowHistoryDetails(false)}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Details Available</h3>
              <p className="text-muted-foreground">
                Unable to load scan details. Please try again.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Scan;
