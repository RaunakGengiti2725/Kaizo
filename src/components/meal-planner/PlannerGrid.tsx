import { motion } from 'framer-motion';
import { Plus, ChefHat, Target, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useMealPlannerStore, MealItem } from '@/state/mealPlannerStore';
import MealCard from './MealCard';

interface PlannerGridProps {
  weekDays: string[];
  onAddItem: (day: string, slot: string) => void;
}

const slots: Array<'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks'> = [
  'Breakfast',
  'Lunch', 
  'Dinner',
  'Snacks'
];

const slotIcons = {
  Breakfast: '',
  Lunch: '',
  Dinner: '',
  Snacks: ''
};

const slotColors = {
  Breakfast: 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800/50',
  Lunch: 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800/50',
  Dinner: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/50',
  Snacks: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800/50'
};

const PlannerGrid = ({ weekDays, onAddItem }: PlannerGridProps) => {
  const { getItemsForSlot, selectItem, selectedItemId } = useMealPlannerStore();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const columnVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const cellVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      {/* Header Row */}
      <div className="grid grid-cols-8 gap-4">
        <div className="w-24" /> {/* Empty corner */}
        {weekDays.map((day, dayIndex) => (
          <motion.div
            key={day}
            variants={columnVariants}
            className="text-center"
          >
            <div className="text-lg font-semibold text-foreground mb-2">
              {day}
            </div>
            <div className="text-sm text-muted-foreground">
              {new Date(Date.now() + dayIndex * 24 * 60 * 60 * 1000).getDate()}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Meal Slots */}
      {slots.map((slot, slotIndex) => (
        <motion.div
          key={slot}
          variants={columnVariants}
          className="grid grid-cols-8 gap-4"
        >
          {/* Slot Label */}
          <div className="flex items-center gap-3">
            <div>
              <div className="font-semibold text-foreground">{slot}</div>
              <div className="text-xs text-muted-foreground">
                {slot === 'Breakfast' ? '7-9 AM' : 
                 slot === 'Lunch' ? '12-2 PM' :
                 slot === 'Dinner' ? '6-8 PM' : '3-4 PM'}
              </div>
            </div>
          </div>

          {/* Day Columns */}
          {weekDays.map((day) => {
            const items = getItemsForSlot(day, slot);
            
            return (
              <motion.div
                key={`${day}-${slot}`}
                variants={cellVariants}
                className="min-h-[120px]"
              >
                <Card className={cn(
                  "h-full transition-all duration-200 hover:shadow-md",
                  items.length === 0 
                    ? "bg-muted/30 border-dashed border-border/50 hover:border-border/70" 
                    : "bg-card/80 backdrop-blur-sm"
                )}>
                  <CardContent className="p-3 h-full">
                    {items.length === 0 ? (
                      <Button
                        onClick={() => onAddItem(day, slot)}
                        variant="ghost"
                        size="sm"
                        className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200"
                      >
                        <Plus className="w-5 h-5" />
                        <span className="text-xs">Add Meal</span>
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        {items.map((item, itemIndex) => (
                          <MealCard
                            key={item.id}
                            item={item}
                            isSelected={selectedItemId === item.id}
                            onSelect={() => selectItem(item.id)}
                            index={itemIndex}
                          />
                        ))}
                        <Button
                          onClick={() => onAddItem(day, slot)}
                          variant="ghost"
                          size="sm"
                          className="w-full h-8 text-xs text-muted-foreground hover:text-foreground hover:bg-accent/50"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add More
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      ))}
    </motion.div>
  );
};

export default PlannerGrid;

