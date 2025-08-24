import { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Star, Navigation } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { VEGAN_RESTAURANTS, Restaurant } from '@/data/veganData';

const Map = () => {
  const [searchLocation, setSearchLocation] = useState('');
  const [veganOnly, setVeganOnly] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);

  // Filter restaurants based on vegan only toggle
  const filteredRestaurants = veganOnly 
    ? VEGAN_RESTAURANTS.filter(r => r.type === 'vegan')
    : VEGAN_RESTAURANTS;

  const getCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(coords);
          toast({
            title: "Location found",
            description: "Using your current location",
          });
        },
        (error) => {
          console.error('Error getting location:', error);
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
  };

  const handleSearch = () => {
    if (!searchLocation.trim()) return;
    
    // For demo purposes, we'll show NYC results
    setUserLocation({ lat: 40.7589, lng: -73.9851 });
    toast({
      title: "Search complete",
      description: `Showing vegan options in ${searchLocation}`,
    });
  };

  // Initialize map when component mounts and location is available
  useEffect(() => {
    if (userLocation && mapRef.current && !map) {
      // For demo purposes, create a simple map representation
      // In a real app, you would integrate with Google Maps API here
      console.log('Would initialize Google Map here with location:', userLocation);
    }
  }, [userLocation, map]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-4">Find Vegan Restaurants</h1>
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
            Find vegan restaurants in any city
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
              className="bg-primary hover:bg-primary/90 shadow-glow transition-smooth"
            >
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
            <Button 
              onClick={getCurrentLocation}
              variant="outline"
              className="whitespace-nowrap"
            >
              <Navigation className="w-4 h-4 mr-2" />
              Use My Location
            </Button>
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-2 pt-4 border-t border-border">
            <Switch
              id="vegan-only"
              checked={veganOnly}
              onCheckedChange={setVeganOnly}
            />
            <Label htmlFor="vegan-only">Show only fully vegan restaurants</Label>
          </div>
        </CardContent>
      </Card>

      {/* Map Placeholder */}
      <Card className="mb-8 shadow-card">
        <CardHeader>
          <CardTitle>Map View</CardTitle>
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
            <h2 className="text-2xl font-bold">
              {filteredRestaurants.length} Restaurant{filteredRestaurants.length !== 1 ? 's' : ''} Found
            </h2>
            <Badge variant="outline">
              {veganOnly ? 'Vegan Only' : 'All Options'}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRestaurants.map((restaurant) => (
              <Card 
                key={restaurant.id} 
                className="shadow-card hover:shadow-glow transition-smooth cursor-pointer border-0 bg-gradient-card"
                onClick={() => setSelectedRestaurant(restaurant)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{restaurant.name}</CardTitle>
                      <CardDescription>{restaurant.cuisine}</CardDescription>
                    </div>
                    <Badge 
                      className={restaurant.type === 'vegan' 
                        ? 'bg-success text-success-foreground' 
                        : 'bg-secondary text-secondary-foreground'
                      }
                    >
                      {restaurant.type === 'vegan' ? 'Fully Vegan' : 'Vegan Options'}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 fill-warning text-warning" />
                    <span className="font-semibold">{restaurant.rating}</span>
                    <span className="text-muted-foreground">rating</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    {restaurant.address}
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

                  <Button className="w-full bg-primary hover:bg-primary/90 transition-smooth">
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!userLocation && (
        <Card className="shadow-card text-center py-12">
          <CardContent>
            <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Search for restaurants</h3>
            <p className="text-muted-foreground mb-4">
              Enter a city name or use your current location to find vegan restaurants
            </p>
            <Button 
              onClick={getCurrentLocation}
              className="bg-primary hover:bg-primary/90"
            >
              <Navigation className="w-4 h-4 mr-2" />
              Use My Location
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Map;