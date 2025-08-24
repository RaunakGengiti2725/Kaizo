import { useState, useEffect, useCallback } from 'react';
import { Camera, Upload, Loader2, CheckCircle, XCircle, AlertTriangle, Brain, Zap, Target, TrendingUp, Info, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { checkVeganStatusWithAI, checkVeganStatus, highlightIngredients, VeganCheckResult, IngredientMatch } from '@/utils/veganChecker';
import { imageProcessor, ImageProcessingResult } from '@/utils/imageProcessor';
import { haptics } from '@/utils/haptics';
import CameraCapture from '@/components/CameraCapture';
import scanFeatureImage from '@/assets/scan-feature.jpg';

interface CapturedImage {
  id: string;
  file: File;
  url: string;
  type: 'front' | 'back' | 'ingredients' | 'additional';
  timestamp: number;
}

const Scan = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<VeganCheckResult | null>(null);
  const [processingResult, setProcessingResult] = useState<ImageProcessingResult | null>(null);
  const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([]);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState<string>('');

  const processImages = useCallback(async (images: CapturedImage[]) => {
    setIsProcessing(true);
    setResult(null);
    setProcessingResult(null);
    setProcessingProgress(0);
    setCapturedImages(images);
    
    try {
      // Initialize image processor
      setCurrentStage('Initializing AI vision...');
      setProcessingProgress(10);
      await imageProcessor.initialize();
      
      // Process all images
      setCurrentStage('Analyzing product images...');
      setProcessingProgress(30);
      
      const imageData = images.map(img => ({
        file: img.file,
        type: img.type
      }));
      
      const processingResult = await imageProcessor.processImages(imageData);
      setProcessingResult(processingResult);
      setProcessingProgress(70);
      
      // Analyze for vegan content with AI
      setCurrentStage('AI analyzing ingredients...');
      setProcessingProgress(85);
      
      const aiImageData = images.map(img => ({
        file: img.file,
        text: processingResult.extractedTexts.find(et => et.source === img.type)?.text || '',
        type: img.type
      }));
      
      const veganResult = await checkVeganStatusWithAI(processingResult.combinedText, aiImageData);
      setResult(veganResult);
      setProcessingProgress(100);
      
      // Haptic feedback based on result
      if (veganResult.result === 'vegan') {
        haptics.success();
      } else if (veganResult.result === 'not-vegan') {
        haptics.error();
      } else {
        haptics.warning();
      }
      
      toast({
        title: "Analysis Complete",
        description: `Product analyzed: ${veganResult.result.replace('-', ' ')} (${Math.round(veganResult.confidence * 100)}% confidence)`,
      });
      
    } catch (error) {
      console.error('Error processing images:', error);
      toast({
        title: "Processing Error",
        description: "Failed to analyze images. Please try again with clearer photos.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setCurrentStage('');
      setProcessingProgress(0);
    }
  }, []);

  const resetScan = useCallback(() => {
    setResult(null);
    setProcessingResult(null);
    setCapturedImages([]);
    // Clean up image URLs
    capturedImages.forEach(img => URL.revokeObjectURL(img.url));
  }, [capturedImages]);
  
  useEffect(() => {
    return () => {
      // Cleanup on unmount
      capturedImages.forEach(img => URL.revokeObjectURL(img.url));
    };
  }, []);

  const getResultIcon = (size: string = "w-6 h-6") => {
    if (!result) return null;
    
    switch (result.result) {
      case 'vegan':
        return <CheckCircle className={`${size} text-success`} />;
      case 'not-vegan':
        return <XCircle className={`${size} text-destructive`} />;
      case 'unclear':
        return <AlertTriangle className={`${size} text-warning`} />;
    }
  };

  const getResultColor = () => {
    if (!result) return 'default';
    
    switch (result.result) {
      case 'vegan':
        return 'bg-success text-success-foreground';
      case 'not-vegan':
        return 'bg-destructive text-destructive-foreground';
      case 'unclear':
        return 'bg-warning text-warning-foreground';
      default:
        return 'default';
    }
  };
  
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-success';
    if (confidence >= 0.6) return 'text-warning';
    return 'text-destructive';
  };

  if (result && processingResult) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header with result */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            {getResultIcon("w-12 h-12")}
            <h1 className="text-4xl font-bold text-foreground">
              Analysis Complete
            </h1>
          </div>
          <div className="flex items-center justify-center gap-4 mb-4">
            <Badge className={`${getResultColor()} text-lg px-4 py-2`}>
              {result.result.replace('-', ' ').toUpperCase()}
            </Badge>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-muted-foreground" />
              <span className={`font-semibold ${getConfidenceColor(result.confidence)}`}>
                {Math.round(result.confidence * 100)}% Confidence
              </span>
            </div>
          </div>
          <Button 
            onClick={resetScan}
            variant="outline"
            className="mb-4"
          >
            <Camera className="w-4 h-4 mr-2" />
            Scan Another Product
          </Button>
        </div>

        <Tabs defaultValue="analysis" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Analysis
            </TabsTrigger>
            <TabsTrigger value="ingredients" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Ingredients
            </TabsTrigger>
            <TabsTrigger value="images" className="flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Images
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Tips
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analysis" className="space-y-6">
            {/* Main Result Card */}
            <Card className="shadow-card border-0">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getResultIcon()}
                    <div>
                      <CardTitle className="text-2xl">
                        {result.result === 'vegan' ? 'Vegan-Friendly! 🌱' :
                         result.result === 'not-vegan' ? 'Contains Animal Products ⚠️' :
                         'Uncertain Status 🤔'}
                      </CardTitle>
                      <CardDescription>
                        {result.productName && (
                          <span className="font-semibold">{result.productName}</span>
                        )}
                        {result.brandName && result.productName && ' • '}
                        {result.brandName && (
                          <span>Brand: {result.brandName}</span>
                        )}
                        {result.productCategory && (
                          <span> • Category: {result.productCategory}</span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold mb-1">
                      {Math.round(result.confidence * 100)}%
                    </div>
                    <Progress 
                      value={result.confidence * 100} 
                      className="w-24"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* AI Analysis Badge */}
                {result.aiAnalysis && (
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      <Brain className="w-3 h-3 mr-1" />
                      AI-Powered Analysis
                    </Badge>
                    <Badge variant="outline">
                      Trust Score: {Math.round((result.trustScore || 0) * 100)}%
                    </Badge>
                    {result.certifications && result.certifications.length > 0 && (
                      <Badge variant="default" className="bg-success text-success-foreground">
                        Certified: {result.certifications[0]}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Reasons */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    {result.aiAnalysis ? 'AI Analysis Reasoning' : 'Why this result?'}
                  </h4>
                  <ul className="space-y-2">
                    {result.reasons.map((reason, index) => (
                      <li key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                        <span className="text-sm">{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Processing Stats */}
                <div className="bg-muted/30 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Processing Statistics
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="font-semibold text-primary">{capturedImages.length}</div>
                      <div className="text-muted-foreground">Images Analyzed</div>
                    </div>
                    <div>
                      <div className="font-semibold text-primary">{result.detectedIngredients.length}</div>
                      <div className="text-muted-foreground">Ingredients Found</div>
                    </div>
                    <div>
                      <div className="font-semibold text-primary">{Math.round(processingResult.overallConfidence * 100)}%</div>
                      <div className="text-muted-foreground">OCR Accuracy</div>
                    </div>
                    <div>
                      <div className="font-semibold text-primary">{(processingResult.processingTime / 1000).toFixed(1)}s</div>
                      <div className="text-muted-foreground">Processing Time</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ingredients" className="space-y-6">
            {/* Detected Ingredients */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Detected Ingredients</CardTitle>
                <CardDescription>
                  All ingredients found in the product analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {result.detectedIngredients.map((ingredient, index) => (
                    <div key={index} className="p-4 bg-muted/50 rounded-lg space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge 
                            variant={ingredient.category === 'vegan' ? 'default' : 
                                    ingredient.category === 'notVegan' ? 'destructive' : 'secondary'}
                            className="capitalize"
                          >
                            {ingredient.category === 'notVegan' ? 'Not Vegan' : ingredient.category}
                          </Badge>
                          {ingredient.severity && (
                            <Badge 
                              variant="outline"
                              className={ingredient.severity === 'high' ? 'border-red-500 text-red-600' :
                                         ingredient.severity === 'medium' ? 'border-yellow-500 text-yellow-600' :
                                         'border-gray-500 text-gray-600'}
                            >
                              {ingredient.severity} severity
                            </Badge>
                          )}
                          <span className="font-medium">{ingredient.ingredient}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold">
                            {Math.round(ingredient.confidence * 100)}%
                          </div>
                        </div>
                      </div>
                      
                      {ingredient.explanation && (
                        <div className="text-sm text-muted-foreground">
                          <strong>Why:</strong> {ingredient.explanation}
                        </div>
                      )}
                      
                      {ingredient.alternatives && ingredient.alternatives.length > 0 && (
                        <div className="text-sm">
                          <strong className="text-success">Alternatives:</strong>{' '}
                          <span className="text-muted-foreground">
                            {ingredient.alternatives.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {result.detectedIngredients.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No specific ingredients detected</p>
                      <p className="text-sm">Try capturing a clearer image of the ingredients list</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Raw Extracted Text */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Extracted Text</CardTitle>
                <CardDescription>
                  Raw text extracted from all images
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {processingResult.extractedTexts.map((extracted, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="capitalize">
                          {extracted.source}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {Math.round(extracted.confidence * 100)}% accuracy
                        </span>
                      </div>
                      <div 
                        className="p-4 bg-muted rounded-lg text-sm font-mono max-h-32 overflow-y-auto"
                        dangerouslySetInnerHTML={{ 
                          __html: highlightIngredients(extracted.text || 'No text detected') 
                        }}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="images" className="space-y-6">
            {/* Captured Images */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Analyzed Images</CardTitle>
                <CardDescription>
                  All images used in the analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {capturedImages.map((image) => (
                    <div key={image.id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="capitalize">
                          {image.type}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(image.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <img
                        src={image.url}
                        alt={`${image.type} capture`}
                        className="w-full h-48 object-cover rounded-lg border"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="suggestions" className="space-y-6">
            {/* Suggestions */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  Recommendations
                </CardTitle>
                <CardDescription>
                  Helpful tips based on your scan results
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.suggestions?.map((suggestion, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                    <Lightbulb className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>{suggestion}</span>
                  </div>
                ))}
                
                {(!result.suggestions || result.suggestions.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No specific suggestions available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-4">AI-Powered Vegan Scanner</h1>
        <p className="text-xl text-muted-foreground">
          Capture multiple angles of your product for the most accurate vegan analysis
        </p>
      </div>

      {/* Processing State */}
      {isProcessing && (
        <Card className="mb-8 shadow-card">
          <CardContent className="py-12">
            <div className="text-center space-y-6">
              <div className="relative">
                <div className="w-20 h-20 mx-auto">
                  <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                  <div className="absolute inset-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <Brain className="w-8 h-8 text-primary" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-xl font-semibold">AI Analysis in Progress</h3>
                <p className="text-muted-foreground">{currentStage}</p>
                
                <div className="max-w-xs mx-auto">
                  <Progress value={processingProgress} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>0%</span>
                    <span>{Math.round(processingProgress)}%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                <div className="text-center">
                  <Camera className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <span className="text-xs text-muted-foreground">Image Processing</span>
                </div>
                <div className="text-center">
                  <Brain className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <span className="text-xs text-muted-foreground">AI Analysis</span>
                </div>
                <div className="text-center">
                  <CheckCircle className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <span className="text-xs text-muted-foreground">Results</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Camera Capture Component */}
      {!isProcessing && (
        <CameraCapture 
          onImagesCapture={processImages}
          isProcessing={isProcessing}
        />
      )}
      
      {/* Demo Section */}
      {!isProcessing && capturedImages.length === 0 && (
        <Card className="mt-8 shadow-card bg-gradient-card border-0">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              How It Works
            </CardTitle>
            <CardDescription>
              Our AI analyzes multiple product angles for maximum accuracy
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-semibold mb-2">1. Capture</h4>
                <p className="text-sm text-muted-foreground">
                  Take photos of the front, back, and ingredients list
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-semibold mb-2">2. Analyze</h4>
                <p className="text-sm text-muted-foreground">
                  AI processes text and identifies all ingredients
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-semibold mb-2">3. Decide</h4>
                <p className="text-sm text-muted-foreground">
                  Get instant vegan status with detailed explanations
                </p>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex justify-center">
              <img 
                src={scanFeatureImage} 
                alt="Scan feature demo"
                className="max-w-sm rounded-lg shadow-soft"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Scan;