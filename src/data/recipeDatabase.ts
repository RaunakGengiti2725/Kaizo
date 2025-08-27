export interface RecipeIngredient {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  notes?: string;
}

export interface Recipe {
  id: string;
  title: string;
  ingredients: RecipeIngredient[];
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
}

export const recipeDatabase: Record<string, Recipe> = {
  'Avocado Toast with Microgreens': {
    id: 'avocado-toast-microgreens',
    title: 'Avocado Toast with Microgreens',
    ingredients: [
      { name: 'Sourdough Bread', quantity: 2, unit: 'slices', category: 'Bakery' },
      { name: 'Avocado', quantity: 1, unit: 'medium', category: 'Produce' },
      { name: 'Microgreens', quantity: 0.5, unit: 'cup', category: 'Produce' },
      { name: 'Lemon', quantity: 0.5, unit: 'medium', category: 'Produce' },
      { name: 'Olive Oil', quantity: 1, unit: 'tbsp', category: 'Pantry' },
      { name: 'Sea Salt', quantity: 0.25, unit: 'tsp', category: 'Pantry' },
      { name: 'Black Pepper', quantity: 0.25, unit: 'tsp', category: 'Pantry' }
    ],
    prepTime: 10,
    cookTime: 5,
    servings: 1,
    difficulty: 'Easy',
    tags: ['breakfast', 'vegan', 'quick', 'toast']
  },
  
  'Quinoa Buddha Bowl': {
    id: 'quinoa-buddha-bowl',
    title: 'Quinoa Buddha Bowl',
    ingredients: [
      { name: 'Quinoa', quantity: 0.5, unit: 'cup', category: 'Pantry' },
      { name: 'Sweet Potato', quantity: 1, unit: 'medium', category: 'Produce' },
      { name: 'Kale', quantity: 2, unit: 'cups', category: 'Produce' },
      { name: 'Chickpeas', quantity: 0.5, unit: 'can', category: 'Pantry' },
      { name: 'Avocado', quantity: 0.5, unit: 'medium', category: 'Produce' },
      { name: 'Cherry Tomatoes', quantity: 0.5, unit: 'cup', category: 'Produce' },
      { name: 'Olive Oil', quantity: 2, unit: 'tbsp', category: 'Pantry' },
      { name: 'Lemon', quantity: 0.5, unit: 'medium', category: 'Produce' },
      { name: 'Garlic', quantity: 1, unit: 'clove', category: 'Produce' },
      { name: 'Cumin', quantity: 0.5, unit: 'tsp', category: 'Pantry' }
    ],
    prepTime: 15,
    cookTime: 20,
    servings: 2,
    difficulty: 'Medium',
    tags: ['lunch', 'dinner', 'vegan', 'gluten-free', 'bowl']
  },
  
  'Smoothie Bowl': {
    id: 'smoothie-bowl',
    title: 'Smoothie Bowl',
    ingredients: [
      { name: 'Frozen Banana', quantity: 1, unit: 'medium', category: 'Frozen' },
      { name: 'Frozen Berries', quantity: 0.5, unit: 'cup', category: 'Frozen' },
      { name: 'Almond Milk', quantity: 0.25, unit: 'cup', category: 'Dairy' },
      { name: 'Chia Seeds', quantity: 1, unit: 'tbsp', category: 'Pantry' },
      { name: 'Granola', quantity: 0.25, unit: 'cup', category: 'Bakery' },
      { name: 'Coconut Flakes', quantity: 2, unit: 'tbsp', category: 'Pantry' },
      { name: 'Honey', quantity: 1, unit: 'tsp', category: 'Pantry' }
    ],
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    difficulty: 'Easy',
    tags: ['breakfast', 'snack', 'vegan', 'no-cook', 'smoothie']
  },
  
  'Oatmeal with Berries & Nuts': {
    id: 'oatmeal-berries-nuts',
    title: 'Oatmeal with Berries & Nuts',
    ingredients: [
      { name: 'Rolled Oats', quantity: 1, unit: 'cup', category: 'Pantry' },
      { name: 'Mixed Berries', quantity: 1, unit: 'cup', category: 'Frozen' },
      { name: 'Mixed Nuts', quantity: 0.5, unit: 'cup', category: 'Pantry' },
      { name: 'Maple Syrup', quantity: 2, unit: 'tbsp', category: 'Pantry' },
      { name: 'Cinnamon', quantity: 1, unit: 'tsp', category: 'Pantry' },
      { name: 'Salt', quantity: 0.25, unit: 'tsp', category: 'Pantry' }
    ],
    prepTime: 5,
    cookTime: 10,
    servings: 2,
    difficulty: 'Easy',
    tags: ['breakfast', 'vegan', 'gluten-free', 'quick']
  },
  
  'Tofu Scramble with Spinach': {
    id: 'tofu-scramble-spinach',
    title: 'Tofu Scramble with Spinach',
    ingredients: [
      { name: 'Firm Tofu', quantity: 1, unit: 'block', category: 'Refrigerated' },
      { name: 'Fresh Spinach', quantity: 2, unit: 'cups', category: 'Produce' },
      { name: 'Onion', quantity: 0.5, unit: 'medium', category: 'Produce' },
      { name: 'Olive Oil', quantity: 1, unit: 'tbsp', category: 'Pantry' },
      { name: 'Turmeric', quantity: 0.5, unit: 'tsp', category: 'Pantry' },
      { name: 'Nutritional Yeast', quantity: 2, unit: 'tbsp', category: 'Pantry' },
      { name: 'Black Pepper', quantity: 0.25, unit: 'tsp', category: 'Pantry' },
      { name: 'Salt', quantity: 0.5, unit: 'tsp', category: 'Pantry' }
    ],
    prepTime: 10,
    cookTime: 15,
    servings: 2,
    difficulty: 'Easy',
    tags: ['breakfast', 'vegan', 'high-protein', 'savory']
  },
  
  'Lentil & Quinoa Buddha Bowl': {
    id: 'lentil-quinoa-buddha-bowl',
    title: 'Lentil & Quinoa Buddha Bowl',
    ingredients: [
      { name: 'Lentils', quantity: 1, unit: 'cup', category: 'Pantry' },
      { name: 'Quinoa', quantity: 0.5, unit: 'cup', category: 'Pantry' },
      { name: 'Sweet Potato', quantity: 1, unit: 'medium', category: 'Produce' },
      { name: 'Kale', quantity: 2, unit: 'cups', category: 'Produce' },
      { name: 'Avocado', quantity: 1, unit: 'medium', category: 'Produce' },
      { name: 'Cherry Tomatoes', quantity: 1, unit: 'cup', category: 'Produce' },
      { name: 'Olive Oil', quantity: 2, unit: 'tbsp', category: 'Pantry' },
      { name: 'Lemon', quantity: 1, unit: 'medium', category: 'Produce' },
      { name: 'Garlic', quantity: 2, unit: 'cloves', category: 'Produce' },
      { name: 'Cumin', quantity: 1, unit: 'tsp', category: 'Pantry' }
    ],
    prepTime: 15,
    cookTime: 25,
    servings: 4,
    difficulty: 'Medium',
    tags: ['lunch', 'dinner', 'vegan', 'gluten-free', 'high-protein']
  },
  
  'Chickpea & Avocado Salad': {
    id: 'chickpea-avocado-salad',
    title: 'Chickpea & Avocado Salad',
    ingredients: [
      { name: 'Chickpeas', quantity: 1, unit: 'can', category: 'Pantry' },
      { name: 'Avocado', quantity: 1, unit: 'medium', category: 'Produce' },
      { name: 'Red Onion', quantity: 0.25, unit: 'medium', category: 'Produce' },
      { name: 'Lemon', quantity: 1, unit: 'medium', category: 'Produce' },
      { name: 'Olive Oil', quantity: 2, unit: 'tbsp', category: 'Pantry' },
      { name: 'Fresh Cilantro', quantity: 0.25, unit: 'cup', category: 'Produce' },
      { name: 'Cumin', quantity: 0.5, unit: 'tsp', category: 'Pantry' },
      { name: 'Salt', quantity: 0.5, unit: 'tsp', category: 'Pantry' },
      { name: 'Black Pepper', quantity: 0.25, unit: 'tsp', category: 'Pantry' }
    ],
    prepTime: 10,
    cookTime: 0,
    servings: 2,
    difficulty: 'Easy',
    tags: ['lunch', 'vegan', 'gluten-free', 'no-cook', 'quick']
  },
  
  'Tempeh & Vegetable Stir Fry': {
    id: 'tempeh-vegetable-stir-fry',
    title: 'Tempeh & Vegetable Stir Fry',
    ingredients: [
      { name: 'Tempeh', quantity: 1, unit: 'block', category: 'Refrigerated' },
      { name: 'Broccoli', quantity: 2, unit: 'cups', category: 'Produce' },
      { name: 'Carrots', quantity: 2, unit: 'medium', category: 'Produce' },
      { name: 'Bell Pepper', quantity: 1, unit: 'medium', category: 'Produce' },
      { name: 'Soy Sauce', quantity: 3, unit: 'tbsp', category: 'Pantry' },
      { name: 'Sesame Oil', quantity: 1, unit: 'tbsp', category: 'Pantry' },
      { name: 'Garlic', quantity: 3, unit: 'cloves', category: 'Produce' },
      { name: 'Ginger', quantity: 1, unit: 'tbsp', category: 'Produce' },
      { name: 'Brown Rice', quantity: 1, unit: 'cup', category: 'Pantry' },
      { name: 'Cornstarch', quantity: 1, unit: 'tsp', category: 'Pantry' }
    ],
    prepTime: 15,
    cookTime: 20,
    servings: 3,
    difficulty: 'Medium',
    tags: ['dinner', 'vegan', 'high-protein', 'asian-inspired']
  },
  
  'Black Bean & Sweet Potato Bowl': {
    id: 'black-bean-sweet-potato-bowl',
    title: 'Black Bean & Sweet Potato Bowl',
    ingredients: [
      { name: 'Black Beans', quantity: 1, unit: 'can', category: 'Pantry' },
      { name: 'Sweet Potato', quantity: 2, unit: 'medium', category: 'Produce' },
      { name: 'Brown Rice', quantity: 1, unit: 'cup', category: 'Pantry' },
      { name: 'Red Onion', quantity: 0.5, unit: 'medium', category: 'Produce' },
      { name: 'Cilantro', quantity: 0.5, unit: 'cup', category: 'Produce' },
      { name: 'Lime', quantity: 1, unit: 'medium', category: 'Produce' },
      { name: 'Olive Oil', quantity: 2, unit: 'tbsp', category: 'Pantry' },
      { name: 'Cumin', quantity: 1, unit: 'tsp', category: 'Pantry' },
      { name: 'Chili Powder', quantity: 0.5, unit: 'tsp', category: 'Pantry' },
      { name: 'Salt', quantity: 0.5, unit: 'tsp', category: 'Pantry' }
    ],
    prepTime: 20,
    cookTime: 30,
    servings: 4,
    difficulty: 'Easy',
    tags: ['dinner', 'vegan', 'gluten-free', 'mexican-inspired']
  },
  
  'Quinoa & Black Bean Enchiladas': {
    id: 'quinoa-black-bean-enchiladas',
    title: 'Quinoa & Black Bean Enchiladas',
    ingredients: [
      { name: 'Quinoa', quantity: 1, unit: 'cup', category: 'Pantry' },
      { name: 'Black Beans', quantity: 1, unit: 'can', category: 'Pantry' },
      { name: 'Corn Tortillas', quantity: 8, unit: 'pieces', category: 'Bakery' },
      { name: 'Enchilada Sauce', quantity: 1, unit: 'can', category: 'Pantry' },
      { name: 'Onion', quantity: 1, unit: 'medium', category: 'Produce' },
      { name: 'Bell Pepper', quantity: 1, unit: 'medium', category: 'Produce' },
      { name: 'Cheese Alternative', quantity: 1, unit: 'cup', category: 'Refrigerated' },
      { name: 'Olive Oil', quantity: 1, unit: 'tbsp', category: 'Pantry' },
      { name: 'Cumin', quantity: 1, unit: 'tsp', category: 'Pantry' },
      { name: 'Garlic Powder', quantity: 0.5, unit: 'tsp', category: 'Pantry' }
    ],
    prepTime: 25,
    cookTime: 20,
    servings: 4,
    difficulty: 'Medium',
    tags: ['dinner', 'vegan', 'mexican-inspired', 'family-friendly']
  },
  
  'Hummus with Carrot Sticks': {
    id: 'hummus-carrot-sticks',
    title: 'Hummus with Carrot Sticks',
    ingredients: [
      { name: 'Chickpeas', quantity: 1, unit: 'can', category: 'Pantry' },
      { name: 'Tahini', quantity: 2, unit: 'tbsp', category: 'Pantry' },
      { name: 'Lemon', quantity: 1, unit: 'medium', category: 'Produce' },
      { name: 'Garlic', quantity: 1, unit: 'clove', category: 'Produce' },
      { name: 'Olive Oil', quantity: 2, unit: 'tbsp', category: 'Pantry' },
      { name: 'Carrots', quantity: 4, unit: 'medium', category: 'Produce' },
      { name: 'Cumin', quantity: 0.5, unit: 'tsp', category: 'Pantry' },
      { name: 'Salt', quantity: 0.5, unit: 'tsp', category: 'Pantry' }
    ],
    prepTime: 10,
    cookTime: 0,
    servings: 2,
    difficulty: 'Easy',
    tags: ['snack', 'vegan', 'gluten-free', 'no-cook', 'quick']
  },
  
  'Mixed Nuts & Seeds': {
    id: 'mixed-nuts-seeds',
    title: 'Mixed Nuts & Seeds',
    ingredients: [
      { name: 'Almonds', quantity: 0.5, unit: 'cup', category: 'Pantry' },
      { name: 'Walnuts', quantity: 0.5, unit: 'cup', category: 'Pantry' },
      { name: 'Pumpkin Seeds', quantity: 0.25, unit: 'cup', category: 'Pantry' },
      { name: 'Sunflower Seeds', quantity: 0.25, unit: 'cup', category: 'Pantry' },
      { name: 'Chia Seeds', quantity: 2, unit: 'tbsp', category: 'Pantry' },
      { name: 'Flax Seeds', quantity: 2, unit: 'tbsp', category: 'Pantry' }
    ],
    prepTime: 5,
    cookTime: 0,
    servings: 4,
    difficulty: 'Easy',
    tags: ['snack', 'vegan', 'gluten-free', 'no-cook', 'high-protein']
  },
  
  'Greek Yogurt with Berries': {
    id: 'greek-yogurt-berries',
    title: 'Greek Yogurt with Berries',
    ingredients: [
      { name: 'Greek Yogurt', quantity: 1, unit: 'cup', category: 'Dairy' },
      { name: 'Mixed Berries', quantity: 0.5, unit: 'cup', category: 'Frozen' },
      { name: 'Honey', quantity: 1, unit: 'tbsp', category: 'Pantry' },
      { name: 'Granola', quantity: 0.25, unit: 'cup', category: 'Bakery' },
      { name: 'Chia Seeds', quantity: 1, unit: 'tbsp', category: 'Pantry' }
    ],
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    difficulty: 'Easy',
    tags: ['snack', 'breakfast', 'high-protein', 'quick', 'no-cook']
  },
  
  'Tofu Scramble': {
    id: 'tofu-scramble',
    title: 'Tofu Scramble',
    ingredients: [
      { name: 'Firm Tofu', quantity: 1, unit: 'block', category: 'Refrigerated' },
      { name: 'Fresh Spinach', quantity: 2, unit: 'cups', category: 'Produce' },
      { name: 'Onion', quantity: 0.5, unit: 'medium', category: 'Produce' },
      { name: 'Olive Oil', quantity: 1, unit: 'tbsp', category: 'Pantry' },
      { name: 'Turmeric', quantity: 0.5, unit: 'tsp', category: 'Pantry' },
      { name: 'Nutritional Yeast', quantity: 2, unit: 'tbsp', category: 'Pantry' },
      { name: 'Black Pepper', quantity: 0.25, unit: 'tsp', category: 'Pantry' },
      { name: 'Salt', quantity: 0.5, unit: 'tsp', category: 'Pantry' }
    ],
    prepTime: 10,
    cookTime: 15,
    servings: 2,
    difficulty: 'Easy',
    tags: ['breakfast', 'vegan', 'high-protein', 'savory']
  },
  
  'Lentil Curry': {
    id: 'lentil-curry',
    title: 'Lentil Curry',
    ingredients: [
      { name: 'Lentils', quantity: 1, unit: 'cup', category: 'Pantry' },
      { name: 'Onion', quantity: 1, unit: 'medium', category: 'Produce' },
      { name: 'Garlic', quantity: 3, unit: 'cloves', category: 'Produce' },
      { name: 'Ginger', quantity: 1, unit: 'tbsp', category: 'Produce' },
      { name: 'Coconut Milk', quantity: 1, unit: 'can', category: 'Pantry' },
      { name: 'Curry Powder', quantity: 2, unit: 'tbsp', category: 'Pantry' },
      { name: 'Olive Oil', quantity: 2, unit: 'tbsp', category: 'Pantry' },
      { name: 'Brown Rice', quantity: 1, unit: 'cup', category: 'Pantry' }
    ],
    prepTime: 15,
    cookTime: 30,
    servings: 4,
    difficulty: 'Medium',
    tags: ['dinner', 'vegan', 'gluten-free', 'curry', 'high-protein']
  },

  'Chia Pudding with Mango': {
    id: 'chia-pudding-mango',
    title: 'Chia Pudding with Mango',
    ingredients: [
      { name: 'Chia Seeds', quantity: 0.25, unit: 'cup', category: 'Pantry' },
      { name: 'Almond Milk', quantity: 1, unit: 'cup', category: 'Dairy' },
      { name: 'Mango', quantity: 1, unit: 'medium', category: 'Produce' },
      { name: 'Maple Syrup', quantity: 1, unit: 'tbsp', category: 'Pantry' },
      { name: 'Vanilla Extract', quantity: 0.5, unit: 'tsp', category: 'Pantry' },
      { name: 'Coconut Flakes', quantity: 2, unit: 'tbsp', category: 'Pantry' }
    ],
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    difficulty: 'Easy',
    tags: ['breakfast', 'snack', 'vegan', 'gluten-free', 'no-cook', 'high-omega3']
  },

  'Spinach & Mushroom Risotto': {
    id: 'spinach-mushroom-risotto',
    title: 'Spinach & Mushroom Risotto',
    ingredients: [
      { name: 'Arborio Rice', quantity: 1, unit: 'cup', category: 'Pantry' },
      { name: 'Spinach', quantity: 3, unit: 'cups', category: 'Produce' },
      { name: 'Mushrooms', quantity: 2, unit: 'cups', category: 'Produce' },
      { name: 'Vegetable Broth', quantity: 4, unit: 'cups', category: 'Pantry' },
      { name: 'Onion', quantity: 1, unit: 'medium', category: 'Produce' },
      { name: 'Garlic', quantity: 3, unit: 'cloves', category: 'Produce' },
      { name: 'Nutritional Yeast', quantity: 0.25, unit: 'cup', category: 'Pantry' },
      { name: 'Olive Oil', quantity: 2, unit: 'tbsp', category: 'Pantry' },
      { name: 'White Wine', quantity: 0.5, unit: 'cup', category: 'Pantry' }
    ],
    prepTime: 15,
    cookTime: 25,
    servings: 3,
    difficulty: 'Medium',
    tags: ['dinner', 'vegan', 'gluten-free', 'risotto', 'high-iron']
  },

  'Hummus with Crudités': {
    id: 'hummus-crudites',
    title: 'Hummus with Crudités',
    ingredients: [
      { name: 'Chickpeas', quantity: 1, unit: 'can', category: 'Pantry' },
      { name: 'Tahini', quantity: 2, unit: 'tbsp', category: 'Pantry' },
      { name: 'Lemon', quantity: 1, unit: 'medium', category: 'Produce' },
      { name: 'Garlic', quantity: 2, unit: 'cloves', category: 'Produce' },
      { name: 'Olive Oil', quantity: 2, unit: 'tbsp', category: 'Pantry' },
      { name: 'Carrots', quantity: 2, unit: 'medium', category: 'Produce' },
      { name: 'Cucumber', quantity: 1, unit: 'medium', category: 'Produce' },
      { name: 'Bell Pepper', quantity: 1, unit: 'medium', category: 'Produce' }
    ],
    prepTime: 10,
    cookTime: 0,
    servings: 2,
    difficulty: 'Easy',
    tags: ['snack', 'lunch', 'vegan', 'gluten-free', 'no-cook', 'high-protein']
  },

  'Walnut & Date Energy Balls': {
    id: 'walnut-date-energy-balls',
    title: 'Walnut & Date Energy Balls',
    ingredients: [
      { name: 'Dates', quantity: 1, unit: 'cup', category: 'Pantry' },
      { name: 'Walnuts', quantity: 0.5, unit: 'cup', category: 'Pantry' },
      { name: 'Chia Seeds', quantity: 2, unit: 'tbsp', category: 'Pantry' },
      { name: 'Coconut Flakes', quantity: 0.25, unit: 'cup', category: 'Pantry' },
      { name: 'Cinnamon', quantity: 1, unit: 'tsp', category: 'Pantry' },
      { name: 'Vanilla Extract', quantity: 0.5, unit: 'tsp', category: 'Pantry' }
    ],
    prepTime: 15,
    cookTime: 0,
    servings: 8,
    difficulty: 'Easy',
    tags: ['snack', 'vegan', 'gluten-free', 'no-cook', 'high-omega3', 'energy']
  },

  'Kale & White Bean Soup': {
    id: 'kale-white-bean-soup',
    title: 'Kale & White Bean Soup',
    ingredients: [
      { name: 'White Beans', quantity: 2, unit: 'cans', category: 'Pantry' },
      { name: 'Kale', quantity: 3, unit: 'cups', category: 'Produce' },
      { name: 'Carrots', quantity: 3, unit: 'medium', category: 'Produce' },
      { name: 'Onion', quantity: 1, unit: 'medium', category: 'Produce' },
      { name: 'Garlic', quantity: 4, unit: 'cloves', category: 'Produce' },
      { name: 'Vegetable Broth', quantity: 6, unit: 'cups', category: 'Pantry' },
      { name: 'Olive Oil', quantity: 2, unit: 'tbsp', category: 'Pantry' },
      { name: 'Thyme', quantity: 1, unit: 'tsp', category: 'Pantry' },
      { name: 'Bay Leaves', quantity: 2, unit: 'leaves', category: 'Pantry' }
    ],
    prepTime: 20,
    cookTime: 40,
    servings: 6,
    difficulty: 'Medium',
    tags: ['dinner', 'vegan', 'gluten-free', 'soup', 'high-iron', 'high-calcium']
  },

  'Almond Butter & Banana Toast': {
    id: 'almond-butter-banana-toast',
    title: 'Almond Butter & Banana Toast',
    ingredients: [
      { name: 'Whole Grain Bread', quantity: 2, unit: 'slices', category: 'Bakery' },
      { name: 'Almond Butter', quantity: 2, unit: 'tbsp', category: 'Pantry' },
      { name: 'Banana', quantity: 1, unit: 'medium', category: 'Produce' },
      { name: 'Chia Seeds', quantity: 1, unit: 'tbsp', category: 'Pantry' },
      { name: 'Cinnamon', quantity: 0.5, unit: 'tsp', category: 'Pantry' },
      { name: 'Honey', quantity: 1, unit: 'tsp', category: 'Pantry' }
    ],
    prepTime: 5,
    cookTime: 3,
    servings: 1,
    difficulty: 'Easy',
    tags: ['breakfast', 'vegan', 'quick', 'toast', 'high-calcium']
  }
};

export const getRecipeIngredients = (recipeTitle: string): RecipeIngredient[] => {
  // Try exact match first
  const recipe = recipeDatabase[recipeTitle];
  if (recipe) {
    return recipe.ingredients;
  }
  
  // Try partial matches for common variations
  const lowerTitle = recipeTitle.toLowerCase();
  
  // Create a mapping of common variations and their corresponding recipe titles
  const recipeVariations: Record<string, string> = {
    // Tofu variations
    'tofu scramble': 'Tofu Scramble with Spinach',
    'tofu scramble with spinach': 'Tofu Scramble with Spinach',
    'scrambled tofu': 'Tofu Scramble with Spinach',
    
    // Quinoa variations
    'quinoa buddha bowl': 'Quinoa Buddha Bowl',
    'buddha bowl': 'Quinoa Buddha Bowl',
    'quinoa bowl': 'Quinoa Buddha Bowl',
    
    // Lentil variations
    'lentil quinoa buddha bowl': 'Lentil & Quinoa Buddha Bowl',
    'lentil and quinoa buddha bowl': 'Lentil & Quinoa Buddha Bowl',
    'lentil buddha bowl': 'Lentil & Quinoa Buddha Bowl',
    
    // Oatmeal variations
    'oatmeal with berries & nuts': 'Oatmeal with Berries & Nuts',
    'oatmeal berries nuts': 'Oatmeal with Berries & Nuts',
    'berry oatmeal': 'Oatmeal with Berries & Nuts',
    
    // Smoothie variations
    'smoothie bowl': 'Smoothie Bowl',
    'acai bowl': 'Smoothie Bowl',
    
    // Avocado variations
    'avocado toast with microgreens': 'Avocado Toast with Microgreens',
    'avocado toast': 'Avocado Toast with Microgreens',
    'toast with avocado': 'Avocado Toast with Microgreens',
    
    // Hummus variations
    'hummus with carrot sticks': 'Hummus with Carrot Sticks',
    'hummus carrot': 'Hummus with Carrot Sticks',
    'carrot sticks with hummus': 'Hummus with Carrot Sticks',
    
    // Black bean variations
    'black bean sweet potato bowl': 'Black Bean & Sweet Potato Bowl',
    'black bean and sweet potato bowl': 'Black Bean & Sweet Potato Bowl',
    'sweet potato black bean bowl': 'Black Bean & Sweet Potato Bowl',
    
    // Quinoa enchilada variations
    'quinoa black bean enchiladas': 'Quinoa & Black Bean Enchiladas',
    'quinoa and black bean enchiladas': 'Quinoa & Black Bean Enchiladas',
    'black bean quinoa enchiladas': 'Quinoa & Black Bean Enchiladas',
    
    // Kale soup variations
    'kale white bean soup': 'Kale & White Bean Soup',
    'kale and white bean soup': 'Kale & White Bean Soup',
    'white bean kale soup': 'Kale & White Bean Soup',
    
    // Mixed nuts variations
    'mixed nuts seeds': 'Mixed Nuts & Seeds',
    'mixed nuts and seeds': 'Mixed Nuts & Seeds',
    'nuts and seeds': 'Mixed Nuts & Seeds',
    
    // Greek yogurt variations
    'greek yogurt berries': 'Greek Yogurt with Berries',
    'greek yogurt with berries': 'Greek Yogurt with Berries',
    'yogurt with berries': 'Greek Yogurt with Berries',
    
    // Lentil curry variations
    'lentil curry': 'Lentil Curry',
    'curry lentils': 'Lentil Curry',
    
    // Chia pudding variations
    'chia pudding mango': 'Chia Pudding with Mango',
    'chia pudding with mango': 'Chia Pudding with Mango',
    'mango chia pudding': 'Chia Pudding with Mango',
    
    // Risotto variations
    'spinach mushroom risotto': 'Spinach & Mushroom Risotto',
    'spinach and mushroom risotto': 'Spinach & Mushroom Risotto',
    'mushroom spinach risotto': 'Spinach & Mushroom Risotto',
    
    // Hummus crudités variations
    'hummus crudités': 'Hummus with Crudités',
    'hummus with crudités': 'Hummus with Crudités',
    'crudités with hummus': 'Hummus with Crudités',
    
    // Energy balls variations
    'walnut date energy balls': 'Walnut & Date Energy Balls',
    'walnut and date energy balls': 'Walnut & Date Energy Balls',
    'date energy balls': 'Walnut & Date Energy Balls',
    
    // Almond butter toast variations
    'almond butter banana toast': 'Almond Butter & Banana Toast',
    'almond butter and banana toast': 'Almond Butter & Banana Toast',
    'banana almond butter toast': 'Almond Butter & Banana Toast',
    
    // Chickpea salad variations
    'chickpea avocado salad': 'Chickpea & Avocado Salad',
    'chickpea and avocado salad': 'Chickpea & Avocado Salad',
    'avocado chickpea salad': 'Chickpea & Avocado Salad',
    
    // Tempeh stir fry variations
    'tempeh vegetable stir fry': 'Tempeh & Vegetable Stir Fry',
    'tempeh and vegetable stir fry': 'Tempeh & Vegetable Stir Fry',
    'vegetable tempeh stir fry': 'Tempeh & Vegetable Stir Fry',
  };
  
  // Check for exact variation match
  for (const [variation, recipeTitle] of Object.entries(recipeVariations)) {
    if (lowerTitle.includes(variation)) {
      const recipe = recipeDatabase[recipeTitle];
      if (recipe) {
        return recipe.ingredients;
      }
    }
  }
  
  // Check for partial matches with key ingredients
  const keyIngredients = [
    'tofu', 'quinoa', 'lentil', 'oatmeal', 'smoothie', 'avocado', 
    'hummus', 'black bean', 'kale', 'nuts', 'yogurt', 'curry', 
    'chia', 'risotto', 'energy', 'almond', 'chickpea', 'tempeh'
  ];
  
  for (const ingredient of keyIngredients) {
    if (lowerTitle.includes(ingredient)) {
      // Find recipes that contain this ingredient
      for (const [title, recipeData] of Object.entries(recipeDatabase)) {
        const recipeIngredients = recipeData.ingredients.map(ing => ing.name.toLowerCase());
        if (recipeIngredients.some(ing => ing.includes(ingredient))) {
          return recipeData.ingredients;
        }
      }
    }
  }
  
  // Return empty array if no match found
  console.warn(`No recipe found for: ${recipeTitle}`);
  return [];
};

export const getAllRecipes = (): Recipe[] => {
  return Object.values(recipeDatabase);
};

export const testRecipeMatching = () => {
  const testCases = [
    'Oatmeal with Berries & Nuts',
    'Tofu Scramble with Spinach',
    'Lentil & Quinoa Buddha Bowl',
    'Hummus with Carrot Sticks',
    'Quinoa Buddha Bowl',
    'Black Bean & Sweet Potato Bowl',
    'Smoothie Bowl',
    'Kale & White Bean Soup',
    'Random Recipe That Does Not Exist'
  ];

  console.log('=== RECIPE MATCHING TEST ===');
  testCases.forEach(recipeTitle => {
    const ingredients = getRecipeIngredients(recipeTitle);
    console.log(`${recipeTitle}: ${ingredients.length > 0 ? '✅ Found' : '❌ Not found'} (${ingredients.length} ingredients)`);
    if (ingredients.length > 0) {
      console.log(`  Ingredients: ${ingredients.map(ing => `${ing.name} (${ing.quantity} ${ing.unit})`).join(', ')}`);
    }
  });
  console.log('=== END TEST ===\n');
};
