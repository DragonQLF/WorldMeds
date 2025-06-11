import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useMapContext } from '@/contexts/MapContext';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider'; // Assuming a slider component exists

interface DateSliderProps {
  selectedDate: Date | null;
  dateRange: { from: Date | undefined; to?: Date | undefined } | undefined;
  selectedMonth: string;
  showMonthPicker: boolean;
  setShowMonthPicker: (show: boolean) => void;
}

const DateSlider: React.FC<DateSliderProps> = ({ selectedDate, dateRange, selectedMonth, showMonthPicker, setShowMonthPicker }) => {
  const { setSelectedMonth, darkMode } = useMapContext();
  const [availableMonths, setAvailableMonths] = useState<{ value: string; label: string }[]>([]);
  const [sliderValue, setSliderValue] = useState<number[]>([0]);

  useEffect(() => {
    const fetchAvailableMonths = async () => {
      try {
        const response = await api.get('/available-months');
        const months = response.data.sort().map((month: string, index: number) => {
          const [year, monthIndexStr] = month.split('-');
          const date = new Date(parseInt(year), parseInt(monthIndexStr) - 1);
          const label = date.toLocaleString('en-US', { month: 'long', year: 'numeric' });

          return {
            value: month,
            label: label,
            index: index
          };
        });
        setAvailableMonths(months);
        
        // Only set initial month if we're not in 'all' mode
        if (selectedMonth && selectedMonth !== 'all') {
          const initialMonth = selectedMonth || months[months.length - 1]?.value;
          const initialIndex = months.findIndex(m => m.value === initialMonth);
          setSliderValue([initialIndex >= 0 ? initialIndex : months.length - 1]);
        }
        
      } catch (error) {
        console.error('Error fetching available months:', error);
      }
    };

    fetchAvailableMonths();
  }, []);

  useEffect(() => {
    // Only update selected month if we're not in 'all' mode
    if (availableMonths.length > 0 && sliderValue[0] !== undefined && selectedMonth !== 'all') {
      setSelectedMonth(availableMonths[sliderValue[0]].value);
    }
  }, [sliderValue, availableMonths, setSelectedMonth, selectedMonth]);

  const handleSliderChange = (value: number[]) => {
    setSliderValue(value);
  };

  if (availableMonths.length === 0) {
    return null;
  }

  const currentMonthLabel = availableMonths[sliderValue[0]]?.label || '';

  return (
    <div
    className={cn(
      "fixed bottom-4 left-1/2 transform -translate-x-1/2 z-10 w-11/12 max-w-md p-4 rounded-lg", // Positioning and size
      "transition-all duration-300 ease-in-out", // Animation properties
      darkMode ? "text-white" : "text-gray-800", // Text color based on dark mode
      showMonthPicker ? "opacity-100 translate-y-0" : "opacity-0 translate-y-full pointer-events-none" // Visibility and position based on showMonthPicker prop
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