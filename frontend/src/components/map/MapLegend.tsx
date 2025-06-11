import React from "react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";
import { InfoIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSidebar } from "@/hooks/useSidebar";

interface MapLegendProps {
  globalAverage: number;
  darkMode: boolean;
  selectedMonth: string | null;
}

export const MapLegend: React.FC<MapLegendProps> = ({ 
  globalAverage, 
  darkMode,
  selectedMonth
}) => {
  const { state } = useSidebar();
  const isSidebarExpanded = state === "expanded";

  const leftPositionClass = isSidebarExpanded ? "left-[236px]" : "left-[109px]";

  // Format the month for display if provided
  const formattedMonth = selectedMonth && selectedMonth !== 'all' ? 
    new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 
    null;

  return (
    <div 
      className={cn(
        "fixed bottom-4 p-2 rounded-md shadow-lg",
        leftPositionClass,
        "w-auto max-w-[180px] sm:max-w-xs md:w-64 transform transition-all duration-300",
        "max-h-[calc(100vh-32px)] overflow-y-visible",
        darkMode ? "bg-gray-800/95 text-white scrollbar-dark" : "bg-white/95 text-gray-800 scrollbar-light",
        "backdrop-blur-sm z-50"
      )}
    >
      <div className="text-sm font-medium mb-2 flex justify-between items-center">
        <span>Price Legend (USD)</span>
        <span className="text-xs text-muted-foreground">
          Per package
        </span>
      </div>
      
      <div className="text-xs mb-2 flex items-center gap-1">
        {formattedMonth ? (
          <>
            <span>Global average ({formattedMonth}): ${formatPrice(globalAverage)} USD</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help">
                    <InfoIcon className="h-3 w-3 text-muted-foreground" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[250px] z-[100]">
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
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help">
                    <InfoIcon className="h-3 w-3 text-muted-foreground" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[250px] z-[100]">
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
      
      <div className="space-y-1.5 sm:space-y-1">
        <div className="flex items-center">
          <div className="w-5 h-5 sm:w-4 sm:h-4 rounded mr-2 sm:mr-1" style={{ backgroundColor: darkMode ? "#10b981" : "#34d399" }}></div>
          <span className="text-xs">Much cheaper (&lt; 70% of global avg.)</span>
        </div>
        <div className="flex items-center">
          <div className="w-5 h-5 sm:w-4 sm:h-4 rounded mr-2 sm:mr-1" style={{ backgroundColor: darkMode ? "#059669" : "#6ee7b7" }}></div>
          <span className="text-xs">Cheaper (70-85% of global avg.)</span>
        </div>
        <div className="flex items-center">
          <div className="w-5 h-5 sm:w-4 sm:h-4 rounded mr-2 sm:mr-1" style={{ backgroundColor: darkMode ? "#047857" : "#a7f3d0" }}></div>
          <span className="text-xs">Slightly cheaper (85-95% of global avg.)</span>
        </div>
        <div className="flex items-center">
          <div className="w-5 h-5 sm:w-4 sm:h-4 rounded mr-2 sm:mr-1" style={{ backgroundColor: darkMode ? "#ca8a04" : "#fcd34d" }}></div>
          <span className="text-xs">Average price (95-105% of global avg.)</span>
        </div>
        <div className="flex items-center">
          <div className="w-5 h-5 sm:w-4 sm:h-4 rounded mr-2 sm:mr-1" style={{ backgroundColor: darkMode ? "#b91c1c" : "#fca5a5" }}></div>
          <span className="text-xs">Slightly more expensive (105-115% of global avg.)</span>
        </div>
        <div className="flex items-center">
          <div className="w-5 h-5 sm:w-4 sm:h-4 rounded mr-2 sm:mr-1" style={{ backgroundColor: darkMode ? "#dc2626" : "#f87171" }}></div>
          <span className="text-xs">More expensive (115-130% of global avg.)</span>
        </div>
        <div className="flex items-center">
          <div className="w-5 h-5 sm:w-4 sm:h-4 rounded mr-2 sm:mr-1" style={{ backgroundColor: darkMode ? "#ef4444" : "#ef4444" }}></div>
          <span className="text-xs">Much more expensive (&gt; 130% of global avg.)</span>
        </div>
        <div className="flex items-center">
          <div className="w-5 h-5 sm:w-4 sm:h-4 rounded mr-2 sm:mr-1" style={{ backgroundColor: darkMode ? "#374151" : "#9ca3af" }}></div>
          <span className="text-xs">No data available</span>
        </div>
      </div>
    </div>
  );
};

export default MapLegend;
