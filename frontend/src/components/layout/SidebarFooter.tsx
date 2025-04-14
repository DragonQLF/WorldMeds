
import React from "react";
import { LogIn, Moon } from "lucide-react";
import { useTheme } from "next-themes";

interface SidebarFooterProps {
  isExpanded: boolean;
}

export const SidebarFooter: React.FC<SidebarFooterProps> = ({ isExpanded }) => {
  const { setTheme } = useTheme();

  const toggleDarkMode = () => {
    setTheme("dark");
  };

  return (
    <footer className="flex flex-col items-start gap-4 w-full">
      <button className="flex items-center gap-3 cursor-pointer p-3 rounded-lg w-full hover:bg-gray-100 text-gray-500">
        <LogIn className="w-6 h-6" />
        {isExpanded && <span>Login</span>}
      </button>
      <button 
        className="flex items-center gap-3 cursor-pointer p-3 rounded-lg w-full hover:bg-gray-100 text-gray-500"
        onClick={toggleDarkMode}
      >
        <Moon className="w-6 h-6" />
        {isExpanded && <span>Dark</span>}
      </button>
    </footer>
  );
};
