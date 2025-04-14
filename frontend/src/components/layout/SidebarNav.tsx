
import React from "react";
import { useLocation } from "react-router-dom";
import { LayoutGrid, Settings } from "lucide-react";

interface SidebarNavProps {
  isExpanded: boolean;
  toggleMobileMenu?: () => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({ isExpanded, toggleMobileMenu }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    {
      name: "Dashboard",
      icon: <LayoutGrid className="w-6 h-6" />,
      path: "/",
    },
    {
      name: "Settings",
      icon: <Settings className="w-6 h-6" />,
      path: "/settings",
    },
  ];

  return (
    <nav className="flex h-[550px] flex-col items-start gap-4 self-stretch w-full">
      <div className="w-full mt-16 space-y-4">
        {navItems.map((item) => {
          const isActive = currentPath === item.path;
          return (
            <button
              key={item.name}
              className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg w-full transition-all duration-200 ${
                isActive
                  ? "bg-blue-500 text-white"
                  : "hover:bg-gray-100 text-gray-500"
              }`}
            >
              {item.icon}
              {isExpanded && (
                <span className={`transition-opacity duration-200 ${isActive ? "font-medium" : ""}`}>
                  {item.name}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
