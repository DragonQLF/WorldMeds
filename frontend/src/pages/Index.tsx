
import { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import InteractiveMap from "@/components/map/InteractiveMap";
import { SearchModal } from "@/components/search/SearchModal";
import { useMapContext } from "@/contexts/MapContext";
import { CountryDetail } from "@/components/map/CountryDetail";
import { Info, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null);
  const [showCountryDetail, setShowCountryDetail] = useState<boolean>(false);
  const { darkMode, visualizationType, selectedDate, dateRange, selectedMonth } = useMapContext();
  const isMobile = useIsMobile();
  
  // Reset the detail view when component mounts or when date filters change
  useEffect(() => {
    // Only close the country detail if a date filter changes and a country is currently shown
    if (selectedCountryId && showCountryDetail) {
      // Keep the detail open but trigger a refresh by toggling and resetting
      setShowCountryDetail(false);
      setTimeout(() => {
        if (selectedCountryId) {
          setShowCountryDetail(true);
        }
      }, 100);
    }
  }, [selectedDate, dateRange, selectedMonth]);

  // Handle country selection from search or map
  const handleCountrySelect = (country: any) => {
    console.log("Selected country from search:", country);
    if (country && country.id) {
      // If selecting the same country that's already shown, close it instead
      if (selectedCountryId === country.id.toString() && showCountryDetail) {
        setSelectedCountryId(null);
        setShowCountryDetail(false);
      } else {
        setSelectedCountryId(country.id.toString());
        // Only show details panel if in graph mode or from search
        setShowCountryDetail(true);
      }
    }
  };

  // Handle closing the country detail
  const handleCloseCountryDetail = () => {
    setSelectedCountryId(null);
    setShowCountryDetail(false);
  };
  
  // Get current selection label
  const getCurrentMonthLabel = () => {
    if (!selectedMonth || selectedMonth === "all") {
      return "All Time";
    }
    
    try {
      const date = parseISO(selectedMonth);
      return format(date, 'MMM yyyy');
    } catch (e) {
      console.error("Error parsing date:", e);
      return "All Time";
    }
  };

  return (
    <Layout>
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-background dark:bg-gray-950">
        {/* Search and help buttons */}
        <div className={cn(
          "absolute z-10 flex space-x-2",
          isMobile ? "top-2 right-2" : "top-4 right-4"
        )}>
          <SearchModal type="country" onSelect={handleCountrySelect} />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link to="/settings">
                  <Button
                    variant="outline"
                    size={isMobile ? "icon" : "sm"}
                    className={cn(
                      "flex items-center justify-center",
                      isMobile ? "w-8 h-8" : "w-8 h-8 md:w-auto md:h-auto md:px-3 md:py-2",
                      "bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
                    )}
                  >
                    <Settings className="h-4 w-4" />
                    <span className="hidden md:inline ml-2">Settings</span>
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side={isMobile ? "left" : "bottom"}>
                Configure application settings
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size={isMobile ? "icon" : "sm"}
                  className={cn(
                    "flex items-center justify-center",
                    isMobile ? "w-8 h-8" : "w-8 h-8 md:w-auto md:h-auto md:px-3 md:py-2",
                    "bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
                  )}
                >
                  <Info className="h-4 w-4" />
                  <span className="hidden md:inline ml-2">Guide</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side={isMobile ? "left" : "bottom"} className="max-w-[300px] p-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">How to use the map:</h4>
                  <ul className="text-xs space-y-1 list-disc pl-4">
                    <li>Colors represent medicine prices relative to global average</li>
                    <li>Click on a country to view detailed medicine information</li>
                    <li>Use the map controls to change view mode and time period</li>
                    <li>Toggle the legend to understand the color coding</li>
                    <li>Search for countries using the search button</li>
                    <li>Change display settings in the Settings page</li>
                    <li>All prices shown are per package (sale price)</li>
                  </ul>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <InteractiveMap 
          onCountryClick={handleCountrySelect} 
        />
        
        {/* Country details modal - only show when in details view or explicitly opened */}
        {showCountryDetail && (
          <CountryDetail
            countryId={selectedCountryId}
            onClose={handleCloseCountryDetail}
          />
        )}
      </div>
    </Layout>
  );
};

export default Index;
