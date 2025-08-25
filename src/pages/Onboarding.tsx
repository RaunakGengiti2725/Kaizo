import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { userPreferences } from '@/services/userPreferences';
import { Leaf, ChevronRight, AlertTriangle, Heart } from 'lucide-react';

type DietaryPreference = 'vegan' | 'vegetarian' | '';
type OnboardingData = {
  dietaryPreference: DietaryPreference;
  allergies: string[];
  customAllergy: string;
};

const COMMON_ALLERGIES = [
  'Nuts (Tree nuts)',
  'Peanuts',
  'Soy',
  'Gluten/Wheat',
  'Sesame',
  'Shellfish',
  'Fish',
  'Eggs',
  'Dairy/Milk',
  'Corn',
];

const Onboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    dietaryPreference: '',
    allergies: [],
    customAllergy: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const progress = (currentStep / 2) * 100;

  const handleDietaryChoice = (choice: DietaryPreference) => {
    setData(prev => ({ ...prev, dietaryPreference: choice }));
  };

  const handleAllergyToggle = (allergy: string) => {
    setData(prev => ({
      ...prev,
      allergies: prev.allergies.includes(allergy)
        ? prev.allergies.filter(a => a !== allergy)
        : [...prev.allergies, allergy],
    }));
  };

  const handleCustomAllergyChange = (value: string) => {
    setData(prev => ({ ...prev, customAllergy: value }));
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (!data.dietaryPreference) {
        toast({
          title: "Please select an option",
          description: "We need to know your dietary preference to provide better recommendations.",
          variant: "destructive",
        });
        return;
      }
      setCurrentStep(2);
    }
  };

  const handleComplete = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // Combine selected allergies with custom allergy
      const allAllergies = [...data.allergies];
      if (data.customAllergy.trim()) {
        allAllergies.push(data.customAllergy.trim());
      }

      // Validate required fields
      if (!data.dietaryPreference) {
        toast({
          title: "Error",
          description: "Please select your dietary preference.",
          variant: "destructive",
        });
        return;
      }

      const preferencesData = {
        dietaryPreference: data.dietaryPreference as 'vegan' | 'vegetarian',
        allergies: allAllergies,
        completedAt: new Date().toISOString(),
      };

      // Save using the preferences service
      await userPreferences.savePreferences(preferencesData, user?.id);

      toast({
        title: "Welcome to Kaizo!",
        description: `Great! We've saved your ${data.dietaryPreference} preferences${allAllergies.length > 0 ? ` and ${allAllergies.length} allergy alert${allAllergies.length > 1 ? 's' : ''}` : ''}. Your personalized experience is ready!`,
      });

      // Redirect to login page
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error saving preferences",
        description: "We had trouble saving your preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg">
          <Leaf className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Welcome to Kaizo!</h2>
        <p className="text-muted-foreground">Let's personalize your experience</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" />
            What describes your diet?
          </CardTitle>
          <CardDescription>
            This helps us provide accurate product recommendations and scanning results.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <Button
              variant={data.dietaryPreference === 'vegan' ? 'default' : 'outline'}
              className="h-auto p-4 justify-start text-left"
              onClick={() => handleDietaryChoice('vegan')}
            >
              <div className="space-y-1">
                <div className={`font-semibold ${data.dietaryPreference === 'vegan' ? 'text-white' : 'text-foreground'}`}>
                  🌱 Vegan
                </div>
                <div className={`text-sm ${data.dietaryPreference === 'vegan' ? 'text-white/80' : 'text-muted-foreground'}`}>
                  No animal products (meat, dairy, eggs, honey, etc.)
                </div>
              </div>
            </Button>
            
            <Button
              variant={data.dietaryPreference === 'vegetarian' ? 'default' : 'outline'}
              className="h-auto p-4 justify-start text-left"
              onClick={() => handleDietaryChoice('vegetarian')}
            >
              <div className="space-y-1">
                <div className={`font-semibold ${data.dietaryPreference === 'vegetarian' ? 'text-white' : 'text-foreground'}`}>
                  🥬 Vegetarian
                </div>
                <div className={`text-sm ${data.dietaryPreference === 'vegetarian' ? 'text-white/80' : 'text-muted-foreground'}`}>
                  No meat or fish, but may include dairy and eggs
                </div>
              </div>
            </Button>
          </div>

          {data.dietaryPreference && (
            <div className="mt-6 flex justify-end">
              <Button onClick={handleNext} className="flex items-center gap-2">
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Allergy Information</h2>
        <p className="text-muted-foreground">Help us keep you safe by alerting you to potential allergens</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Do you have any food allergies?
          </CardTitle>
          <CardDescription>
            Select all that apply. We'll warn you when scanning products that contain these ingredients.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {COMMON_ALLERGIES.map((allergy) => (
              <div key={allergy} className="flex items-center space-x-2">
                <Checkbox
                  id={allergy}
                  checked={data.allergies.includes(allergy)}
                  onCheckedChange={() => handleAllergyToggle(allergy)}
                />
                <Label htmlFor={allergy} className="text-sm font-normal cursor-pointer">
                  {allergy}
                </Label>
              </div>
            ))}
          </div>

          <Separator />

          <div className="space-y-3">
            <Label htmlFor="custom-allergy" className="text-sm font-medium">
              Other allergies or dietary restrictions:
            </Label>
            <Input
              id="custom-allergy"
              placeholder="Type any other allergies or restrictions..."
              value={data.customAllergy}
              onChange={(e) => handleCustomAllergyChange(e.target.value)}
            />
          </div>

          {(data.allergies.length > 0 || data.customAllergy.trim()) && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Selected allergies:</p>
              <div className="flex flex-wrap gap-2">
                {data.allergies.map((allergy) => (
                  <Badge key={allergy} variant="secondary" className="text-xs">
                    {allergy}
                  </Badge>
                ))}
                {data.customAllergy.trim() && (
                  <Badge variant="secondary" className="text-xs">
                    {data.customAllergy.trim()}
                  </Badge>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(1)}
              className="flex items-center gap-2"
            >
              Back
            </Button>
            
            <Button
              onClick={handleComplete}
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Complete Setup
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          You can always update these preferences later in your profile settings.
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Step {currentStep} of 2</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Content */}
        {currentStep === 1 ? renderStep1() : renderStep2()}

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>Your data is securely stored and never shared with third parties.</p>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
