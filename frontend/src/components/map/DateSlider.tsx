import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useMapContext } from '@/contexts/MapContext';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider'; // Assuming a slider component exists

interface DateSliderProps {
  isVisible: boolean;
}

const DateSlider: React.FC<DateSliderProps> = ({ isVisible }) => {
  const { selectedMonth, setSelectedMonth, darkMode } = useMapContext();
  const [availableMonths, setAvailableMonths] = useState<{ value: string; label: string }[]>([]);
  const [sliderValue, setSliderValue] = useState<number[]>([0]);

  useEffect(() => {
    const fetchAvailableMonths = async () => {
      try {
        const response = await api.get('/available-months'); // Assuming this API endpoint exists
        const months = response.data.sort().map((month: string, index: number) => {
          // Parse the YYYY-MM string and format it as "Month YYYY" in English
          const [year, monthIndexStr] = month.split('-');
          const date = new Date(parseInt(year), parseInt(monthIndexStr) - 1); // Month is 0-indexed
          // Specify 'en-US' locale for English formatting
          const label = date.toLocaleString('en-US', { month: 'long', year: 'numeric' });

          return {
            value: month,
            label: label,
            index: index
          };
        });
        setAvailableMonths(months);
        
        const initialMonth = selectedMonth || months[months.length - 1]?.value;
        const initialIndex = months.findIndex(m => m.value === initialMonth);
        setSliderValue([initialIndex >= 0 ? initialIndex : months.length - 1]);
        
      } catch (error) {
        console.error('Error fetching available months:', error);
      }
    };

    fetchAvailableMonths();
  }, []);

  useEffect(() => {
    if (availableMonths.length > 0 && sliderValue[0] !== undefined) {
      setSelectedMonth(availableMonths[sliderValue[0]].value);
    }
  }, [sliderValue, availableMonths, setSelectedMonth]);

  const handleSliderChange = (value: number[]) => {
    setSliderValue(value);
  };

  if (!isVisible || availableMonths.length === 0) {
    return null;
  }

  const currentMonthLabel = availableMonths[sliderValue[0]]?.label || '';

  return (
    <div
    className={cn(
      "fixed bottom-4 left-1/2 transform -translate-x-1/2 z-10 w-11/12 max-w-md p-4 rounded-lg", // Positioning and size
      "transition-all duration-300 ease-in-out", // Animation properties
      darkMode ? "text-white" : "text-gray-800", // Text color based on dark mode
      isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-full pointer-events-none" // Visibility and position based on isVisible prop
    )}
    style={{ backgroundColor: 'transparent', borderColor: 'transparent', boxShadow: 'none' }} // Manual styles for transparency
  >
      <h3 className="text-center text-lg font-semibold mb-4">{currentMonthLabel}</h3>
      
      <div className="flex items-center gap-4 justify-center">
        <Slider
          min={0}
          max={availableMonths.length > 0 ? availableMonths.length - 1 : 0}
          step={1}
          value={sliderValue}
          onValueChange={handleSliderChange}
          className="w-full max-w-xs"
        />
      </div>
    </div>
  );
};

export default DateSlider;  