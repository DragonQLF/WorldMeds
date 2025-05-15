
import { useState, useEffect } from "react";
import { LayoutDashboard, Settings, Shield, BarChart4, GitCompare } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

type NavigationItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  requiresAuth?: boolean;
  requiresAdmin?: boolean;
};

export const useSidebar = () => {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const [activeItem, setActiveItem] = useState("");

  // Check if user has admin privileges (checks both isAdmin property and role==='admin')
  const hasAdminPrivileges = user && (user.isAdmin || user.role === 'admin');

  // Log admin status for debugging
  useEffect(() => {
    console.log('Sidebar admin check:', { 
      user: user ? {
        id: user.id,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin
      } : null,
      hasAdminPrivileges
    });
  }, [user, hasAdminPrivileges]);

  // Define navigation items with their routes and icons
  const allNavigationItems: NavigationItem[] = [
    {
      label: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
    },
    {
      label: "Stats",
      href: "/stats",
      icon: BarChart4,
      requiresAuth: true,
    },
    {
      label: "Comparison",
      href: "/comparison",
      icon: GitCompare,
      requiresAuth: true,
    },
    {
      label: "Admin",
      href: "/admin",
      icon: Shield,
      requiresAuth: true,
      requiresAdmin: true,
    },
    {
      label: "Settings",
      href: "/settings",
      icon: Settings,
      requiresAuth: true,
    },
  ];

  // Filter navigation items based on authentication and admin status
  const navigationItems = allNavigationItems.filter(item => {
    // Skip items that require authentication if user is not authenticated
    if (item.requiresAuth && !isAuthenticated) {
      return false;
    }
    
    // Skip items that require admin if user doesn't have admin privileges
    if (item.requiresAdmin && !hasAdminPrivileges) {
      return false;
    }
    
    return true;
  });

  // Update active item based on current location
  useEffect(() => {
    setActiveItem(location.pathname);
  }, [location.pathname]);

  return {
    navigationItems,
    activeItem,
  };
};
