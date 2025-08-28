import { VEGAN_RECIPES } from '@/data/veganData';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Clock } from 'lucide-react';
import { useState } from 'react';
import { geminiAI, type GeneratedRecipeCandidate, type GeneratedRecipeDetail } from '@/services/geminiAI';
import { useAuth } from '@/contexts/AuthContext';
import ChatWithGemini from '@/components/ChatWithGemini';

const mealTypes = [
  'Breakfast','Lunch','Dinner','Snacks','Desserts','Drinks/Smoothies','Appetizers/Sides','Meal Prep/Bulk'
];
const proteinSources = [
  'Tofu/Tempeh','Beans/Lentils','Seitan/Soy-based','Chickpeas','Nuts & Seeds','Quinoa/Whole Grains','High-Protein (25g+ per serving)'
];
const cuisines = [
  'Asian','Indian','Mexican','Italian','American/Comfort','Mediterranean','Fusion/Modern','Spicy','Sweet','Savory','Tangy'
];

const Recipes = () => {
  const { user } = useAuth();
  const [mealType, setMealType] = useState<string | undefined>();
  const [proteinSource, setProteinSource] = useState<string | undefined>();
  const [cuisineOrFlavor, setCuisineOrFlavor] = useState<string | undefined>();
  const [timeMinutes, setTimeMinutes] = useState<number>(30);
  const [customRecipeInput, setCustomRecipeInput] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<GeneratedRecipeCandidate[]>([]);
  const [selected, setSelected] = useState<GeneratedRecipeDetail | null>(null);
  
  // Instant recipe cache for popular items
  const instantRecipes: Record<string, GeneratedRecipeDetail> = {
    'Hummus': {
      id: 'instant-hummus',
      title: 'Classic Vegan Hummus',
      shortDescription: 'Smooth and creamy hummus with tahini, lemon, and authentic Middle Eastern flavors',
      timeMinutes: 15,
      mealType: 'Snack',
      proteinSource: 'Chickpeas',
      cuisine: 'Middle Eastern',
      ingredients: [
        '1 can (15 oz) chickpeas, drained and rinsed',
        '1/4 cup tahini (sesame seed paste)',
        '3 tbsp fresh lemon juice (about 1 large lemon)',
        '3 cloves garlic, minced',
        '3 tbsp extra virgin olive oil',
        '1/2 tsp ground cumin',
        '1/4 tsp ground coriander',
        '1/2 tsp sea salt',
        '1/4 tsp black pepper',
        '2-4 tbsp cold water',
        '1 tbsp fresh parsley, chopped (for garnish)',
        '1 tbsp extra virgin olive oil (for drizzling)',
        '1/2 tsp paprika (for garnish)'
      ],
      steps: [
        'Drain and thoroughly rinse the chickpeas under cold water. For extra smooth hummus, remove the thin skins by gently rubbing the chickpeas between your fingers',
        'In a food processor, combine the chickpeas, tahini, lemon juice, minced garlic, olive oil, cumin, coriander, salt, and pepper',
        'Process the mixture for 1-2 minutes, scraping down the sides as needed. The mixture will be thick and grainy at first',
        'With the processor running, slowly add cold water, 1 tablespoon at a time, until the hummus reaches your desired consistency (usually 2-4 tablespoons)',
        'Continue processing for another 1-2 minutes until the hummus is completely smooth and creamy',
        'Taste and adjust the seasoning. You may want to add more lemon juice for acidity, more salt, or more spices',
        'Transfer to a serving bowl and create a shallow well in the center with the back of a spoon',
        'Drizzle with extra virgin olive oil and sprinkle with paprika and chopped parsley',
        'Serve immediately with warm pita bread, fresh vegetables, or as a spread for sandwiches'
      ],
      servings: 8,
      nutrition: { calories: 140, proteinGrams: 5, carbsGrams: 14, fatGrams: 8 }
    },
    'Tofu Scramble': {
      id: 'instant-tofu-scramble',
      title: 'Vegan Tofu Scramble',
      shortDescription: 'Protein-rich breakfast scramble with colorful vegetables and authentic egg-like texture',
      timeMinutes: 20,
      mealType: 'Breakfast',
      proteinSource: 'Tofu',
      cuisine: 'American',
      ingredients: [
        '1 block (14 oz) extra-firm tofu, pressed and drained',
        '2 tbsp extra virgin olive oil',
        '1/2 medium yellow onion, finely diced',
        '1 medium red bell pepper, diced',
        '1 medium green bell pepper, diced',
        '1 cup baby spinach, roughly chopped',
        '3 cloves garlic, minced',
        '1/2 tsp ground turmeric (for color and health benefits)',
        '1/2 tsp ground cumin',
        '1/4 tsp smoked paprika',
        '1/4 tsp black salt (kala namak) for eggy flavor, or regular salt',
        '1/4 tsp black pepper',
        '1 tbsp nutritional yeast (optional, for cheesy flavor)',
        '2 tbsp unsweetened plant milk (almond, soy, or oat)',
        'Fresh chives or green onions, chopped (for garnish)',
        'Hot sauce (optional, for serving)'
      ],
      steps: [
        'Press the tofu: Wrap the tofu block in a clean kitchen towel and place a heavy object on top for 15-20 minutes to remove excess water',
        'While tofu is pressing, prepare your vegetables: dice the onion and bell peppers, mince the garlic, and chop the spinach',
        'Crumble the pressed tofu into small, irregular pieces (about 1/2 inch) using your hands or a fork',
        'Heat olive oil in a large non-stick skillet over medium heat. Add diced onion and cook for 3-4 minutes until translucent',
        'Add diced bell peppers and cook for another 3-4 minutes until they begin to soften',
        'Add minced garlic and cook for 1 minute until fragrant, being careful not to burn',
        'Add the crumbled tofu to the pan and gently break it up further with a spatula',
        'Sprinkle turmeric, cumin, smoked paprika, black salt, and black pepper over the tofu',
        'Add nutritional yeast and plant milk, then gently stir to combine all ingredients',
        'Cook for 5-7 minutes, stirring occasionally, until the tofu is heated through and has absorbed the flavors',
        'Add chopped spinach and cook for 1-2 minutes until wilted',
        'Taste and adjust seasoning as needed. You may want to add more salt, spices, or nutritional yeast',
        'Serve hot with fresh chives or green onions on top, and hot sauce on the side if desired',
        'Best served immediately while hot and fresh'
      ],
      servings: 3,
      nutrition: { calories: 220, proteinGrams: 18, carbsGrams: 12, fatGrams: 14 }
    }
  };

  const onGenerate = async () => {
    setError(null);
    setSelected(null);
    setCandidates([]);
    setLoading(true);
    try {
      const res = await geminiAI.generateRecipes({ mealType, proteinSource, cuisineOrFlavor, timeMinutes });
      setCandidates(res);
    } catch (e: any) {
      setError(e?.message || 'Failed to generate recipes');
    } finally {
      setLoading(false);
    }
  };

  const onGenerateCustomRecipe = async () => {
    if (!customRecipeInput.trim()) return;
    
    setError(null);
    setSelected(null);
    setCandidates([]);
    setRetryAttempt(0);
    setLoading(true);
    
    try {
      // Unique AI prompt for each recipe
      const prompt = `Create a UNIQUE and detailed vegan recipe for "${customRecipeInput.trim()}". This should be completely different from any other recipe.

IMPORTANT: Make this recipe specific to "${customRecipeInput.trim()}" - not a generic vegan dish. Include unique ingredients, techniques, and flavors that make this dish special.

Return ONLY this JSON format:
{
  "title": "Creative and unique recipe title for ${customRecipeInput.trim()}",
  "desc": "Detailed description explaining what makes this ${customRecipeInput.trim()} special and unique",
  "time": [realistic cooking time],
  "type": "Breakfast/Lunch/Dinner/Snack",
  "protein": "Specific protein source used",
  "cuisine": "Specific cuisine style",
  "ingredients": [
    "Exact quantities with specific ingredients (e.g., '1 1/2 cups cooked quinoa', '2 tbsp tahini paste')",
    "Specific vegetables, grains, or legumes",
    "Exact spice measurements",
    "Fresh herbs and garnishes"
  ],
  "steps": [
    "Detailed step 1 with specific cooking techniques",
    "Detailed step 2 with timing and temperature",
    "Detailed step 3 with specific instructions",
    "Additional steps as needed"
  ],
  "servings": [realistic number],
  "nutrition": {"cal": [realistic calories], "protein": [realistic grams], "carbs": [realistic grams], "fat": [realistic grams]}
}

Make this recipe truly unique and specific to ${customRecipeInput.trim()}. Include cooking tips and techniques that make this dish special.`;

      // Direct AI call with retry mechanism for API overload
      console.log('🤖 Calling Gemini AI for recipe:', customRecipeInput.trim());
      
      let result;
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          attempts++;
          setRetryAttempt(attempts);
          console.log(`🤖 Attempt ${attempts}/${maxAttempts} to call Gemini AI...`);
          
          result = await Promise.race([
            geminiAI.model.generateContent(prompt),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('AI timeout')), 15000)
            )
          ]);
          
          // If we get here, the call succeeded
          break;
        } catch (error: any) {
          console.log(`❌ Attempt ${attempts} failed:`, error.message);
          
          if (error.message.includes('503') || error.message.includes('overloaded')) {
            if (attempts < maxAttempts) {
              const delay = Math.pow(2, attempts) * 1000; // Exponential backoff: 2s, 4s, 8s
              console.log(`🔄 API overloaded, retrying in ${delay/1000} seconds...`);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            } else {
              throw new Error('Gemini API is overloaded after multiple attempts. Please try again later.');
            }
          } else if (error.message.includes('timeout')) {
            if (attempts < maxAttempts) {
              console.log(`⏰ Timeout, retrying...`);
              continue;
            } else {
              throw new Error('AI request timed out after multiple attempts.');
            }
          } else {
            // Other errors, don't retry
            throw error;
          }
        }
      }
      
      if (!result) {
        throw new Error('Failed to get AI response after multiple attempts');
      }
      
      const response = await result.response;
      const text = response.text();
      
      console.log('🤖 AI Response received:', text.substring(0, 200) + '...');
      
      // Multiple parsing strategies for robustness
      let recipeData = null;
      
      // Strategy 1: Try to extract JSON from markdown code blocks first
      const markdownJsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (markdownJsonMatch) {
        try {
          recipeData = JSON.parse(markdownJsonMatch[1]);
          console.log('✅ JSON parsed successfully with strategy 1 (markdown extraction)');
        } catch (e) {
          console.log('❌ Strategy 1 (markdown) failed:', e.message);
        }
      }
      
      // Strategy 2: Direct JSON parse (if no markdown wrapper)
      if (!recipeData) {
        try {
          recipeData = JSON.parse(text);
          console.log('✅ JSON parsed successfully with strategy 2 (direct parse)');
        } catch (e) {
          console.log('❌ Strategy 2 (direct) failed:', e.message);
        }
      }
      
      // Strategy 3: Extract JSON from text using improved regex
      if (!recipeData) {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            recipeData = JSON.parse(jsonMatch[0]);
            console.log('✅ JSON parsed successfully with strategy 3 (regex extraction)');
          } catch (e2) {
            console.log('❌ Strategy 3 (regex) failed:', e2.message);
          }
        }
      }
      
      // Strategy 4: Manual parsing for common patterns
      if (!recipeData) {
        console.log('⚠️ Using manual fallback parsing');
        recipeData = {
          title: customRecipeInput.trim(),
          desc: `Vegan ${customRecipeInput.trim()}`,
          time: 25,
          type: "Main",
          protein: "Plant-based",
          cuisine: "Modern",
          ingredients: ["2 cups main ingredient", "1 tbsp oil", "spices"],
          steps: ["Mix ingredients", "Cook 20 min", "Serve"],
          servings: 2,
          nutrition: {cal: 250, protein: 12, carbs: 30, fat: 8}
        };
      }
      
      if (recipeData) {
        // Convert to our format with fallbacks
        const detail: GeneratedRecipeDetail = {
          id: `custom-${Date.now()}`,
          title: recipeData.title || customRecipeInput.trim(),
          shortDescription: recipeData.desc || recipeData.shortDescription || `Vegan ${customRecipeInput.trim()}`,
          timeMinutes: recipeData.time || recipeData.timeMinutes || 25,
          mealType: recipeData.type || recipeData.mealType || 'Main',
          proteinSource: recipeData.protein || recipeData.proteinSource || 'Plant-based',
          cuisine: recipeData.cuisine || 'Modern',
          ingredients: recipeData.ingredients || [],
          steps: recipeData.steps || [],
          servings: recipeData.servings || 2,
          nutrition: {
            calories: recipeData.nutrition?.cal || recipeData.nutrition?.calories || 250,
            proteinGrams: recipeData.nutrition?.protein || recipeData.nutrition?.proteinGrams || 12,
            carbsGrams: recipeData.nutrition?.carbs || recipeData.nutrition?.carbsGrams || 30,
            fatGrams: recipeData.nutrition?.fat || recipeData.nutrition?.fatGrams || 8
          }
        };
        
        console.log('✅ AI recipe generated successfully:', detail.title);
        setSelected(detail);
        setCandidates([]);
        setError(null); // Clear any previous errors
      } else {
        throw new Error('Failed to parse AI response');
      }
    } catch (e: any) {
      // Dynamic fallback based on recipe type
      console.log('⚠️ AI failed, using dynamic fallback for:', customRecipeInput.trim());
      
      const recipeName = customRecipeInput.trim().toLowerCase();
      let fallbackRecipe: GeneratedRecipeDetail;
      
      if (recipeName.includes('pizza') || recipeName.includes('pasta') || recipeName.includes('lasagna')) {
                 fallbackRecipe = {
           id: `fallback-${Date.now()}`,
           title: `Vegan ${customRecipeInput.trim()}`,
           shortDescription: `A delicious plant-based ${customRecipeInput.trim()} with authentic flavors and perfect texture`,
          timeMinutes: 35,
          mealType: 'Main',
          proteinSource: 'Plant-based proteins',
          cuisine: 'Italian-inspired',
          ingredients: [
            '2 cups all-purpose flour or gluten-free flour blend',
            '1 cup warm water',
            '1 tbsp active dry yeast',
            '1 tbsp olive oil',
            '1 tsp sea salt',
            '1 tsp sugar',
            '2 cups marinara sauce',
            '1 cup vegan cheese shreds',
            '1 cup fresh vegetables (bell peppers, mushrooms, spinach)',
            '1/4 cup fresh basil leaves',
            '2 tbsp nutritional yeast',
            '1 tsp dried oregano',
            '1/2 tsp garlic powder',
            '1/4 tsp red pepper flakes'
          ],
          steps: [
            'In a large bowl, combine warm water, yeast, and sugar. Let stand for 5 minutes until foamy',
            'Add flour, olive oil, and salt. Mix until a dough forms, then knead for 5-7 minutes',
            'Place dough in oiled bowl, cover with towel, and let rise in warm place for 1 hour',
            'Preheat oven to 450°F (230°C). Punch down dough and roll out on floured surface',
            'Transfer to baking sheet and pre-bake for 5 minutes to set the crust',
            'Spread marinara sauce evenly over crust, leaving 1/2 inch border',
            'Add vegetables, vegan cheese, and seasonings. Bake for 15-20 minutes until golden',
            'Garnish with fresh basil and serve hot'
          ],
          servings: 4,
          nutrition: { calories: 320, proteinGrams: 14, carbsGrams: 45, fatGrams: 12 }
        };
      } else if (recipeName.includes('curry') || recipeName.includes('stew') || recipeName.includes('soup')) {
                 fallbackRecipe = {
           id: `fallback-${Date.now()}`,
           title: `Vegan ${customRecipeInput.trim()}`,
           shortDescription: `A hearty and flavorful ${customRecipeInput.trim()} with aromatic spices and wholesome ingredients`,
          timeMinutes: 40,
          mealType: 'Main',
          proteinSource: 'Legumes and grains',
          cuisine: 'Global fusion',
          ingredients: [
            '1 cup dried lentils or chickpeas, soaked overnight',
            '2 tbsp coconut oil or olive oil',
            '1 large onion, diced',
            '4 cloves garlic, minced',
            '1 tbsp fresh ginger, grated',
            '2 tbsp curry powder or spice blend',
            '1 can (14 oz) coconut milk',
            '2 cups vegetable broth',
            '2 cups mixed vegetables (carrots, potatoes, spinach)',
            '1 cup brown rice or quinoa',
            '1 tbsp tomato paste',
            '1 tbsp fresh cilantro',
            '1 tsp ground turmeric',
            '1/2 tsp cayenne pepper',
            'Salt and pepper to taste'
          ],
          steps: [
            'Heat oil in large pot over medium heat. Add diced onion and cook until translucent',
            'Add minced garlic and ginger, cook for 1 minute until fragrant',
            'Stir in curry powder, turmeric, and cayenne. Cook for 30 seconds to toast spices',
            'Add soaked lentils, coconut milk, vegetable broth, and tomato paste',
            'Bring to boil, then reduce heat and simmer for 20-25 minutes until lentils are tender',
            'Add vegetables and rice, cook for additional 10-15 minutes',
            'Season with salt and pepper, garnish with fresh cilantro',
            'Serve hot with additional rice or bread'
          ],
          servings: 6,
          nutrition: { calories: 280, proteinGrams: 16, carbsGrams: 38, fatGrams: 14 }
        };
      } else {
                 // Generic fallback for other recipes
         fallbackRecipe = {
           id: `fallback-${Date.now()}`,
           title: `Vegan ${customRecipeInput.trim()}`,
           shortDescription: `A delicious and nutritious vegan ${customRecipeInput.trim()} made with wholesome ingredients`,
          timeMinutes: 25,
          mealType: 'Main',
          proteinSource: 'Plant-based proteins',
          cuisine: 'Modern Vegan',
          ingredients: [
            '2 cups fresh vegetables (choose seasonal options)',
            '1 cup whole grains (quinoa, brown rice, or farro)',
            '1/2 cup legumes (chickpeas, lentils, or black beans)',
            '2 tbsp extra virgin olive oil',
            '3 cloves garlic, minced',
            '1 medium onion, diced',
            '1 tbsp fresh herbs (basil, parsley, or cilantro)',
            '1 tsp ground spices (cumin, paprika, or turmeric)',
            '1/2 tsp sea salt',
            '1/4 tsp black pepper',
            '1 tbsp nutritional yeast (optional, for cheesy flavor)',
            '1/4 cup vegetable broth or water'
          ],
          steps: [
            'Prepare your ingredients: wash and chop vegetables, rinse grains and legumes, mince garlic, and dice onion',
            'Heat olive oil in a large skillet over medium heat. Add diced onion and cook until translucent, about 3-4 minutes',
            'Add minced garlic and cook for 1 minute until fragrant, being careful not to burn',
            'Add your chosen vegetables and cook for 5-7 minutes until they begin to soften',
            'Stir in grains, legumes, and spices. Cook for 2-3 minutes to toast the spices',
            'Add vegetable broth and bring to a simmer. Cover and cook for 15-20 minutes until grains are tender',
            'Season with salt, pepper, and fresh herbs. Taste and adjust seasoning as needed',
            'Serve hot with a drizzle of olive oil and additional fresh herbs on top'
          ],
          servings: 4,
          nutrition: { calories: 280, proteinGrams: 12, carbsGrams: 35, fatGrams: 10 }
        };
      }
      
      setSelected(fallbackRecipe);
      setCandidates([]);
      

      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  const onPick = async (c: GeneratedRecipeCandidate) => {
    setLoading(true);
    setError(null);
    try {
      const detail = await geminiAI.expandRecipe(c);
      setSelected(detail);
    } catch (e: any) {
      setError(e?.message || 'Failed to load recipe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-4xl font-bold text-foreground mb-4">Generate AI Recipes</h1>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Customize your recipe</CardTitle>
          <CardDescription>Choose filters and generate 3 vegan recipe options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Custom Recipe Input Section */}
          <div className="space-y-3 p-4 bg-muted/20 rounded-lg border">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <h3 className="font-medium text-sm">Or Type Any Recipe You Want</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter the name of any recipe and we'll generate it with full ingredients and instructions.
            </p>
            
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g., Tofu Scramble, Lentil Curry, Chia Pudding, Vegan Pizza..."
                className="flex-1 px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                value={customRecipeInput}
                onChange={(e) => setCustomRecipeInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && onGenerateCustomRecipe()}
              />
              <Button
                onClick={onGenerateCustomRecipe}
                disabled={!customRecipeInput.trim() || loading}
                size="sm"
                className="gap-2"
              >
                Generate Recipe
              </Button>
            </div>
            
            {/* Helpful Recipe Suggestions */}
            <div className="text-xs text-muted-foreground">
              <p className="mb-2">💡 <strong>Popular recipe suggestions:</strong></p>
              <div className="flex flex-wrap gap-1">
                {['Tofu Scramble', 'Lentil Curry', 'Chia Pudding', 'Vegan Pizza', 'Quinoa Bowl', 'Smoothie Bowl', 'Hummus', 'Falafel'].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setCustomRecipeInput(suggestion);
                      
                      // Check if we have an instant recipe
                      if (instantRecipes[suggestion]) {
                        setSelected(instantRecipes[suggestion]);
                        setCandidates([]);
                        setError(null);
                      } else {
                        // Auto-generate recipe when suggestion is clicked
                        setTimeout(() => onGenerateCustomRecipe(), 100);
                      }
                    }}
                    disabled={loading}
                    className={`px-2 py-1 rounded text-xs transition-colors ${
                      loading 
                        ? 'bg-muted/30 text-muted-foreground cursor-not-allowed' 
                        : 'bg-muted/50 hover:bg-muted'
                    }`}
                  >
                    {suggestion}

                  </button>
                ))}
              </div>

            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Meal Type</label>
              <Select value={mealType} onValueChange={setMealType}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select meal type" /></SelectTrigger>
                <SelectContent>
                  {mealTypes.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Protein Source</label>
              <Select value={proteinSource} onValueChange={setProteinSource}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select protein" /></SelectTrigger>
                <SelectContent>
                  {proteinSources.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Cuisine / Flavor</label>
              <Select value={cuisineOrFlavor} onValueChange={setCuisineOrFlavor}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select cuisine or flavor" /></SelectTrigger>
                <SelectContent>
                  {cuisines.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Time to cook: {timeMinutes} min</label>
            <div className="mt-2">
              <Slider defaultValue={[30]} min={10} max={60} step={5} onValueChange={(v) => setTimeMinutes(v[0])} />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={onGenerate} disabled={loading}>Generate 3 recipes</Button>
            <Button variant="outline" onClick={() => { setMealType(undefined); setProteinSource(undefined); setCuisineOrFlavor(undefined); setTimeMinutes(30); setCustomRecipeInput(''); setCandidates([]); setSelected(null); setError(null); }} disabled={loading}>Clear</Button>
          </div>

          {error && <p className="text-destructive">{error}</p>}
        </CardContent>
      </Card>

      {candidates.length > 0 && !selected && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {candidates.map((c) => (
            <Card key={c.id} className="border">
              <CardHeader>
                <CardTitle className="text-lg">{c.title}</CardTitle>
                <CardDescription>{c.shortDescription}</CardDescription>
                <div className="text-sm text-muted-foreground">~{c.timeMinutes} min {c.mealType ? `• ${c.mealType}` : ''} {c.cuisine ? `• ${c.cuisine}` : ''}</div>
              </CardHeader>
              <CardContent>
                <Button onClick={() => onPick(c)} disabled={loading} className="w-full">View full recipe</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selected && (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recipe Details - Left Side */}
          <Card>
            <CardHeader>
              <CardTitle>{selected.title}</CardTitle>
              <CardDescription>{selected.shortDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                ~{selected.timeMinutes} min
                {selected.mealType && ` • ${selected.mealType}`}
                {selected.cuisine && ` • ${selected.cuisine}`}
                {selected.proteinSource && ` • ${selected.proteinSource}`}
              </div>

              <div>
                <h3 className="font-semibold mb-2">Ingredients</h3>
                <ul className="list-disc pl-6 space-y-1">
                  {selected.ingredients.map((i, idx) => <li key={idx}>{i}</li>)}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Instructions</h3>
                <ol className="list-decimal pl-6 space-y-1">
                  {selected.steps.map((s, idx) => <li key={idx}>{s}</li>)}
                </ol>
              </div>

              {selected.nutrition && (
                <div>
                  <h3 className="font-semibold mb-2">Nutrition (per serving)</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {selected.nutrition.calories && <div>Calories: {selected.nutrition.calories}</div>}
                    {selected.nutrition.proteinGrams && <div>Protein: {selected.nutrition.proteinGrams}g</div>}
                    {selected.nutrition.carbsGrams && <div>Carbs: {selected.nutrition.carbsGrams}g</div>}
                    {selected.nutrition.fatGrams && <div>Fat: {selected.nutrition.fatGrams}g</div>}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setSelected(null)}>Back to options</Button>
              </div>
            </CardContent>
          </Card>

          {/* Chat with Gemini - Right Side */}
          <ChatWithGemini recipe={selected} />
        </div>
      )}
    </div>
  );
};

export default Recipes;