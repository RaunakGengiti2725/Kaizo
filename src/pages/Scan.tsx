import { useState, useEffect, useCallback } from 'react';
import { Camera, Upload, Loader2, CheckCircle, XCircle, AlertTriangle, Brain, Zap, Target, TrendingUp, Info, Lightbulb, Leaf, Droplets, TreePine, Recycle, Shield, Users, Award, FlaskConical } from 'lucide-react';
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
import { cn } from '@/lib/utils';

interface CapturedImage {
  id: string;
  file: File;
  url: string;
  type: 'front' | 'back' | 'ingredients' | 'additional';
  timestamp: number;
}

const Scan = () => {
  const [isLoaded, setIsLoaded] = useState(false);
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

  useEffect(() => {
    setIsLoaded(true);
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
      <div className={cn(
        "container mx-auto px-4 py-8 max-w-6xl transition-transform duration-200 ease-out",
        isLoaded ? "animate-slide-in-right" : "translate-x-full"
      )}>
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

                          {/* Scores */}
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold">{result.veganScore ?? Math.round(result.confidence * 100)}</div>
              <div className="text-sm text-muted-foreground">Vegan score</div>
            </div>
            <Separator orientation="vertical" className="h-10" />
            <div className="text-center">
              <div className="text-3xl font-bold">{result.overallScore ?? Math.round((result.trustScore || result.confidence) * 100)}</div>
              <div className="text-sm text-muted-foreground">Overall</div>
            </div>
            {result.environmentalImpact?.carbonFootprint && (
              <>
                <Separator orientation="vertical" className="h-10" />
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{result.environmentalImpact.carbonFootprint.score}</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Leaf className="w-3 h-3" />
                    Carbon
                  </div>
                </div>
              </>
            )}
            {result.ethicalRating?.overallScore && (
              <>
                <Separator orientation="vertical" className="h-10" />
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{result.ethicalRating.overallScore}</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Ethics
                  </div>
                </div>
              </>
            )}
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
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Analysis
            </TabsTrigger>
            <TabsTrigger value="environmental" className="flex items-center gap-2">
              <Leaf className="w-4 h-4" />
              Environment
            </TabsTrigger>
            <TabsTrigger value="ethical" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Ethics
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
              Alternatives
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
                {/* Negatives / Positives summary like Yuka */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-destructive" />
                      Concerns
                    </h4>
                    <div className="space-y-2">
                      {(result.negatives || []).map((n, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded bg-destructive/5">
                          <span className="text-sm">{n.label}</span>
                          <span className={`w-2 h-2 rounded-full ${n.severity === 'high' ? 'bg-destructive' : n.severity === 'medium' ? 'bg-warning' : 'bg-muted-foreground'}`}></span>
                        </div>
                      ))}
                      {(!result.negatives || result.negatives.length === 0) && (
                        <div className="text-sm text-muted-foreground">No major concerns detected</div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      Positives
                    </h4>
                    <div className="space-y-2">
                      {(result.positives || []).map((p, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded bg-success/5">
                          <span className="text-sm">{p.label}</span>
                          <span className="w-2 h-2 rounded-full bg-success"></span>
                        </div>
                      ))}
                      {(!result.positives || result.positives.length === 0) && (
                        <div className="text-sm text-muted-foreground">No specific positives identified</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Environmental and Ethical Overview */}
                {(result.environmentalImpact || result.ethicalRating) && (
                  <>
                    <Separator />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Environmental Quick View */}
                      {result.environmentalImpact && (
                        <div className="bg-green-50 p-4 rounded-lg">
                          <h4 className="font-semibold mb-3 flex items-center gap-2 text-green-800">
                            <Leaf className="w-4 h-4" />
                            Environmental Impact
                          </h4>
                          <div className="space-y-2">
                            {result.environmentalImpact.carbonFootprint && (
                              <div className="flex items-center justify-between text-sm">
                                <span>Carbon footprint</span>
                                <Badge variant="outline" className={`${result.environmentalImpact.carbonFootprint.level === 'low' ? 'border-green-500 text-green-700' : 
                                                                    result.environmentalImpact.carbonFootprint.level === 'medium' ? 'border-yellow-500 text-yellow-700' : 'border-red-500 text-red-700'}`}>
                                  {result.environmentalImpact.carbonFootprint.level}
                                </Badge>
                              </div>
                            )}
                            {result.environmentalImpact.waterUsage && (
                              <div className="flex items-center justify-between text-sm">
                                <span>Water usage</span>
                                <Badge variant="outline" className={`${result.environmentalImpact.waterUsage.level === 'low' ? 'border-blue-500 text-blue-700' : 
                                                                     result.environmentalImpact.waterUsage.level === 'medium' ? 'border-yellow-500 text-yellow-700' : 'border-red-500 text-red-700'}`}>
                                  {result.environmentalImpact.waterUsage.level}
                                </Badge>
                              </div>
                            )}
                            {result.environmentalImpact.packaging && (
                              <div className="flex items-center justify-between text-sm">
                                <span>Packaging</span>
                                <Badge variant="outline" className={result.environmentalImpact.packaging.recyclable ? 'border-green-500 text-green-700' : 'border-gray-500 text-gray-700'}>
                                  {result.environmentalImpact.packaging.recyclable ? 'Recyclable' : 'Not recyclable'}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Ethical Quick View */}
                      {result.ethicalRating && (
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <h4 className="font-semibold mb-3 flex items-center gap-2 text-blue-800">
                            <Shield className="w-4 h-4" />
                            Ethical Practices
                          </h4>
                          <div className="space-y-2">
                            {result.ethicalRating.palmOil && (
                              <div className="flex items-center justify-between text-sm">
                                <span>Palm oil</span>
                                <Badge variant="outline" className={!result.ethicalRating.palmOil.present ? 'border-green-500 text-green-700' : 
                                                                   result.ethicalRating.palmOil.sustainable === true ? 'border-green-500 text-green-700' : 'border-red-500 text-red-700'}>
                                  {!result.ethicalRating.palmOil.present ? 'Free' : 
                                   result.ethicalRating.palmOil.sustainable === true ? 'Sustainable' : 'Concerning'}
                                </Badge>
                              </div>
                            )}
                            {result.ethicalRating.fairTrade && (
                              <div className="flex items-center justify-between text-sm">
                                <span>Fair trade</span>
                                <Badge variant="outline" className={result.ethicalRating.fairTrade.certified ? 'border-blue-500 text-blue-700' : 'border-gray-500 text-gray-700'}>
                                  {result.ethicalRating.fairTrade.certified ? 'Certified' : 'Not certified'}
                                </Badge>
                              </div>
                            )}
                            {result.ethicalRating.animalTesting && (
                              <div className="flex items-center justify-between text-sm">
                                <span>Animal testing</span>
                                <Badge variant="outline" className={result.ethicalRating.animalTesting.policy === 'not-tested' ? 'border-green-500 text-green-700' : 
                                                                   result.ethicalRating.animalTesting.policy === 'tested' ? 'border-red-500 text-red-700' : 'border-gray-500 text-gray-700'}>
                                  {result.ethicalRating.animalTesting.policy === 'not-tested' ? 'Cruelty-free' : 
                                   result.ethicalRating.animalTesting.policy === 'tested' ? 'Tested' : 'Unclear'}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

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

          <TabsContent value="environmental" className="space-y-6">
            {/* Environmental Impact Overview */}
            <Card className="shadow-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Leaf className="w-5 h-5 text-success" />
                  Environmental Impact Assessment
                </CardTitle>
                <CardDescription>
                  Carbon footprint, water usage, and packaging sustainability analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {result.environmentalImpact ? (
                  <>
                    {/* Carbon Footprint */}
                    {result.environmentalImpact.carbonFootprint && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <TreePine className="w-5 h-5 text-muted-foreground" />
                            <h4 className="font-semibold">Carbon Footprint</h4>
                          </div>
                          <Badge 
                            variant={result.environmentalImpact.carbonFootprint.level === 'low' ? 'default' : 
                                    result.environmentalImpact.carbonFootprint.level === 'medium' ? 'secondary' : 'destructive'}
                            className={result.environmentalImpact.carbonFootprint.level === 'low' ? 'bg-success text-success-foreground' : ''}
                          >
                            {result.environmentalImpact.carbonFootprint.level} impact
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <Progress 
                              value={result.environmentalImpact.carbonFootprint.score} 
                              className="h-2"
                            />
                          </div>
                          <div className="text-2xl font-bold text-primary">
                            {result.environmentalImpact.carbonFootprint.score}/100
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {result.environmentalImpact.carbonFootprint.details}
                        </p>
                        {result.environmentalImpact.carbonFootprint.factors && result.environmentalImpact.carbonFootprint.factors.length > 0 && (
                          <div className="space-y-2">
                            <h5 className="text-sm font-semibold">Key factors:</h5>
                            <ul className="space-y-1">
                              {result.environmentalImpact.carbonFootprint.factors.map((factor, idx) => (
                                <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                                  <div className="w-1 h-1 bg-primary rounded-full" />
                                  {factor}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    <Separator />

                    {/* Water Usage */}
                    {result.environmentalImpact.waterUsage && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Droplets className="w-5 h-5 text-blue-500" />
                            <h4 className="font-semibold">Water Usage</h4>
                          </div>
                          <Badge 
                            variant={result.environmentalImpact.waterUsage.level === 'low' ? 'default' : 
                                    result.environmentalImpact.waterUsage.level === 'medium' ? 'secondary' : 'destructive'}
                            className={result.environmentalImpact.waterUsage.level === 'low' ? 'bg-blue-100 text-blue-800' : ''}
                          >
                            {result.environmentalImpact.waterUsage.level} usage
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <Progress 
                              value={result.environmentalImpact.waterUsage.score} 
                              className="h-2"
                            />
                          </div>
                          <div className="text-2xl font-bold text-blue-600">
                            {result.environmentalImpact.waterUsage.score}/100
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {result.environmentalImpact.waterUsage.details}
                        </p>
                        {result.environmentalImpact.waterUsage.estimatedLiters && (
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <div className="text-sm font-semibold text-blue-800">
                              Estimated water footprint: {result.environmentalImpact.waterUsage.estimatedLiters} liters
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <Separator />

                    {/* Packaging */}
                    {result.environmentalImpact.packaging && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Recycle className="w-5 h-5 text-green-600" />
                            <h4 className="font-semibold">Packaging Sustainability</h4>
                          </div>
                          <Badge 
                            variant={result.environmentalImpact.packaging.recyclable ? 'default' : 'secondary'}
                            className={result.environmentalImpact.packaging.recyclable ? 'bg-green-100 text-green-800' : ''}
                          >
                            {result.environmentalImpact.packaging.recyclable ? 'Recyclable' : 'Not recyclable'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <Progress 
                              value={result.environmentalImpact.packaging.sustainabilityScore} 
                              className="h-2"
                            />
                          </div>
                          <div className="text-2xl font-bold text-green-600">
                            {result.environmentalImpact.packaging.sustainabilityScore}/100
                          </div>
                        </div>
                        {result.environmentalImpact.packaging.materials.length > 0 && (
                          <div className="space-y-2">
                            <h5 className="text-sm font-semibold">Packaging materials:</h5>
                            <div className="flex flex-wrap gap-2">
                              {result.environmentalImpact.packaging.materials.map((material, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {material}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Leaf className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Environmental impact data not available</p>
                    <p className="text-sm">This analysis requires AI processing with complete product information</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ethical" className="space-y-6">
            {/* Ethical Rating Overview */}
            <Card className="shadow-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Ethical Rating Assessment
                </CardTitle>
                <CardDescription>
                  Fair trade, labor practices, palm oil sustainability, and animal testing policies
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {result.ethicalRating ? (
                  <>
                    {/* Overall Ethical Score */}
                    <div className="text-center p-6 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg">
                      <div className="text-4xl font-bold text-primary mb-2">
                        {result.ethicalRating.overallScore}/100
                      </div>
                      <div className="text-sm text-muted-foreground">Overall Ethical Score</div>
                      <Progress value={result.ethicalRating.overallScore} className="mt-3 max-w-xs mx-auto" />
                    </div>

                    {/* Palm Oil Assessment */}
                    {result.ethicalRating.palmOil && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <TreePine className="w-5 h-5 text-orange-500" />
                            <h4 className="font-semibold">Palm Oil</h4>
                          </div>
                          <Badge 
                            variant={!result.ethicalRating.palmOil.present ? 'default' :
                                    result.ethicalRating.palmOil.sustainable === true ? 'secondary' : 'destructive'}
                            className={!result.ethicalRating.palmOil.present ? 'bg-success text-success-foreground' : 
                                      result.ethicalRating.palmOil.sustainable === true ? 'bg-green-100 text-green-800' : ''}
                          >
                            {!result.ethicalRating.palmOil.present ? 'Palm oil free' :
                             result.ethicalRating.palmOil.sustainable === true ? 'Sustainable' :
                             result.ethicalRating.palmOil.sustainable === 'unclear' ? 'Unclear' : 'Unsustainable'}
                          </Badge>
                        </div>
                        {result.ethicalRating.palmOil.certification && (
                          <div className="bg-green-50 p-3 rounded-lg">
                            <div className="text-sm font-semibold text-green-800">
                              Certification: {result.ethicalRating.palmOil.certification}
                            </div>
                          </div>
                        )}
                        {result.ethicalRating.palmOil.concerns && result.ethicalRating.palmOil.concerns.length > 0 && (
                          <div className="space-y-1">
                            {result.ethicalRating.palmOil.concerns.map((concern, idx) => (
                              <div key={idx} className="text-sm text-destructive flex items-center gap-2">
                                <AlertTriangle className="w-3 h-3" />
                                {concern}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <Separator />

                    {/* Fair Trade */}
                    {result.ethicalRating.fairTrade && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Award className="w-5 h-5 text-blue-600" />
                            <h4 className="font-semibold">Fair Trade</h4>
                          </div>
                          <Badge 
                            variant={result.ethicalRating.fairTrade.certified ? 'default' : 'secondary'}
                            className={result.ethicalRating.fairTrade.certified ? 'bg-blue-100 text-blue-800' : ''}
                          >
                            {result.ethicalRating.fairTrade.certified ? 'Certified' : 'Not certified'}
                          </Badge>
                        </div>
                        {result.ethicalRating.fairTrade.certification && (
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <div className="text-sm font-semibold text-blue-800">
                              {result.ethicalRating.fairTrade.certification}
                            </div>
                          </div>
                        )}
                        {result.ethicalRating.fairTrade.details && (
                          <p className="text-sm text-muted-foreground">
                            {result.ethicalRating.fairTrade.details}
                          </p>
                        )}
                      </div>
                    )}

                    <Separator />

                    {/* Labor Practices */}
                    {result.ethicalRating.laborPractices && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-purple-600" />
                            <h4 className="font-semibold">Labor Practices</h4>
                          </div>
                          <div className="text-lg font-bold">
                            {result.ethicalRating.laborPractices.score}/100
                          </div>
                        </div>
                        <Progress value={result.ethicalRating.laborPractices.score} className="h-2" />
                        {result.ethicalRating.laborPractices.certifications && result.ethicalRating.laborPractices.certifications.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {result.ethicalRating.laborPractices.certifications.map((cert, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {cert}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {result.ethicalRating.laborPractices.concerns && result.ethicalRating.laborPractices.concerns.length > 0 && (
                          <div className="space-y-1">
                            {result.ethicalRating.laborPractices.concerns.map((concern, idx) => (
                              <div key={idx} className="text-sm text-warning flex items-center gap-2">
                                <AlertTriangle className="w-3 h-3" />
                                {concern}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <Separator />

                    {/* Animal Testing */}
                    {result.ethicalRating.animalTesting && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FlaskConical className="w-5 h-5 text-indigo-600" />
                            <h4 className="font-semibold">Animal Testing</h4>
                          </div>
                          <Badge 
                            variant={result.ethicalRating.animalTesting.policy === 'not-tested' ? 'default' : 
                                    result.ethicalRating.animalTesting.policy === 'tested' ? 'destructive' : 'secondary'}
                            className={result.ethicalRating.animalTesting.policy === 'not-tested' ? 'bg-success text-success-foreground' : ''}
                          >
                            {result.ethicalRating.animalTesting.policy === 'not-tested' ? 'Not tested on animals' :
                             result.ethicalRating.animalTesting.policy === 'tested' ? 'Tested on animals' : 'Policy unclear'}
                          </Badge>
                        </div>
                        {result.ethicalRating.animalTesting.details && (
                          <p className="text-sm text-muted-foreground">
                            {result.ethicalRating.animalTesting.details}
                          </p>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Ethical rating data not available</p>
                    <p className="text-sm">This analysis requires AI processing with complete product information</p>
                  </div>
                )}
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
                  Better Alternatives
                </CardTitle>
                <CardDescription>
                  Healthier or fully vegan substitutes for this product
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(result.alternatives || result.suggestions || []).map((alt, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                    <Lightbulb className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>{typeof alt === 'string' ? alt : alt.title}</span>
                  </div>
                ))}
                {(!result.alternatives || result.alternatives.length === 0) && (!result.suggestions || result.suggestions.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No alternatives available</p>
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
    <div className={cn(
      "container mx-auto px-4 py-8 max-w-4xl transition-transform duration-200 ease-out",
      isLoaded ? "animate-slide-in-right" : "translate-x-full"
    )}>
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-4">Kaizo - AI-Powered Vegan Scanner</h1>
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