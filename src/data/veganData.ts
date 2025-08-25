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

// Real Vegan Restaurants Data - Curated from major cities
export const REAL_VEGAN_RESTAURANTS = [
  // New York City
  {
    id: '1',
    name: 'By Chloe',
    type: 'vegan' as const,
    rating: 4.5,
    cuisine: 'Fast Casual Vegan',
    address: '185 Bleecker St, New York, NY 10012',
    lat: 40.7282,
    lng: -74.0021,
    phoneNumber: '+1 212-290-8000',
    website: 'https://www.bychloe.com',
    priceLevel: 2,
    photos: ['https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop'],
    veganOptions: ['Guac Burger', 'Mac and Cheese', 'Quinoa Taco Salad', 'Chocolate Chip Cookies']
  },
  {
    id: '2',
    name: 'Candle Cafe',
    type: 'vegan' as const,
    rating: 4.6,
    cuisine: 'Organic American',
    address: '1307 3rd Ave, New York, NY 10021',
    lat: 40.7736,
    lng: -73.9566,
    phoneNumber: '+1 212-472-0970',
    website: 'https://www.candlecafe.com',
    priceLevel: 3
  },
  {
    id: '3',
    name: 'Peacefood Cafe',
    type: 'vegan' as const,
    rating: 4.4,
    cuisine: 'Asian Fusion Vegan',
    address: '460 Amsterdam Ave, New York, NY 10024',
    lat: 40.7870,
    lng: -73.9754,
    phoneNumber: '+1 212-362-2266',
    priceLevel: 2
  },
  
  // Los Angeles
  {
    id: '4',
    name: 'Gracias Madre',
    type: 'vegan' as const,
    rating: 4.7,
    cuisine: 'Plant-Based Mexican',
    address: '8905 Melrose Ave, West Hollywood, CA 90069',
    lat: 34.0837,
    lng: -118.3891,
    phoneNumber: '+1 323-978-2170',
    website: 'https://www.graciasmadre.com',
    priceLevel: 3
  },
  {
    id: '5',
    name: 'Crossroads Kitchen',
    type: 'vegan' as const,
    rating: 4.5,
    cuisine: 'Mediterranean Vegan',
    address: '8284 Melrose Ave, Los Angeles, CA 90046',
    lat: 34.0837,
    lng: -118.3707,
    phoneNumber: '+1 323-782-9245',
    website: 'https://www.crossroadskitchen.com',
    priceLevel: 4
  },
  {
    id: '6',
    name: 'Sage Vegan Bistro',
    type: 'vegan' as const,
    rating: 4.3,
    cuisine: 'Contemporary Vegan',
    address: '1700 Sunset Blvd, Los Angeles, CA 90026',
    lat: 34.0776,
    lng: -118.2596,
    phoneNumber: '+1 213-989-1718',
    priceLevel: 3
  },

  // San Francisco
  {
    id: '7',
    name: 'Greens Restaurant',
    type: 'vegetarian' as const,
    rating: 4.4,
    cuisine: 'Fine Dining Vegetarian',
    address: 'Building A, Fort Mason, 2 Marina Blvd, San Francisco, CA 94123',
    lat: 37.8058,
    lng: -122.4331,
    phoneNumber: '+1 415-771-6222',
    website: 'https://www.greensrestaurant.com',
    priceLevel: 4,
    veganOptions: ['Seasonal vegetable plates', 'Vegan tasting menu available']
  },
  {
    id: '8',
    name: 'The Plant Café Organic',
    type: 'mixed' as const,
    rating: 4.2,
    cuisine: 'Healthy California',
    address: '101 California St, San Francisco, CA 94111',
    lat: 37.7929,
    lng: -122.3970,
    phoneNumber: '+1 415-984-1973',
    priceLevel: 2,
    veganOptions: ['Vegan Buddha Bowl', 'Plant-based burgers', 'Coconut curry bowl']
  },

  // Chicago
  {
    id: '9',
    name: 'Chicago Pizza & Oven Grinder Co.',
    type: 'mixed' as const,
    rating: 4.1,
    cuisine: 'Pizza & Italian',
    address: '2121 N Clark St, Chicago, IL 60614',
    lat: 41.9205,
    lng: -87.6368,
    phoneNumber: '+1 773-248-2570',
    priceLevel: 2,
    veganOptions: ['Vegan cheese pizza', 'Mediterranean salad (vegan)']
  },
  {
    id: '10',
    name: 'Green Zebra',
    type: 'vegetarian' as const,
    rating: 4.3,
    cuisine: 'Vegetarian Fine Dining',
    address: '1460 W Chicago Ave, Chicago, IL 60642',
    lat: 41.8958,
    lng: -87.6656,
    phoneNumber: '+1 312-243-7100',
    website: 'https://www.greenzebrachicago.com',
    priceLevel: 3
  },

  // Austin
  {
    id: '11',
    name: 'Arlo\'s',
    type: 'vegan' as const,
    rating: 4.6,
    cuisine: 'Vegan Comfort Food',
    address: '900 Red River St, Austin, TX 78701',
    lat: 30.2640,
    lng: -97.7340,
    phoneNumber: '+1 512-386-2554',
    website: 'https://www.arlostruck.com',
    priceLevel: 2
  },
  {
    id: '12',
    name: 'Counter Culture',
    type: 'vegan' as const,
    rating: 4.5,
    cuisine: 'Plant-Based American',
    address: '2337 E Cesar Chavez St, Austin, TX 78702',
    lat: 30.2592,
    lng: -97.7230,
    phoneNumber: '+1 512-524-1950',
    priceLevel: 2
  },

  // Portland
  {
    id: '13',
    name: 'Portobello Vegan Trattoria',
    type: 'vegan' as const,
    rating: 4.7,
    cuisine: 'Italian Vegan',
    address: '1125 SE Division St, Portland, OR 97202',
    lat: 45.5048,
    lng: -122.6540,
    phoneNumber: '+1 503-231-7463',
    website: 'https://www.portobellopdx.com',
    priceLevel: 3
  },
  {
    id: '14',
    name: 'Virtuous Pie',
    type: 'vegan' as const,
    rating: 4.4,
    cuisine: 'Vegan Pizza',
    address: '1126 SE Division St, Portland, OR 97202',
    lat: 45.5048,
    lng: -122.6541,
    phoneNumber: '+1 971-770-8045',
    website: 'https://www.virtuouspie.com',
    priceLevel: 2
  },

  // Seattle
  {
    id: '15',
    name: 'Plum Bistro',
    type: 'vegan' as const,
    rating: 4.5,
    cuisine: 'Contemporary Vegan',
    address: '1429 12th Ave, Seattle, WA 98122',
    lat: 47.6148,
    lng: -122.3160,
    phoneNumber: '+1 206-838-5333',
    website: 'https://www.plumbistro.com',
    priceLevel: 3
  },

  // Miami
  {
    id: '16',
    name: 'Plant Miami',
    type: 'vegan' as const,
    rating: 4.3,
    cuisine: 'Plant-Based Fine Dining',
    address: '105 NE 24th St, Miami, FL 33137',
    lat: 25.8041,
    lng: -80.1918,
    phoneNumber: '+1 786-706-6670',
    website: 'https://www.plantmiami.com',
    priceLevel: 4
  },

  // Boston
  {
    id: '17',
    name: 'Life Alive Organic Cafe',
    type: 'vegetarian' as const,
    rating: 4.4,
    cuisine: 'Organic Bowls & Smoothies',
    address: '765 Massachusetts Ave, Cambridge, MA 02139',
    lat: 42.3656,
    lng: -71.1028,
    phoneNumber: '+1 617-354-5433',
    website: 'https://www.lifealive.com',
    priceLevel: 2,
    veganOptions: ['Goddess bowl (vegan)', 'Green smoothies', 'Vegan wraps']
  },

  // Mixed Restaurants with Great Vegan Options (Various Cities)
  {
    id: '18',
    name: 'Chipotle Mexican Grill',
    type: 'mixed' as const,
    rating: 4.0,
    cuisine: 'Fast Casual Mexican',
    address: '2 Broadway, New York, NY 10004',
    lat: 40.7047,
    lng: -74.0138,
    phoneNumber: '+1 212-344-0941',
    website: 'https://www.chipotle.com',
    priceLevel: 2,
    veganOptions: [
      'Sofritas (tofu-based protein)',
      'Black bean bowls',
      'Guacamole and veggie bowls',
      'Brown rice and cilantro-lime rice'
    ],
    veganMenu: [
      {
        name: 'Sofritas Bowl',
        description: 'Organic braised tofu with peppers and onions in a spicy tomato and chili sauce, served with rice, beans, and fresh toppings',
        price: '$8.95',
        category: 'main',
        isGlutenFree: true,
        isSoyFree: false,
        spiceLevel: 'medium'
      },
      {
        name: 'Black Bean Bowl',
        description: 'Seasoned black beans with cilantro-lime rice, fajita veggies, salsa, and guacamole',
        price: '$7.95',
        category: 'main',
        isGlutenFree: true,
        isNutFree: true,
        isSoyFree: true
      },
      {
        name: 'Veggie Burrito',
        description: 'Fajita veggies, black beans, rice, salsa, and guacamole wrapped in a warm flour tortilla',
        price: '$7.95',
        category: 'main',
        allergens: ['gluten']
      },
      {
        name: 'Guacamole & Chips',
        description: 'Fresh avocados mashed with lime, cilantro, red onion, and jalapeño, served with crispy tortilla chips',
        price: '$4.25',
        category: 'appetizer',
        isGlutenFree: true,
        isNutFree: true,
        isSoyFree: true
      }
    ],
    specialties: ['Build-your-own bowls', 'Fresh daily ingredients', 'Responsibly sourced']
  },
  {
    id: '19',
    name: 'Sweetgreen',
    type: 'mixed' as const,
    rating: 4.2,
    cuisine: 'Healthy Salads & Bowls',
    address: '1164 Broadway, New York, NY 10001',
    lat: 40.7451,
    lng: -73.9890,
    phoneNumber: '+1 646-449-8825',
    website: 'https://www.sweetgreen.com',
    priceLevel: 2,
    veganOptions: [
      'Harvest bowl (vegan)',
      'Kale Caesar with no cheese',
      'Custom vegan salads',
      'Seasonal plant-based proteins'
    ],
    veganMenu: [
      {
        name: 'Harvest Bowl',
        description: 'Organic wild rice, roasted chicken (sub tofu), apples, sweet potato, goat cheese (omit), almonds, warm wild rice, balsamic vinaigrette',
        price: '$12.95',
        category: 'main',
        isGlutenFree: true,
        allergens: ['tree nuts'],
        isSoyFree: false
      },
      {
        name: 'Kale Caesar (Vegan)',
        description: 'Chopped kale, shredded kale, lime squeeze, breadcrumbs (omit parmesan), vegan caesar dressing',
        price: '$11.95',
        category: 'salad',
        isGlutenFree: false,
        allergens: ['gluten']
      },
      {
        name: 'Market Bowl',
        description: 'Mixed greens, quinoa, cucumber, tomatoes, carrots, avocado, hemp seeds, green goddess dressing',
        price: '$10.95',
        category: 'salad',
        isGlutenFree: true,
        isNutFree: true,
        isSoyFree: true
      },
      {
        name: 'Green Goddess Bowl',
        description: 'Baby spinach, mesclun, quinoa, chickpeas, broccoli, celery, cucumber, avocado, green goddess dressing',
        price: '$11.45',
        category: 'main',
        isGlutenFree: true,
        isNutFree: true,
        isSoyFree: true
      },
      {
        name: 'Cold-Pressed Juice',
        description: 'Daily selection of fresh vegetable and fruit juices',
        price: '$7.95',
        category: 'beverage',
        isGlutenFree: true,
        isNutFree: true,
        isSoyFree: true
      }
    ],
    specialties: ['Seasonal local ingredients', 'Customizable bowls', 'Cold-pressed juices', 'Sustainable sourcing']
  },
  {
    id: '20',
    name: 'Panera Bread',
    type: 'mixed' as const,
    rating: 4.1,
    cuisine: 'Bakery Cafe',
    address: '1501 Broadway, New York, NY 10036',
    lat: 40.7580,
    lng: -73.9855,
    phoneNumber: '+1 212-840-1344',
    website: 'https://www.panerabread.com',
    priceLevel: 2,
    veganOptions: [
      'Soba noodle bowl with edamame',
      'Mediterranean veggie sandwich (no feta)',
      'Steel cut oatmeal',
      'Multiple vegan soups'
    ],
    veganMenu: [
      {
        name: 'Soba Noodle Bowl with Edamame',
        description: 'Buckwheat soba noodles with edamame, fresh vegetables, and sesame ginger dressing',
        price: '$9.99',
        category: 'main',
        isGlutenFree: false,
        isNutFree: false,
        isSoyFree: false,
        allergens: ['gluten', 'sesame', 'soy']
      },
      {
        name: 'Mediterranean Veggie Sandwich',
        description: 'Zucchini, yellow squash, eggplant, red peppers, onions, hummus on tomato basil bread (ask for no feta)',
        price: '$8.99',
        category: 'main',
        allergens: ['gluten']
      },
      {
        name: 'Steel Cut Oatmeal',
        description: 'Hearty steel-cut oats with your choice of toppings: fresh berries, nuts, or dried fruit',
        price: '$4.99',
        category: 'breakfast',
        isGlutenFree: true,
        isSoyFree: true
      },
      {
        name: 'Ten Vegetable Soup',
        description: 'A hearty blend of tomatoes, red peppers, onions, corn, carrots, celery, spinach, and beans in vegetable broth',
        price: '$5.99',
        category: 'soup',
        isGlutenFree: true,
        isNutFree: true,
        isSoyFree: true
      },
      {
        name: 'Apple Cinnamon Oatmeal',
        description: 'Steel-cut oats with cinnamon, brown sugar, and fresh apple pieces',
        price: '$5.49',
        category: 'breakfast',
        isGlutenFree: true,
        isNutFree: true,
        isSoyFree: true
      }
    ],
    specialties: ['Fresh baked breads', 'Seasonal soups', 'Healthy options', 'Customizable meals']
  },
  {
    id: '21',
    name: 'P.F. Chang\'s',
    type: 'mixed' as const,
    rating: 4.3,
    cuisine: 'Asian Fusion',
    address: '8500 Beverly Blvd, Los Angeles, CA 90048',
    lat: 34.0758,
    lng: -118.3776,
    phoneNumber: '+1 323-782-8845',
    website: 'https://www.pfchangs.com',
    priceLevel: 3,
    veganOptions: [
      'Ma Po Tofu (vegan version)',
      'Buddha\'s Feast (steamed)',
      'Coconut curry vegetables',
      'Hand-folded veggie dumplings'
    ],
    veganMenu: [
      {
        name: 'Ma Po Tofu (Vegan)',
        description: 'Silky tofu in a spicy Sichuan sauce with scallions and garlic, served over steamed rice',
        price: '$14.95',
        category: 'main',
        isGlutenFree: false,
        isSoyFree: false,
        spiceLevel: 'hot',
        allergens: ['soy', 'gluten']
      },
      {
        name: 'Buddha\'s Feast (Steamed)',
        description: 'Fresh seasonal vegetables, tofu, and mushrooms steamed with ginger soy sauce',
        price: '$13.95',
        category: 'main',
        isGlutenFree: false,
        isSoyFree: false,
        allergens: ['soy', 'gluten']
      },
      {
        name: 'Coconut Curry Vegetables',
        description: 'Mixed vegetables in aromatic coconut curry sauce with jasmine rice',
        price: '$12.95',
        category: 'main',
        isGlutenFree: true,
        isSoyFree: true,
        spiceLevel: 'medium'
      },
      {
        name: 'Vegetable Dumplings (Steamed)',
        description: 'Hand-folded dumplings filled with fresh vegetables and served with soy ginger sauce',
        price: '$8.95',
        category: 'appetizer',
        isGlutenFree: false,
        isSoyFree: false,
        allergens: ['gluten', 'soy']
      },
      {
        name: 'Asian Cucumber Salad',
        description: 'Crisp cucumbers with rice vinegar dressing, sesame seeds, and chili oil',
        price: '$6.95',
        category: 'salad',
        isGlutenFree: true,
        isSoyFree: true,
        spiceLevel: 'mild',
        allergens: ['sesame']
      }
    ],
    specialties: ['Asian fusion cuisine', 'Wok-fired dishes', 'Fresh ingredients', 'Customizable spice levels']
  },
  {
    id: '22',
    name: 'True Food Kitchen',
    type: 'mixed' as const,
    rating: 4.4,
    cuisine: 'Healthy American',
    address: '395 Santa Monica Pl, Santa Monica, CA 90401',
    lat: 34.0167,
    lng: -118.4906,
    phoneNumber: '+1 310-593-8300',
    website: 'https://www.truefoodkitchen.com',
    priceLevel: 3,
    veganOptions: [
      'Ancient grains bowl',
      'Spaghetti squash casserole',
      'Seasonal vegetable plates',
      'House-made veggie burgers'
    ]
  },
  {
    id: '23',
    name: 'Mendocino Farms',
    type: 'mixed' as const,
    rating: 4.2,
    cuisine: 'Gourmet Sandwiches',
    address: '444 Flower St, Los Angeles, CA 90071',
    lat: 34.0522,
    lng: -118.2570,
    phoneNumber: '+1 213-627-3262',
    website: 'https://www.mendocinofarms.com',
    priceLevel: 2,
    veganOptions: [
      'Impossible burger',
      'Avocado and cucumber sandwich',
      'Seasonal market salads',
      'Vegan soups and sides'
    ]
  },
  {
    id: '24',
    name: 'Flower Child',
    type: 'mixed' as const,
    rating: 4.3,
    cuisine: 'Healthy Bowls',
    address: '1440 S Sepulveda Blvd, Los Angeles, CA 90025',
    lat: 34.0351,
    lng: -118.4456,
    phoneNumber: '+1 310-477-4457',
    website: 'https://www.flowerchild.com',
    priceLevel: 2,
    veganOptions: [
      'Mother Earth bowl',
      'Rebel bowl (without feta)',
      'Build-your-own vegan bowls',
      'Fresh pressed juices'
    ]
  }
];

// Legacy export for backward compatibility
export const VEGAN_RESTAURANTS = REAL_VEGAN_RESTAURANTS;

export type VeganResult = 'vegan' | 'not-vegan' | 'unclear';
export type Recipe = typeof VEGAN_RECIPES[0];
export type Restaurant = typeof VEGAN_RESTAURANTS[0];