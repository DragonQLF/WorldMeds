import React, { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

/**
 * ProtectedRoute - A component that redirects unauthenticated users to login page
 * Only allows authenticated users to access wrapped routes
 * For admin routes, also checks if user has admin privileges
 */
const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Check if the current route requires admin access
  const isAdminRoute = location.pathname === '/admin';

  // Show redirect message when an unauthenticated user tries to access protected pages
  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      // Extract page name from path for a more descriptive message
      const pathSegments = location.pathname.split('/').filter(Boolean);
      const pageName = pathSegments.length > 0 
        ? pathSegments[pathSegments.length - 1].replace(/-/g, ' ')
        : 'protected page';

      toast({
        title: "Authentication required",
        description: `Please log in to access the ${pageName} page.`,
        variant: "default",
      });
      
      // Dispatch event to open login modal
      const event = new CustomEvent('open-auth-modal', { 
        detail: { type: 'login' } 
      });
      window.dispatchEvent(event);
    } else if (isAuthenticated && isAdminRoute && !user?.isAdmin) {
      toast({
        title: "Access denied",
        description: "You don't have permission to access the admin page.",
        variant: "destructive",
      });
    }
  }, [isAuthenticated, isLoading, location.pathname, isAdminRoute, user?.isAdmin]);

  // Show nothing while checking authentication status
  if (isLoading) {
    return null; // Or return a loading spinner if preferred
  }

  // If not authenticated, redirect to home page
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // If trying to access admin route without admin privileges, redirect to home
  if (isAdminRoute && !user?.isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Otherwise, render the child routes (protected content)
  return <Outlet />;
};

export default ProtectedRoute; 