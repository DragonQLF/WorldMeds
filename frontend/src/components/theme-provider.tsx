"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: string;
  storageKey?: string;
  enableSystem?: boolean;
};

export function ThemeProvider({ 
  children, 
  defaultTheme = "system",
  storageKey = "worldmeds-theme",
  enableSystem = true,
  ...props 
}: ThemeProviderProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    // Update Chrome tab color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#1a1a1a' : '#ffffff');
    }
  }, [mounted]);

  if (!mounted) {
    return null;
  }

  return (
    <NextThemesProvider
      defaultTheme={defaultTheme}
      storageKey={storageKey}
      enableSystem={enableSystem}
      attribute="class"
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
