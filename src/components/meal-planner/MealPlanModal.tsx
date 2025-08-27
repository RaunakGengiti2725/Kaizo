import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChefHat, Sparkles, Loader2, CheckCircle, RefreshCw, Leaf, Zap, Target, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { MealItem } from '@/state/mealPlannerStore';
import { getAllRecipes } from '@/data/recipeDatabase';

interface MealPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  weekDays: string[];
  weekStart: Date;
  onMealPlanGenerated: (meals: MealItem[]) => void;
}

interface MealPlanOptions {
  includeBreakfast: boolean;
  includeLunch: boolean;
  includeDinner: boolean;
  includeSnacks: boolean;
  focusOnProtein: boolean;
  focusOnIron: boolean;
  focusOnCalcium: boolean;
  focusOnOmega3: boolean;
  varietyLevel: 'low' | 'medium' | 'high';
}

const MealPlanModal = ({ isOpen, onClose, weekDays, weekStart, onMealPlanGenerated }: MealPlanModalProps) => {
  const [options, setOptions] = useState<MealPlanOptions>({
    includeBreakfast: true,
    includeLunch: true,
    includeDinner: true,
    includeSnacks: true,
    focusOnProtein: true,
    focusOnIron: true,
    focusOnCalcium: true,
    focusOnOmega3: true,
    varietyLevel: 'high'
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMeals, setGeneratedMeals] = useState<MealItem[]>([]);
  const [previewMode, setPreviewMode] = useState(false);

  const allRecipes = getAllRecipes();

  // Nutrition-focused recipe categories
  const recipeCategories = {
    highProtein: allRecipes.filter(recipe => 
      recipe.tags.includes('high-protein') || 
      recipe.title.toLowerCase().includes('tofu') ||
      recipe.title.toLowerCase().includes('tempeh') ||
      recipe.title.toLowerCase().includes('lentil') ||
      recipe.title.toLowerCase().includes('chickpea') ||
      recipe.title.toLowerCase().includes('bean')
    ),
    highIron: allRecipes.filter(recipe => 
      recipe.title.toLowerCase().includes('spinach') ||
      recipe.title.toLowerCase().includes('kale') ||
      recipe.title.toLowerCase().includes('lentil') ||
      recipe.title.toLowerCase().includes('quinoa') ||
      recipe.title.toLowerCase().includes('tofu') ||
      recipe.title.toLowerCase().includes('bean')
    ),
    highCalcium: allRecipes.filter(recipe => 
      recipe.title.toLowerCase().includes('tofu') ||
      recipe.title.toLowerCase().includes('kale') ||
      recipe.title.toLowerCase().includes('almond') ||
      recipe.title.toLowerCase().includes('chia') ||
      recipe.title.toLowerCase().includes('yogurt')
    ),
    highOmega3: allRecipes.filter(recipe => 
      recipe.title.toLowerCase().includes('chia') ||
      recipe.title.toLowerCase().includes('flax') ||
      recipe.title.toLowerCase().includes('walnut') ||
      recipe.title.toLowerCase().includes('seeds') ||
      recipe.title.toLowerCase().includes('omega3')
    ),
    breakfast: allRecipes.filter(recipe => 
      recipe.tags.includes('breakfast') ||
      recipe.title.toLowerCase().includes('oatmeal') ||
      recipe.title.toLowerCase().includes('toast') ||
      recipe.title.toLowerCase().includes('smoothie') ||
      recipe.title.toLowerCase().includes('pudding')
    ),
    lunch: allRecipes.filter(recipe => 
      recipe.tags.includes('lunch') ||
      recipe.title.toLowerCase().includes('bowl') ||
      recipe.title.toLowerCase().includes('salad') ||
      recipe.title.toLowerCase().includes('wrap') ||
      recipe.title.toLowerCase().includes('hummus')
    ),
    dinner: allRecipes.filter(recipe => 
      recipe.tags.includes('dinner') ||
      recipe.title.toLowerCase().includes('curry') ||
      recipe.title.toLowerCase().includes('stew') ||
      recipe.title.toLowerCase().includes('enchilada') ||
      recipe.title.toLowerCase().includes('risotto') ||
      recipe.title.toLowerCase().includes('soup')
    ),
    snacks: allRecipes.filter(recipe => 
      recipe.tags.includes('snack') ||
      recipe.title.toLowerCase().includes('hummus') ||
      recipe.title.toLowerCase().includes('nuts') ||
      recipe.title.toLowerCase().includes('yogurt') ||
      recipe.title.toLowerCase().includes('energy') ||
      recipe.title.toLowerCase().includes('balls')
    )
  };

  const generateMealPlan = () => {
    setIsGenerating(true);
    setPreviewMode(false);
    setGeneratedMeals([]);

    // Simulate processing delay
    setTimeout(() => {
      const newMeals: MealItem[] = [];
      
      // Track used recipes per day to avoid same recipe twice in one day
      const usedRecipesPerDay = new Map<string, Set<string>>();
      
      weekDays.forEach((day, dayIndex) => {
        const dayUsedRecipes = new Set<string>();
        
        // Breakfast
        if (options.includeBreakfast) {
          let breakfastRecipes = options.focusOnProtein 
            ? recipeCategories.highProtein.filter(r => r.tags.includes('breakfast'))
            : recipeCategories.breakfast;
          
          // Fallback to general breakfast recipes if specific ones are empty
          if (breakfastRecipes.length === 0) {
            breakfastRecipes = allRecipes.filter(r => r.tags.includes('breakfast'));
          }
          
          // If still empty, use any recipe that could work for breakfast
          if (breakfastRecipes.length === 0) {
            breakfastRecipes = allRecipes.filter(r => 
              r.tags.includes('quick') || 
              r.tags.includes('no-cook') ||
              r.prepTime <= 15
            );
          }
          
          // If we run out of unique recipes, allow reuse but avoid same day
          let availableBreakfast = breakfastRecipes.filter(r => !dayUsedRecipes.has(r.title));
          if (availableBreakfast.length === 0) {
            availableBreakfast = breakfastRecipes;
          }
          
          if (availableBreakfast.length > 0) {
            const selected = availableBreakfast[Math.floor(Math.random() * availableBreakfast.length)];
            dayUsedRecipes.add(selected.title);
            newMeals.push({
              id: `meal-${day}-breakfast-${Date.now()}`,
              title: selected.title,
              type: 'recipe',
              day,
              slot: 'Breakfast'
            });
          }
        }

        // Lunch
        if (options.includeLunch) {
          let lunchRecipes = options.focusOnIron 
            ? recipeCategories.highIron.filter(r => r.tags.includes('lunch') || r.tags.includes('dinner'))
            : recipeCategories.lunch;
          
          // Fallback to general lunch recipes if specific ones are empty
          if (lunchRecipes.length === 0) {
            lunchRecipes = allRecipes.filter(r => r.tags.includes('lunch'));
          }
          
          // If still empty, use any recipe that could work for lunch
          if (lunchRecipes.length === 0) {
            lunchRecipes = allRecipes.filter(r => 
              r.tags.includes('bowl') || 
              r.tags.includes('salad') ||
              r.servings >= 2
            );
          }
          
          let availableLunch = lunchRecipes.filter(r => !dayUsedRecipes.has(r.title));
          if (availableLunch.length === 0) {
            availableLunch = lunchRecipes;
          }
          
          if (availableLunch.length > 0) {
            const selected = availableLunch[Math.floor(Math.random() * availableLunch.length)];
            dayUsedRecipes.add(selected.title);
            newMeals.push({
              id: `meal-${day}-lunch-${Date.now()}`,
              title: selected.title,
              type: 'recipe',
              day,
              slot: 'Lunch'
            });
          }
        }

        // Dinner
        if (options.includeDinner) {
          let dinnerRecipes = options.focusOnCalcium 
            ? recipeCategories.highCalcium.filter(r => r.tags.includes('dinner'))
            : recipeCategories.dinner;
          
          // Fallback to general dinner recipes if specific ones are empty
          if (dinnerRecipes.length === 0) {
            dinnerRecipes = allRecipes.filter(r => r.tags.includes('dinner'));
          }
          
          // If still empty, use any recipe that could work for dinner
          if (dinnerRecipes.length === 0) {
            dinnerRecipes = allRecipes.filter(r => 
              r.tags.includes('curry') || 
              r.tags.includes('stew') ||
              r.tags.includes('soup') ||
              r.cookTime >= 20
            );
          }
          
          let availableDinner = dinnerRecipes.filter(r => !dayUsedRecipes.has(r.title));
          if (availableDinner.length === 0) {
            availableDinner = dinnerRecipes;
          }
          
          if (availableDinner.length > 0) {
            const selected = availableDinner[Math.floor(Math.random() * availableDinner.length)];
            dayUsedRecipes.add(selected.title);
            newMeals.push({
              id: `meal-${day}-dinner-${Date.now()}`,
              title: selected.title,
              type: 'recipe',
              day,
              slot: 'Dinner'
            });
          }
        }

        // Snacks
        if (options.includeSnacks) {
          let snackRecipes = options.focusOnOmega3 
            ? recipeCategories.highOmega3.filter(r => r.tags.includes('snack'))
            : recipeCategories.snacks;
          
          // Fallback to general snack recipes if specific ones are empty
          if (snackRecipes.length === 0) {
            snackRecipes = allRecipes.filter(r => r.tags.includes('snack'));
          }
          
          // If still empty, use any recipe that could work for snacks
          if (snackRecipes.length === 0) {
            snackRecipes = allRecipes.filter(r => 
              r.tags.includes('no-cook') || 
              r.tags.includes('quick') ||
              r.prepTime <= 10
            );
          }
          
          let availableSnacks = snackRecipes.filter(r => !dayUsedRecipes.has(r.title));
          if (availableSnacks.length === 0) {
            availableSnacks = snackRecipes;
          }
          
          if (availableSnacks.length > 0) {
            const selected = availableSnacks[Math.floor(Math.random() * availableSnacks.length)];
            dayUsedRecipes.add(selected.title);
            newMeals.push({
              id: `meal-${day}-snacks-${Date.now()}`,
              title: selected.title,
              type: 'recipe',
              day,
              slot: 'Snacks'
            });
          }
        }
        
        usedRecipesPerDay.set(day, dayUsedRecipes);
      });

      setGeneratedMeals(newMeals);
      setIsGenerating(false);
      setPreviewMode(true);
    }, 2000);
  };

  const handleApplyMealPlan = () => {
    onMealPlanGenerated(generatedMeals);
    onClose();
  };

  const regenerateMealPlan = () => {
    setPreviewMode(false);
    generateMealPlan();
  };

  const toggleOption = (key: keyof MealPlanOptions) => {
    setOptions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const setVarietyLevel = (level: 'low' | 'medium' | 'high') => {
    setOptions(prev => ({
      ...prev,
      varietyLevel: level
    }));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-4xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="shadow-2xl border-border/50 h-full flex flex-col">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl flex items-center gap-2">
                  <ChefHat className="w-5 h-5" />
                  Generate Meal Plan
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Create a nutritionally balanced vegan meal plan for {weekStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - {new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </CardHeader>

            <CardContent className="flex-1 overflow-hidden flex flex-col gap-6">
              {!previewMode ? (
                <div className="space-y-6">
                  {/* Meal Type Selection */}
                  <div>
                    <h3 className="font-medium mb-3">Include Meal Types</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant={options.includeBreakfast ? "default" : "outline"}
                        onClick={() => toggleOption('includeBreakfast')}
                        className="justify-start"
                      >
                        <CheckCircle className={cn("w-4 h-4 mr-2", options.includeBreakfast ? "opacity-100" : "opacity-0")} />
                        Breakfast
                      </Button>
                      <Button
                        variant={options.includeLunch ? "default" : "outline"}
                        onClick={() => toggleOption('includeLunch')}
                        className="justify-start"
                      >
                        <CheckCircle className={cn("w-4 h-4 mr-2", options.includeLunch ? "opacity-100" : "opacity-0")} />
                        Lunch
                      </Button>
                      <Button
                        variant={options.includeDinner ? "default" : "outline"}
                        onClick={() => toggleOption('includeDinner')}
                        className="justify-start"
                      >
                        <CheckCircle className={cn("w-4 h-4 mr-2", options.includeDinner ? "opacity-100" : "opacity-0")} />
                        Dinner
                      </Button>
                      <Button
                        variant={options.includeSnacks ? "default" : "outline"}
                        onClick={() => toggleOption('includeSnacks')}
                        className="justify-start"
                      >
                        <CheckCircle className={cn("w-4 h-4 mr-2", options.includeSnacks ? "opacity-100" : "opacity-0")} />
                        Snacks
                      </Button>
                    </div>
                  </div>

                  {/* Nutritional Focus */}
                  <div>
                    <h3 className="font-medium mb-3">Nutritional Focus</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant={options.focusOnProtein ? "default" : "outline"}
                        onClick={() => toggleOption('focusOnProtein')}
                        className="justify-start"
                      >
                        <Target className="w-4 h-4 mr-2" />
                        High Protein
                      </Button>
                      <Button
                        variant={options.focusOnIron ? "default" : "outline"}
                        onClick={() => toggleOption('focusOnIron')}
                        className="justify-start"
                      >
                        <Heart className="w-4 h-4 mr-2" />
                        Iron Rich
                      </Button>
                      <Button
                        variant={options.focusOnCalcium ? "default" : "outline"}
                        onClick={() => toggleOption('focusOnCalcium')}
                        className="justify-start"
                      >
                        <Leaf className="w-4 h-4 mr-2" />
                        Calcium Rich
                      </Button>
                      <Button
                        variant={options.focusOnOmega3 ? "default" : "outline"}
                        onClick={() => toggleOption('focusOnOmega3')}
                        className="justify-start"
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Omega-3 Rich
                      </Button>
                    </div>
                  </div>

                  {/* Variety Level */}
                  <div>
                    <h3 className="font-medium mb-3">Variety Level</h3>
                    <div className="flex gap-2">
                      <Button
                        variant={options.varietyLevel === 'low' ? "default" : "outline"}
                        onClick={() => setVarietyLevel('low')}
                        size="sm"
                      >
                        Low
                      </Button>
                      <Button
                        variant={options.varietyLevel === 'medium' ? "default" : "outline"}
                        onClick={() => setVarietyLevel('medium')}
                        size="sm"
                      >
                        Medium
                      </Button>
                      <Button
                        variant={options.varietyLevel === 'high' ? "default" : "outline"}
                        onClick={() => setVarietyLevel('high')}
                        size="sm"
                      >
                        High
                      </Button>
                    </div>
                  </div>

                  <Button
                    onClick={generateMealPlan}
                    disabled={isGenerating || (!options.includeBreakfast && !options.includeLunch && !options.includeDinner && !options.includeSnacks)}
                    className="w-full"
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Generating Your Perfect Meal Plan...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        Generate Meal Plan
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Generated Meal Plan Preview */}
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-lg">Your Generated Meal Plan</h3>
                    <div className="flex gap-2">
                      <Button
                        onClick={regenerateMealPlan}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Regenerate
                      </Button>
                      <Button
                        onClick={handleApplyMealPlan}
                        size="sm"
                        className="gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Apply to Planner
                      </Button>
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto space-y-4">
                    {weekDays.map(day => {
                      const dayMeals = generatedMeals.filter(meal => meal.day === day);
                      if (dayMeals.length === 0) return null;

                      return (
                        <div key={day} className="space-y-3">
                          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                            {day}
                          </h4>
                          <div className="space-y-2">
                            {dayMeals.map((meal) => (
                              <div
                                key={meal.id}
                                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                              >
                                <div className="flex items-center gap-3">
                                  <Badge variant="secondary" className="text-xs">
                                    {meal.slot}
                                  </Badge>
                                  <span className="font-medium">{meal.title}</span>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  Recipe
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="text-center text-sm text-muted-foreground">
                    <p>This meal plan is optimized for your nutritional preferences and ensures variety throughout the week.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MealPlanModal;
