// Comprehensive ingredient detection rules with detailed categorization
export const VEGAN_RULES = {
  notVegan: [
    // Dairy products
    'milk', 'butter', 'cheese', 'cream', 'whey', 'casein', 'lactose', 'buttermilk',
    'ghee', 'dairy', 'lactoglobulin', 'lactalbumin', 'milk powder', 'milk solids',
    'condensed milk', 'evaporated milk', 'sour cream', 'yogurt', 'kefir',
    // Eggs
    'eggs', 'egg white', 'egg yolk', 'albumin', 'egg powder', 'mayonnaise',
    'lecithin (egg)', 'lysozyme', 'ovalbumin', 'ovomucoid',
    // Meat and poultry
    'meat', 'beef', 'pork', 'chicken', 'turkey', 'duck', 'lamb', 'veal',
    'bacon', 'ham', 'sausage', 'pepperoni', 'salami', 'prosciutto',
    // Seafood
    'fish', 'salmon', 'tuna', 'cod', 'anchovy', 'sardine', 'crab', 'lobster',
    'shrimp', 'prawns', 'oyster', 'mussel', 'clam', 'scallop', 'caviar',
    'fish sauce', 'worcestershire sauce', 'caesar dressing',
    // Animal-derived additives
    'gelatin', 'collagen', 'carmine', 'cochineal', 'shellac', 'confectioner\'s glaze',
    'bone char', 'bone meal', 'blood', 'plasma', 'hemoglobin',
    // Bee products
    'honey', 'beeswax', 'royal jelly', 'propolis', 'bee pollen',
    // Fats and oils
    'lard', 'tallow', 'suet', 'chicken fat', 'duck fat', 'beef fat',
    // Enzymes and proteins
    'rennet', 'isinglass', 'pepsin', 'trypsin', 'lipase', 'chymotrypsin'
  ],
  unclear: [
    // Flavors (source unclear)
    'natural flavors', 'artificial flavors', 'natural flavor', 'flavoring',
    'vanilla extract', 'natural vanilla flavor',
    // Vitamins (may be animal-derived)
    'vitamin d3', 'vitamin d', 'vitamin b12', 'vitamin a', 'retinol',
    'cholecalciferol', 'ergocalciferol',
    // Fats and emulsifiers
    'mono and diglycerides', 'glycerin', 'glycerol', 'lecithin', 'polysorbate',
    'stearic acid', 'palmitic acid', 'oleic acid', 'fatty acids',
    'magnesium stearate', 'calcium stearate',
    // Sugars (may use bone char)
    'sugar', 'brown sugar', 'confectioners sugar', 'powdered sugar',
    'cane sugar', 'refined sugar',
    // Processing aids
    'cysteine', 'l-cysteine', 'enzymes', 'processing aids',
    // Alcohol (may use animal products in processing)
    'wine', 'beer', 'alcohol', 'ethanol'
  ],
  vegan: [
    // Plant proteins
    'soy protein', 'pea protein', 'rice protein', 'hemp protein', 'quinoa',
    'lentils', 'chickpeas', 'black beans', 'kidney beans', 'tofu', 'tempeh',
    'seitan', 'nutritional yeast',
    // Plant milks
    'soy milk', 'almond milk', 'oat milk', 'rice milk', 'coconut milk',
    'cashew milk', 'hemp milk', 'pea milk',
    // Vegetables and fruits
    'tomato', 'onion', 'garlic', 'carrot', 'spinach', 'kale', 'broccoli',
    'apple', 'banana', 'orange', 'lemon', 'lime', 'berries',
    // Grains and cereals
    'wheat', 'rice', 'oats', 'barley', 'corn', 'millet', 'buckwheat',
    'amaranth', 'teff', 'spelled',
    // Nuts and seeds
    'almonds', 'walnuts', 'cashews', 'pistachios', 'sunflower seeds',
    'pumpkin seeds', 'chia seeds', 'flax seeds', 'sesame seeds',
    // Oils
    'olive oil', 'coconut oil', 'sunflower oil', 'canola oil', 'avocado oil',
    'sesame oil', 'grapeseed oil',
    // Spices and herbs
    'salt', 'pepper', 'turmeric', 'cumin', 'paprika', 'oregano', 'basil',
    'thyme', 'rosemary', 'sage', 'cinnamon', 'ginger'
  ]
};

// Confidence scoring system
export const CONFIDENCE_WEIGHTS = {
  definitive_non_vegan: 1.0,
  likely_non_vegan: 0.8,
  unclear: 0.5,
  likely_vegan: 0.2,
  definitely_vegan: 0.0
};

// Common product types and their typical non-vegan ingredients
export const PRODUCT_CATEGORIES = {
  dairy: ['milk', 'cheese', 'yogurt', 'butter', 'cream'],
  baked_goods: ['eggs', 'butter', 'milk', 'honey', 'lard'],
  confectionery: ['gelatin', 'carmine', 'shellac', 'milk', 'honey'],
  processed_foods: ['whey', 'casein', 'gelatin', 'natural flavors'],
  beverages: ['milk', 'honey', 'carmine', 'isinglass']
};

// Sample vegan recipes
export const VEGAN_RECIPES = [
  {
    id: '1',
    title: 'Creamy Avocado Pasta',
    time: 15,
    ingredients: ['avocado', 'pasta', 'lemon', 'garlic', 'nutritional yeast', 'olive oil'],
    description: 'Quick and creamy pasta without dairy',
    image: '/api/placeholder/300/200'
  },
  {
    id: '2',
    title: 'Chickpea Buddha Bowl',
    time: 25,
    ingredients: ['chickpeas', 'quinoa', 'spinach', 'tomatoes', 'cucumber', 'tahini'],
    description: 'Nutritious and filling bowl',
    image: '/api/placeholder/300/200'
  },
  {
    id: '3',
    title: 'Lentil Curry',
    time: 30,
    ingredients: ['red lentils', 'coconut milk', 'onion', 'garlic', 'ginger', 'curry powder'],
    description: 'Warming and protein-rich curry',
    image: '/api/placeholder/300/200'
  },
  {
    id: '4',
    title: 'Mushroom Stir Fry',
    time: 15,
    ingredients: ['mushrooms', 'bell peppers', 'soy sauce', 'garlic', 'ginger', 'sesame oil'],
    description: 'Quick and savory stir fry',
    image: '/api/placeholder/300/200'
  },
  {
    id: '5',
    title: 'Sweet Potato Soup',
    time: 35,
    ingredients: ['sweet potato', 'coconut milk', 'onion', 'ginger', 'vegetable broth'],
    description: 'Creamy and comforting soup',
    image: '/api/placeholder/300/200'
  }
];

// Vegan restaurants data
export const VEGAN_RESTAURANTS = [
  {
    id: '1',
    name: 'Green Garden Café',
    type: 'vegan',
    rating: 4.8,
    cuisine: 'Plant-based, Organic',
    address: '123 Eco Street',
    lat: 40.7589,
    lng: -73.9851
  },
  {
    id: '2',
    name: 'Plant Power Kitchen',
    type: 'vegan',
    rating: 4.6,
    cuisine: 'Modern Vegan',
    address: '456 Green Ave',
    lat: 40.7614,
    lng: -73.9776
  },
  {
    id: '3',
    name: 'Harvest Moon Bistro',
    type: 'mixed',
    rating: 4.4,
    cuisine: 'Contemporary',
    address: '789 Main Street',
    lat: 40.7505,
    lng: -73.9934,
    veganOptions: ['Quinoa Buddha Bowl', 'Mushroom Risotto (vegan)', 'Plant-based Burger']
  }
];

export type VeganResult = 'vegan' | 'not-vegan' | 'unclear';
export type Recipe = typeof VEGAN_RECIPES[0];
export type Restaurant = typeof VEGAN_RESTAURANTS[0];