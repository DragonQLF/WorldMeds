
import React, { createContext, useState, useContext, ReactNode } from "react";

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
  setDarkMode: (darkMode: boolean) => void;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

export const MapProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [visualizationType, setVisualizationType] = useState<VisualizationType>("markers");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(false);

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
        setDarkMode,
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
