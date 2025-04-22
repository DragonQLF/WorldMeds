
import React from "react";
import { LogIn, LogOut, Moon, Sun, User } from "lucide-react";
import { useMapContext } from "@/contexts/MapContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

interface SidebarFooterProps {
  isExpanded: boolean;
}

export const SidebarFooter: React.FC<SidebarFooterProps> = ({ isExpanded }) => {
  const { darkMode, setDarkMode } = useMapContext();
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleLoginClick = () => {
    navigate("/auth/login");
  };

  return (
    <footer className="flex flex-col items-start gap-4 w-full">
      {isAuthenticated ? (
        <Sheet>
          <SheetTrigger asChild>
            <button className="flex items-center gap-3 cursor-pointer p-3 rounded-lg w-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400">
              <User className="w-6 h-6" />
              {isExpanded && <span>{user?.firstName || "Profile"}</span>}
            </button>
          </SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle>Your Account</SheetTitle>
              <SheetDescription>
                {user?.firstName} {user?.lastName}
              </SheetDescription>
            </SheetHeader>
            <div className="py-6">
              <h3 className="text-sm font-medium">{user?.email}</h3>
            </div>
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={logout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </SheetContent>
        </Sheet>
      ) : (
        <button 
          className="flex items-center gap-3 cursor-pointer p-3 rounded-lg w-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
          onClick={handleLoginClick}
        >
          <LogIn className="w-6 h-6" />
          {isExpanded && <span>Login</span>}
        </button>
      )}

      <button 
        className="flex items-center gap-3 cursor-pointer p-3 rounded-lg w-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400"
        onClick={toggleDarkMode}
      >
        {darkMode ? (
          <Sun className="w-6 h-6" />
        ) : (
          <Moon className="w-6 h-6" />
        )}
        {isExpanded && <span>{darkMode ? "Light" : "Dark"}</span>}
      </button>
    </footer>
  );
};
