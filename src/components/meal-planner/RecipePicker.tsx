import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, ChefHat, Clock, Star, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Recipe {
  id: string;
  title: string;
  description?: string;
  time?: number;
  difficulty?: string;
  href?: string;
  tags?: string[];
}

interface RecipePickerProps {
  onSelect: (recipe: { title: string; href?: string; time?: number }) => void;
  onClose: () => void;
}

// Mock recipes data - in a real app, this would come from your recipes API
const mockRecipes: Recipe[] = [
  {
    id: '1',
    title: 'Avocado Toast with Microgreens',
    description: 'Simple yet delicious breakfast with creamy avocado and fresh microgreens',
    time: 10,
    difficulty: 'Easy',
    tags: ['breakfast', 'quick', 'healthy'],
  },
  {
    id: '2',
    title: 'Quinoa Buddha Bowl',
    description: 'Nutritious bowl with quinoa, roasted vegetables, and tahini dressing',
    time: 25,
    difficulty: 'Medium',
    tags: ['lunch', 'bowl', 'protein'],
  },
  {
    id: '3',
    title: 'Vegan Pasta Primavera',
    description: 'Fresh spring vegetables tossed with al dente pasta and olive oil',
    time: 20,
    difficulty: 'Easy',
    tags: ['dinner', 'pasta', 'vegetables'],
  },
  {
    id: '4',
    title: 'Smoothie Bowl',
    description: 'Thick smoothie topped with granola, fruits, and seeds',
    time: 15,
    difficulty: 'Easy',
    tags: ['breakfast', 'smoothie', 'fruits'],
  },
  {
    id: '5',
    title: 'Chickpea Curry',
    description: 'Spicy chickpea curry with coconut milk and aromatic spices',
    time: 35,
    difficulty: 'Medium',
    tags: ['dinner', 'curry', 'protein'],
  },
  {
    id: '6',
    title: 'Hummus & Veggie Wrap',
    description: 'Fresh vegetables wrapped in a whole grain tortilla with hummus',
    time: 12,
    difficulty: 'Easy',
    tags: ['lunch', 'wrap', 'quick'],
  },
];

const RecipePicker = ({ onSelect, onClose }: RecipePickerProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>(mockRecipes);

  const allTags = Array.from(new Set(mockRecipes.flatMap(recipe => recipe.tags || [])));

  useEffect(() => {
    let filtered = mockRecipes;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(recipe =>
        recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by selected tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter(recipe =>
        selectedTags.some(tag => recipe.tags?.includes(tag))
      );
    }

    setRecipes(filtered);
  }, [searchQuery, selectedTags]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleRecipeSelect = (recipe: Recipe) => {
    onSelect({
      title: recipe.title,
      href: recipe.href,
      time: recipe.time,
    });
  };

  return (
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
        className="w-full max-w-4xl max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="shadow-2xl border-border/50 h-full flex flex-col">
          <CardHeader className="pb-4 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl flex items-center gap-2">
                <ChefHat className="w-5 h-5" />
                Choose Recipe
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
          </CardHeader>

          <CardContent className="flex-1 overflow-hidden p-6">
            {/* Search and Filters */}
            <div className="space-y-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search recipes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer transition-colors",
                      selectedTags.includes(tag) && "bg-primary text-primary-foreground"
                    )}
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Recipes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto max-h-[60vh] pr-2">
              <AnimatePresence>
                {recipes.map((recipe, index) => (
                  <motion.div
                    key={recipe.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                  >
                    <Card 
                      className="cursor-pointer hover:shadow-md transition-all duration-200 hover:scale-105 border-border/50"
                      onClick={() => handleRecipeSelect(recipe)}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <h3 className="font-semibold text-foreground text-sm leading-tight">
                              {recipe.title}
                            </h3>
                            {recipe.href && (
                              <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0 ml-2" />
                            )}
                          </div>
                          
                          {recipe.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {recipe.description}
                            </p>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {recipe.time && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="w-3 h-3" />
                                  {recipe.time}m
                                </div>
                              )}
                              {recipe.difficulty && (
                                <Badge variant="secondary" className="text-xs">
                                  {recipe.difficulty}
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          {recipe.tags && recipe.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {recipe.tags.slice(0, 3).map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="outline"
                                  className="text-xs px-2 py-0.5"
                                >
                                  {tag}
                                </Badge>
                              ))}
                              {recipe.tags.length > 3 && (
                                <Badge variant="outline" className="text-xs px-2 py-0.5">
                                  +{recipe.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {recipes.length === 0 && (
              <div className="text-center py-12">
                <ChefHat className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No recipes found</h3>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search or filters
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default RecipePicker;

