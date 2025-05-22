
import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback } from "react";
import { useTheme } from "next-themes";
import { format, parseISO } from "date-fns";
import { api } from "@/lib/api";

type VisualizationType = "markers" | "graphs"; // "markers" shows tooltips, "graphs" shows detailed view

interface DateRange {
  from: Date;
  to?: Date;
}

interface MapContextProps {
  visualizationType: VisualizationType;
  setVisualizationType: React.Dispatch<React.SetStateAction<VisualizationType>>;
  darkMode: boolean;
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  toggleDarkMode: () => void;
  selectedDate: Date | null;
  setSelectedDate: React.Dispatch<React.SetStateAction<Date | null>>;
  dateRange: DateRange | null;
  setDateRange: React.Dispatch<React.SetStateAction<DateRange | null>>;
  selectedMonth: string | null;
  setSelectedMonth: React.Dispatch<React.SetStateAction<string | null>>;
  showMonthPicker: boolean;
  setShowMonthPicker: React.Dispatch<React.SetStateAction<boolean>>;
  availableMonths: string[];
  setAvailableMonths: React.Dispatch<React.SetStateAction<string[]>>;
  isMonthAvailable: (month: string) => boolean;
  useTimeFiltering: boolean;
  setUseTimeFiltering: React.Dispatch<React.SetStateAction<boolean>>;
}

const defaultContext: MapContextProps = {
  visualizationType: "markers",
  setVisualizationType: () => {},
  darkMode: false,
  setDarkMode: () => {},
  toggleDarkMode: () => {},
  selectedDate: null,
  setSelectedDate: () => {},
  dateRange: null,
  setDateRange: () => {},
  selectedMonth: null,
  setSelectedMonth: () => {},
  showMonthPicker: false,
  setShowMonthPicker: () => {},
  availableMonths: [],
  setAvailableMonths: () => {},
  isMonthAvailable: () => false,
  useTimeFiltering: true,
  setUseTimeFiltering: () => {},
};

const MapContext = createContext<MapContextProps>(defaultContext);

export const useMapContext = () => useContext(MapContext);

export function MapProvider({ children }: { children: ReactNode }) {
  const { theme, setTheme } = useTheme();
  const [visualizationType, setVisualizationType] = useState<VisualizationType>("markers");
  const [darkMode, setDarkMode] = useState<boolean>(theme === "dark");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  
  // Initialize with current month by default
  const currentMonth = format(new Date(), 'yyyy-MM');
  const [selectedMonth, setSelectedMonth] = useState<string | null>(currentMonth);
  
  const [showMonthPicker, setShowMonthPicker] = useState<boolean>(false);
  
  // Available months from the database - will be populated from API
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [isLoadingMonths, setIsLoadingMonths] = useState<boolean>(true);
  
  // Add time filtering state - default to true
  const [useTimeFiltering, setUseTimeFiltering] = useState<boolean>(true);

  // Memoized function to check if a month is available
  const isMonthAvailable = useCallback((month: string): boolean => {
    return month === 'all' || availableMonths.includes(month);
  }, [availableMonths]);

  // Sync theme changes with darkMode state
  useEffect(() => {
    setDarkMode(theme === "dark");
  }, [theme]);

  // Function to toggle dark mode
  const toggleDarkMode = useCallback(() => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    setDarkMode(newTheme === "dark");
  }, [theme, setTheme]);

  // Fetch available months from API when component mounts
  useEffect(() => {
    const fetchAvailableMonths = async () => {
      setIsLoadingMonths(true);
      try {
        // Get available months from API
        const response = await api.get('/available-months');
        const months = response.data;
        
        if (months && months.length > 0) {
          setAvailableMonths(months);
          
          // If the current selected month is not available, reset to most recent month
          if (selectedMonth && selectedMonth !== 'all' && !months.includes(selectedMonth)) {
            setSelectedMonth(months[0]);
          }
        } else {
          // Fallback to current month if API returns no data
          console.warn("No available months returned from API, using fallback");
          setAvailableMonths([currentMonth]);
        }
      } catch (error) {
        console.error("Failed to fetch available months:", error);
        // Fallback: Set current month only
        setAvailableMonths([currentMonth]);
      } finally {
        setIsLoadingMonths(false);
      }
    };

    fetchAvailableMonths();
  }, []);

  // Create a memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    visualizationType,
    setVisualizationType,
    darkMode,
    setDarkMode,
    toggleDarkMode,
    selectedDate,
    setSelectedDate,
    dateRange, 
    setDateRange,
    selectedMonth,
    setSelectedMonth,
    showMonthPicker,
    setShowMonthPicker,
    availableMonths,
    setAvailableMonths,
    isMonthAvailable,
    useTimeFiltering,
    setUseTimeFiltering,
  }), [
    visualizationType, 
    darkMode,
    toggleDarkMode, 
    selectedDate, 
    dateRange, 
    selectedMonth, 
    showMonthPicker,
    availableMonths,
    isMonthAvailable,
    useTimeFiltering,
  ]);

  return (
    <MapContext.Provider value={contextValue}>
      {children}
    </MapContext.Provider>
  );
}
