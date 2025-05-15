
import React from "react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";

interface MapLegendProps {
  globalAverage: number;
  darkMode: boolean;
}

export const MapLegend: React.FC<MapLegendProps> = ({ 
  globalAverage, 
  darkMode
}) => {
  return (
    <div 
      className={cn(
        "absolute bottom-4 left-4 p-3 rounded-lg shadow-lg z-10",
        "w-56 sm:w-60 md:w-64 transform transition-all duration-300",
        "max-h-[calc(100vh-32px)] overflow-y-auto",
        darkMode ? "bg-gray-800/90 text-white scrollbar-dark" : "bg-white/90 text-gray-800 scrollbar-light"
      )}
    >
      <div className="text-sm font-medium mb-2 flex justify-between items-center">
        <span>Price Legend (USD)</span>
        <span className="text-xs text-muted-foreground">
          Per package
        </span>
      </div>
      <div className="text-xs mb-2">
        Global average: ${formatPrice(globalAverage)} USD
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center">
          <div className="w-5 h-5 rounded mr-2" style={{ backgroundColor: darkMode ? "#10b981" : "#34d399" }}></div>
          <span className="text-xs">Much cheaper (&lt; 80% of global avg.)</span>
        </div>
        <div className="flex items-center">
          <div className="w-5 h-5 rounded mr-2" style={{ backgroundColor: darkMode ? "#059669" : "#6ee7b7" }}></div>
          <span className="text-xs">Slightly cheaper (80-95% of global avg.)</span>
        </div>
        <div className="flex items-center">
          <div className="w-5 h-5 rounded mr-2" style={{ backgroundColor: darkMode ? "#ca8a04" : "#fcd34d" }}></div>
          <span className="text-xs">Average price (95-105% of global avg.)</span>
        </div>
        <div className="flex items-center">
          <div className="w-5 h-5 rounded mr-2" style={{ backgroundColor: darkMode ? "#dc2626" : "#fca5a5" }}></div>
          <span className="text-xs">Slightly more expensive (105-120% of global avg.)</span>
        </div>
        <div className="flex items-center">
          <div className="w-5 h-5 rounded mr-2" style={{ backgroundColor: darkMode ? "#ef4444" : "#f87171" }}></div>
          <span className="text-xs">Much more expensive (&gt; 120% of global avg.)</span>
        </div>
        <div className="flex items-center">
          <div className="w-5 h-5 rounded mr-2" style={{ backgroundColor: darkMode ? "#374151" : "#9ca3af" }}></div>
          <span className="text-xs">No data available</span>
        </div>
      </div>
    </div>
  );
};

export default MapLegend;
