import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MapProvider } from "./contexts/MapContext";
import Index from "./pages/Index";
import Settings from "./pages/Settings";
import ProfilePage from "./pages/ProfilePage"; // Kept for future use if needed
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { Admin } from "./pages/Admin";
import { Stats } from "./pages/Stats";
import { CountryStats } from "@/pages/CountryStats";
import { CountryProfile } from "@/pages/CountryProfile";
import { Comparison } from "@/pages/Comparison";

// Create a query client with proper configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      meta: {
        errorHandler: (error: Error) => {
          console.error("Query error:", error);
        }
      }
    }
  }
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider 
      defaultTheme="system" 
      storageKey="worldmeds-theme"
      enableSystem={true}
    >
      <AuthProvider>
        <MapProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Public routes - accessible without login */}
                <Route path="/" element={<Index />} />
                <Route path="/country/:countryId" element={<CountryProfile />} />
                
                {/* Protected routes - require authentication */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/stats" element={<Stats />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/country/:countryId/stats" element={<CountryStats />} />
                  <Route path="/comparison" element={<Comparison />} />
                </Route>
                
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </MapProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
