import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { startOfWeek, addDays, format, isSameDay, parseISO } from 'date-fns';

export interface MealItem {
  id: string;
  title: string;
  type: 'recipe' | 'product' | 'custom';
  day: string; // 'Mon', 'Tue', etc.
  slot: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';
  notes?: string;
  href?: string;
  meta?: {
    calories?: number;
    protein?: number;
    time?: number;
    nutrients?: string[];
  };
}

export interface PlannerState {
  weekStartISO: string;
  items: MealItem[];
  selectedItemId: string | null;
  weeklyMeals: Record<string, MealItem[]>; // Store meals per week
}

interface MealPlannerStore extends PlannerState {
  // Actions
  setWeekStart: (date: Date) => void;
  addItem: (item: Omit<MealItem, 'id'>) => void;
  updateItem: (id: string, updates: Partial<MealItem>) => void;
  deleteItem: (id: string) => void;
  moveItem: (id: string, newDay: string, newSlot: string) => void;
  duplicateItem: (id: string) => void;
  selectItem: (id: string | null) => void;
  resetWeek: () => void;
  duplicateToNextWeek: () => void;
  getWeekKey: (date: Date) => string;
  loadWeekMeals: (date: Date) => void;
  saveWeekMeals: (date: Date) => void;

  
  // Computed
  getItemsForDay: (day: string) => MealItem[];
  getItemsForSlot: (day: string, slot: string) => MealItem[];
  getWeekDays: () => string[];
  getCurrentWeekStart: () => Date;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const getWeekDays = (weekStart: Date): string[] => {
  return Array.from({ length: 7 }, (_, i) => {
    const day = addDays(weekStart, i);
    return format(day, 'EEE'); // Mon, Tue, Wed, etc.
  });
};

const getCurrentWeekStart = (): Date => {
  const now = new Date();
  return startOfWeek(now, { weekStartsOn: 1 }); // Monday start
};

const getWeekKey = (date: Date): string => {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  return weekStart.toISOString().split('T')[0]; // YYYY-MM-DD format
};

export const useMealPlannerStore = create<MealPlannerStore>()(
  persist(
    (set, get) => ({
      weekStartISO: getCurrentWeekStart().toISOString(),
      items: [
        {
          id: 'sample-1',
          title: 'Oatmeal with Berries & Nuts',
          type: 'recipe',
          day: 'Mon',
          slot: 'Breakfast'
        },
        {
          id: 'sample-2',
          title: 'Tofu Scramble with Spinach',
          type: 'recipe',
          day: 'Mon',
          slot: 'Lunch'
        },
        {
          id: 'sample-3',
          title: 'Lentil & Quinoa Buddha Bowl',
          type: 'recipe',
          day: 'Mon',
          slot: 'Dinner'
        },
        {
          id: 'sample-4',
          title: 'Hummus with Carrot Sticks',
          type: 'custom',
          day: 'Mon',
          slot: 'Snacks'
        },
        {
          id: 'sample-5',
          title: 'Quinoa Buddha Bowl',
          type: 'recipe',
          day: 'Tue',
          slot: 'Lunch'
        },
        {
          id: 'sample-6',
          title: 'Black Bean & Sweet Potato Bowl',
          type: 'recipe',
          day: 'Tue',
          slot: 'Dinner'
        },
        {
          id: 'sample-7',
          title: 'Smoothie Bowl',
          type: 'recipe',
          day: 'Wed',
          slot: 'Breakfast'
        },
        {
          id: 'sample-8',
          title: 'Kale & White Bean Soup',
          type: 'recipe',
          day: 'Wed',
          slot: 'Dinner'
        }
      ],
      selectedItemId: null,
      weeklyMeals: {},

      setWeekStart: (date: Date) => {
        const currentWeekKey = getWeekKey(parseISO(get().weekStartISO));
        const newWeekKey = getWeekKey(date);
        
        // Save current week's meals before switching
        if (get().items.length > 0) {
          get().saveWeekMeals(parseISO(get().weekStartISO));
        }
        
        // Set new week and load its meals
        set({ weekStartISO: date.toISOString() });
        get().loadWeekMeals(date);
      },

      addItem: (itemData) => {
        const newItem: MealItem = {
          ...itemData,
          id: generateId(),
        };
        set((state) => ({
          items: [...state.items, newItem],
        }));
      },

      updateItem: (id, updates) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        }));
      },

      deleteItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
          selectedItemId: state.selectedItemId === id ? null : state.selectedItemId,
        }));
      },

      moveItem: (id, newDay, newSlot) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, day: newDay, slot: newSlot } : item
          ),
        }));
      },

      duplicateItem: (id) => {
        const item = get().items.find((i) => i.id === id);
        if (item) {
          const newItem: MealItem = {
            ...item,
            id: generateId(),
            title: `${item.title} (Copy)`,
          };
          set((state) => ({
            items: [...state.items, newItem],
          }));
        }
      },

      selectItem: (id) => {
        set({ selectedItemId: id });
      },

      resetWeek: () => {
        set({ items: [], selectedItemId: null });
      },

      duplicateToNextWeek: () => {
        const currentItems = get().items;
        const currentWeekStart = parseISO(get().weekStartISO);
        const nextWeekStart = addDays(currentWeekStart, 7);
        
        const nextWeekItems = currentItems.map((item) => ({
          ...item,
          id: generateId(),
        }));

        set((state) => ({
          weekStartISO: nextWeekStart.toISOString(),
          items: [...state.items, ...nextWeekItems],
        }));
      },

      getWeekKey: (date: Date) => {
        return getWeekKey(date);
      },

      loadWeekMeals: (date: Date) => {
        const weekKey = getWeekKey(date);
        const weekMeals = get().weeklyMeals[weekKey] || [];
        set({ items: weekMeals });
      },

      saveWeekMeals: (date: Date) => {
        const weekKey = getWeekKey(date);
        const currentItems = get().items;
        set((state) => ({
          weeklyMeals: {
            ...state.weeklyMeals,
            [weekKey]: currentItems
          }
        }));
      },



      // Computed getters
      getItemsForDay: (day) => {
        return get().items.filter((item) => item.day === day);
      },

      getItemsForSlot: (day, slot) => {
        return get().items.filter((item) => item.day === day && item.slot === slot);
      },

      getWeekDays: () => {
        const weekStart = parseISO(get().weekStartISO);
        return getWeekDays(weekStart);
      },

      getCurrentWeekStart: () => {
        return getCurrentWeekStart();
      },
    }),
    {
      name: 'kaizo.mealPlanner.v1',
      partialize: (state) => ({
        weekStartISO: state.weekStartISO,
        items: state.items,
        weeklyMeals: state.weeklyMeals,
      }),
    }
  )
);
