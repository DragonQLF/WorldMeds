import React from "react";
import { Sidebar } from "./Sidebar";

interface LayoutProps {
  children: React.ReactNode;
  isExpanded: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  isExpanded,
  onMouseEnter,
  onMouseLeave
}) => {
  return (
    <div className="flex min-h-screen bg-background dark:bg-background text-foreground dark:text-foreground">
      <Sidebar 
        className="z-50" 
        isExpanded={isExpanded}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />
      <main className="flex-1 bg-background dark:bg-background text-foreground dark:text-foreground">
        <div className="h-full bg-background dark:bg-background">
          {children}
        </div>
      </main>
    </div>
  );
};
