import React from "react";
import { Sidebar } from "./Sidebar";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-background dark:bg-background text-foreground dark:text-foreground">
      <Sidebar />
      <main className="flex-1 bg-background dark:bg-background text-foreground dark:text-foreground">
        <div className="h-full w-full bg-background dark:bg-background">
          {children}
        </div>
      </main>
    </div>
  );
};
