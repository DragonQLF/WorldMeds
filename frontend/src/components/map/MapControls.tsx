import React, { useState, useEffect } from "react";
import { Calendar, ZoomIn, ZoomOut, Map, LineChart } from "lucide-react";
import { useMapContext } from "@/contexts/MapContext";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export const MapControls: React.FC<MapControlsProps> = ({
  onZoomIn,
  onZoomOut,
}) => {
  const { 
    visualizationType, 
    setVisualizationType, 
    selectedDate,
    setSelectedDate,
    darkMode
  } = useMapContext();
  
  const [isVisible, setIsVisible] = useState(false);
  
  // Animation to fade in controls
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  const controlClass = "w-8 h-8 flex items-center justify-center transition-transform duration-200 hover:scale-110";
  const activeClass = "bg-blue-100 dark:bg-purple-900 border-blue-500 dark:border-purple-600 text-[#007AFF] dark:text-white";

  return (
    <div 
      className={`fixed bottom-4 right-4 flex flex-col gap-1 z-10 transition-all duration-500 ease-in-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}
    >
      {/* Date control */}
      <div className="flex flex-col gap-1 p-1 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-white border border-gray-200 dark:border-gray-700 shadow-lg transition-all duration-200 hover:shadow-xl">
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn(controlClass)}
            >
              <Calendar className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-background dark:bg-background border dark:border-border" align="end">
            <CalendarComponent
              mode="single"
              selected={selectedDate || undefined}
              onSelect={(date) => date && setSelectedDate(date)}
              initialFocus
              className="bg-background dark:bg-background text-foreground dark:text-foreground"
            />
          </PopoverContent>
        </Popover>
      </div>
      
      {/* Visualization controls as a toggle switch */}
      <div className="flex flex-col gap-1 p-1 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg transition-all duration-200 hover:shadow-xl">
        <div className="flex flex-col gap-1">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              controlClass,
              visualizationType === "markers" ? activeClass : "text-gray-500 dark:text-gray-400"
            )}
            onClick={() => setVisualizationType("markers")}
          >
            <Map className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              controlClass,
              visualizationType === "graphs" ? activeClass : "text-gray-500 dark:text-gray-400"
            )}
            onClick={() => setVisualizationType("graphs")}
          >
            <LineChart className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Zoom Controls */}
      <div className="flex flex-col gap-1 p-1 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-white border border-gray-200 dark:border-gray-700 shadow-lg transition-all duration-200 hover:shadow-xl">
        <div className="grid grid-cols-1 gap-1">
          <Button 
            onClick={onZoomIn} 
            variant="ghost" 
            size="icon" 
            className={cn(controlClass, "active:scale-95")}
          >
            <ZoomIn className="h-3 w-3" />
          </Button>
          <Button 
            onClick={onZoomOut} 
            variant="ghost" 
            size="icon" 
            className={cn(controlClass, "active:scale-95")}
          >
            <ZoomOut className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};
