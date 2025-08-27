import { motion } from 'framer-motion';
import { ChefHat, Package, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { MealItem } from '@/state/mealPlannerStore';

interface MealCardProps {
  item: MealItem;
  isSelected: boolean;
  onSelect: () => void;
  index: number;
}

const MealCard = ({ item, isSelected, onSelect, index }: MealCardProps) => {

  const typeIcons = {
    recipe: ChefHat,
    product: Package,
    custom: Plus
  };

  const typeColors = {
    recipe: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    product: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    custom: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
  };

  const Icon = typeIcons[item.type];



  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.3, 
        delay: index * 0.1,
        ease: "easeOut"
      }}
      whileHover={{ 
        y: -2, 
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      className="relative"
    >
      <Card
        className={cn(
          "cursor-pointer transition-all duration-200 border-2",
          isSelected 
            ? "border-primary shadow-lg shadow-primary/20" 
            : "border-border hover:border-primary/50 hover:shadow-md"
        )}
        onClick={onSelect}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <CardContent className="p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge 
                  variant="secondary" 
                  className={cn("text-xs", typeColors[item.type])}
                >
                  <Icon className="w-3 h-3 mr-1" />
                  {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                </Badge>
              </div>
              
              <h4 className="font-medium text-foreground text-sm leading-tight mb-1">
                {item.title}
              </h4>
              

              
              {item.notes && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {item.notes}
                </p>
              )}
            </div>


          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MealCard;
