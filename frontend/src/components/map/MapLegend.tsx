import React, { useEffect } from "react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";
import { InfoIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";

interface MapLegendProps {
  globalAverage: number;
  darkMode: boolean;
  selectedMonth: string | null;
  isSidebarExpanded: boolean;
  isMobile: boolean;
  isDateSliderOpen: boolean;
}

export const MapLegend: React.FC<MapLegendProps> = ({ 
  globalAverage, 
  darkMode,
  selectedMonth,
  isSidebarExpanded,
  isMobile,
  isDateSliderOpen
}) => {
  const [isExpanded, setIsExpanded] = React.useState(!isMobile);

  // Reset expansion state when switching between mobile and desktop
  useEffect(() => {
    setIsExpanded(!isMobile);
  }, [isMobile]);

  const leftPositionClass = isMobile 
    ? (isSidebarExpanded ? "left-[300px]" : "left-4")
    : (isSidebarExpanded ? "left-[236px]" : "left-[109px]");

  const bottomPositionClass = isMobile && isDateSliderOpen
    ? "bottom-[160px]"
    : "bottom-4";

  const formattedMonth = selectedMonth && selectedMonth !== 'all' ? 
    new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 
    null;

  const GlobalAverageInfo = () => (
    <div className="text-xs flex items-center gap-1">
      {formattedMonth ? (
        <>
          <span>Global average ({formattedMonth}): ${formatPrice(globalAverage)} USD</span>
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-help">
                  <InfoIcon className="h-3 w-3 text-muted-foreground" />
                </div>
              </TooltipTrigger>
              <TooltipContent 
                side="top" 
                className="z-[9999] relative w-60 p-2 text-xs"
                sideOffset={5}
                align="center"
              >
                <p>Using {formattedMonth} conversion rates</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  All prices are converted to USD using the exchange rates from {formattedMonth}.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </>
      ) : (
        <>
          <span>Global average (All Time): ${formatPrice(globalAverage)} USD</span>
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="cursor-help">
                  <InfoIcon className="h-3 w-3 text-muted-foreground" />
                </div>
              </TooltipTrigger>
              <TooltipContent 
                side="top" 
                className="z-[9999] relative w-60 p-2 text-xs"
                sideOffset={5}
                align="center"
              >
                <p>Average price across all available months.</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Each price is converted to USD using the historical exchange rate from its respective month.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </>
      )}
    </div>
  );

  return (
    <div 
      className={cn(
        "fixed p-2 rounded-md shadow-lg transition-all duration-300 ease-in-out",
        leftPositionClass,
        bottomPositionClass,
        isMobile ? "w-auto max-w-[calc(100vw-32px)]" : "w-auto max-w-[180px] sm:max-w-xs md:w-64",
        darkMode ? "bg-gray-800/95 text-white" : "bg-white/95 text-gray-800",
        "backdrop-blur-sm z-10"
      )}
    >
      <div className="text-sm font-medium mb-2 flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <span>Price Legend (USD)</span>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            Per package
          </span>
          {isMobile && (
            <button 
              onClick={() => setIsExpanded(!isExpanded)} 
              className="ml-auto p-1 rounded-full hover:bg-gray-700/50 focus:outline-none"
              aria-label={isExpanded ? "Collapse legend" : "Expand legend"}
            >
              {isExpanded ? (
                <ChevronUpIcon className="h-4 w-4" />
              ) : (
                <ChevronDownIcon className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
        {(!isExpanded && isMobile) && <GlobalAverageInfo />}
      </div>
      
      {(isExpanded || !isMobile) && (
        <div className="max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600">
          {(isExpanded || !isMobile) && <GlobalAverageInfo />}
          
          <div className="space-y-1.5 mt-2">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded mr-2" style={{ backgroundColor: darkMode ? "#10b981" : "#34d399" }}></div>
              <span className="text-xs">Much cheaper (&lt; 70% of global avg.)</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded mr-2" style={{ backgroundColor: darkMode ? "#059669" : "#6ee7b7" }}></div>
              <span className="text-xs">Cheaper (70-85% of global avg.)</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded mr-2" style={{ backgroundColor: darkMode ? "#047857" : "#a7f3d0" }}></div>
              <span className="text-xs">Slightly cheaper (85-95% of global avg.)</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded mr-2" style={{ backgroundColor: darkMode ? "#ca8a04" : "#fcd34d" }}></div>
              <span className="text-xs">Average price (95-105% of global avg.)</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded mr-2" style={{ backgroundColor: darkMode ? "#b91c1c" : "#fca5a5" }}></div>
              <span className="text-xs">Slightly more expensive (105-115% of global avg.)</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded mr-2" style={{ backgroundColor: darkMode ? "#dc2626" : "#f87171" }}></div>
              <span className="text-xs">More expensive (115-130% of global avg.)</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded mr-2" style={{ backgroundColor: darkMode ? "#ef4444" : "#ef4444" }}></div>
              <span className="text-xs">Much more expensive (&gt; 130% of global avg.)</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded mr-2" style={{ backgroundColor: darkMode ? "#374151" : "#9ca3af" }}></div>
              <span className="text-xs">No data available</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapLegend;
