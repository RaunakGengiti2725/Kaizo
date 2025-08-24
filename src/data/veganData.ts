// Ingredient detection rules
export const VEGAN_RULES = {
  notVegan: [
    'milk', 'butter', 'cheese', 'cream', 'whey', 'casein', 'lactose',
    'eggs', 'egg white', 'egg yolk', 'albumin',
    'meat', 'beef', 'pork', 'chicken', 'turkey', 'fish', 'salmon', 'tuna',
    'gelatin', 'collagen', 'carmine', 'cochineal', 'shellac',
    'honey', 'beeswax', 'royal jelly', 'propolis',
    'lard', 'tallow', 'rennet', 'isinglass'
  ],
  unclear: [
    'natural flavors', 'artificial flavors', 'vitamin d3', 'vitamin d',
    'mono and diglycerides', 'glycerin', 'glycerol', 'lecithin',
    'stearic acid', 'palmitic acid', 'oleic acid',
    'sugar', 'brown sugar', 'confectioners sugar'
  ]
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