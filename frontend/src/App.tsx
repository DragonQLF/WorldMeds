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
import { FlagProvider } from "./components/flags/FlagProvider";
import { GoogleOAuthProvider } from '@react-oauth/google';

// Lazy load components to reduce initial bundle size
const Index = lazy(() => import("./pages/Index"));
const Settings = lazy(() => import("./pages/Settings"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const Admin = lazy(() => import("./pages/Admin"));
const CountryStats = lazy(() => import("@/pages/CountryStats"));
const CountryProfile = lazy(() => import("@/pages/CountryProfile"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Stats = lazy(() => import("./pages/Stats"));

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
  <GoogleOAuthProvider clientId="1006551602939-l857fi30aljqag85gccvn72p1vrokgvk.apps.googleusercontent.com">
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem={true}
      >
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={<Loading />}>
              <FlagProvider>
                <Routes>
                  {/* Public route for VerifyEmail - rendered outside AuthProvider */}
                  <Route path="/verify-email" element={<VerifyEmail />} />

                  {/* All other routes wrapped within AuthProvider and other contexts */}
                  <Route
                    path="/*" // Use a wildcard path to match all other routes
                    element={
                      <MapProvider>
                        <TooltipProvider>
                          <Toaster />
                          <Sonner />
                          <Routes> {/* Nested Routes for the rest of the application */}
                            {/* Public routes within AuthProvider context */}
                            <Route path="/" element={<Index />} />
                            <Route path="/country/:countryId" element={<CountryProfile />} />
                            <Route path="/reset-password" element={<ResetPassword />} />

                            {/* Protected routes */}
                            <Route element={<ProtectedRoute />}>
                              <Route path="/settings" element={<Settings />} />
                              <Route path="/profile" element={<ProfilePage />} />
                              <Route path="/admin" element={<Admin />} />
                              <Route path="/country/:countryId/stats" element={<CountryStats />} />
                              <Route path="/stats" element={<Stats />} />
                            </Route>

                            {/* Fallback route for paths within the AuthProvider scope that don't match */}
                            {/* Note: This nested fallback might need adjustment based on desired behavior for unmatched paths */} 
                            {/* within or outside the authenticated area. A single top-level fallback is usually sufficient. */}
                            {/* Keeping it simple for now based on the original structure's intent. */}
                            {/* Removed the nested fallback to rely on the top-level one */}

                          </Routes> {/* Close Nested Routes */}
                        </TooltipProvider>
                      </MapProvider>
                    }
                  /> {/* Close wildcard Route */}

                  {/* Top-level fallback route for paths that don't match /verify-email or the wildcard route */}
                  {/* This catches paths that are not /verify-email and not handled within the AuthProvider's Routes */} 
                  <Route path="*" element={<Navigate to="/" />} />

                </Routes> {/* Close Top-level Routes */}
              </FlagProvider>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </GoogleOAuthProvider>
);

export default App;
