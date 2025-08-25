import { Link } from 'react-router-dom';
import { Scan, ChefHat, MapPin, ArrowRight, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import heroImage from '@/assets/hero-vegan.jpg';

const Index = () => {
  const features = [
    {
      icon: Scan,
      title: 'Scan Products',
      description: 'Take a photo of ingredients to instantly check if a product is vegan',
      href: '/scan',
      color: 'text-primary'
    },
    {
      icon: ChefHat,
      title: 'Find Recipes',
      description: 'Discover delicious vegan recipes based on ingredients you have',
      href: '/recipes',
      color: 'text-success'
    },
    {
      icon: MapPin,
      title: 'Find Restaurants',
      description: 'Find vegan restaurants and vegan-friendly options nearby',
      href: '/map',
      color: 'text-warning'
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 to-background/80" />
        <div className="relative container mx-auto px-4 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Leaf className="w-4 h-4" />
                Plant-Powered Technology
              </div>
              
              <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                Your Smart
                <span className="text-transparent bg-gradient-primary bg-clip-text"> Vegan </span>
                Companion
              </h1>
              
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Scan products, discover recipes, and find restaurants with AI-powered 
                vegan detection. Living plant-based has never been easier.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/scan">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 shadow-glow transition-smooth w-full sm:w-auto">
                    Start Scanning
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                
                <Link to="/recipes">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Browse Recipes
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-primary rounded-3xl blur-3xl opacity-20 transform rotate-6" />
              <img 
                src={heroImage} 
                alt="Fresh vegan ingredients" 
                className="relative rounded-3xl shadow-card w-full max-w-lg mx-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Everything You Need for Vegan Living
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Three powerful tools to help you navigate your plant-based journey with confidence
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={index} 
                  className="shadow-card hover:shadow-glow transition-smooth border-0 bg-gradient-card group cursor-pointer"
                >
                  <Link to={feature.href}>
                    <CardHeader className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-background shadow-soft flex items-center justify-center group-hover:scale-110 transition-smooth">
                        <Icon className={`w-8 h-8 ${feature.color}`} />
                      </div>
                      <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                      <CardDescription className="text-base">
                        {feature.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                      <Button variant="ghost" className="group-hover:bg-primary group-hover:text-primary-foreground transition-smooth">
                        Try Now
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-smooth" />
                      </Button>
                    </CardContent>
                  </Link>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-gradient-card">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Ready to Start Your Vegan Journey?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of people making informed plant-based choices every day
            </p>
            <Link to="/scan">
              <Button size="lg" className="bg-primary hover:bg-primary/90 shadow-glow transition-smooth">
                Get Started Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
