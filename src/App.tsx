import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { DatabaseProvider } from "@/contexts/DatabaseContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { CalibrationProvider } from "@/contexts/CalibrationContext";
import { CoachingEngineProvider } from "@/contexts/CoachingEngineContext";
import { UploadProvider } from "@/contexts/UploadContext";

// Landing page
import LandingPage from "./pages/LandingPage";

// Auth page
import Auth from "./pages/Auth";

// Demo pages
import Ignition from "./pages/Ignition";
import GoalsAndActions from "./pages/GoalsAndActions";
import BusinessPlan from "./pages/BusinessPlan";
import Pipeline from "./pages/Pipeline";
import ProductionDashboard from "./pages/ProductionDashboard";
import Database from "./pages/Database";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <CalibrationProvider>
          <CoachingEngineProvider>
            <UploadProvider>
            <TooltipProvider>
            <DatabaseProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
              <Routes>
                {/* Landing page - standalone, no layout */}
                <Route path="/" element={<LandingPage />} />
                
                {/* Auth page */}
                <Route path="/auth" element={<Auth />} />
                
                {/* Demo pages - with app layout */}
                <Route path="/demo/*" element={
                  <MainLayout>
                    <Routes>
                      <Route path="ignition" element={<Ignition />} />
                      <Route path="goals" element={<GoalsAndActions />} />
                      <Route path="business-plan" element={<BusinessPlan />} />
                      <Route path="pipeline" element={<Pipeline />} />
                      <Route path="production" element={<ProductionDashboard />} />
                      <Route path="database" element={<Database />} />
                    </Routes>
                  </MainLayout>
                } />
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
            </DatabaseProvider>
          </TooltipProvider>
          </UploadProvider>
          </CoachingEngineProvider>
        </CalibrationProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
