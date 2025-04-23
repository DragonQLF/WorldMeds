import React, { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

/**
 * GuestRoute - A component that redirects authenticated users away from auth pages
 * Only allows non-authenticated users to access wrapped routes
 */
const GuestRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show redirect message when a logged-in user tries to access auth pages
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      // Get a friendly name for the route
      let pageName = "authentication page";
      if (location.pathname.includes("login")) {
        pageName = "login page";
      } else if (location.pathname.includes("register")) {
        pageName = "registration page";
      } else if (location.pathname.includes("forgot-password")) {
        pageName = "password reset page";
      }

      toast({
        title: "Already logged in",
        description: `You were redirected from the ${pageName} because you're already logged in.`,
        variant: "default",
      });
    }
  }, [isAuthenticated, isLoading, location.pathname]);

  // Show nothing while checking authentication status
  if (isLoading) {
    return null; // Or return a loading spinner if preferred
  }

  // If authenticated, redirect to home page
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Otherwise, render the child routes
  return <Outlet />;
};

export default GuestRoute; 