import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, ChefHat, Package, Edit3, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useMealPlannerStore } from '@/state/mealPlannerStore';
import { toast } from '@/hooks/use-toast';
import RecipePicker from './RecipePicker';

interface AddItemMenuProps {
  day: string;
  slot: string;
  onClose: () => void;
}

const AddItemMenu = ({ day, slot, onClose }: AddItemMenuProps) => {
  const [activeTab, setActiveTab] = useState<'custom' | 'recipes'>('custom');
  const [customTitle, setCustomTitle] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [showRecipePicker, setShowRecipePicker] = useState(false);
  
  const { addItem } = useMealPlannerStore();

  const handleAddCustom = () => {
    if (!customTitle.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a meal title.",
        variant: "destructive",
      });
      return;
    }

    addItem({
      title: customTitle.trim(),
      type: 'custom',
      day,
      slot,
      notes: customNotes.trim() || undefined,
    });

    toast({
      title: "Meal Added",
      description: `${customTitle} has been added to ${day} ${slot}.`,
    });

    onClose();
  };

  const handleAddFromRecipe = (recipe: { title: string; href?: string; time?: number }) => {
    addItem({
      title: recipe.title,
      type: 'recipe',
      day,
      slot,
      href: recipe.href,
      meta: {
        time: recipe.time,
        vegan: true,
      },
    });

    toast({
      title: "Recipe Added",
      description: `${recipe.title} has been added to ${day} ${slot}.`,
    });

    onClose();
  };

  const tabs = [
    { id: 'custom', label: 'Custom Meal', icon: Edit3 },
    { id: 'recipes', label: 'From Recipes', icon: ChefHat },
  ];

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
        className="w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="shadow-2xl border-border/50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Add Meal</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline">{day}</Badge>
              <Badge variant="outline">{slot}</Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-muted rounded-lg">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab(tab.id as any)}
                    className="flex-1 gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </Button>
                );
              })}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {activeTab === 'custom' && (
                <motion.div
                  key="custom"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Meal Title
                    </label>
                    <Input
                      placeholder="e.g., Avocado Toast, Smoothie Bowl..."
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Notes (Optional)
                    </label>
                    <Textarea
                      placeholder="Add any notes, ingredients, or special instructions..."
                      value={customNotes}
                      onChange={(e) => setCustomNotes(e.target.value)}
                      rows={3}
                      className="w-full"
                    />
                  </div>

                  <Button
                    onClick={handleAddCustom}
                    className="w-full gap-2"
                    disabled={!customTitle.trim()}
                  >
                    <Plus className="w-4 h-4" />
                    Add Custom Meal
                  </Button>
                </motion.div>
              )}

              {activeTab === 'recipes' && (
                <motion.div
                  key="recipes"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  <div className="text-center py-8">
                    <ChefHat className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">Choose from Recipes</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Select from your saved recipes or discover new ones
                    </p>
                    <Button
                      onClick={() => setShowRecipePicker(true)}
                      className="gap-2"
                    >
                      <Search className="w-4 h-4" />
                      Browse Recipes
                    </Button>
                  </div>
                </motion.div>
              )}


            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recipe Picker Modal */}
      <AnimatePresence>
        {showRecipePicker && (
          <RecipePicker
            onSelect={handleAddFromRecipe}
            onClose={() => setShowRecipePicker(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AddItemMenu;
