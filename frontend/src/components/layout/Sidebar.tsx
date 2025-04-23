import React, { useState, useEffect } from "react";
import { SidebarLogo } from "./SidebarLogo";
import { SidebarNav } from "./SidebarNav";
import { SidebarFooter } from "./SidebarFooter";
import { MobileNav } from "./MobileNav";
import { Menu } from "lucide-react";

export const Sidebar: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener
    window.addEventListener('resize', checkIfMobile);
    
    // Add animation init
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkIfMobile);
      clearTimeout(timer);
    };
  }, []);

  const handleMouseEnter = () => {
    if (!isMobile) {
      setIsExpanded(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      setIsExpanded(false);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // For mobile: show hamburger menu button when closed, or MobileNav when open
  if (isMobile) {
    return (
      <>
        {!isMobileMenuOpen && (
          <div className={`fixed top-4 left-4 z-50 transition-opacity duration-300 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
            <button 
              onClick={toggleMobileMenu} 
              className="p-2 rounded-md hover:bg-gray-100 transition-all duration-200 hover:shadow-md active:scale-95"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        )}
        <MobileNav isOpen={isMobileMenuOpen} onClose={toggleMobileMenu} />
      </>
    );
  }

  // For desktop: show sidebar
  return (
    <aside 
      className={`flex h-screen flex-col justify-between items-start bg-background dark:bg-sidebar py-10 transition-all duration-300 ease-in-out shadow-lg ${
        isExpanded ? "w-[220px] px-5" : "w-[93px] px-6"
      } ${isLoaded ? 'translate-x-0 opacity-100' : '-translate-x-10 opacity-0'}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <SidebarLogo isExpanded={isExpanded} />
      <SidebarNav isExpanded={isExpanded} />
      <SidebarFooter isExpanded={isExpanded} />
    </aside>
  );
};
