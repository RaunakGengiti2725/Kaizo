import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar, Plus, RefreshCw, ShoppingCart, ChefHat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useMealPlannerStore } from '@/state/mealPlannerStore';
import { format, addWeeks, subWeeks, isSameWeek, parseISO } from 'date-fns';
import PlannerGrid from '@/components/meal-planner/PlannerGrid';
import AddItemMenu from '@/components/meal-planner/AddItemMenu';
import ShoppingListModal from '@/components/meal-planner/ShoppingListModal';
import MealPlanModal from '@/components/meal-planner/MealPlanModal';

const MealPlanner = () => {
  const {
    weekStartISO,
    items,
    setWeekStart,
    getWeekDays,
    resetWeek,
    addItem,
  } = useMealPlannerStore();

  const [showAddMenu, setShowAddMenu] = useState(false);
  const [activeCell, setActiveCell] = useState<{ day: string; slot: string } | null>(null);
  const [showShoppingListModal, setShowShoppingListModal] = useState(false);
  const [showMealPlanModal, setShowMealPlanModal] = useState(false);
  const [savedWeeksCount, setSavedWeeksCount] = useState(0);

  const weekDays = getWeekDays();
  const weekStart = parseISO(weekStartISO);
  const isCurrentWeek = isSameWeek(weekStart, new Date(), { weekStartsOn: 1 });

  const goToPreviousWeek = () => {
    const newWeekStart = subWeeks(weekStart, 1);
    setWeekStart(newWeekStart);
  };

  const goToNextWeek = () => {
    const newWeekStart = addWeeks(weekStart, 1);
    setWeekStart(newWeekStart);
  };

  const goToCurrentWeek = () => {
    setWeekStart(new Date());
  };



  const handleAddItem = (day: string, slot: string) => {
    setActiveCell({ day, slot });
    setShowAddMenu(true);
  };

  useEffect(() => {
    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setShowAddMenu(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update saved weeks count when weeklyMeals change
  useEffect(() => {
    const updateSavedWeeksCount = () => {
      const weeklyMeals = useMealPlannerStore.getState().weeklyMeals;
      setSavedWeeksCount(Object.keys(weeklyMeals).length);
    };
    
    updateSavedWeeksCount();
    
    // Subscribe to store changes
    const unsubscribe = useMealPlannerStore.subscribe(updateSavedWeeksCount);
    return unsubscribe;
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20"
    >
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                Meal Planner
              </h1>
              <p className="text-xl text-muted-foreground">
                Plan your week with delicious vegan meals
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => setShowMealPlanModal(true)}
                className="gap-2 bg-green-600 hover:bg-green-700 text-white"
              >
                <ChefHat className="w-4 h-4" />
                Generate Meal Plan
              </Button>
              
              <Button
                onClick={() => setShowShoppingListModal(true)}
                className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <ShoppingCart className="w-4 h-4" />
                Generate Shopping List
              </Button>
              
              <Button
                onClick={() => {
                  resetWeek();
                  toast({
                    title: "Meal Planner Reset",
                    description: "Current week cleared. Previous weeks are saved and can be accessed by navigating to them.",
                  });
                }}
                variant="outline"
                className="gap-2 hover:bg-destructive hover:text-destructive-foreground transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Reset All
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Week Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-8"
        >
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Button
                    onClick={goToPreviousWeek}
                    variant="ghost"
                    size="sm"
                    className="p-2"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  
                  <div className="text-center">
                    <h2 className="text-2xl font-semibold text-foreground">
                      {format(weekStart, 'MMMM d')} - {format(addWeeks(weekStart, 1), 'MMMM d, yyyy')}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {items.length} meals planned
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      {savedWeeksCount} weeks saved
                    </p>
                  </div>
                  
                  <Button
                    onClick={goToNextWeek}
                    variant="ghost"
                    size="sm"
                    className="p-2"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={goToCurrentWeek}
                    variant={isCurrentWeek ? "default" : "outline"}
                    size="sm"
                    className="gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    Today
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content */}
        <div className="flex flex-col gap-8">
          {/* Planner Grid */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex-1"
          >
            <PlannerGrid
              weekDays={weekDays}
              onAddItem={handleAddItem}
            />
            
            {/* Empty State Message */}
            {items.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-center py-12"
              >
                <div className="max-w-md mx-auto">
                  <ChefHat className="w-16 h-16 mx-auto mb-4 text-muted-foreground/40" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    No meals planned yet
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Get started by generating a meal plan or adding individual meals to your week. 
                    {savedWeeksCount > 0 && (
                      <span className="block mt-2 text-sm">
                        💡 You have {savedWeeksCount} other week{ savedWeeksCount !== 1 ? 's' : ''} planned ahead!
                      </span>
                    )}
                  </p>
                  <Button
                    onClick={() => setShowMealPlanModal(true)}
                    className="gap-2"
                  >
                    <ChefHat className="w-4 h-4" />
                    Generate Meal Plan
                  </Button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Add Item Menu */}
      <AnimatePresence>
        {showAddMenu && activeCell && (
          <AddItemMenu
            day={activeCell.day}
            slot={activeCell.slot}
            onClose={() => {
              setShowAddMenu(false);
              setActiveCell(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Shopping List Modal */}
      <ShoppingListModal
        isOpen={showShoppingListModal}
        onClose={() => setShowShoppingListModal(false)}
        weekDays={weekDays}
        weekStart={weekStart}
        items={items}
      />

      {/* Meal Plan Modal */}
      <MealPlanModal
        isOpen={showMealPlanModal}
        onClose={() => setShowMealPlanModal(false)}
        weekDays={weekDays}
        weekStart={weekStart}
        onMealPlanGenerated={(meals) => {
          // Clear existing meals and add new ones
          resetWeek();
          meals.forEach(meal => {
            addItem(meal);
          });
          toast({
            title: "Meal Plan Generated!",
            description: "Your week has been filled with delicious vegan meals.",
          });
        }}
      />
    </motion.div>
  );
};

export default MealPlanner;
