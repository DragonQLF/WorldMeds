import React, { useState } from "react";
import { Calendar, ZoomIn, ZoomOut, Map, LineChart } from "lucide-react";
import { format, subMonths } from "date-fns";
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

  const bgClass = darkMode 
    ? "bg-gray-800 text-white border-gray-700" 
    : "bg-white text-gray-700 border-gray-200";

  return (
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-10">
      <div className={`flex flex-col gap-2 p-2 rounded-lg ${bgClass} border shadow-lg backdrop-blur-sm bg-opacity-90`}>
        <div className="space-y-2">
          {/* Visualization Type Toggle */}
          <div className="flex flex-col gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={cn("w-10 h-10", visualizationType === "markers" && "bg-accent")}
              onClick={() => setVisualizationType("markers")}
            >
              <Map className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn("w-10 h-10", visualizationType === "graphs" && "bg-accent")}
              onClick={() => setVisualizationType("graphs")}
            >
              <LineChart className="h-5 w-5" />
            </Button>
          </div>

          {/* Date Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className={cn("w-10 h-10", bgClass)}>
                <Calendar className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent
                mode="single"
                selected={selectedDate || undefined}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Zoom Controls */}
        <div className="grid grid-cols-1 gap-1">
          <Button onClick={onZoomIn} variant="ghost" size="icon" className={bgClass}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button onClick={onZoomOut} variant="ghost" size="icon" className={bgClass}>
            <ZoomOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};