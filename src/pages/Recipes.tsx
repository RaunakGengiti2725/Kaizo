import { VEGAN_RECIPES } from '@/data/veganData';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Clock } from 'lucide-react';
import { useState } from 'react';
import { geminiAI, type GeneratedRecipeCandidate, type GeneratedRecipeDetail } from '@/services/geminiAI';
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
  const [mealType, setMealType] = useState<string | undefined>();
  const [proteinSource, setProteinSource] = useState<string | undefined>();
  const [cuisineOrFlavor, setCuisineOrFlavor] = useState<string | undefined>();
  const [timeMinutes, setTimeMinutes] = useState<number>(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<GeneratedRecipeCandidate[]>([]);
  const [selected, setSelected] = useState<GeneratedRecipeDetail | null>(null);

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
            <Button variant="outline" onClick={() => { setMealType(undefined); setProteinSource(undefined); setCuisineOrFlavor(undefined); setTimeMinutes(30); setCandidates([]); setSelected(null); setError(null); }} disabled={loading}>Clear</Button>
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