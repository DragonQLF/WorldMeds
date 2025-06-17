import React, { useState, useEffect } from "react";
import { SidebarLogo } from "./SidebarLogo";
import { SidebarNav } from "./SidebarNav";
import { SidebarFooter } from "./SidebarFooter";
import { MobileNav } from "./MobileNav";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  className?: string;
  isExpanded: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onMobileSidebarOpen?: () => void;
  onMobileSidebarClose?: () => void;
  isMobileSidebarOpen?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  className, 
  isExpanded,
  onMouseEnter,
  onMouseLeave,
  onMobileSidebarOpen,
  onMobileSidebarClose,
  isMobileSidebarOpen
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => {
      window.removeEventListener('resize', checkIfMobile);
      clearTimeout(timer);
    };
  }, []);

  const handleMobileMenuOpen = () => {
    if (onMobileSidebarOpen) onMobileSidebarOpen();
  };
  const handleMobileMenuClose = () => {
    if (onMobileSidebarClose) onMobileSidebarClose();
  };

  if (isMobile) {
    return (
      <>
        {!isMobileSidebarOpen && (
          <div className={`fixed top-4 left-4 z-50 transition-opacity duration-300 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
            <button 
              onClick={handleMobileMenuOpen} 
              className="p-2 rounded-md bg-background dark:bg-background text-foreground dark:text-foreground hover:bg-accent dark:hover:bg-accent transition-all duration-200 hover:shadow-md active:scale-95"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        )}
        <MobileNav isOpen={!!isMobileSidebarOpen} onClose={handleMobileMenuClose} />
      </>
    );
  }

  // For desktop: show sidebar
  return (
    <aside 
      className={cn(`flex h-screen flex-col justify-between items-start bg-background dark:bg-background border-r border-border dark:border-border py-10 transition-all duration-300 ease-in-out shadow-lg z-50 ${
        isExpanded ? "w-[220px] px-5" : "w-[93px] px-6"
      } ${isLoaded ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}`, className)}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ minWidth: isExpanded ? "220px" : "93px" }}
    >
      <SidebarLogo isExpanded={isExpanded} />
      <SidebarNav isExpanded={isExpanded} />
      <SidebarFooter isExpanded={isExpanded} />
    </aside>
  );
};
