import { useState, useEffect } from "react";
import { LayoutDashboard, Settings } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

type NavigationItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  requiresAuth?: boolean;
};

export const useSidebar = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [activeItem, setActiveItem] = useState("");

  // Define navigation items with their routes and icons
  const allNavigationItems: NavigationItem[] = [
    {
      label: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
    },
    {
      label: "Settings",
      href: "/settings",
      icon: Settings,
    },
  ];

  // Filter navigation items based on authentication status
  const navigationItems = allNavigationItems.filter(item => {
    if (item.requiresAuth) {
      return isAuthenticated;
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