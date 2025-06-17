import React from "react";
import { Sidebar } from "./Sidebar";

interface LayoutProps {
  children: React.ReactNode;
  isExpanded: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onMobileSidebarOpen?: () => void;
  onMobileSidebarClose?: () => void;
  isMobileSidebarOpen?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  isExpanded,
  onMouseEnter,
  onMouseLeave,
  onMobileSidebarOpen,
  onMobileSidebarClose,
  isMobileSidebarOpen
}) => {
  return (
    <div className="flex min-h-screen bg-background dark:bg-background text-foreground dark:text-foreground">
      <Sidebar 
        className="z-50" 
        isExpanded={isExpanded}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onMobileSidebarOpen={onMobileSidebarOpen}
        onMobileSidebarClose={onMobileSidebarClose}
        isMobileSidebarOpen={isMobileSidebarOpen}
      />
      <main className="flex-1 bg-background dark:bg-background text-foreground dark:text-foreground">
        <div className="h-full bg-background dark:bg-background">
          {children}
        </div>
      </main>
    </div>
  );
};
