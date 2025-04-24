import React, { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { useTheme } from "next-themes";

type VisualizationType = "markers" | "graphs";

interface DateRange {
  from?: Date;
  to?: Date;
}

interface MapContextType {
  visualizationType: VisualizationType;
  setVisualizationType: (type: VisualizationType) => void;
  selectedDate: Date | null;
  setSelectedDate: (date: Date | null) => void;
  dateRange: DateRange | null;
  setDateRange: (range: DateRange | null) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

export const MapProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [visualizationType, setVisualizationType] = useState<VisualizationType>("markers");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const { theme, setTheme } = useTheme();
  const [darkMode, setDarkMode] = useState<boolean>(false);
  
  // Sync darkMode state with theme
  useEffect(() => {
    setDarkMode(theme === 'dark');
  }, [theme]);
  
  // Toggle dark mode function
  const toggleDarkMode = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  return (
    <MapContext.Provider
      value={{
        visualizationType,
        setVisualizationType,
        selectedDate,
        setSelectedDate,
        dateRange,
        setDateRange,
        darkMode,
        toggleDarkMode,
      }}
    >
      {children}
    </MapContext.Provider>
  );
};

export const useMapContext = () => {
  const context = useContext(MapContext);
  if (context === undefined) {
    throw new Error("useMapContext must be used within a MapProvider");
  }
  return context;
};
