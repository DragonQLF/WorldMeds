
import React, { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { format, parseISO, isValid, addMonths, subMonths } from "date-fns";
import { useMapContext } from "@/contexts/MapContext";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MonthPickerProps {
  isOpen: boolean;
  onClose: () => void;
  position?: "left" | "right";
  anchor?: React.RefObject<HTMLElement>;
}

export const MonthPicker: React.FC<MonthPickerProps> = ({
  isOpen,
  onClose,
  position = "right",
  anchor
}) => {
  const { selectedMonth, setSelectedMonth, availableMonths, isMonthAvailable } = useMapContext();
  const [currentView, setCurrentView] = useState<Date>(new Date());
  const [showPicker, setShowPicker] = useState(false);
  
  // Calculate position based on anchor element
  const [popoverStyle, setPopoverStyle] = useState({});
  
  const dateFormat = "yyyy-MM";

  // Generate an array of months for the current view
  const visibleMonths = useMemo(() => {
    const result: Date[] = [];
    const baseMonth = new Date(currentView.getFullYear(), currentView.getMonth(), 1);
    
    // Previous 3 months
    for (let i = -3; i < 0; i++) {
      const monthDate = new Date(baseMonth);
      monthDate.setMonth(baseMonth.getMonth() + i);
      result.push(monthDate);
    }
    
    // Current month
    result.push(baseMonth);
    
    // Next 3 months
    for (let i = 1; i <= 3; i++) {
      const monthDate = new Date(baseMonth);
      monthDate.setMonth(baseMonth.getMonth() + i);
      result.push(monthDate);
    }
    
    return result;
  }, [currentView]);
  
  useEffect(() => {
    if (!isOpen) return;
    
    // Set default to current month if no month is selected
    if (!selectedMonth || selectedMonth === 'all') {
      const today = new Date();
      setCurrentView(today);
    } else {
      // Parse the selected month if it exists
      try {
        const date = parseISO(selectedMonth);
        if (isValid(date)) {
          setCurrentView(date);
        }
      } catch (error) {
        console.error("Failed to parse selected month:", error);
      }
    }
    
    // Position the popover relative to the anchor element
    if (anchor?.current) {
      const rect = anchor.current.getBoundingClientRect();
      const topSpace = rect.top;
      const bottomSpace = window.innerHeight - rect.bottom;
      const leftSpace = rect.left;
      const rightSpace = window.innerWidth - rect.right;
      
      const horizontalPosition = position === 'left' 
        ? { right: `${rightSpace + rect.width + 10}px` }
        : { left: `${rect.left}px` };
        
      // Place above or below based on available space
      const verticalPosition = bottomSpace > 320 || topSpace < 320
        ? { top: `${rect.bottom + 5}px` }
        : { bottom: `${window.innerHeight - rect.top + 5}px` };
        
      setPopoverStyle({
        ...horizontalPosition,
        ...verticalPosition,
        position: 'fixed',
        zIndex: 50,
      });
    } else {
      // Default positioning if no anchor
      const defaultPosition = position === 'left'
        ? { right: '5rem', bottom: '5rem' }
        : { left: '5rem', bottom: '5rem' };
        
      setPopoverStyle({
        ...defaultPosition,
        position: 'fixed',
        zIndex: 50,
      });
    }
    
    // Show the picker with a small animation delay
    setTimeout(() => {
      setShowPicker(true);
    }, 50);
    
  }, [isOpen, selectedMonth, position, anchor]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && 
          anchor?.current && 
          !anchor.current.contains(event.target as Node) &&
          event.target instanceof Node) {
        
        // Find the popover element
        const popover = document.getElementById('month-picker-popover');
        
        // Only close if the click is outside both the anchor and the popover
        if (popover && !popover.contains(event.target as Node)) {
          onClose();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, anchor]);

  if (!isOpen) return null;

  // Get the previous set of months
  const handlePrevMonths = () => {
    setCurrentView(prev => subMonths(prev, 3));
  };

  // Get the next set of months
  const handleNextMonths = () => {
    setCurrentView(prev => addMonths(prev, 3));
  };

  // Handle month selection
  const handleSelectMonth = (date: Date) => {
    const formattedMonth = format(date, dateFormat);
    
    // Only allow selection if month is in available months or if there are no available months loaded yet
    if (isMonthAvailable(formattedMonth) || !availableMonths?.length) {
      console.log('Selected month:', formattedMonth);
      setSelectedMonth(formattedMonth);
      onClose();
    } else {
      console.log('Month not available:', formattedMonth, 'Available months:', availableMonths);
    }
  };

  // Handle all time selection
  const handleAllTime = () => {
    console.log('Selected: all time');
    setSelectedMonth('all');
    onClose();
  };
  
  const today = new Date();
  const isCurrentMonthSelected = selectedMonth && selectedMonth !== 'all' && 
    format(parseISO(selectedMonth), 'yyyy-MM') === format(today, 'yyyy-MM');
  const isAllTimeSelected = !selectedMonth || selectedMonth === 'all';

  return (
    <div
      id="month-picker-popover"
      className={cn(
        "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg",
        "transition-all duration-150 ease-in-out",
        showPicker ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
      )}
      style={popoverStyle}
    >
      <div className="flex justify-between items-center p-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-medium">Select Month</h3>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 rounded-full"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
      </div>
      
      <div className="p-3">
        <div className="flex justify-between items-center mb-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0"
            onClick={handlePrevMonths}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous months</span>
          </Button>
          
          <div className="text-sm font-medium">
            {format(visibleMonths[0], 'MMM yyyy')} - {format(visibleMonths[visibleMonths.length-1], 'MMM yyyy')}
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0"
            onClick={handleNextMonths}
            disabled={visibleMonths[visibleMonths.length-1] > today}
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next months</span>
          </Button>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
          {visibleMonths.map((date, index) => {
            const monthString = format(date, 'yyyy-MM');
            const isSelected = selectedMonth && selectedMonth !== 'all' && 
              format(parseISO(selectedMonth), 'yyyy-MM') === monthString;
            
            // Check if month is available in the database
            const isAvailable = isMonthAvailable(monthString);
            
            // Disable future months and unavailable months
            const isDisabled = date > today || (availableMonths?.length > 0 && !isAvailable);
            
            return (
              <Button
                key={index}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                className={cn(
                  "w-full justify-center text-center",
                  isSelected && "bg-primary text-primary-foreground",
                  isDisabled ? "opacity-50 cursor-not-allowed" : "",
                  !isAvailable && !isDisabled ? "opacity-70" : ""
                )}
                onClick={() => !isDisabled && handleSelectMonth(date)}
                disabled={isDisabled}
              >
                {format(date, 'MMM yyyy')}
              </Button>
            );
          })}
        </div>
        
        <Button
          variant={isAllTimeSelected ? "default" : "outline"}
          size="sm"
          className="w-full mt-4"
          onClick={handleAllTime}
        >
          All Time
        </Button>
      </div>
    </div>
  );
};

export default MonthPicker;
