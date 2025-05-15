import React, { useState, useEffect, memo, useCallback } from 'react';
import { Pill, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatPrice } from "@/lib/utils";

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
  };
  x: number;
  y: number;
  darkMode: boolean;
  isPinned: boolean;
  onPin: () => void;
  mapRef?: React.RefObject<HTMLDivElement>;
}

export const CountryTooltip: React.FC<CountryTooltipProps> = memo(({ 
  country, 
  x, 
  y, 
  darkMode,
  isPinned,
  onPin,
  mapRef
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
  
  const positionStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${position.x}px`, 
    top: `${position.y}px`,
    transform: 'translate(-50%, -110%)',
    zIndex: isPinned ? 30 : 20, 
    pointerEvents: 'auto'
  };
  
  // Calculate price change percentage if previous price exists
  const calculatePriceChange = () => {
    if (country.previousPrice && country.averagePrice) {
      const change = ((country.averagePrice - country.previousPrice) / country.previousPrice) * 100;
      return {
        value: change,
        increased: change > 0,
        percentage: Math.abs(change).toFixed(1) + '%'
      };
    }
    return null;
  };
  
  const priceChange = calculatePriceChange();

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
  
  // Get country code for flag (assuming countryName is in English)
  const getCountryCode = (name: string) => {
    // This is a simplified mapping for demonstration
    const countryMap: { [key: string]: string } = {
      "Brazil": "BR",
      "United States": "US",
      "Canada": "CA",
      "Mexico": "MX",
      "United Kingdom": "GB",
      "France": "FR",
      "Germany": "DE",
      "Spain": "ES",
      "Italy": "IT",
      "Japan": "JP",
      "China": "CN",
      "India": "IN",
      "Australia": "AU",
      "Russia": "RU",
      "Chile": "CL",
      "Argentina": "AR",
      // Add more mappings as needed
    };
    
    return countryMap[name] || "UN"; // Return UN (United Nations) as fallback
  };
  
  const countryCode = getCountryCode(country.countryName);
  
  // Randomly assign a color for the country flag background
  const getRandomFlagBg = () => {
    const colors = [
      "bg-emerald-500", "bg-blue-500", "bg-purple-500", 
      "bg-pink-500", "bg-indigo-500", "bg-cyan-500"
    ];
    // Use a deterministic method since we don't have the country.countryId available here
    const nameHash = (name: string) => {
      let hash = 0;
      for (let i = 0; i < name.length; i++) {
        hash += name.charCodeAt(i);
      }
      return hash % colors.length;
    };
    return colors[nameHash(country.countryName)] || "bg-emerald-500";
  };

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
      className={`${isPinned ? 'opacity-100' : 'opacity-90 hover:opacity-100'} transition-opacity duration-200`}
      onClick={handleTooltipClick}
      data-testid="country-tooltip"
    >
      <section 
        className={`flex overflow-hidden z-0 gap-2 sm:gap-3 items-center px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl ${
          darkMode ? 'bg-gray-800' : 'bg-white border border-gray-200 shadow-md'
        }`}
        aria-label={`Location information for ${country.countryName}`}
      >
        {/* Flag indicator in colored square */}
        <div className="flex items-center justify-center w-8 sm:w-10 h-8 sm:h-10">
          <div className={`${getRandomFlagBg()} flex items-center justify-center w-8 sm:w-10 h-8 sm:h-10 rounded-md`}>
            <img 
              src={`https://flagcdn.com/w20/${countryCode.toLowerCase()}.png`} 
              alt={`${country.countryName} flag`}
              className="object-contain w-full h-full p-1"
              onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
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
          
          {/* Price and medicine count */}
          <div className="flex gap-2 sm:gap-4 items-center text-sm sm:text-base tracking-normal leading-snug mt-1">
            {/* Price - dynamic with conversion */}
            <div className="flex gap-1 sm:gap-1.5 items-center self-stretch">
              <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
              {country.localCurrency && originalPrice ? 
                renderLocalPriceTooltip() : 
                <span>{displayPrice}</span>
              }
              
              {/* Price change indicator with fancy icons */}
              {priceChange && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className={`ml-1 flex items-center ${
                        priceChange.increased ? 'text-red-500' : 'text-emerald-500'
                      }`}>
                        {priceChange.increased ? (
                          <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                        ) : (
                          <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4" />
                        )}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      <p>
                        {priceChange.increased ? 'Increased' : 'Decreased'} by {priceChange.percentage}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            
            {/* Medicine count */}
            <div className="flex gap-1 sm:gap-1.5 items-center self-stretch">
              <Pill className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
              <span>{formattedQuantity}</span>
            </div>
          </div>
        </div>
      </section>
      
      {/* Triangle pointer */}
      <div 
        className={`w-3 h-3 transform rotate-45 absolute -bottom-1.5 left-1/2 -translate-x-1/2 ${
          darkMode ? 'bg-gray-800' : 'bg-white border-r border-b border-gray-200'
        }`}
      ></div>
    </div>
  );
});

CountryTooltip.displayName = "CountryTooltip";

export default CountryTooltip;
