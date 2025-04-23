import React from "react";
import { useNavigate } from "react-router-dom";
import { useSidebar } from "@/hooks/useSidebar";

interface SidebarNavProps {
  isExpanded: boolean;
  toggleMobileMenu?: () => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({ isExpanded, toggleMobileMenu }) => {
  const { navigationItems, activeItem } = useSidebar();
  const navigate = useNavigate();

  const handleNavigation = (href: string) => {
    navigate(href);
    if (toggleMobileMenu) {
      toggleMobileMenu();
    }
  };

  return (
    <nav className="flex flex-col items-start gap-4 self-stretch w-full py-10">
      <div className="w-full space-y-2">
        {navigationItems.map((item, index) => {
          const isActive = activeItem === item.href;
          return (
            <button
              key={index}
              onClick={() => handleNavigation(item.href)}
              className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg w-full transition-all duration-200 ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-gray-500 dark:text-gray-300"
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? "text-primary-foreground" : ""}`} />
              {isExpanded && (
                <span className={`transition-opacity duration-200 ${isActive ? "font-medium" : ""}`}>
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
