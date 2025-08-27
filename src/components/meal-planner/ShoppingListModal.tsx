import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Download, Loader2, Sparkles } from 'lucide-react';
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

interface ShoppingListModalProps {
  isOpen: boolean;
  onClose: () => void;
  weekDays: string[];
  weekStart: Date;
  items: MealItem[];
}

interface ShoppingItem {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  recipes: string[];
  notes?: string;
  priority?: 'high' | 'medium' | 'low';
}

interface ShoppingListModalProps {
  isOpen: boolean;
  onClose: () => void;
  weekDays: string[];
  weekStart: Date;
  items: MealItem[];
}

const ShoppingListModal = ({ isOpen, onClose, weekDays, weekStart, items }: ShoppingListModalProps) => {
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [selectedMealTypes, setSelectedMealTypes] = useState<Set<string>>(new Set(['Breakfast', 'Lunch', 'Dinner', 'Snacks']));
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set(weekDays));
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiGeneratedList, setAiGeneratedList] = useState<ShoppingItem[]>([]);

  const mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
  const categories = ['Produce', 'Pantry', 'Frozen', 'Dairy', 'Bakery', 'Refrigerated', 'Other'];

  // Helper function to convert recipe ingredients to shopping items
  const getIngredientsForRecipe = (recipeTitle: string): ShoppingItem[] => {
    const ingredients = getRecipeIngredients(recipeTitle);
    return ingredients.map(ingredient => ({
      name: ingredient.name,
      quantity: ingredient.quantity,
      unit: ingredient.unit,
      category: ingredient.category,
      recipes: [recipeTitle],
      notes: ingredient.notes
    }));
  };

  // Download functions
  const downloadAsCSV = () => {
    if (shoppingList.length === 0) return;
    
    const csvContent = [
      ['Category', 'Item', 'Quantity', 'Unit', 'Recipes', 'Notes'],
      ...shoppingList.map(item => [
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
    link.setAttribute('download', `shopping-list-${weekStart.toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAsTXT = () => {
    if (shoppingList.length === 0) return;
    
    let txtContent = `SHOPPING LIST\n`;
    txtContent += `${weekStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}\n`;
    txtContent += `Generated on: ${new Date().toLocaleDateString()}\n\n`;
    
    categories.forEach(category => {
      const categoryItems = shoppingList.filter(item => item.category === category);
      if (categoryItems.length > 0) {
        txtContent += `${category.toUpperCase()}\n`;
        txtContent += `${'='.repeat(category.length)}\n`;
        categoryItems.forEach(item => {
          txtContent += `☐ ${item.name} - ${item.quantity} ${item.unit}\n`;
          if (item.recipes.length > 0) {
            txtContent += `   Used in: ${item.recipes.join(', ')}\n`;
          }
          if (item.notes) {
            txtContent += `   Note: ${item.notes}\n`;
          }
          txtContent += '\n';
        });
      }
    });
    
    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `shopping-list-${weekStart.toISOString().split('T')[0]}.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAsPDF = () => {
    if (shoppingList.length === 0) return;
    
    // Create a formatted HTML document that can be printed as PDF
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
    
    categories.forEach(category => {
      const categoryItems = shoppingList.filter(item => item.category === category);
      if (categoryItems.length > 0) {
        htmlContent += `<div class="category">`;
        htmlContent += `<div class="category-title">${category.toUpperCase()}</div>`;
        categoryItems.forEach(item => {
          htmlContent += `<div class="item">`;
          htmlContent += `<span class="checkbox"></span>`;
          htmlContent += `<span class="item-name">${item.name}</span> - ${item.quantity} ${item.unit}`;
          htmlContent += `<div class="item-details">`;
          if (item.recipes.length > 0) {
            htmlContent += `Used in: ${item.recipes.join(', ')}`;
          }
          if (item.notes) {
            htmlContent += ` | Note: ${item.notes}`;
          }
          htmlContent += `</div>`;
          htmlContent += `</div>`;
        });
        htmlContent += `</div>`;
      }
    });
    
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
    link.setAttribute('download', `shopping-list-${weekStart.toISOString().split('T')[0]}.html`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateShoppingList = () => {
    setIsGenerating(true);
    
    // Simulate processing delay
    setTimeout(() => {
      console.log('=== SHOPPING LIST GENERATION DEBUG ===');
      console.log('Available items:', items);
      console.log('Selected meal types:', Array.from(selectedMealTypes));
      console.log('Selected days:', Array.from(selectedDays));
      
      const filteredItems = items.filter(item => 
        selectedMealTypes.has(item.slot) && selectedDays.has(item.day)
      );
      
      console.log('Filtered items:', filteredItems);

      const ingredientMap = new Map<string, ShoppingItem>();
      let totalIngredientsFound = 0;
      let totalIngredientsNotFound = 0;

      filteredItems.forEach(item => {
        console.log(`\n--- Processing item: ${item.title} ---`);
        const ingredients = getIngredientsForRecipe(item.title);
        console.log('Found ingredients:', ingredients);
        
        if (ingredients.length === 0) {
          console.warn(`❌ No ingredients found for: ${item.title}`);
          totalIngredientsNotFound++;
          // Add a placeholder item for meals without ingredients
          const placeholderKey = `placeholder-${item.title}`;
          if (!ingredientMap.has(placeholderKey)) {
            ingredientMap.set(placeholderKey, {
              name: `${item.title} (ingredients not available)`,
              quantity: 1,
              unit: 'serving',
              category: 'Other',
              recipes: [item.title],
              notes: 'Recipe ingredients not found in database'
            });
          }
        } else {
          console.log(`✅ Found ${ingredients.length} ingredients for ${item.title}`);
          totalIngredientsFound += ingredients.length;
          ingredients.forEach(ingredient => {
            const key = `${ingredient.name}-${ingredient.unit}`;
            
            if (ingredientMap.has(key)) {
              const existing = ingredientMap.get(key)!;
              existing.quantity += ingredient.quantity;
              if (!existing.recipes.includes(item.title)) {
                existing.recipes.push(item.title);
              }
              console.log(`  📝 Updated existing ingredient: ${ingredient.name} (${existing.quantity} ${ingredient.unit})`);
            } else {
              ingredientMap.set(key, {
                ...ingredient,
                recipes: [item.title]
              });
              console.log(`  ➕ Added new ingredient: ${ingredient.name} (${ingredient.quantity} ${ingredient.unit})`);
            }
          });
        }
      });

      const shoppingList = Array.from(ingredientMap.values())
        .sort((a, b) => categories.indexOf(a.category) - categories.indexOf(b.category));

      console.log(`\n=== SHOPPING LIST SUMMARY ===`);
      console.log(`Total items processed: ${filteredItems.length}`);
      console.log(`Ingredients found: ${totalIngredientsFound}`);
      console.log(`Ingredients not found: ${totalIngredientsNotFound}`);
      console.log(`Final shopping list items: ${shoppingList.length}`);
      console.log('Final shopping list:', shoppingList);
      console.log('=== END DEBUG ===\n');

      setShoppingList(shoppingList);
      setIsGenerating(false);
    }, 1500);
  };

  const generateAIShoppingList = async () => {
    if (!geminiAI.isConfigured()) {
      toast({
        title: "AI Not Configured",
        description: "Please check your Gemini API key in the environment variables.",
        variant: "destructive",
      });
      return;
    }

    if (shoppingList.length === 0) {
      toast({
        title: "No Shopping List",
        description: "Please generate a basic shopping list first before using AI enhancement.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingAI(true);
    
    try {
      // Create a detailed prompt for the AI
      const mealDetails = shoppingList.map(item => 
        `${item.name} (${item.quantity} ${item.unit}) - Used in: ${item.recipes.join(', ')}`
      ).join('\n');

      const prompt = `You are an expert vegan nutritionist and meal planner. I have a shopping list for a week of vegan meals. Please enhance this list by:

1. **Optimizing quantities** - Suggest better amounts based on typical household usage
2. **Adding missing essentials** - Include common vegan staples that might be needed
3. **Organizing by category** - Group items logically for efficient shopping
4. **Adding helpful notes** - Include storage tips, substitution suggestions, or cooking notes
5. **Budget optimization** - Suggest cost-effective alternatives where appropriate

CURRENT SHOPPING LIST:
${mealDetails}

WEEK RANGE: ${weekStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}

Please provide an enhanced shopping list in this JSON format:
{
  "enhancedItems": [
    {
      "name": "Item name",
      "quantity": "Optimized quantity",
      "unit": "unit",
      "category": "Produce/Pantry/Frozen/Dairy/Bakery/Refrigerated/Other",
      "notes": "Helpful tips or substitutions",
      "priority": "high/medium/low"
    }
  ],
  "tips": [
    "Shopping tip 1",
    "Shopping tip 2"
  ],
  "budgetNotes": "Budget optimization suggestions"
}

Make it practical, budget-friendly, and optimized for a vegan household.`;

      const response = await geminiAI.model.generateContent(prompt);
      const text = response.response.text();
      
      // Parse the AI response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const aiData = JSON.parse(jsonMatch[0]);
        
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
        throw new Error('AI response format was invalid');
      }
      
    } catch (error) {
      console.error('AI shopping list generation failed:', error);
      toast({
        title: "AI Generation Failed",
        description: "Failed to generate AI-enhanced shopping list. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAI(false);
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

  useEffect(() => {
    if (isOpen) {
      console.log('Modal opened with weekDays:', weekDays);
      console.log('Available items:', items);
      setSelectedDays(new Set(weekDays));
      setShoppingList([]);
      setAiGeneratedList([]); // Clear AI generated list when modal opens
      
      // Test recipe matching
      testRecipeMatching();
    }
  }, [isOpen, weekDays, items]);

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
                  <ShoppingCart className="w-5 h-5" />
                  Generate Shopping List
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
                Generate a shopping list from your planned meals for {weekStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - {new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </CardHeader>

            <CardContent className="flex-1 overflow-hidden flex flex-col gap-6">
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
                      Generating Shopping List...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Generate Shopping List
                    </>
                  )}
                </Button>
              </div>

              {/* Shopping List Preview */}
              {shoppingList.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Shopping List Preview</h3>
                    <div className="flex gap-2">
                      {/* Download Options */}
                      <div className="flex gap-1">
                        <Button
                          onClick={downloadAsTXT}
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          title="Download as Text File"
                        >
                          <Download className="w-3 h-3" />
                          TXT
                        </Button>
                        <Button
                          onClick={downloadAsCSV}
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          title="Download as CSV File"
                        >
                          <Download className="w-3 h-3" />
                          CSV
                        </Button>
                        <Button
                          onClick={downloadAsPDF}
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          title="Download as Printable HTML"
                        >
                          <Download className="w-3 h-3" />
                          HTML
                        </Button>
                      </div>
                      
                      {/* AI Enhanced List */}
                      {aiGeneratedList.length > 0 && (
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
                      )}
                      
                      {/* AI Enhancement Button (when no AI list exists) */}
                      {aiGeneratedList.length === 0 && shoppingList.length > 0 && (
                        <Button
                          onClick={generateAIShoppingList}
                          disabled={isGeneratingAI || !geminiAI.isConfigured()}
                          size="sm"
                          className="gap-2"
                        >
                          {isGeneratingAI ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Enhancing with AI...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" />
                              Enhance with AI
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="max-h-96 overflow-y-auto space-y-4">
                    {/* AI Enhanced List */}
                    {aiGeneratedList.length > 0 && (
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
                    )}

                    {/* Original List */}
                    {shoppingList.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                            {aiGeneratedList.length > 0 ? 'Original Shopping List' : 'Shopping List'}
                          </h4>
                        </div>
                        {categories.map(category => {
                          const categoryItems = shoppingList.filter(item => item.category === category);
                          if (categoryItems.length === 0) return null;

                          return (
                            <div key={category} className="space-y-2">
                              <h5 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                                {category}
                              </h5>
                              <div className="space-y-2">
                                {categoryItems.map((item, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                                  >
                                    <div className="flex-1">
                                      <div className="font-medium">{item.name}</div>
                                      <div className="text-sm text-muted-foreground">
                                        {item.quantity} {item.unit}
                                      </div>
                                      <div className="text-xs text-muted-foreground mt-1">
                                        Used in: {item.recipes.join(', ')}
                                      </div>
                                    </div>
                                    <Checkbox />
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  
                  {/* Download Section */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground">Download Options</h4>
                    <div className="flex gap-2">
                      <Button
                        onClick={downloadAsTXT}
                        variant="outline"
                        className="flex-1 gap-2"
                        title="Download as Text File - Simple, readable format"
                      >
                        <Download className="w-4 h-4" />
                        Download as Text
                      </Button>
                      <Button
                        onClick={downloadAsCSV}
                        variant="outline"
                        className="flex-1 gap-2"
                        title="Download as CSV File - For spreadsheet applications"
                      >
                        <Download className="w-4 h-4" />
                        Download as CSV
                      </Button>
                      <Button
                        onClick={downloadAsPDF}
                        variant="outline"
                        className="flex-1 gap-2"
                        title="Download as HTML - Print-friendly format"
                      >
                        <Download className="w-4 h-4" />
                        Download as HTML
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      Download your shopping list in multiple formats for easy access on any device
                    </p>
                    
                    {/* AI Enhanced List Download */}
                    {aiGeneratedList.length > 0 && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>AI Enhanced Shopping List:</strong> This list has been optimized by our AI nutritionist.
                          It includes optimized quantities, helpful notes, and budget optimization suggestions.
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Button
                            onClick={() => {
                              const csvContent = [
                                ['Category', 'Item', 'Quantity', 'Unit', 'Recipes', 'Notes'],
                                ...aiGeneratedList.map(item => [
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
                              link.setAttribute('download', `ai-enhanced-shopping-list-${weekStart.toISOString().split('T')[0]}.csv`);
                              link.style.visibility = 'hidden';
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
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
                            <Download className="w-3 h-3" />
                            HTML
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {shoppingList.length === 0 && !isGenerating && (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p>Generate a shopping list to see ingredients from your planned meals</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>


    </AnimatePresence>
  );
};

export default ShoppingListModal;
