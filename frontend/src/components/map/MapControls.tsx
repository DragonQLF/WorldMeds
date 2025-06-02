import React, { useState, useEffect, useRef, memo } from "react";
import { Calendar, ZoomIn, ZoomOut, MapPin, BarChart2, Map, Layers, ListTree } from "lucide-react";
import { useMapContext } from "@/contexts/MapContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onToggleLegend?: () => void;
  showLegend?: boolean;
}

export const MapControls: React.FC<MapControlsProps> = memo(({
  onZoomIn,
  onZoomOut,
  onToggleLegend,
  showLegend = true,
}) => {
  const { 
    visualizationType, 
    setVisualizationType, 
    selectedMonth,
    setSelectedMonth,
    showMonthPicker, 
    setShowMonthPicker
  } = useMapContext();
  
  const [isVisible, setIsVisible] = useState(false);
  const calendarButtonRef = useRef<HTMLButtonElement>(null);
  const isMobile = useIsMobile();
  
  // Animation to fade in controls
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  // Toggle month picker
  const toggleMonthPicker = () => {
    setShowMonthPicker(prev => !prev);
  };

  const controlClass = "w-8 h-8 flex items-center justify-center transition-transform duration-200 hover:scale-110";
  const activeClass = "bg-blue-100 dark:bg-purple-900 border-blue-500 dark:border-purple-600 text-[#007AFF] dark:text-white";

  return (
    <div 
      className={`fixed ${isMobile ? 'bottom-4 left-1/2 -translate-x-1/2' : 'bottom-4 right-4'} 
      ${isMobile ? 'flex flex-row gap-1' : 'flex flex-col gap-1'} 
      z-10 transition-all duration-500 ease-in-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
    >
      {/* Visualization controls */}
      <div className={`${isMobile ? 'flex flex-row' : 'flex flex-col'} gap-1 p-1 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg transition-all duration-200 hover:shadow-xl`}>
        <div className={`${isMobile ? 'flex flex-row' : 'flex flex-col'} gap-1`}>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              controlClass,
              visualizationType === "markers" ? activeClass : "text-gray-500 dark:text-gray-400"
            )}
            onClick={() => setVisualizationType("markers")}
            title="Markers View"
            aria-label="Toggle Markers View"
          >
            <MapPin className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              controlClass,
              visualizationType === "graphs" ? activeClass : "text-gray-500 dark:text-gray-400"
            )}
            onClick={() => setVisualizationType("graphs")}
            title="Detailed View"
            aria-label="Toggle Detailed View"
          >
            <BarChart2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Calendar icon to trigger date picker */}
      <div className="flex p-1 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-white border border-gray-200 dark:border-gray-700 shadow-lg transition-all duration-200 hover:shadow-xl">
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            controlClass,
            showMonthPicker ? activeClass : "text-gray-500 dark:text-gray-400"
          )}
          onClick={toggleMonthPicker}
          title={showMonthPicker ? "Hide Month Picker" : "Show Month Picker"}
          aria-label={showMonthPicker ? "Hide Month Picker" : "Show Month Picker"}
          ref={calendarButtonRef}
        >
          <Calendar className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Month picker popup */}
      
      {/* Legend Toggle */}
      {onToggleLegend && (
        <div className="flex p-1 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-white border border-gray-200 dark:border-gray-700 shadow-lg transition-all duration-200 hover:shadow-xl">
          <Button
            variant="ghost"
            size="icon"
            className={cn(controlClass, showLegend ? activeClass : "")}
            onClick={onToggleLegend}
            title={showLegend ? "Hide Legend" : "Show Legend"}
            aria-label={showLegend ? "Toggle Legend Visibility" : "Toggle Legend Visibility"}
          >
            <ListTree className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      {/* Zoom Controls */}
      <div className={`${isMobile ? 'flex flex-row' : 'flex flex-col'} gap-1 p-1 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-white border border-gray-200 dark:border-gray-700 shadow-lg transition-all duration-200 hover:shadow-xl`}>
        <div className={`${isMobile ? 'grid grid-cols-2' : 'grid grid-cols-1'} gap-1`}>
          <Button 
            onClick={onZoomIn} 
            variant="ghost" 
            size="icon" 
            className={cn(controlClass, "active:scale-95")}
            aria-label="Zoom In"
          >
            <ZoomIn className="h-3 w-3" />
          </Button>
          <Button 
            onClick={onZoomOut} 
            variant="ghost" 
            size="icon" 
            className={cn(controlClass, "active:scale-95")}
            aria-label="Zoom Out"
          >
            <ZoomOut className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
});

MapControls.displayName = "MapControls";

export default MapControls;
