import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import ErrorBoundary from "./components/ErrorBoundary";
import Index from "./pages/Index";
import Scan from "./pages/Scan";
import Recipes from "./pages/Recipes";
import Map from "./pages/Map";
import MealPlanner from "./pages/MealPlanner";
import NotFound from "./pages/NotFound";
import Community from "./pages/Community";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import SplashScreen from "./pages/SplashScreen";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import { useSplashScreen } from "./hooks/useSplashScreen";

const queryClient = new QueryClient();

const App = () => {
  const { showSplash, hideSplash } = useSplashScreen();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        
        {/* Splash Screen */}
        {showSplash && <SplashScreen onEnter={hideSplash} />}
        
        {/* Main App */}
        <BrowserRouter>
          <AuthProvider>
            <Layout>
              <Routes>
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                <Route path="/scan" element={<ProtectedRoute><Scan /></ProtectedRoute>} />
                <Route
                  path="/recipes"
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <Recipes />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  }
                />
                <Route path="/map" element={<ProtectedRoute><Map /></ProtectedRoute>} />
                <Route path="/meal-planner" element={<ProtectedRoute><MealPlanner /></ProtectedRoute>} />
                <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
