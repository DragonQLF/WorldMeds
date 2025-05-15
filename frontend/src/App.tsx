
import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MapProvider } from "./contexts/MapContext";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Lazy load components to reduce initial bundle size
const Index = lazy(() => import("./pages/Index"));
const Settings = lazy(() => import("./pages/Settings"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const Admin = lazy(() => import("./pages/Admin"));
const Stats = lazy(() => import("./pages/Stats"));
const CountryStats = lazy(() => import("@/pages/CountryStats"));
const CountryProfile = lazy(() => import("@/pages/CountryProfile"));
const Comparison = lazy(() => import("@/pages/Comparison"));

// Loading fallback component
const Loading = () => (
  <div className="flex items-center justify-center h-screen w-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

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
              <Suspense fallback={<Loading />}>
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
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </MapProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
