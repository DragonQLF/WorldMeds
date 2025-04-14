
import React from "react";
import { useLocation } from "react-router-dom";
import { X, LayoutGrid, Settings, LogIn, Moon } from "lucide-react";
import { SidebarLogo } from "./SidebarLogo";
import { useTheme } from "next-themes";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const { setTheme } = useTheme();

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <div className="flex justify-between items-center p-4 border-b">
        <SidebarLogo isExpanded={true} />
        <button 
          onClick={onClose} 
          className="p-2 rounded-md hover:bg-gray-100"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      
      <nav className="flex-1 p-4">
        <div className="space-y-4 mt-8">
          {navItems.map((item) => {
            const isActive = currentPath === item.path;
            return (
              <button
                key={item.name}
                className={`flex items-center gap-3 p-4 rounded-lg w-full transition-all duration-200 ${
                  isActive
                    ? "bg-blue-500 text-white"
                    : "hover:bg-gray-100 text-gray-500"
                }`}
              >
                {item.icon}
                <span className={`${isActive ? "font-medium" : ""}`}>
                  {item.name}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
      
      <div className="p-4 border-t">
        <button className="flex items-center gap-3 p-4 rounded-lg w-full hover:bg-gray-100 text-gray-500">
          <LogIn className="w-6 h-6" />
          <span>Login</span>
        </button>
        <button 
          className="flex items-center gap-3 p-4 rounded-lg w-full hover:bg-gray-100 text-gray-500"
          onClick={() => setTheme("dark")}
        >
          <Moon className="w-6 h-6" />
          <span>Dark</span>
        </button>
      </div>
    </div>
  );
};
