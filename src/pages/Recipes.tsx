import { useState, useMemo } from 'react';
import { Search, Clock, ChefHat } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VEGAN_RECIPES, Recipe } from '@/data/veganData';
import recipesFeatureImage from '@/assets/recipes-feature.jpg';

const Recipes = () => {
  const [searchIngredients, setSearchIngredients] = useState('');
  const [maxTime, setMaxTime] = useState<string>('');

  const filteredRecipes = useMemo(() => {
    if (!searchIngredients.trim()) return VEGAN_RECIPES;

    const userIngredients = searchIngredients
      .toLowerCase()
      .split(',')
      .map(ing => ing.trim())
      .filter(ing => ing.length > 0);

    if (userIngredients.length === 0) return VEGAN_RECIPES;

    const scoredRecipes = VEGAN_RECIPES.map(recipe => {
      const recipeIngredients = recipe.ingredients.map(ing => ing.toLowerCase());
      const matchCount = userIngredients.filter(userIng => 
        recipeIngredients.some(recipeIng => 
          recipeIng.includes(userIng) || userIng.includes(recipeIng)
        )
      ).length;
      
      const missing = recipe.ingredients.filter(recipeIng => 
        !userIngredients.some(userIng => 
          recipeIng.toLowerCase().includes(userIng) || userIng.includes(recipeIng.toLowerCase())
        )
      );

      return {
        ...recipe,
        matchCount,
        missing,
        score: matchCount / recipe.ingredients.length
      };
    })
    .filter(recipe => recipe.matchCount > 0)
    .sort((a, b) => b.score - a.score);

    return scoredRecipes;
  }, [searchIngredients]);

  const timeFilteredRecipes = useMemo(() => {
    if (!maxTime) return filteredRecipes;
    const timeLimit = parseInt(maxTime);
    return filteredRecipes.filter(recipe => recipe.time <= timeLimit);
  }, [filteredRecipes, maxTime]);

  const getMissingIngredients = (recipe: Recipe & { missing?: string[] }) => {
    if (!recipe.missing) return [];
    return recipe.missing;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-4">Vegan Recipes</h1>
        <p className="text-xl text-muted-foreground">
          Find delicious vegan recipes based on ingredients you have
        </p>
      </div>

      {/* Search Section */}
      <Card className="mb-8 shadow-card bg-gradient-card border-0">
        <CardHeader className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <ChefHat className="w-10 h-10 text-primary" />
          </div>
          <CardTitle>What ingredients do you have?</CardTitle>
          <CardDescription>
            Enter ingredients separated by commas (e.g., "avocado, pasta, garlic")
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              placeholder="Enter ingredients you have..."
              value={searchIngredients}
              onChange={(e) => setSearchIngredients(e.target.value)}
              className="pl-10 text-lg py-6"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Select value={maxTime} onValueChange={setMaxTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Max cooking time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any time</SelectItem>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={() => {
                setSearchIngredients('');
                setMaxTime('');
              }}
              variant="outline"
              className="sm:w-auto"
            >
              Clear Filters
            </Button>
          </div>

          {/* Demo Image */}
          <div className="flex justify-center mt-6">
            <img 
              src={recipesFeatureImage} 
              alt="Fresh vegan ingredients"
              className="max-w-sm rounded-lg shadow-soft"
            />
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      {searchIngredients && (
        <div className="mb-6">
          <p className="text-muted-foreground">
            Found {timeFilteredRecipes.length} recipe{timeFilteredRecipes.length !== 1 ? 's' : ''} 
            {maxTime && ` under ${maxTime} minutes`}
          </p>
        </div>
      )}

      {/* Recipe Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {timeFilteredRecipes.map((recipe) => {
          const missing = getMissingIngredients(recipe);
          const hasMatch = 'matchCount' in recipe;
          
          return (
            <Card key={recipe.id} className="shadow-card hover:shadow-glow transition-smooth border-0 bg-gradient-card">
              <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary-light/20 flex items-center justify-center">
                  <ChefHat className="w-12 h-12 text-primary" />
                </div>
              </div>
              
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{recipe.title}</CardTitle>
                  <Badge variant="secondary" className="ml-2">
                    <Clock className="w-3 h-3 mr-1" />
                    {recipe.time}m
                  </Badge>
                </div>
                <CardDescription>{recipe.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Ingredients */}
                <div>
                  <h4 className="font-semibold text-sm mb-2">Ingredients:</h4>
                  <div className="flex flex-wrap gap-1">
                    {recipe.ingredients.map((ingredient, index) => (
                      <Badge 
                        key={index} 
                        variant="outline" 
                        className="text-xs"
                      >
                        {ingredient}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Missing ingredients if search is active */}
                {hasMatch && missing.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2 text-muted-foreground">
                      You're missing:
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {missing.map((ingredient, index) => (
                        <Badge 
                          key={index} 
                          variant="secondary"
                          className="text-xs opacity-60"
                        >
                          {ingredient}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Match indicator */}
                {hasMatch && (
                  <div className="pt-2 border-t border-border">
                    <Badge className="bg-success text-success-foreground">
                      {((recipe as any).matchCount)} ingredients match
                    </Badge>
                  </div>
                )}

                <Button className="w-full bg-primary hover:bg-primary/90 transition-smooth">
                  View Recipe
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {timeFilteredRecipes.length === 0 && searchIngredients && (
        <Card className="shadow-card text-center py-12">
          <CardContent>
            <ChefHat className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No recipes found</h3>
            <p className="text-muted-foreground mb-4">
              Try different ingredients or remove the time filter
            </p>
            <Button 
              onClick={() => {
                setSearchIngredients('');
                setMaxTime('');
              }}
              variant="outline"
            >
              Show All Recipes
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Recipes;