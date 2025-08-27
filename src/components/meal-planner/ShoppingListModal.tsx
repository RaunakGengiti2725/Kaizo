import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { MealItem } from '@/state/mealPlannerStore';
import { getRecipeIngredients, testRecipeMatching } from '@/data/recipeDatabase';
import { geminiAI } from '@/services/geminiAI';
import { X, Download, Sparkles, Loader2, Plus } from 'lucide-react';

interface ShoppingItem {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  recipes: string[];
  notes?: string;
  priority?: string;
}

interface ShoppingListModalProps {
  isOpen: boolean;
  onClose: () => void;
  weekDays: string[];
  weekStart: Date;
  items: MealItem[];
}

const categories = ['Produce', 'Pantry', 'Frozen', 'Dairy', 'Bakery', 'Refrigerated', 'Other'];
const mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const ShoppingListModal: React.FC<ShoppingListModalProps> = ({
  isOpen,
  onClose,
  weekDays,
  weekStart,
  items
}) => {
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [aiGeneratedList, setAiGeneratedList] = useState<ShoppingItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedMealTypes, setSelectedMealTypes] = useState<Set<string>>(new Set(['Breakfast', 'Lunch', 'Dinner']));
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set(weekDays));
  const [customFoodInput, setCustomFoodInput] = useState<string>('');
  const [customFoodItems, setCustomFoodItems] = useState<string[]>([]);

  // Helper function to convert recipe ingredients to shopping items
  const convertIngredientsToShoppingItems = (ingredients: any[], recipeName: string): ShoppingItem[] => {
    return ingredients.map(ingredient => ({
      name: ingredient.name,
      quantity: ingredient.quantity || 1,
      unit: ingredient.unit || 'piece',
      category: ingredient.category || 'Other',
      recipes: [recipeName],
      notes: ingredient.notes,
      priority: ingredient.priority || 'medium'
    }));
  };

  // Download functions
  const downloadAsCSV = (listToDownload: ShoppingItem[] = shoppingList) => {
    if (listToDownload.length === 0) return;
    
    const csvContent = [
      ['Category', 'Item', 'Quantity', 'Unit', 'Recipes', 'Notes'],
      ...listToDownload.map(item => [
        item.category,
        item.name,
        item.quantity.toString(),
        item.unit,
        item.recipes.join('; '),
        item.notes || ''
      ])
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const filename = listToDownload === aiGeneratedList ? `ai-shopping-list-${weekStart.toISOString().split('T')[0]}.csv` : `shopping-list-${weekStart.toISOString().split('T')[0]}.csv`;
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAsTXT = (listToDownload: ShoppingItem[] = shoppingList) => {
    if (listToDownload.length === 0) return;
    
    let txtContent = `AI SHOPPING LIST\n`;
    txtContent += `${weekStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}\n`;
    txtContent += `Generated on: ${new Date().toLocaleDateString()}\n\n`;
    
    if (listToDownload === aiGeneratedList) {
      txtContent += `AI Enhanced Shopping List\n`;
      txtContent += `${'='.repeat(15)}\n`;
      listToDownload.forEach(item => {
        txtContent += `☐ ${item.name} - ${item.quantity} ${item.unit}\n`;
        if (item.recipes.length > 0) {
          txtContent += `   Used in: ${item.recipes.join(', ')}\n`;
        }
        if (item.notes) {
          txtContent += `   Note: ${item.notes}\n`;
        }
        txtContent += '\n';
      });
    } else {
      txtContent += `Shopping List\n`;
      txtContent += `${'='.repeat(15)}\n`;
      listToDownload.forEach(item => {
        txtContent += `☐ ${item.name} - ${item.quantity} ${item.unit}\n`;
        if (item.recipes.length > 0) {
          txtContent += `   Used in: ${item.recipes.join(', ')}\n`;
        }
        txtContent += '\n';
      });
    }
    
    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    const filename = listToDownload === aiGeneratedList ? `ai-shopping-list-${weekStart.toISOString().split('T')[0]}.txt` : `shopping-list-${weekStart.toISOString().split('T')[0]}.txt`;
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAsPDF = (listToDownload: ShoppingItem[] = shoppingList) => {
    if (listToDownload.length === 0) return;
    
    // Create a formatted HTML document that can be printed as PDF
    let htmlContent = '<!DOCTYPE html>' +
      '<html>' +
      '<head>' +
        '<title>AI Shopping List</title>' +
        '<style>' +
          'body { font-family: Arial, sans-serif; margin: 20px; }' +
          '.header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }' +
          '.category { margin-bottom: 25px; }' +
          '.category-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; }' +
          '.item { margin-bottom: 10px; padding-left: 20px; }' +
          '.item-name { font-weight: bold; }' +
          '.item-details { color: #666; font-size: 14px; margin-left: 20px; }' +
          '.checkbox { display: inline-block; width: 20px; height: 20px; border: 2px solid #333; margin-right: 10px; }' +
          '@media print { .no-print { display: none; } }' +
        '</style>' +
      '</head>' +
      '<body>' +
        '<div class="header">' +
          '<h1>AI SHOPPING LIST</h1>' +
          '<p>' + weekStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) + ' - ' + new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) + '</p>' +
          '<p>Generated on: ' + new Date().toLocaleDateString() + '</p>' +
        '</div>';

    if (listToDownload === aiGeneratedList) {
      htmlContent += '<div class="category">' +
        '<div class="category-title">AI Enhanced Shopping List</div>';
      
      listToDownload.forEach(item => {
        htmlContent += '<div class="item">' +
          '<span class="checkbox"></span>' +
          '<span class="item-name">' + item.name + '</span> - ' + item.quantity + ' ' + item.unit +
          '<div class="item-details">' +
            'Used in: ' + item.recipes.join(', ') +
            (item.notes ? ' | Note: ' + item.notes : '') +
          '</div>' +
        '</div>';
      });
      
      htmlContent += '</div>';
    } else {
      // Group by category for basic list
      const groupedItems = listToDownload.reduce((acc, item) => {
        if (!acc[item.category]) acc[item.category] = [];
        acc[item.category].push(item);
        return acc;
      }, {} as Record<string, ShoppingItem[]>);

      Object.entries(groupedItems).forEach(([category, items]) => {
        htmlContent += '<div class="category">' +
          '<div class="category-title">' + category.toUpperCase() + '</div>';
        
        items.forEach(item => {
          htmlContent += '<div class="item">' +
            '<span class="checkbox"></span>' +
            '<span class="item-name">' + item.name + '</span> - ' + item.quantity + ' ' + item.unit +
            '<div class="item-details">' +
              'Used in: ' + item.recipes.join(', ') +
            '</div>' +
          '</div>';
        });
        
        htmlContent += '</div>';
      });
    }

    htmlContent += '<div class="no-print" style="margin-top: 30px; text-align: center;">' +
      '<p>Print this page to save as PDF or take with you shopping!</p>' +
    '</div>' +
    '</body>' +
    '</html>';
    
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const filename = listToDownload === aiGeneratedList ? `ai-enhanced-shopping-list-${weekStart.toISOString().split('T')[0]}.html` : `shopping-list-${weekStart.toISOString().split('T')[0]}.html`;
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateShoppingList = async () => {
    setIsGenerating(true);
    try {
      // First, generate the basic shopping list from recipe ingredients
      const basicShoppingList: ShoppingItem[] = [];
      const processedRecipes = new Set<string>();

      // Safety check: ensure items array exists and is valid
      if (!items || !Array.isArray(items)) {
        console.log('⚠️ No meal plan items found');
        toast({
          title: "⚠️ No Meals Found",
          description: "Please add some meals to your plan before generating a shopping list.",
          variant: "destructive"
        });
        return;
      }

      console.log('🔍 Debug: Starting shopping list generation');
      console.log('📋 Available items:', items);
      console.log('🍽️ Selected meal types:', Array.from(selectedMealTypes));
      console.log('📅 Selected days:', Array.from(selectedDays));
      console.log('🍳 Custom food items:', customFoodItems);

      // Process meal plan items
      items.forEach(meal => {
        if (selectedMealTypes.has(meal.slot) && selectedDays.has(meal.day)) {
          if (meal.title && meal.type === 'recipe' && !processedRecipes.has(meal.title)) {
            processedRecipes.add(meal.title);
            const ingredients = getRecipeIngredients(meal.title);
            if (ingredients && ingredients.length > 0) {
              const shoppingItems = convertIngredientsToShoppingItems(ingredients, meal.title);
              basicShoppingList.push(...shoppingItems);
            } else {
              // Add a placeholder item for meals without ingredients
              basicShoppingList.push({
                name: meal.title,
                quantity: 1,
                unit: 'recipe',
                category: 'Other',
                recipes: [meal.title],
                notes: 'Recipe ingredients not found in database',
                priority: 'medium'
              });
            }
          }
        }
      });

      // Process custom food items
      customFoodItems.forEach(foodName => {
        if (!processedRecipes.has(foodName)) {
          processedRecipes.add(foodName);
          
          // For custom food items, create a basic shopping list item
          // The AI enhancement will handle adding proper ingredients
          basicShoppingList.push({
            name: foodName,
            quantity: 1,
            unit: 'recipe',
            category: 'Other',
            recipes: [foodName],
            notes: 'Custom food item - will be enhanced by AI',
            priority: 'medium'
          });
          console.log(`✅ Added custom food item: ${foodName} (will be enhanced by AI)`);
        }
      });

      // Check if we found any items to process
      if (basicShoppingList.length === 0) {
        console.log('⚠️ No meals or custom foods found matching criteria');
        toast({
          title: "⚠️ No Items Found",
          description: "No meals or custom foods found. Please add some items or adjust your selection.",
          variant: "destructive"
        });
        return;
      }

      // Set the basic shopping list first
      setShoppingList(basicShoppingList);

      // Now enhance it with AI if available
      if (geminiAI.isConfigured()) {
        try {
          // Create a detailed prompt for the AI
          const prompt = `You are an AI nutritionist helping to create an optimized shopping list. 
          
          Based on this basic shopping list: ${JSON.stringify(basicShoppingList, null, 2)}
          
          Please enhance this list by:
          1. For custom food items (marked as "Custom food item - will be enhanced by AI"), generate a complete list of ingredients needed to make that recipe
          2. Optimizing quantities based on typical household usage
          3. Adding missing essential items that complement these recipes
          4. Suggesting budget-friendly alternatives
          5. Adding helpful cooking tips
          
          IMPORTANT: For any custom food items, break them down into their individual ingredients with proper quantities and units.
          
          Return your response in this exact JSON format:
          {
            "enhancedItems": [
              {
                "name": "Item Name",
                "quantity": 2,
                "unit": "cups",
                "category": "Produce/Pantry/Frozen/Dairy/Bakery/Refrigerated/Other",
                "priority": "high/medium/low"
              }
            ],
            "tips": ["Helpful tip 1", "Helpful tip 2"],
            "budgetNotes": "Budget optimization suggestions"
          }
          
          Ensure all quantities are reasonable numbers and units are standard cooking measurements.`;

          const response = await geminiAI.model.generateContent(prompt);
          const text = response.response.text();
          
          console.log('🤖 AI Response:', text);
          
          // Try multiple JSON parsing strategies
          let aiData = null;
          let parseSuccess = false;

          // Strategy 1: Try to find complete JSON object
          if (text.includes('{') && text.includes('}')) {
            const startBrace = text.indexOf('{');
            const endBrace = text.lastIndexOf('}');
            if (startBrace !== -1 && endBrace !== -1) {
              try {
                const jsonText = text.substring(startBrace, endBrace + 1);
                aiData = JSON.parse(jsonText);
                parseSuccess = true;
                console.log('✅ JSON parsed successfully with strategy 1 (complete object)');
              } catch (e) {
                console.log('❌ Strategy 1 failed:', e);
              }
            }
          }

          // Strategy 2: Try to extract just the enhancedItems array if the main JSON is malformed
          if (!parseSuccess) {
            const startBracket = text.indexOf('[');
            const endBracket = text.lastIndexOf(']');
            if (text.includes('"enhancedItems"') && startBracket !== -1 && endBracket !== -1) {
              try {
                // Try to parse just the array part
                const arrayText = text.substring(startBracket, endBracket + 1);
                const enhancedItemsArray = JSON.parse(arrayText);
                
                // Create a minimal aiData structure
                aiData = {
                  enhancedItems: enhancedItemsArray,
                  tips: [],
                  budgetNotes: "AI enhancement completed with partial data"
                };
                parseSuccess = true;
                console.log('✅ JSON parsed successfully with strategy 2 (array extraction)');
              } catch (e) {
                console.log('❌ Strategy 2 failed:', e);
              }
            }
          }

          // Strategy 3: Try to manually parse the response if JSON is completely broken
          if (!parseSuccess) {
            try {
              // Use simple string operations instead of regex
              const lines = text.split('\n');
              const items = [];
              
              for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                if (line.includes('"name"') && line.includes('"quantity"') && line.includes('"unit"')) {
                  try {
                    // Try to extract the values using simple string operations
                    const nameMatch = line.includes('"name"') ? line.split('"name"')[1]?.split('"')[1] : null;
                    const quantityMatch = line.includes('"quantity"') ? line.split('"quantity"')[1]?.split('"')[1] : null;
                    const unitMatch = line.includes('"unit"') ? line.split('"unit"')[1]?.split('"')[1] : null;
                    
                    if (nameMatch && quantityMatch && unitMatch) {
                      items.push({
                        name: nameMatch,
                        quantity: parseFloat(quantityMatch) || 1,
                        unit: unitMatch,
                        category: 'Other',
                        notes: 'AI Enhanced',
                        priority: 'medium'
                      });
                    }
                  } catch (e) {
                    console.log('Failed to parse line:', line);
                  }
                }
              }
              
              if (items.length > 0) {
                aiData = {
                  enhancedItems: items,
                  tips: ['AI enhancement completed with pattern matching'],
                  budgetNotes: "AI enhancement completed with pattern matching"
                };
                parseSuccess = true;
                console.log('✅ JSON parsed successfully with strategy 3 (string parsing)');
              }
            } catch (e) {
              console.log('❌ Strategy 3 failed:', e);
            }
          }

          if (parseSuccess && aiData) {
            // Convert AI response to shopping items
            const enhancedItems: ShoppingItem[] = aiData.enhancedItems?.map((item: any) => ({
              name: item.name,
              quantity: parseFloat(item.quantity) || 1,
              unit: item.unit || 'piece',
              category: item.category || 'Other',
              recipes: ['AI Enhanced'],
              notes: item.notes,
              priority: item.priority
            })) || [];

            setAiGeneratedList(enhancedItems);
            
            toast({
              title: "✨ AI Shopping List Generated!",
              description: `Enhanced your list with ${enhancedItems.length} optimized items and helpful tips.`,
            });

            // Log AI tips and budget notes
            if (aiData.tips) {
              console.log('🛒 AI Shopping Tips:', aiData.tips);
            }
            if (aiData.budgetNotes) {
              console.log('💰 AI Budget Notes:', aiData.budgetNotes);
            }
          } else {
            console.log('❌ All AI parsing strategies failed');
            toast({
              title: "⚠️ AI Enhancement Failed",
              description: "Generated basic shopping list. AI enhancement could not be completed.",
              variant: "destructive"
            });
          }
        } catch (error) {
          console.log('🤖 AI shopping list generation failed:', error);
          
          // Handle specific AI service errors
          let errorMessage = "Generated basic shopping list. AI enhancement encountered an error.";
          let errorTitle = "⚠️ AI Enhancement Failed";
          
          if (error instanceof Error) {
            const errorString = error.toString();
            
            // Handle Google AI service overload (503 error)
            if (errorString.includes('503') || errorString.includes('overloaded') || errorString.includes('overload')) {
              errorTitle = "🚫 AI Service Busy";
              errorMessage = "Google AI is currently overloaded. Your basic shopping list is ready. Try again in a few minutes for AI enhancement.";
            }
            // Handle rate limiting
            else if (errorString.includes('429') || errorString.includes('rate limit') || errorString.includes('quota')) {
              errorTitle = "⏱️ AI Rate Limited";
              errorMessage = "AI service is rate limited. Your basic shopping list is ready. Try again later for AI enhancement.";
            }
            // Handle authentication issues
            else if (errorString.includes('401') || errorString.includes('unauthorized') || errorString.includes('API key')) {
              errorTitle = "🔑 AI Configuration Issue";
              errorMessage = "AI service configuration issue. Your basic shopping list is ready. Check your API settings.";
            }
            // Handle network issues
            else if (errorString.includes('network') || errorString.includes('fetch') || errorString.includes('timeout')) {
              errorTitle = "🌐 Network Issue";
              errorMessage = "Network issue with AI service. Your basic shopping list is ready. Check your connection and try again.";
            }
          }
          
          toast({
            title: errorTitle,
            description: errorMessage,
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "ℹ️ AI Not Configured",
          description: "Generated basic shopping list. Configure Gemini AI for enhanced features.",
        });
      }
    } catch (error) {
      console.log('❌ Shopping list generation failed:', error);
      toast({
        title: "❌ Error",
        description: "Failed to generate shopping list. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleMealType = (mealType: string) => {
    const newSelected = new Set(selectedMealTypes);
    if (newSelected.has(mealType)) {
      newSelected.delete(mealType);
    } else {
      newSelected.add(mealType);
    }
    setSelectedMealTypes(newSelected);
  };

  const toggleDay = (day: string) => {
    const newSelected = new Set(selectedDays);
    if (newSelected.has(day)) {
      newSelected.delete(day);
    } else {
      newSelected.add(day);
    }
    setSelectedDays(newSelected);
  };

  const addCustomFood = () => {
    const foodName = customFoodInput.trim();
    if (foodName && !customFoodItems.includes(foodName)) {
      setCustomFoodItems([...customFoodItems, foodName]);
      setCustomFoodInput('');
    }
  };

  const removeCustomFood = (index: number) => {
    setCustomFoodItems(customFoodItems.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (isOpen) {
      setShoppingList([]);
      setAiGeneratedList([]); // Clear AI generated list when modal opens
      setCustomFoodItems([]); // Clear custom food items when modal opens
      setCustomFoodInput(''); // Clear custom food input when modal opens
      setSelectedDays(new Set(weekDays)); // Initialize with current week days
      
      // Test recipe matching
      testRecipeMatching();
    }
  }, [isOpen, weekDays]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-4xl h-[90vh]"
        >
          <Card className="shadow-2xl border-border/50 h-full flex flex-col">
            <CardHeader className="flex-shrink-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Generate AI Shopping List
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
                Generate an AI-enhanced shopping list from your planned meals for {weekStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - {new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                {geminiAI.isConfigured() && (
                  <span className="block mt-1 text-xs">
                    🤖 AI enhancement available • Basic list always generated as fallback
                  </span>
                )}
              </p>
            </CardHeader>

            <CardContent className="flex-1 overflow-hidden flex flex-col gap-6">
              <>
                {/* Custom Recipe Input Section */}
                <div className="space-y-4 p-4 bg-muted/20 rounded-lg border">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <h3 className="font-medium">Add Custom Food Items</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Type in any food you want to add to your shopping list. We'll find the ingredients for you.
                  </p>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g., Tofu Scramble, Lentil Curry, Chia Pudding..."
                      className="flex-1 px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                      value={customFoodInput}
                      onChange={(e) => setCustomFoodInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addCustomFood()}
                    />
                    <Button
                      onClick={addCustomFood}
                      disabled={!customFoodInput.trim()}
                      size="sm"
                      className="gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </Button>
                  </div>
                  
                  {/* Custom Food Items List */}
                  {customFoodItems.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-muted-foreground">Custom Items Added:</h4>
                        <Button
                          onClick={() => setCustomFoodItems([])}
                          variant="ghost"
                          size="sm"
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          Clear All
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {customFoodItems.map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 px-3 py-1 bg-blue-100 border border-blue-200 rounded-full text-sm"
                          >
                            <span className="text-blue-800">{item}</span>
                            <Button
                              onClick={() => removeCustomFood(index)}
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0 hover:bg-blue-200"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Helpful Suggestions */}
                  <div className="text-xs text-muted-foreground">
                    <p className="mb-1">💡 <strong>Popular suggestions:</strong></p>
                    <div className="flex flex-wrap gap-1">
                      {['Tofu Scramble', 'Lentil Curry', 'Chia Pudding', 'Hummus', 'Quinoa Bowl', 'Smoothie Bowl'].map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => {
                            if (!customFoodItems.includes(suggestion)) {
                              setCustomFoodItems([...customFoodItems, suggestion]);
                            }
                          }}
                          className="px-2 py-1 bg-muted/50 hover:bg-muted rounded text-xs transition-colors"
                          disabled={customFoodItems.includes(suggestion)}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Configuration Section */}
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-3">Include Meal Types</h3>
                    <div className="flex flex-wrap gap-2">
                      {mealTypes.map(mealType => (
                        <Button
                          key={mealType}
                          variant={selectedMealTypes.has(mealType) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleMealType(mealType)}
                          className="text-xs"
                        >
                          {mealType}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-3">Include Days</h3>
                    <div className="flex flex-wrap gap-2">
                      {weekDays.map(day => (
                        <Button
                          key={day}
                          variant={selectedDays.has(day) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleDay(day)}
                          className="text-xs"
                        >
                          {day}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={generateShoppingList}
                    disabled={isGenerating || selectedMealTypes.size === 0 || selectedDays.size === 0}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating AI Shopping List...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate AI Shopping List
                      </>
                    )}
                  </Button>
                </div>

                {/* AI Shopping List Preview */}
                {aiGeneratedList.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">AI Shopping List Preview</h3>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setAiGeneratedList([])}
                          size="sm"
                          variant="outline"
                          className="gap-2"
                          title="Clear AI Enhanced List"
                        >
                          <X className="w-4 h-4" />
                          Clear AI List
                        </Button>
                      </div>
                    </div>

                    <div className="max-h-96 overflow-y-auto space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-blue-600" />
                          <h4 className="font-medium text-sm text-blue-600 uppercase tracking-wide">
                            AI Enhanced Shopping List
                          </h4>
                          <Badge variant="secondary" className="text-xs">Optimized</Badge>
                        </div>
                        {categories.map(category => {
                          const categoryItems = aiGeneratedList.filter(item => item.category === category);
                          if (categoryItems.length === 0) return null;

                          return (
                            <div key={`ai-${category}`} className="space-y-2">
                              <h5 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                                {category}
                              </h5>
                              <div className="space-y-2">
                                {categoryItems.map((item, index) => (
                                  <div
                                    key={`ai-${index}`}
                                    className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
                                  >
                                    <div className="flex-1">
                                      <div className="font-medium">{item.name}</div>
                                      <div className="text-sm text-muted-foreground">
                                        {item.quantity} {item.unit}
                                      </div>
                                      <div className="text-xs text-muted-foreground mt-1">
                                        Used in: {item.recipes.join(', ')}
                                      </div>
                                      {item.notes && (
                                        <div className="text-xs text-blue-600 mt-1">
                                          💡 {item.notes}
                                        </div>
                                      )}
                                    </div>
                                    <Checkbox />
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Download Section - Only show when AI content exists */}
                    <div className="space-y-3">
                      <h4 className="font-medium text-sm text-muted-foreground">Download AI Shopping List</h4>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => downloadAsTXT(aiGeneratedList)}
                          variant="outline"
                          className="flex-1 gap-2"
                          title="Download as Text File - Simple, readable format"
                        >
                          <Download className="w-4 h-4" />
                          Download as Text
                        </Button>
                        <Button
                          onClick={() => downloadAsCSV(aiGeneratedList)}
                          variant="outline"
                          className="flex-1 gap-2"
                          title="Download as CSV File - For spreadsheet applications"
                        >
                          <Download className="w-4 h-4" />
                          Download as CSV
                        </Button>
                        <Button
                          onClick={() => downloadAsPDF(aiGeneratedList)}
                          variant="outline"
                          className="flex-1 gap-2"
                          title="Download as HTML - Print-friendly format"
                        >
                          <Download className="w-4 h-4" />
                          Download as HTML
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        Download your AI-enhanced shopping list in multiple formats
                      </p>
                    </div>
                  </div>
                )}

                {aiGeneratedList.length === 0 && !isGenerating && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p>Click "Generate AI Shopping List" to create an optimized shopping list from your meal plan</p>
                    
                    {/* Show basic shopping list if available */}
                    {shoppingList.length > 0 && (
                      <div className="mt-6 p-4 bg-muted/20 rounded-lg border">
                        <h4 className="font-medium mb-2">📋 Basic Shopping List Available</h4>
                        <p className="text-sm mb-3">
                          Your basic shopping list has been generated from your meal plan. 
                          {geminiAI.isConfigured() && (
                            <span className="block mt-1">
                              AI enhancement is available when the service is not overloaded.
                            </span>
                          )}
                        </p>
                        <div className="flex gap-2 justify-center">
                          <Button
                            onClick={() => downloadAsTXT(shoppingList)}
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            title="Download AI Enhanced List as CSV"
                          >
                            <Download className="w-3 h-3" />
                            CSV
                          </Button>
                          <Button
                            onClick={() => {
                              let txtContent = `SHOPPING LIST\n`;
                              txtContent += `${weekStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}\n`;
                              txtContent += `Generated on: ${new Date().toLocaleDateString()}\n\n`;
                              txtContent += `AI Enhanced Shopping List\n`;
                              txtContent += `${'='.repeat(15)}\n`;
                              aiGeneratedList.forEach(item => {
                                txtContent += `☐ ${item.name} - ${item.quantity} ${item.unit}\n`;
                                if (item.recipes.length > 0) {
                                  txtContent += `   Used in: ${item.recipes.join(', ')}\n`;
                                }
                                if (item.notes) {
                                  txtContent += `   Note: ${item.notes}\n`;
                                }
                                txtContent += '\n';
                              });
                              const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
                              const link = document.createElement('a');
                              const url = URL.createObjectURL(blob);
                              link.setAttribute('href', url);
                              link.setAttribute('download', `ai-enhanced-shopping-list-${weekStart.toISOString().split('T')[0]}.txt`);
                              link.style.visibility = 'hidden';
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            title="Download AI Enhanced List as TXT"
                          >
                            <Download className="w-3 h-3" />
                            TXT
                          </Button>
                          <Button
                            onClick={() => {
                              let htmlContent = `
                                <!DOCTYPE html>
                                <html>
                                <head>
                                  <title>Shopping List</title>
                                  <style>
                                    body { font-family: Arial, sans-serif; margin: 20px; }
                                    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px; }
                                    .category { margin-bottom: 25px; }
                                    .category-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
                                    .item { margin-bottom: 10px; padding-left: 20px; }
                                    .item-name { font-weight: bold; }
                                    .item-details { color: #666; font-size: 14px; margin-left: 20px; }
                                    .checkbox { display: inline-block; width: 20px; height: 20px; border: 2px solid #333; margin-right: 10px; }
                                    @media print { .no-print { display: none; } }
                                  </style>
                                </head>
                                <body>
                                  <div class="header">
                                    <h1>SHOPPING LIST</h1>
                                    <p>${weekStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                    <p>Generated on: ${new Date().toLocaleDateString()}</p>
                                  </div>
                              `;
                              htmlContent += `
                                <div class="category">
                                  <div class="category-title">AI Enhanced Shopping List</div>
                              `;
                              aiGeneratedList.forEach(item => {
                                htmlContent += `
                                  <div class="item">
                                    <span class="checkbox"></span>
                                    <span class="item-name">${item.name}</span> - ${item.quantity} ${item.unit}
                                    <div class="item-details">
                                      Used in: ${item.recipes.join(', ')}
                                      ${item.notes ? ` | Note: ${item.notes}` : ''}
                                    </div>
                                  </div>
                                `;
                              });
                              htmlContent += `
                                </div>
                              `;
                              htmlContent += `
                                <div class="no-print" style="margin-top: 30px; text-align: center;">
                                  <p>Print this page to save as PDF or take with you shopping!</p>
                                </div>
                              </body>
                              </html>
                            `;
                              const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
                              const url = URL.createObjectURL(blob);
                              const link = document.createElement('a');
                              link.setAttribute('href', url);
                              link.setAttribute('download', `ai-enhanced-shopping-list-${weekStart.toISOString().split('T')[0]}.html`);
                              link.style.visibility = 'hidden';
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            title="Download AI Enhanced List as HTML"

                          >
                            <Download className="w-4 h-4" />
                            Download Basic List
                          </Button>
                          {geminiAI.isConfigured() && (
                            <Button
                              onClick={generateShoppingList}
                              variant="outline"
                              size="sm"
                              className="gap-2"
                            >
                              <Sparkles className="w-4 h-4" />
                              Retry AI Enhancement
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ShoppingListModal;
