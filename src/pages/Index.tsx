import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Scan, ChefHat, MapPin, ArrowRight, Leaf, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import FeaturePreviewHover from '@/components/FeaturePreviewHover';
import { useSlideTransition } from '@/hooks/useSlideTransition';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { cn } from '@/lib/utils';

const Index = () => {
  const { isSliding, slideToPage } = useSlideTransition();
  const { ref: featuresRef, isVisible: featuresVisible, hasAnimated: featuresAnimated } = useScrollAnimation(0.1);
  const { ref: ctaRef, isVisible: ctaVisible, hasAnimated: ctaAnimated } = useScrollAnimation(0.1);
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setHasScrolled(true);
      } else {
        setHasScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
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
    <div className={cn(
      "min-h-screen transition-transform duration-200 ease-out",
      isSliding && "animate-slide-out-left"
    )}>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 to-background/80" />
        <div className="relative container mx-auto px-4 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full text-sm font-medium mb-6 shadow-lg shadow-emerald-500/10">
                <Leaf className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">
                  Plant-Powered Technology
                </span>
              </div>
              
              <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                Your Smart
                <span className="text-emerald-400 font-extrabold"> Vegan </span>
                Companion
              </h1>
              
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Scan products, discover recipes, and find restaurants with AI-powered 
                vegan detection. Living plant-based has never been easier.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button 
                  size="lg" 
                  className="bg-primary hover:bg-primary/90 shadow-glow transition-smooth w-full sm:w-auto"
                  onClick={() => slideToPage('/scan')}
                  disabled={isSliding}
                >
                  Start Scanning
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                
                <Link to="/recipes">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Browse Recipes
                  </Button>
                </Link>
              </div>
            </div>
            
            <FeaturePreviewHover />
          </div>
        </div>
        
      </section>
      
      {/* Subtle Scroll Indicator */}
      <div className={cn(
        "absolute bottom-8 left-1/2 transform -translate-x-1/2 transition-all duration-500 ease-out",
        hasScrolled ? "opacity-0 translate-y-4 pointer-events-none" : "opacity-100 translate-y-0"
      )}>
        <div className="flex flex-col items-center space-y-2">
          <span className="text-xs text-muted-foreground/60 font-light tracking-wider uppercase">
            Scroll
          </span>
          <ChevronDown className="w-4 h-4 text-muted-foreground/40 animate-bounce" />
        </div>
      </div>

      {/* Features Section */}
      <section className="py-16 lg:py-24" ref={featuresRef}>
        <div className="container mx-auto px-4">
          <div className={cn(
            "text-center mb-16 transition-all duration-1000 ease-out pt-64",
            featuresAnimated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
          )}>
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Everything You Need for Vegan Living
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Three powerful tools to help you navigate your plant-based journey with confidence
            </p>
          </div>
          
          <div className={cn(
            "grid grid-cols-1 md:grid-cols-3 gap-8 transition-all duration-1000 ease-out",
            featuresAnimated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
          )}>
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={index} 
                  className={cn(
                    "group cursor-pointer rounded-2xl bg-white/70 dark:bg-gray-900/50 backdrop-blur-sm border border-emerald-100/70 dark:border-emerald-800/50 shadow-lg hover:shadow-2xl hover:border-emerald-300/80 hover:-translate-y-0.5 transition-all duration-1000 ease-out",
                    featuresAnimated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
                  )}
                  style={{
                    transitionDelay: featuresAnimated ? `${index * 300}ms` : '0ms'
                  }}
                >
                  <Link to={feature.href}>
                    <CardHeader className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200/70 dark:border-emerald-800/60 shadow-soft flex items-center justify-center group-hover:scale-110 transition-smooth">
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
      <section className="py-16 lg:py-24 bg-gradient-card" ref={ctaRef}>
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              <span className={cn(
                "inline-block transition-all duration-300 ease-out",
                ctaVisible && "animate-letter-bounce"
              )} style={{ animationDelay: ctaVisible ? '0ms' : '0ms' }}>
                Ready
              </span>{' '}
              <span className={cn(
                "inline-block transition-all duration-300 ease-out",
                ctaVisible && "animate-letter-bounce"
              )} style={{ animationDelay: ctaVisible ? '100ms' : '0ms' }}>
                to
              </span>{' '}
              <span className={cn(
                "inline-block transition-all duration-300 ease-out",
                ctaVisible && "animate-letter-bounce"
              )} style={{ animationDelay: ctaVisible ? '200ms' : '0ms' }}>
                Start
              </span>{' '}
              <span className={cn(
                "inline-block transition-all duration-300 ease-out",
                ctaVisible && "animate-letter-bounce"
              )} style={{ animationDelay: ctaVisible ? '300ms' : '0ms' }}>
                Your
              </span>{' '}
              <span className={cn(
                "inline-block transition-all duration-300 ease-out",
                ctaVisible && "animate-letter-bounce"
              )} style={{ animationDelay: ctaVisible ? '400ms' : '0ms' }}>
                Vegan
              </span>{' '}
              <span className={cn(
                "inline-block transition-all duration-300 ease-out",
                ctaVisible && "animate-letter-bounce"
              )} style={{ animationDelay: ctaVisible ? '500ms' : '0ms' }}>
                Journey?
              </span>
            </h2>
            <p className={cn(
              "text-xl text-muted-foreground mb-8 transition-all duration-700 ease-out",
              ctaAnimated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            )}>
              Join thousands of people making informed plant-based choices every day
            </p>
            <div className={cn(
              "transition-all duration-700 ease-out",
              ctaAnimated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            )} style={{ transitionDelay: ctaAnimated ? '600ms' : '0ms' }}>
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 shadow-glow transition-smooth"
                onClick={() => slideToPage('/scan')}
                disabled={isSliding}
              >
                Get Started Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
