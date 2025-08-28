import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { MapPin, Search, Star, Navigation, Phone, Globe, Clock, DollarSign, Filter, Loader2, X, Utensils, AlertCircle, CheckCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { googleMapsService, VeganRestaurant, SearchFilters, MenuItem } from '@/services/googleMaps';
import { REAL_VEGAN_RESTAURANTS } from '@/data/veganData';
import { scrapeVeganMenuForRestaurant } from '@/services/menuScraper';
import { useDietMode } from '@/contexts/DietModeContext';

const Map = () => {
  const { mode } = useDietMode();
  const [searchLocation, setSearchLocation] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<VeganRestaurant | null>(null);
  const [restaurants, setRestaurants] = useState<VeganRestaurant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchStatus, setSearchStatus] = useState<'idle' | 'searching' | 'complete' | 'error'>('idle');
  const [showFilters, setShowFilters] = useState(false);
  const [useGoogleMaps, setUseGoogleMaps] = useState(true);
  
  // Map references
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [scrapedMenu, setScrapedMenu] = useState<MenuItem[] | null>(null);
  
  // Search filters
  const [filters, setFilters] = useState<SearchFilters>({
    veganOnly: false,
    radius: 10000, // 10km
    rating: 3.5,
    openNow: false
  });

  // Check if Google Maps is configured
  const isGoogleMapsConfigured = googleMapsService.isConfigured();

  // Memoize filtered local restaurants to avoid recalculation on every render
  const filteredLocalRestaurants = useMemo(() => {
    return REAL_VEGAN_RESTAURANTS.filter(restaurant => {
      if (mode === 'vegan' && restaurant.type === 'vegetarian') return false;
      if (filters.veganOnly && restaurant.type !== 'vegan') return false;
      if (filters.rating && restaurant.rating < filters.rating) return false;
      return true;
    }).map(restaurant => ({
      ...restaurant,
      // Ensure local restaurants have the correct structure for VeganRestaurant interface
      id: restaurant.id,
      placeId: restaurant.id, // Use local id as placeId for local data
      openNow: undefined, // Will be handled separately if needed
      photos: [], // No photos for local data
      reviews: [] // No reviews for local data
    }));
  }, [filters.veganOnly, filters.rating, mode]);
  
  console.log('🏪 Filtered local restaurants:', filteredLocalRestaurants.length);
  console.log('🍽️ Restaurants with vegan menus:', filteredLocalRestaurants.filter(r => r.veganMenu?.length).length);
  
  // DEBUG: Log first restaurant with menu
  const restaurantWithMenu = filteredLocalRestaurants.find(r => r.veganMenu?.length);
  if (restaurantWithMenu) {
    console.log('📋 Sample restaurant with menu:', restaurantWithMenu.name, 'Menu items:', restaurantWithMenu.veganMenu?.length);
    console.log('📋 Sample menu item:', restaurantWithMenu.veganMenu?.[0]);
  }
  
  // DEBUG: Add a test restaurant to ensure we have menu data
  const testChipotle = REAL_VEGAN_RESTAURANTS.find(r => r.name.includes('Chipotle'));
  if (testChipotle) {
    console.log('🌯 Found Chipotle in data:', testChipotle.name, 'Menu items:', testChipotle.veganMenu?.length);
  }

  const getCurrentLocation = useCallback(() => {
    if ('geolocation' in navigator) {
      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(coords);
          
          if (!isGoogleMapsConfigured || !useGoogleMaps) {
            console.log('🏪 Using local restaurant data...');
            console.log('📋 Setting restaurants:', filteredLocalRestaurants.length);
            setRestaurants(filteredLocalRestaurants);
          }
          // For Google Maps, let useEffect handle the search to avoid duplicate calls
          
          toast({
            title: "Location found",
            description: "Finding vegan restaurants near you",
          });
          setIsLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setIsLoading(false);
          toast({
            title: "Location error",
            description: "Could not get your location. Please search manually.",
            variant: "destructive",
          });
        }
      );
    } else {
      toast({
        title: "Location not supported",
        description: "Please search for a city manually.",
        variant: "destructive",
      });
    }
  }, [isGoogleMapsConfigured, useGoogleMaps, filteredLocalRestaurants]);

  const handleSearch = useCallback(async () => {
    if (!searchLocation.trim()) return;
    
    setIsLoading(true);
    setSearchStatus('searching');
    
    if (isGoogleMapsConfigured && useGoogleMaps) {
      try {
        const coords = await googleMapsService.geocodeAddress(searchLocation);
        if (coords) {
          setUserLocation(coords);
          setSearchStatus('complete');
          // Don't call searchRestaurants here - let useEffect handle it to avoid duplicate calls
          toast({
            title: "Location found",
            description: `Searching for vegan restaurants in ${searchLocation}`,
          });
        } else {
          throw new Error('Location not found');
        }
      } catch (error) {
        console.error('Search error:', error);
        setSearchStatus('error');
        toast({
          title: "Search error",
          description: "Could not find that location. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      // Fallback to major city coordinates
      const cityCoords = getCityCoordinates(searchLocation);
      if (cityCoords) {
        console.log('🏪 Using local restaurant data for city search...');
        console.log('📋 Setting restaurants:', filteredLocalRestaurants.length);
        setUserLocation(cityCoords);
        setRestaurants(filteredLocalRestaurants);
        setSearchStatus('complete');
        toast({
          title: "Search complete",
          description: `Showing curated vegan restaurants in ${searchLocation}`,
        });
      } else {
        setSearchStatus('error');
        toast({
          title: "City not found",
          description: "Try searching for a major city like New York, Los Angeles, or San Francisco.",
          variant: "destructive",
        });
      }
    }
    
    setIsLoading(false);
  }, [searchLocation, isGoogleMapsConfigured, useGoogleMaps, filteredLocalRestaurants]);

  const searchRestaurants = useCallback(async (location: { lat: number; lng: number }) => {
    if (!isGoogleMapsConfigured) return;
    
    // Check if Google Maps service is properly initialized
    if (!googleMapsService.isInitialized()) {
      console.warn('Google Maps service not initialized yet, skipping search');
      return;
    }
    
    setSearchStatus('searching');
    
    try {
      const results = await googleMapsService.searchVeganRestaurants(location, filters);
      setRestaurants(results);
      setSearchStatus('complete');
      
      if (results.length === 0) {
        toast({
          title: "No restaurants found",
          description: "Try adjusting your filters or search a different area.",
        });
      }
    } catch (error) {
      console.error('Restaurant search error:', error);
      setRestaurants(filteredLocalRestaurants);
      setSearchStatus('error');
      toast({
        title: "Search limited",
        description: "Using curated restaurant data. Configure Google Maps API for live results.",
        variant: "destructive",
      });
    }
  }, [filters, isGoogleMapsConfigured, filteredLocalRestaurants]);

  const getCityCoordinates = (city: string): { lat: number; lng: number } | null => {
    const cities: Record<string, { lat: number; lng: number }> = {
      'new york': { lat: 40.7589, lng: -73.9851 },
      'nyc': { lat: 40.7589, lng: -73.9851 },
      'los angeles': { lat: 34.0522, lng: -118.2437 },
      'la': { lat: 34.0522, lng: -118.2437 },
      'san francisco': { lat: 37.7749, lng: -122.4194 },
      'sf': { lat: 37.7749, lng: -122.4194 },
      'chicago': { lat: 41.8781, lng: -87.6298 },
      'austin': { lat: 30.2672, lng: -97.7431 },
      'portland': { lat: 45.5152, lng: -122.6784 },
      'seattle': { lat: 47.6062, lng: -122.3321 },
      'miami': { lat: 25.7617, lng: -80.1918 },
      'boston': { lat: 42.3601, lng: -71.0589 }
    };
    
    return cities[city.toLowerCase()] || null;
  };

  // Initialize map when component mounts and location is available
  useEffect(() => {
    if (userLocation && mapRef.current && !map && isGoogleMapsConfigured && useGoogleMaps) {
      const initializeMap = async () => {
        try {
          const googleMap = await googleMapsService.initializeMap(mapRef.current!, userLocation);
          setMap(googleMap);
          setIsMapReady(true);
          // Don't call searchRestaurants here - let the filters useEffect handle it
          // to avoid duplicate calls when both initialization and filters change
        } catch (error) {
          console.error('Map initialization error:', error);
          setUseGoogleMaps(false);
          setIsMapReady(false);
        }
      };
      
      initializeMap();
    }
  }, [userLocation, map, isGoogleMapsConfigured, useGoogleMaps]);

  // Reset map ready state when Google Maps is not configured or disabled
  useEffect(() => {
    if (!isGoogleMapsConfigured || !useGoogleMaps) {
      setIsMapReady(false);
    }
  }, [isGoogleMapsConfigured, useGoogleMaps]);

  useEffect(() => {
    const load = async () => {
      if (!selectedRestaurant) {
        setScrapedMenu(null);
        return;
      }
      let current = selectedRestaurant;
      if ((!current.website || current.website.length === 0) && current.placeId) {
        try {
          const details = await googleMapsService.getRestaurantDetails(current.placeId);
          current = { ...current, ...details } as VeganRestaurant;
          setSelectedRestaurant(current);
        } catch {}
      }
      if (current.veganMenu && current.veganMenu.length > 0) {
        setScrapedMenu(null);
        return;
      }
      if (!current.website) {
        setScrapedMenu(null);
        return;
      }
      try {
        const items = await scrapeVeganMenuForRestaurant(current);
        setScrapedMenu(items);
      } catch {
        setScrapedMenu(null);
      }
    };
    load();
  }, [selectedRestaurant]);

  // Update map markers when restaurants change
  useEffect(() => {
    if (map && restaurants.length > 0 && isGoogleMapsConfigured) {
      googleMapsService.addMarkersToMap(restaurants, (restaurant) => {
        setSelectedRestaurant(restaurant);
      });
    }
  }, [map, restaurants, isGoogleMapsConfigured]);

  // Update search when filters change (only if map is already initialized)
  useEffect(() => {
    if (userLocation) {
      if (isGoogleMapsConfigured && useGoogleMaps && isMapReady) {
        // Only search if map is fully ready (Places service initialized)
        searchRestaurants(userLocation);
      } else if (!isGoogleMapsConfigured || !useGoogleMaps) {
        // Use local data when Google Maps is not configured or disabled
        setRestaurants(filteredLocalRestaurants);
      }
      // If map is configured but not ready yet, do nothing - 
      // the search will happen after initialization
    }
  }, [filters, userLocation, isGoogleMapsConfigured, useGoogleMaps, filteredLocalRestaurants, isMapReady]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-4">Restaurant Finder</h1>
        <p className="text-xl text-muted-foreground">
          Discover vegan restaurants and vegan-friendly options near you
        </p>
      </div>

      {/* Search Section */}
      <Card className="mb-8 shadow-card bg-gradient-card border-0">
        <CardHeader>
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <MapPin className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="text-center">Search Location</CardTitle>
          <CardDescription className="text-center">
            Find {mode === 'vegan' ? 'vegan' : 'vegetarian'} restaurants in any city
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Enter city or address..."
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                className="pl-10"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button 
              onClick={handleSearch}
              disabled={isLoading || !searchLocation.trim()}
              className="bg-primary hover:bg-primary/90 shadow-glow transition-smooth"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              {isLoading ? 'Searching...' : 'Search'}
            </Button>
            <Button 
              onClick={getCurrentLocation}
              disabled={isLoading}
              variant="outline"
              className="whitespace-nowrap"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Navigation className="w-4 h-4 mr-2" />
              )}
              Use My Location
            </Button>
          </div>

          {/* Search Progress */}
          {searchStatus === 'searching' && (
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Searching for vegan restaurants...
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    This may take a few seconds for the best results
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col gap-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Restaurant Type</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                {showFilters ? 'Hide' : 'Show'} Filters
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="vegan-only"
                checked={filters.veganOnly}
                onCheckedChange={(checked) => setFilters(prev => ({ ...prev, veganOnly: checked }))}
              />
              <Label htmlFor="vegan-only">Show only fully vegan restaurants</Label>
            </div>

            {showFilters && (
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <div className="space-y-2">
                  <Label className="text-sm">Minimum Rating: {filters.rating}</Label>
                  <Slider
                    value={[filters.rating || 3.5]}
                    onValueChange={([value]) => setFilters(prev => ({ ...prev, rating: value }))}
                    max={5}
                    min={1}
                    step={0.1}
                    className="w-full"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm">Search Radius: {(filters.radius || 10000) / 1000}km</Label>
                  <Slider
                    value={[filters.radius || 10000]}
                    onValueChange={([value]) => setFilters(prev => ({ ...prev, radius: value }))}
                    max={50000}
                    min={1000}
                    step={1000}
                    className="w-full"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="open-now"
                    checked={filters.openNow || false}
                    onCheckedChange={(checked) => setFilters(prev => ({ ...prev, openNow: checked }))}
                  />
                  <Label htmlFor="open-now">Open now only</Label>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Map Placeholder */}
      <Card className="mb-8 shadow-card">
        <CardHeader>
          <CardTitle>Restaurant Map</CardTitle>
          <CardDescription>
            Interactive map showing restaurant locations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div 
            ref={mapRef}
            className="w-full h-64 bg-gradient-to-br from-primary/10 to-primary-light/20 rounded-lg flex items-center justify-center border border-border"
          >
            <div className="text-center">
              <MapPin className="w-12 h-12 text-primary mx-auto mb-2" />
              <p className="text-muted-foreground">Interactive Map</p>
              <p className="text-sm text-muted-foreground">
                {userLocation ? 'Showing restaurants near you' : 'Search for a location to view map'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {userLocation && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              {searchStatus === 'searching' ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Searching for restaurants...
                </>
              ) : searchStatus === 'complete' ? (
                `${restaurants.length} Restaurant${restaurants.length !== 1 ? 's' : ''} Found`
              ) : (
                `${restaurants.length} Restaurant${restaurants.length !== 1 ? 's' : ''} Found`
              )}
            </h2>
            <div className="flex gap-2">
              <Badge variant="outline">
                {filters.veganOnly ? 'Vegan Only' : 'All Options'}
              </Badge>
              {isGoogleMapsConfigured && useGoogleMaps && (
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  Live Results
                </Badge>
              )}
            </div>
          </div>

          {!isGoogleMapsConfigured && (
            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                      Showing Curated Restaurants
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      Add your Google Maps API key to search live restaurant data with real-time availability, reviews, and photos.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {searchStatus === 'searching' ? (
              // Skeleton loading cards
              Array.from({ length: 6 }).map((_, index) => (
                <Card key={index} className="shadow-card border-0 bg-gradient-card animate-pulse">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <div className="h-5 bg-muted rounded w-3/4"></div>
                        <div className="h-4 bg-muted rounded w-1/2"></div>
                      </div>
                      <div className="h-6 bg-muted rounded-full w-20"></div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="h-4 bg-muted rounded w-4"></div>
                      <div className="h-4 bg-muted rounded w-16"></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-4 bg-muted rounded w-4"></div>
                      <div className="h-4 bg-muted rounded w-full"></div>
                    </div>
                    <div className="h-10 bg-muted rounded w-full"></div>
                  </CardContent>
                </Card>
              ))
            ) : (
              restaurants.map((restaurant) => (
              <Card 
                key={restaurant.id} 
                className="shadow-card hover:shadow-glow transition-smooth cursor-pointer border-0 bg-gradient-card h-fit"
                onClick={() => setSelectedRestaurant(restaurant)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate leading-tight">{restaurant.name}</CardTitle>
                      <CardDescription className="truncate">{restaurant.cuisine}</CardDescription>
                    </div>
                    <Badge 
                      className={restaurant.type === 'vegan' 
                        ? 'bg-success text-success-foreground flex-shrink-0' 
                        : 'bg-secondary text-secondary-foreground flex-shrink-0'
                      }
                    >
                      {restaurant.type === 'vegan' ? 'Fully Vegan' : 'Vegan Options'}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 fill-warning text-warning" />
                    <span className="font-semibold">{restaurant.rating}</span>
                    <span className="text-muted-foreground">rating</span>
                  </div>

                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{restaurant.address}</span>
                  </div>

                  {/* Vegan Options for mixed restaurants */}
                  {restaurant.type === 'mixed' && restaurant.veganOptions && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Vegan Options:</h4>
                      <div className="space-y-1">
                        {restaurant.veganOptions.map((option, index) => (
                          <div key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-success rounded-full" />
                            {option}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button 
                    className="w-full bg-primary hover:bg-primary/90 transition-smooth"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('Selected restaurant data:', restaurant);
                      console.log('Vegan menu:', restaurant.veganMenu);
                      setSelectedRestaurant(restaurant);
                    }}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
              ))
            )}
          </div>
        </div>
      )}



      {/* Restaurant Details Modal */}
      <Dialog open={!!selectedRestaurant} onOpenChange={() => setSelectedRestaurant(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedRestaurant && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedRestaurant.name}</h2>
                    <p className="text-muted-foreground">{selectedRestaurant.cuisine}</p>
                  </div>
                  <Badge 
                    className={selectedRestaurant.type === 'vegan' 
                      ? 'bg-success text-success-foreground' 
                      : 'bg-secondary text-secondary-foreground'
                    }
                  >
                    {selectedRestaurant.type === 'vegan' ? 'Fully Vegan' : 
                     selectedRestaurant.type === 'vegetarian' ? 'Vegetarian' : 'Vegan Options'}
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="photos">Photos</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6 mt-6">
                  {/* Rating and Basic Info */}
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 fill-warning text-warning" />
                      <span className="font-semibold text-lg">{selectedRestaurant.rating}</span>
                      <span className="text-muted-foreground">rating</span>
                    </div>
                    {selectedRestaurant.priceLevel > 0 && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-muted-foreground" />
                        <span>{'$'.repeat(selectedRestaurant.priceLevel)}</span>
                      </div>
                    )}
                    {selectedRestaurant.openNow !== undefined && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-muted-foreground" />
                        <span className={selectedRestaurant.openNow ? 'text-success' : 'text-destructive'}>
                          {selectedRestaurant.openNow ? 'Open now' : 'Closed now'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Address */}
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Address</p>
                      <p className="text-muted-foreground">{selectedRestaurant.address}</p>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedRestaurant.phoneNumber && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Phone</p>
                          <a 
                            href={`tel:${selectedRestaurant.phoneNumber}`}
                            className="text-primary hover:underline"
                          >
                            {selectedRestaurant.phoneNumber}
                          </a>
                        </div>
                      </div>
                    )}
                    
                    {selectedRestaurant.website && (
                      <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Website</p>
                          <a 
                            href={selectedRestaurant.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            Visit Website
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Specialties */}
                  {selectedRestaurant.specialties && selectedRestaurant.specialties.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                        <Utensils className="w-5 h-5" />
                        Restaurant Specialties
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedRestaurant.specialties.map((specialty, index) => (
                          <Badge key={index} variant="outline" className="text-sm">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick Vegan Options */}
                  {selectedRestaurant.veganOptions && selectedRestaurant.veganOptions.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-lg mb-3">Quick Vegan Options</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {selectedRestaurant.veganOptions.map((option, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 bg-success rounded-full" />
                            <span>{option}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                

                <TabsContent value="photos" className="space-y-6 mt-6">
                  {selectedRestaurant.photos && selectedRestaurant.photos.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {selectedRestaurant.photos.map((photo, index) => (
                        <img 
                          key={index}
                          src={photo} 
                          alt={`${selectedRestaurant.name} photo ${index + 1}`}
                          className="w-full h-48 object-cover rounded-lg shadow-sm hover:shadow-md transition-shadow"
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-muted rounded-lg mx-auto mb-4 flex items-center justify-center">
                        📸
                      </div>
                      <h3 className="font-semibold text-lg mb-2">No Photos Available</h3>
                      <p className="text-muted-foreground">
                        Photos for this restaurant are not available at the moment.
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Map;