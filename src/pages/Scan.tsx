import { useState, useRef } from 'react';
import { Camera, Upload, Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { checkVeganStatus, highlightIngredients, VeganCheckResult } from '@/utils/veganChecker';
import Tesseract from 'tesseract.js';
import scanFeatureImage from '@/assets/scan-feature.jpg';

const Scan = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<VeganCheckResult | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImage = async (file: File) => {
    setIsProcessing(true);
    setResult(null);
    
    try {
      // Create image URL for preview
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);

      // Extract text using Tesseract.js
      const { data: { text } } = await Tesseract.recognize(file, 'eng', {
        logger: m => console.log(m)
      });

      // Check vegan status
      const veganResult = checkVeganStatus(text);
      setResult(veganResult);
      
      toast({
        title: "Scan Complete",
        description: `Product is ${veganResult.result.replace('-', ' ')}`,
      });
    } catch (error) {
      console.error('Error processing image:', error);
      toast({
        title: "Error",
        description: "Failed to process image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processImage(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const getResultIcon = () => {
    if (!result) return null;
    
    switch (result.result) {
      case 'vegan':
        return <CheckCircle className="w-6 h-6 text-success" />;
      case 'not-vegan':
        return <XCircle className="w-6 h-6 text-destructive" />;
      case 'unclear':
        return <AlertTriangle className="w-6 h-6 text-warning" />;
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-4">Scan Product Ingredients</h1>
        <p className="text-xl text-muted-foreground">
          Upload or take a photo of ingredients to check if a product is vegan
        </p>
      </div>

      {/* Upload Section */}
      <Card className="mb-8 shadow-card bg-gradient-card border-0">
        <CardHeader className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Camera className="w-10 h-10 text-primary" />
          </div>
          <CardTitle>Upload Product Image</CardTitle>
          <CardDescription>
            Take a clear photo of the ingredients panel for best results
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={handleUploadClick}
              disabled={isProcessing}
              size="lg"
              className="bg-primary hover:bg-primary/90 shadow-glow transition-smooth"
            >
              <Upload className="w-5 h-5 mr-2" />
              Choose Photo
            </Button>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Demo Image */}
          <div className="flex justify-center mt-6">
            <img 
              src={scanFeatureImage} 
              alt="Scan feature demo"
              className="max-w-sm rounded-lg shadow-soft"
            />
          </div>
        </CardContent>
      </Card>

      {/* Processing State */}
      {isProcessing && (
        <Card className="mb-8 shadow-card">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Processing Image...</h3>
              <p className="text-muted-foreground">Extracting and analyzing ingredients</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Image Preview */}
      {selectedImage && !isProcessing && (
        <Card className="mb-8 shadow-card">
          <CardHeader>
            <CardTitle>Uploaded Image</CardTitle>
          </CardHeader>
          <CardContent>
            <img 
              src={selectedImage} 
              alt="Selected product"
              className="max-w-full h-auto rounded-lg shadow-soft mx-auto"
            />
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <Card className="shadow-card border-0">
          <CardHeader>
            <div className="flex items-center gap-3">
              {getResultIcon()}
              <div>
                <CardTitle className="flex items-center gap-2">
                  Analysis Results
                  <Badge className={getResultColor()}>
                    {result.result.replace('-', ' ').toUpperCase()}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Based on ingredient analysis
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Reasons */}
            <div>
              <h4 className="font-semibold mb-2">Why this result?</h4>
              <ul className="space-y-1">
                {result.reasons.map((reason, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                    {reason}
                  </li>
                ))}
              </ul>
            </div>

            {/* Extracted Text */}
            <div>
              <h4 className="font-semibold mb-2">Extracted Ingredients</h4>
              <div 
                className="p-4 bg-muted rounded-lg text-sm font-mono"
                dangerouslySetInnerHTML={{ 
                  __html: highlightIngredients(result.extractedText) 
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Scan;