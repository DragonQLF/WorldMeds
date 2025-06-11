import React, { useState, useEffect, memo, useCallback } from 'react';
import { Pill, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatPrice } from "@/lib/utils";
import FlagIcon from "@/components/flags/FlagIcon";

interface CountryTooltipProps {
  country: {
    countryId: string | number;
    countryName: string;
    averagePrice: number;
    previousPrice?: number;
    localCurrency?: string;
    originalPrice?: number;
    totalMedicines: number;
    conversionRate?: number;
    pillsPerPackage?: number;
    iso_code?: string;
    bgColor?: string;
  };
  x: number;
  y: number;
  darkMode: boolean;
  isPinned: boolean;
  onPin: () => void;
  mapRef?: React.RefObject<HTMLDivElement>;
  zoom: number;
}

export const CountryTooltip: React.FC<CountryTooltipProps> = memo(({ 
  country, 
  x, 
  y, 
  darkMode,
  isPinned,
  onPin,
  mapRef,
  zoom
}) => {
  const [convertedPrice, setConvertedPrice] = useState<number | null>(null);
  const [originalPrice, setOriginalPrice] = useState<number | null>(null);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [position, setPosition] = useState({ x, y });
  
  // Calculate position to ensure tooltip stays visible within the viewport
  // This function will be called initially and when the map moves
  const updatePosition = useCallback(() => {
    if (!mapRef?.current) {
      return;
    }
    
    // Get map dimensions and position
    const mapRect = mapRef.current.getBoundingClientRect();
    
    // Define tooltip width and height (approximate)
    const tooltipWidth = 220;
    const tooltipHeight = 120;
    
    // Calculate safe coordinates to keep tooltip within map boundaries
    const safeX = Math.min(
      Math.max(x, mapRect.left + tooltipWidth/2 + 10), 
      mapRect.right - tooltipWidth/2 - 10
    );
    
    const safeY = Math.min(
      Math.max(y - 20, mapRect.top + tooltipHeight/2), 
      mapRect.bottom - tooltipHeight - 10
    );
    
    setPosition({ x: safeX, y: safeY });
  }, [x, y, mapRef]);

  // Update position when props change or map moves
  useEffect(() => {
    updatePosition();
    
    // Add event listeners to track map movement and resize
    const handleMapMove = () => updatePosition();
    window.addEventListener('resize', updatePosition);
    
    if (mapRef?.current) {
      mapRef.current.addEventListener('mousemove', handleMapMove);
      mapRef.current.addEventListener('wheel', handleMapMove);
      mapRef.current.addEventListener('drag', handleMapMove);
    }
    
    return () => {
      window.removeEventListener('resize', updatePosition);
      if (mapRef?.current) {
        mapRef.current.removeEventListener('mousemove', handleMapMove);
        mapRef.current.removeEventListener('wheel', handleMapMove);
        mapRef.current.removeEventListener('drag', handleMapMove);
      }
    };
  }, [x, y, isPinned, mapRef, updatePosition]);
  
  // Calculate scale factor based on zoom level
  const scale = Math.min(1.5, Math.max(0.8, 1.2 / zoom)); // Adjusted for inverse scaling: smaller when zooming in, larger when zooming out

  const positionStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${position.x}px`, 
    top: `${position.y}px`,
    transform: `translate(-50%, -110%) scale(${scale})`, // Apply scale here
    transformOrigin: 'bottom center', // Set transform origin to bottom center
    zIndex: isPinned ? 30 : 20, 
    pointerEvents: 'auto'
  };
  
  // Calculate price change in local currency (for arrow/percent)
  const calculateLocalPriceChange = () => {
    // Use originalPrice (local currency) and previousPrice (local currency)
    const orig = typeof originalPrice === 'string' ? parseFloat(originalPrice) : originalPrice;
    const prev = typeof country.previousPrice === 'string' ? parseFloat(country.previousPrice) : country.previousPrice;
    if (typeof orig === 'number' && typeof prev === 'number' && !isNaN(orig) && !isNaN(prev) && prev > 0) {
      const change = ((orig - prev) / prev) * 100;
      return {
        value: change,
        increased: change > 0,
        percentage: Math.abs(change).toFixed(1) + '%',
        orig,
        prev
      };
    }
    return null;
  };
  const localPriceChange = calculateLocalPriceChange();

  // Use package price (already converted to USD) when tooltip is shown
  useEffect(() => {
    const setValues = () => {
      setIsConverting(true);
      
      try {
        // Store the original price for tooltip display if available
        if (country.originalPrice !== undefined && country.originalPrice !== null) {
          setOriginalPrice(country.originalPrice);
        }
        
        // Use package price (already converted to USD in InteractiveMap)
        setConvertedPrice(country.averagePrice);
      } catch (error) {
        console.error('Error setting price in tooltip:', error);
        // If conversion fails, fallback to whatever value we have
        setConvertedPrice(Number(country.averagePrice || 0));
      } finally {
        setIsConverting(false);
      }
    };
    
    setValues();
  }, [country]);

  // Display price based on conversion status
  const displayPrice = isConverting 
    ? "Converting..." 
    : formatPrice(convertedPrice !== null ? convertedPrice : Number(country.averagePrice || 0), 'USD');
  
  const formattedQuantity = Number(country.totalMedicines || 0).toLocaleString();
  
  // Handle click on tooltip
  const handleTooltipClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPin();
  };

  // Show a tooltip with local price if available
  const renderLocalPriceTooltip = () => {
    // Only show local price tooltip if we have both original price and local currency
    if (!originalPrice || !country.localCurrency) {
      return null;
    }
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="underline decoration-dotted cursor-help">{displayPrice}</span>
          </TooltipTrigger>
          <TooltipContent className="bg-card dark:bg-card text-foreground dark:text-foreground border dark:border-border">
            <p>USD: {formatPrice(convertedPrice as number, 'USD')}</p>
            <p>Local ({country.localCurrency}): {formatPrice(originalPrice as number, country.localCurrency)}</p>
            <p className="text-xs text-muted-foreground">Price per package</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div 
      style={positionStyle} 
      className={`relative ${isPinned ? 'opacity-100' : 'opacity-90 hover:opacity-100'} transition-opacity duration-200`}
      onClick={handleTooltipClick}
      data-testid="country-tooltip"
    >
      {/* Triangle pointer - zIndex 1 to be behind the main tooltip content */}
      <div 
        className={`w-4 h-4 transform rotate-45 absolute -bottom-2 left-1/2 -translate-x-1/2 ${
          darkMode ? 'bg-gray-800' : 'bg-white border-r border-b border-gray-200'
        }`}
        style={{ zIndex: 1, transform: `rotate(45deg) scale(${scale})` }} 
      ></div>

      <section 
        className={`relative z-20 flex overflow-hidden gap-2 sm:gap-3 items-center px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl ${
          darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200 shadow-md' // Apply shadow here
        }`}
        aria-label={`Location information for ${country.countryName}`}
      >
        {/* Flag indicator in colored square */}
        <div className="flex items-center justify-center">
          
          <div 
            className={`flex items-center justify-center rounded-md`} 
            style={{ backgroundColor: country.bgColor }}
          >
            {/* Use the country-flag-icons component */}
            
            <FlagIcon 
              isoCode={country.iso_code}
              title={`${country.countryName} flag`} 
              className="object-contain w-10 h-10 p-1 !w-10 !h-10"
            />
          </div>
        </div>
        
        {/* Country info section */}
        <div className={`overflow-hidden self-stretch my-auto font-light whitespace-nowrap ${
          darkMode ? 'text-white' : 'text-gray-800'
        }`}>
          {/* Country name */}
          <h3 className="text-sm sm:text-base tracking-wide leading-none font-medium">
            {country.countryName}
          </h3>
          
          {/* Price and medicine count - single row, arrow left, price, pill/qty */}
          <div className="flex gap-2 items-center text-base font-medium tracking-normal leading-snug mt-1">
            {/* Arrow or info icon, percent only on hover */}
            {localPriceChange ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className={`flex items-center ${
                      localPriceChange.increased ? 'text-red-500' : 'text-emerald-500'
                    }`}>
                      {localPriceChange.increased ? (
                        <TrendingUp className="h-5 w-5" />
                      ) : (
                        <TrendingDown className="h-5 w-5" />
                      )}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <p>
                      {localPriceChange.increased ? 'Increased' : 'Decreased'} by {localPriceChange.percentage} (local currency)
                    </p>
                    <p>
                      {`From ${formatPrice(localPriceChange.prev, country.localCurrency)} to ${formatPrice(localPriceChange.orig, country.localCurrency)}`}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex items-center text-muted-foreground cursor-help">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="8"/></svg>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    No previous price data
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {/* Price with $ after the number, same size as arrow */}
            <span className="font-medium text-base flex items-center">{displayPrice.replace('$', '')}$</span>
            {/* Pill icon and quantity, font-medium, same size as price */}
            <span className="flex items-center font-medium text-base">
              <Pill className="h-5 w-5 mr-1 text-blue-500" />
              {formattedQuantity}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
});

CountryTooltip.displayName = "CountryTooltip";

export default CountryTooltip;