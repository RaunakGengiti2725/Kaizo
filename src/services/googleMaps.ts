import { Loader } from '@googlemaps/js-api-loader';
import { REAL_VEGAN_RESTAURANTS } from '@/data/veganData';
import { searchCache } from './searchCache';

export interface MenuItem {
  name: string;
  description: string;
  price?: string;
  category: 'appetizer' | 'salad' | 'soup' | 'main' | 'side' | 'dessert' | 'beverage' | 'breakfast' | 'lunch' | 'dinner';
  allergens?: string[];
  isGlutenFree?: boolean;
  isNutFree?: boolean;
  isSoyFree?: boolean;
  spiceLevel?: 'mild' | 'medium' | 'hot';
}

export interface VeganRestaurant {
  id: string;
  name: string;
  rating: number;
  cuisine: string;
  address: string;
  lat: number;
  lng: number;
  type: 'vegan' | 'vegetarian' | 'mixed';
  priceLevel: number;
  openNow?: boolean;
  photos?: string[];
  phoneNumber?: string;
  website?: string;
  reviews?: GoogleReview[];
  veganOptions?: string[];
  veganMenu?: MenuItem[];
  specialties?: string[];
  placeId?: string;
}

export interface GoogleReview {
  author: string;
  rating: number;
  text: string;
  time: number;
}

export interface SearchFilters {
  veganOnly: boolean;
  priceRange?: [number, number];
  openNow?: boolean;
  radius?: number;
  rating?: number;
}

class GoogleMapsService {
  private loader: Loader;
  private map: google.maps.Map | null = null;
  private placesService: google.maps.places.PlacesService | null = null;
  private geocoder: google.maps.Geocoder | null = null;
  private markers: google.maps.Marker[] = [];
  private markerMap: Map<string, google.maps.Marker> = new Map();
  private infoWindow: google.maps.InfoWindow | null = null;

  constructor() {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
      throw new Error('Google Maps API key not configured. Please add VITE_GOOGLE_MAPS_API_KEY to your .env file.');
    }

    this.loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places', 'geometry']
    });
  }

  async initialize(): Promise<void> {
    await this.loader.load();
    this.geocoder = new google.maps.Geocoder();
    this.infoWindow = new google.maps.InfoWindow();
  }

  async initializeMap(element: HTMLElement, center: { lat: number; lng: number }): Promise<google.maps.Map> {
    await this.initialize();

    this.map = new google.maps.Map(element, {
      zoom: 13,
      center,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
      gestureHandling: 'greedy',
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    this.placesService = new google.maps.places.PlacesService(this.map);
    return this.map;
  }

  async searchVeganRestaurants(
    location: { lat: number; lng: number },
    filters: SearchFilters = { veganOnly: false }
  ): Promise<VeganRestaurant[]> {
    if (!this.placesService) {
      console.warn('Places service not initialized. Make sure initializeMap() was called first.');
      throw new Error('Places service not initialized');
    }

    if (!this.map) {
      console.warn('Google Map not initialized. Make sure initializeMap() was called first.');
      throw new Error('Google Map not initialized');
    }

    // Check cache first
    const cacheKey = searchCache.generateSearchKey(location, filters);
    const cachedResults = searchCache.get<VeganRestaurant[]>(cacheKey);
    if (cachedResults) {
      console.log('🚀 Using cached search results');
      return cachedResults;
    }

    // Optimized search queries - fewer, more targeted searches
    const searchQueries = filters.veganOnly 
      ? ['vegan restaurant', 'plant based restaurant']
      : [
          // Most effective queries for mixed results
          'restaurant vegan options', 'vegetarian restaurant', 'healthy restaurant',
          'vegan restaurant', 'plant based restaurant'
        ];

    const allResults: VeganRestaurant[] = [];
    const seenPlaceIds = new Set<string>();

    // Parallel processing for faster results
    const searchPromises = searchQueries.map(async (query) => {
      try {
        return await this.performTextSearch(query, location, filters);
      } catch (error) {
        console.warn(`Search failed for query "${query}":`, error);
        return [];
      }
    });

    // Wait for all searches to complete in parallel
    const allSearchResults = await Promise.all(searchPromises);
    
    // Flatten and deduplicate results
    allSearchResults.forEach(results => {
      results.forEach(restaurant => {
        if (!seenPlaceIds.has(restaurant.placeId || restaurant.id)) {
          seenPlaceIds.add(restaurant.placeId || restaurant.id);
          allResults.push(restaurant);
        }
      });
    });

    // Sort by rating and relevance, limit results
    const finalResults = allResults
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 30); // Reduced from 50 to 30 for faster rendering

    // Cache results for 5 minutes
    searchCache.set(cacheKey, finalResults, 5 * 60 * 1000);

    return finalResults;
  }

  private performTextSearch(
    query: string,
    location: { lat: number; lng: number },
    filters: SearchFilters
  ): Promise<VeganRestaurant[]> {
    return new Promise((resolve, reject) => {
      if (!this.placesService) {
        reject(new Error('Places service not initialized'));
        return;
      }

      const request: google.maps.places.TextSearchRequest = {
        query,
        location: new google.maps.LatLng(location.lat, location.lng),
        radius: filters.radius || 10000, // 10km default
        type: 'restaurant'
      };

      this.placesService.textSearch(request, async (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          let restaurants = results
            .filter(place => place.geometry?.location)
            .slice(0, 20) // Limit initial results for faster processing
            .map(place => this.placeToRestaurant(place))
            .filter(restaurant => {
              if (filters.rating && restaurant.rating < filters.rating) return false;
              // Apply vegan-only filter if enabled
              if (filters.veganOnly && restaurant.type !== 'vegan') return false;
              return true;
            });

          // Only fetch detailed info if absolutely necessary and do it efficiently
          if (filters.openNow) {
            // Use cached details where possible and batch uncached requests
            const detailPromises = restaurants.map(async (restaurant) => {
              if (!restaurant.placeId) return restaurant;
              
              const cacheKey = searchCache.generateDetailsKey(restaurant.placeId);
              const cachedDetails = searchCache.get<Partial<VeganRestaurant>>(cacheKey);
              
              if (cachedDetails) {
                return { ...restaurant, ...cachedDetails };
              }
              
              try {
                const details = await this.getRestaurantDetails(restaurant.placeId);
                // Cache details for 15 minutes
                searchCache.set(cacheKey, details, 15 * 60 * 1000);
                return { ...restaurant, ...details };
              } catch (error) {
                console.warn(`Failed to get details for ${restaurant.name}:`, error);
                return restaurant;
              }
            });
            
            const detailedRestaurants = await Promise.all(detailPromises);
            
            // Filter by openNow after getting details
            restaurants = detailedRestaurants.filter(restaurant => 
              restaurant.openNow !== false
            );
          }

          resolve(restaurants);
        } else {
          console.warn(`Places search failed with status: ${status}`);
          resolve([]);
        }
      });
    });
  }

  private findLocalRestaurantData(placeName: string, address?: string): any {
    // Try to match by name (case insensitive, fuzzy matching)
    const normalizedPlaceName = placeName.toLowerCase().trim();
    
    console.log(`🔍 Trying to match restaurant: "${placeName}" (normalized: "${normalizedPlaceName}")`);
    console.log(`📍 Address: "${address}"`);
    
    const result = REAL_VEGAN_RESTAURANTS.find(local => {
      const normalizedLocalName = local.name.toLowerCase().trim();
      
      console.log(`  🔸 Checking against local: "${local.name}" (normalized: "${normalizedLocalName}")`);
      
      // Direct name match
      if (normalizedLocalName === normalizedPlaceName) {
        console.log(`  ✅ Direct name match found!`);
        return true;
      }
      
      // Enhanced fuzzy name matching for chain restaurants
      const nameKeywords = normalizedPlaceName.split(' ').filter(word => word.length > 2); // Filter out short words
      const localKeywords = normalizedLocalName.split(' ').filter(word => word.length > 2);
      
      // Special handling for known chains
      const chainNames = {
        'chipotle': ['chipotle'],
        'sweetgreen': ['sweetgreen', 'sweet', 'green'],
        'panera': ['panera'],
        'p.f.': ['p.f.', 'pf', 'chang', 'changs'],
        'true food': ['true', 'food', 'kitchen'],
        'mendocino': ['mendocino', 'farms'],
        'flower child': ['flower', 'child']
      };
      
      // Check for chain matches first
      for (const [chain, keywords] of Object.entries(chainNames)) {
        const placeHasChain = keywords.some(keyword => normalizedPlaceName.includes(keyword));
        const localHasChain = keywords.some(keyword => normalizedLocalName.includes(keyword));
        
        if (placeHasChain && localHasChain) {
          console.log(`  ✅ Chain match found: "${chain}"`);
          return true;
        }
      }
      
      // General keyword matching (more flexible)
      const matchingKeywords = nameKeywords.filter(keyword => 
        localKeywords.some(localKeyword => 
          localKeyword.includes(keyword) || keyword.includes(localKeyword) ||
          // Also check if they share common substrings (3+ chars)
          (keyword.length >= 3 && localKeyword.length >= 3 && 
           (keyword.includes(localKeyword.substring(0, 3)) || localKeyword.includes(keyword.substring(0, 3))))
        )
      );
      
      console.log(`  🔸 Keywords - Place: [${nameKeywords.join(', ')}], Local: [${localKeywords.join(', ')}]`);
      console.log(`  🔸 Matching keywords: [${matchingKeywords.join(', ')}] (${matchingKeywords.length}/${nameKeywords.length})`);
      
      // Lower threshold for better matching
      const requiredMatches = Math.max(1, Math.ceil(nameKeywords.length * 0.4)); // Reduced from 0.6 to 0.4
      if (matchingKeywords.length >= requiredMatches) {
        console.log(`  ✅ Fuzzy name match found! (${matchingKeywords.length}/${nameKeywords.length} keywords matched, needed ${requiredMatches})`);
        return true;
      }
      
      // Check if address contains similar location (city matching)
      if (address) {
        const normalizedAddress = address.toLowerCase();
        const localAddress = local.address.toLowerCase();
        
        // Extract city from addresses for basic location matching
        const addressCities = ['new york', 'los angeles', 'san francisco', 'chicago', 'austin', 'portland', 'seattle', 'miami', 'boston'];
        const foundCity = addressCities.find(city => 
          normalizedAddress.includes(city) && localAddress.includes(city)
        );
        
        if (foundCity && matchingKeywords.length > 0) {
          console.log(`  ✅ City + partial name match found! City: ${foundCity}`);
          return true;
        }
      }
      
      return false;
    });
    
    if (result) {
      console.log(`🎉 Match found: "${result.name}" with ${result.veganMenu?.length || 0} menu items`);
    } else {
      console.log(`❌ No match found for "${placeName}"`);
    }
    
    return result;
  }

  private placeToRestaurant(place: google.maps.places.PlaceResult): VeganRestaurant {
    const isVegan = this.determineVeganType(place.name || '', place.types || []);
    
    // Try to find matching local restaurant data with detailed menu
    const localData = this.findLocalRestaurantData(place.name || '', place.formatted_address || place.vicinity);
    
    const baseRestaurant = {
      id: place.place_id || Math.random().toString(36),
      placeId: place.place_id,
      name: place.name || 'Unknown Restaurant',
      rating: place.rating || 0,
      cuisine: this.determineCuisine(place.types || []),
      address: place.formatted_address || place.vicinity || '',
      lat: place.geometry!.location!.lat(),
      lng: place.geometry!.location!.lng(),
      type: isVegan,
      priceLevel: place.price_level || 0,
      // Remove deprecated open_now access - will be handled separately if needed
      openNow: undefined,
      photos: place.photos?.slice(0, 3).map(photo => 
        photo.getUrl({ maxWidth: 400, maxHeight: 300 })
      ),
      phoneNumber: place.formatted_phone_number,
      website: place.website
    };
    
    // Merge with local data if found
    if (localData) {
      return {
        ...baseRestaurant,
        // Prefer local data for these fields as they're more curated
        type: localData.type,
        veganOptions: localData.veganOptions,
        veganMenu: localData.veganMenu,
        specialties: localData.specialties,
        // Keep Google data for contact info as it's more up-to-date
        phoneNumber: baseRestaurant.phoneNumber || localData.phoneNumber,
        website: baseRestaurant.website || localData.website
      };
    }
    
    return baseRestaurant;
  }

  // Method to get detailed opening hours using the recommended approach
  async getRestaurantDetails(placeId: string): Promise<Partial<VeganRestaurant>> {
    if (!this.placesService) {
      throw new Error('Places service not initialized');
    }

    return new Promise((resolve, reject) => {
      this.placesService!.getDetails(
        {
          placeId: placeId,
          fields: ['opening_hours', 'formatted_phone_number', 'website', 'reviews']
        },
        (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place) {
            const details: Partial<VeganRestaurant> = {
              openNow: place.opening_hours?.isOpen?.() || false,
              phoneNumber: place.formatted_phone_number,
              website: place.website,
              reviews: place.reviews?.slice(0, 5).map(review => ({
                author: review.author_name,
                rating: review.rating,
                text: review.text
              }))
            };
            resolve(details);
          } else {
            console.warn(`Failed to get details for place ${placeId}:`, status);
            resolve({});
          }
        }
      );
    });
  }

  private determineVeganType(name: string, types: string[]): 'vegan' | 'vegetarian' | 'mixed' {
    const nameLower = name.toLowerCase();
    const veganKeywords = ['vegan', 'plant-based', 'plant based', 'herbivore'];
    const vegetarianKeywords = ['vegetarian', 'veggie'];
    
    // Chains known for great vegan options
    const veganFriendlyChains = [
      'chipotle', 'sweetgreen', 'panera', 'p.f. chang', 'true food kitchen',
      'mendocino farms', 'flower child', 'olive garden', 'taco bell',
      'subway', 'blaze pizza', 'mod pizza', 'noodles & company'
    ];

    if (veganKeywords.some(keyword => nameLower.includes(keyword))) {
      return 'vegan';
    }
    
    if (vegetarianKeywords.some(keyword => nameLower.includes(keyword))) {
      return 'vegetarian';
    }

    // Check if it's a known vegan-friendly chain
    if (veganFriendlyChains.some(chain => nameLower.includes(chain))) {
      return 'mixed';
    }

    // Default to mixed for restaurants (gives users more options)
    return 'mixed';
  }

  private determineCuisine(types: string[]): string {
    const cuisineMap: Record<string, string> = {
      'asian_restaurant': 'Asian',
      'chinese_restaurant': 'Chinese',
      'indian_restaurant': 'Indian',
      'italian_restaurant': 'Italian',
      'japanese_restaurant': 'Japanese',
      'korean_restaurant': 'Korean',
      'mexican_restaurant': 'Mexican',
      'thai_restaurant': 'Thai',
      'mediterranean_restaurant': 'Mediterranean',
      'middle_eastern_restaurant': 'Middle Eastern',
      'american_restaurant': 'American',
      'french_restaurant': 'French',
      'spanish_restaurant': 'Spanish',
      'greek_restaurant': 'Greek'
    };

    for (const type of types) {
      if (cuisineMap[type]) {
        return cuisineMap[type];
      }
    }

    return 'International';
  }



  addMarkersToMap(restaurants: VeganRestaurant[], onMarkerClick?: (restaurant: VeganRestaurant) => void): void {
    if (!this.map) return;

    const currentIds = new Set(restaurants.map(r => r.placeId || r.id));

    // Remove markers that are no longer in the list
    for (const [id, marker] of this.markerMap.entries()) {
      if (!currentIds.has(id)) {
        marker.setMap(null);
        this.markerMap.delete(id);
      }
    }

    // Add or update markers without clearing all to prevent flicker
    restaurants.forEach(restaurant => {
      const id = restaurant.placeId || restaurant.id;
      let marker = this.markerMap.get(id);
      const iconUrl = restaurant.type === 'vegan' 
        ? 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="15" fill="#22c55e" stroke="#fff" stroke-width="2"/>
              <path d="M12 16l3 3 6-6" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          `)
        : 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="15" fill="#f59e0b" stroke="#fff" stroke-width="2"/>
              <path d="M12 16l3 3 6-6" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          `);

      if (!marker) {
        marker = new google.maps.Marker({
          position: { lat: restaurant.lat, lng: restaurant.lng },
          map: this.map,
          title: restaurant.name,
          optimized: true,
          icon: { url: iconUrl, scaledSize: new google.maps.Size(32, 32) }
        });

        marker.addListener('click', () => {
          if (onMarkerClick) onMarkerClick(restaurant);
          this.showInfoWindow(restaurant, marker!);
        });

        this.markerMap.set(id, marker);
      } else {
        // Update existing marker without recreating
        marker.setTitle(restaurant.name);
        marker.setIcon({ url: iconUrl, scaledSize: new google.maps.Size(32, 32) } as any);
        const pos = marker.getPosition();
        if (!pos || pos.lat() !== restaurant.lat || pos.lng() !== restaurant.lng) {
          marker.setPosition({ lat: restaurant.lat, lng: restaurant.lng });
        }
        if (!marker.getMap()) marker.setMap(this.map);
      }
    });

    // Do not auto-fit or constrain zoom here to avoid fighting user interactions
  }

  private showInfoWindow(restaurant: VeganRestaurant, marker: google.maps.Marker): void {
    if (!this.infoWindow) return;

    const content = `
      <div style="max-width: 250px; padding: 8px;">
        <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">${restaurant.name}</h3>
        <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 4px;">
          <span style="color: #f59e0b;">★</span>
          <span style="font-weight: 600;">${restaurant.rating}</span>
          <span style="color: #6b7280;">• ${restaurant.cuisine}</span>
        </div>
        <p style="margin: 4px 0; color: #6b7280; font-size: 14px;">${restaurant.address}</p>
        <div style="margin-top: 8px;">
          <span style="background: ${restaurant.type === 'vegan' ? '#22c55e' : '#f59e0b'}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">
            ${restaurant.type === 'vegan' ? 'Fully Vegan' : restaurant.type === 'vegetarian' ? 'Vegetarian' : 'Vegan Options'}
          </span>
        </div>
      </div>
    `;

    this.infoWindow.setContent(content);
    this.infoWindow.open(this.map, marker);
  }

  clearMarkers(): void {
    this.markers.forEach(marker => marker.setMap(null));
    this.markers = [];
  }

  async geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    if (!this.geocoder) {
      await this.initialize();
    }

    // Check cache first
    const cacheKey = searchCache.generateGeocodeKey(address);
    const cachedResult = searchCache.get<{ lat: number; lng: number }>(cacheKey);
    if (cachedResult) {
      console.log('🚀 Using cached geocoding result');
      return cachedResult;
    }

    return new Promise((resolve) => {
      this.geocoder!.geocode({ address }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const location = results[0].geometry.location;
          const result = {
            lat: location.lat(),
            lng: location.lng()
          };
          
          // Cache for 1 hour
          searchCache.set(cacheKey, result, 60 * 60 * 1000);
          
          resolve(result);
        } else {
          console.warn(`Geocoding failed: ${status}`);
          resolve(null);
        }
      });
    });
  }

  isConfigured(): boolean {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    return apiKey && apiKey !== 'your_google_maps_api_key_here';
  }

  isInitialized(): boolean {
    return !!(this.map && this.placesService);
  }
}

export const googleMapsService = new GoogleMapsService();
