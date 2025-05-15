import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import { api, convertToUSD, fetchCurrencyRates } from "@/lib/api";
import { useMapContext } from "@/contexts/MapContext";
import { MapControls } from "./MapControls";
import { CountryDetail } from "./CountryDetail";
import { MapLegend } from "./MapLegend";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { CountryTooltip } from "./CountryTooltip";
import { useIsMobile } from "@/hooks/use-mobile";

interface CountryData {
  countryId: string | number;
  countryName: string;
  averagePrice: number;
  originalPrice?: number;
  previousPrice?: number;
  localCurrency?: string;
  conversionRate?: number;
  totalMedicines: number;
  pillsPerPackage?: number;
}

interface TooltipData {
  x: number;
  y: number;
  country: CountryData;
  visible: boolean;
  isPinned: boolean;
}

interface InteractiveMapProps {
  onCountryClick?: (country: { id: string | number; name: string; averagePrice: number; totalMedicines: number }) => void;
}

interface CurrencyRates {
  [key: string]: number;
}

const geoUrl = "/features.json";

const InteractiveMap = ({ onCountryClick }: InteractiveMapProps) => {
  const { visualizationType, darkMode, selectedDate, dateRange, selectedMonth } = useMapContext();
  const { isAuthenticated } = useAuth();
  const isMobile = useIsMobile();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({
    coordinates: [20, 45] as [number, number],
    zoom: 1.2,
  });
  const [globalAverage, setGlobalAverage] = useState<number>(0);
  const [countriesData, setCountriesData] = useState<CountryData[]>([]);
  const [detailCountryId, setDetailCountryId] = useState<string | number | null>(null);
  const [loading, setLoading] = useState(true);
  const [currencyRates, setCurrencyRates] = useState<CurrencyRates>({});
  const [showLegend, setShowLegend] = useState<boolean>(true);
  
  // Store multiple tooltips in an array
  const [tooltips, setTooltips] = useState<TooltipData[]>([]);
  
  // Performance optimization refs
  const zoomLevel = useRef(position.zoom);
  const frameId = useRef<number | null>(null);
  const isMoving = useRef(false);

  // Initialize currency exchange rates from API
  useEffect(() => {
    const loadCurrencyRates = async () => {
      try {
        // Use the fetchCurrencyRates function from api.ts
        const rates = await fetchCurrencyRates();
        setCurrencyRates(rates);
        console.log("Currency rates loaded from API:", rates);
      } catch (error) {
        console.error("Failed to load currency rates:", error);
        // We'll still have fallback rates from the API module
      }
    };
    
    loadCurrencyRates();
  }, []);

  // Currency conversion function
  const convertToUSDWithRates = useCallback(async (amount: number, currency: string) => {
    if (!currency || currency.toUpperCase() === 'USD') return amount;
    
    try {
      const rate = currencyRates[currency.toLowerCase()];
      if (!rate) {
        console.warn(`No rate found for ${currency}, fetching from API`);
        // If we don't have the rate cached, get it from the API
        const convertedAmount = await convertToUSD(amount, currency);
        return convertedAmount;
      }
      
      // If currency is not USD, and we have a rate, convert to USD
      // API rates are USD to currency, so to convert to USD we divide
      return amount / rate;
    } catch (error) {
      console.warn(`Error converting ${currency} to USD:`, error);
      return amount; // Return original amount if conversion fails
    }
  }, [currencyRates]);
  
  // Calculate stroke width based on zoom
  const strokeWidth = useMemo(() => {
    // Decrease stroke width as zoom increases
    if (position.zoom > 4) return 0.1;
    if (position.zoom > 2) return 0.2;
    return 0.3;
  }, [position.zoom]);

  // Use memoized calculations to improve performance
  const mapBgColor = useMemo(() => 
    darkMode ? "hsl(var(--map-bg-dark))" : "hsl(var(--map-bg-light))",
  [darkMode]);

  // Enhanced fetchData function with more robust data processing
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      let dateParam = '';
      let previousMonth = '';
      
      if (selectedDate) {
        const formattedDate = selectedDate.toISOString().split('T')[0];
        dateParam = `?date=${formattedDate}`;
      } else if (dateRange && dateRange.from) {
        const from = dateRange.from.toISOString().split('T')[0];
        const to = dateRange.to ? dateRange.to.toISOString().split('T')[0] : '';
        dateParam = `?start=${from}${to ? `&end=${to}` : ''}`;
      } else if (selectedMonth && selectedMonth !== 'all') {
        dateParam = `?month=${selectedMonth}`;
        
        // Calculate previous month for comparison
        const currentDate = new Date(selectedMonth + "-01");
        const prevDate = new Date(currentDate);
        prevDate.setMonth(prevDate.getMonth() - 1);
        previousMonth = prevDate.toISOString().split('T')[0].substring(0, 7); // Get YYYY-MM format
      }

      // Default values in case of errors
      let globalAverageValue = 10;
      let countriesDataValue: any[] = [];
      let previousPrices: { [key: string]: number } = {};

      try {
        const globalRes = await api.get(`/global-average-medicine-price${dateParam}`);
        globalAverageValue = parseFloat(globalRes.data.global_average) || globalAverageValue;
        
        // Ensure global average is a valid number
        if (isNaN(globalAverageValue) || globalAverageValue <= 0) {
          globalAverageValue = 10; // Fallback to a reasonable default
          console.warn("Invalid global average, using default:", 10);
        } else {
          console.log("Global average price:", globalAverageValue);
        }
      } catch (error) {
        console.warn("Could not fetch global average price, using default value", error);
      }

      // If we have a selected month that's not "all", fetch previous month data for comparison
      if (previousMonth) {
        try {
          const prevMonthRes = await api.get(`/countries-average-prices?month=${previousMonth}`);
          prevMonthRes.data.forEach((country: any) => {
            previousPrices[country.countryId] = country.originalPrice; // Use originalPrice instead
          });
        } catch (error) {
          console.warn("Could not fetch previous month data", error);
        }
      }

      try {
        const countriesRes = await api.get(`/countries-average-prices${dateParam}`);
        
        // Process each country's data in parallel for better performance
        const processedData = await Promise.all(countriesRes.data.map(async (country: any) => {
          // Ensure averagePrice is properly parsed as a number
          let originalPrice = null;
          
          if (country.originalPrice) {
            // Use the original package price, not price per pill
            originalPrice = parseFloat(country.originalPrice);
            
            // Validate and ensure it's a proper number
            if (isNaN(originalPrice)) {
              originalPrice = null;
            }
          }
          
          // Default averagePrice to originalPrice (will be converted if needed)
          let averagePrice = originalPrice;
          
          // Convert to USD if needed and value is valid
          if (originalPrice !== null && country.localCurrency && country.localCurrency !== 'USD') {
            try {
              averagePrice = await convertToUSDWithRates(originalPrice, country.localCurrency);
              console.log(`Converted ${country.countryName} price: ${originalPrice} ${country.localCurrency} → ${averagePrice} USD`);
            } catch (err) {
              console.warn(`Currency conversion failed for ${country.countryName}:`, err);
              // Keep averagePrice as originalPrice if conversion fails
            }
          }
          
          return {
            countryId: country.countryId,
            countryName: country.countryName,
            originalPrice: originalPrice,       // Package price in local currency
            averagePrice: averagePrice,         // Package price converted to USD
            previousPrice: previousPrices[country.countryId],
            totalMedicines: country.totalMedicines || 0,
            localCurrency: country.localCurrency || 'USD',
            pillsPerPackage: country.pillsPerPackage
          };
        }));
        
        countriesDataValue = processedData;
        
        // Debug for Chile
        const chile = countriesDataValue.find(c => c.countryName === 'Chile');
        if (chile) {
          console.log('Chile data:', {
            originalPrice: chile.originalPrice,  // Local currency price
            averagePrice: chile.averagePrice,    // USD price
            currency: chile.localCurrency,
          });
        }
      } catch (error) {
        console.warn("Could not fetch countries data", error);
      }
      
      setGlobalAverage(globalAverageValue);
      setCountriesData(countriesDataValue);
    } catch (error) {
      console.error("Error in fetchData:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, dateRange, selectedMonth, convertToUSDWithRates]);

  // Fetch data when date filters change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Improved getCountryColor function for better map visualization
  const getCountryColor = useCallback((countryName: string) => {
    // Find the country in our data
    const country = countriesData.find(
      (c) => c.countryName.toLowerCase() === countryName.toLowerCase()
    );

    if (!country) {
      // Default color for countries with no data - darker gray
      return darkMode ? "#374151" : "#9ca3af";
    }

    // Use the USD-converted price for map coloring
    let priceForComparison = country.averagePrice;
    
    if (typeof priceForComparison !== 'number' || isNaN(priceForComparison) || priceForComparison === null) {
      console.warn(`No valid price data for ${country.countryName}`);
      return darkMode ? "#374151" : "#9ca3af"; // Gray for invalid data
    }

    // Use price comparison to determine color with safe division
    const priceRatio = globalAverage > 0 ? priceForComparison / globalAverage : 1;

    // Ensure ratio is a valid number
    if (isNaN(priceRatio)) {
      return darkMode ? "#374151" : "#9ca3af"; // Gray for invalid data
    }
    
    // Special debug for Chile to check the calculations
    if (country.countryName === 'Chile') {
      console.log(`${country.countryName} price: ${priceForComparison} USD, global avg: ${globalAverage}, ratio: ${priceRatio}`);
      console.log(`Original price: ${country.originalPrice}, currency: ${country.localCurrency}`);
    }

    // Return colors based on price ratio
    if (priceRatio < 0.8) {
      return darkMode ? "#10b981" : "#34d399"; // emerald-600/400 - much cheaper
    } else if (priceRatio < 0.95) {
      return darkMode ? "#059669" : "#6ee7b7"; // emerald-700/300 - slightly cheaper
    } else if (priceRatio > 1.2) {
      return darkMode ? "#ef4444" : "#f87171"; // red-500/400 - much more expensive
    } else if (priceRatio > 1.05) {
      return darkMode ? "#dc2626" : "#fca5a5"; // red-600/300 - slightly more expensive
    } else {
      return darkMode ? "#ca8a04" : "#fcd34d"; // amber-600/300 - close to average
    }
  }, [countriesData, globalAverage, darkMode]);

  // Fix for scroll event listeners with passive option
  useEffect(() => {
    // Add passive scroll listeners to improve performance
    const mapElement = mapContainerRef.current;
    if (mapElement) {
      const options = { passive: true };
      
      // Add passive listeners for wheel and touch events
      mapElement.addEventListener('wheel', () => {}, options);
      mapElement.addEventListener('touchstart', () => {}, options);
      mapElement.addEventListener('touchmove', () => {}, options);
      mapElement.addEventListener('touchend', () => {}, options);
    }
    
    return () => {
      // Cleanup listeners on unmount
      const mapElement = mapContainerRef.current;
      if (mapElement) {
        mapElement.removeEventListener('wheel', () => {});
        mapElement.removeEventListener('touchstart', () => {});
        mapElement.removeEventListener('touchmove', () => {});
        mapElement.removeEventListener('touchend', () => {});
      }
    };
  }, []);

  const handleCountryClick = useCallback(async (geo: any, event?: React.MouseEvent) => {
    // Stop event propagation if provided to prevent double-click
    if (event) {
      event.stopPropagation();
    }
    
    // Validate geo object
    if (!geo || !geo.properties || !geo.properties.name) {
      console.log("Invalid geo object:", geo);
      return;
    }
    
    const countryName = geo.properties.name;
    console.log("Country clicked:", countryName);
    
    // Case-insensitive matching
    const country = countriesData.find(
      (c) => c.countryName.toLowerCase() === countryName.toLowerCase()
    );
  
    // If we didn't find the country in our data, we can't proceed
    if (!country) {
      console.log("Country not found in data:", countryName);
      toast({
        title: "No Data Available",
        description: `${countryName} has no medicine data available.`,
        variant: "destructive"
      });
      return;
    }
  
    // Check if the country has data (averagePrice and totalMedicines)
    if (!country.averagePrice && !country.totalMedicines) {
      console.log("Country has no data:", countryName);
      toast({
        title: "No Data Available",
        description: `${countryName} has no medicine data available.`,
        variant: "destructive"
      });
      return;
    }
  
    console.log("Found country data:", country);
    
    // Create a proper country object to pass to the parent handler
    const countryObject = {
      id: country.countryId,
      name: country.countryName,
      averagePrice: country.averagePrice,
      totalMedicines: country.totalMedicines
    };
    
    // On mobile or in graphs mode, always open the full details
    if (visualizationType === "graphs" || (isMobile && visualizationType !== "markers")) {
      onCountryClick?.(countryObject);
      console.log("Setting detailCountryId:", country.countryId);
      setDetailCountryId(country.countryId);
    } else {
      // For tooltips view, toggle tooltip pin on click
      if (event) {
        const x = event.clientX;
        const y = event.clientY;
        
        // Check if this country already has a tooltip
        const existingTooltipIndex = tooltips.findIndex(
          tooltip => tooltip.country.countryId === country.countryId
        );
        
        if (existingTooltipIndex >= 0) {
          // If pinned, remove it; otherwise pin it
          if (tooltips[existingTooltipIndex].isPinned) {
            setTooltips(prev => prev.filter((_, i) => i !== existingTooltipIndex));
          } else {
            setTooltips(prev => prev.map((tooltip, i) => 
              i === existingTooltipIndex 
                ? { ...tooltip, isPinned: true }
                : tooltip
            ));
          }
        } else {
          // Add a new tooltip
          setTooltips(prev => [
            ...prev, 
            { 
              x, 
              y, 
              country, 
              visible: true,
              isPinned: true
            }
          ]);
        }
      }
    }
  }, [countriesData, onCountryClick, visualizationType, tooltips, isMobile]);

  const handleCountryHover = useCallback((geo: any, event: React.MouseEvent) => {
    // Only show tooltip on hover for non-mobile devices when in markers mode
    if (visualizationType === "markers" && !isMobile) {
      const countryName = geo.properties.name;
      const country = countriesData.find(
        (c) => c.countryName.toLowerCase() === countryName.toLowerCase()
      );

      if (country) {
        // Check if this country already has a pinned tooltip
        const hasPinnedTooltip = tooltips.some(
          t => t.country.countryId === country.countryId && t.isPinned
        );
        
        // Only show hover tooltip if there isn't already a pinned one for this country
        if (!hasPinnedTooltip) {
          // Create or update temporary hover tooltip
          const existingTooltipIndex = tooltips.findIndex(
            t => t.country.countryId === country.countryId && !t.isPinned
          );
          
          if (existingTooltipIndex >= 0) {
            // Update existing hover tooltip
            setTooltips(prev => prev.map((tooltip, i) => 
              i === existingTooltipIndex 
                ? { ...tooltip, x: event.clientX, y: event.clientY, visible: true }
                : tooltip
            ));
          } else {
            // Add a new hover tooltip
            setTooltips(prev => [
              ...prev.filter(t => t.isPinned), // Keep only pinned tooltips
              { 
                x: event.clientX, 
                y: event.clientY, 
                country, 
                visible: true,
                isPinned: false
              }
            ]);
          }
        }
      }
    }
  }, [countriesData, visualizationType, isMobile, tooltips]);

  const handleMouseLeave = useCallback(() => {
    // Only hide non-pinned tooltips on mouse leave
    setTooltips(prev => prev.filter(tooltip => tooltip.isPinned));
  }, []);

  const handleZoomIn = useCallback(() => {
    setPosition((prev) => ({ ...prev, zoom: Math.min(prev.zoom * 1.5, 8) }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setPosition((prev) => ({ ...prev, zoom: Math.max(prev.zoom / 1.5, 1) }));
  }, []);

  const handleMoveStart = useCallback(() => {
    isMoving.current = true;
    // Only hide non-pinned tooltips on move start
    setTooltips(prev => prev.filter(tooltip => tooltip.isPinned));
  }, []);
  
  const handleMoveEnd = useCallback(({ coordinates, zoom }: { coordinates: [number, number], zoom: number }) => {
    // Update position after movement ends
    setPosition({ coordinates, zoom });
    zoomLevel.current = zoom;
    isMoving.current = false;
  }, []);

  // Pin/unpin a tooltip
  const togglePinTooltip = useCallback((countryId: string | number) => {
    setTooltips(prev => {
      const tooltipIndex = prev.findIndex(t => t.country.countryId === countryId);
      if (tooltipIndex >= 0) {
        if (prev[tooltipIndex].isPinned) {
          // If already pinned, remove it
          return prev.filter((_, i) => i !== tooltipIndex);
        } else {
          // If not pinned, pin it
          return prev.map((t, i) => 
            i === tooltipIndex ? { ...t, isPinned: true } : t
          );
        }
      }
      return prev;
    });
  }, []);

  const toggleLegend = useCallback(() => {
    setShowLegend(prev => !prev);
  }, []);

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-full w-full ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'}`}>
        <div className="text-xl">Loading medicine price data...</div>
      </div>
    );
  }

  return (
    <div 
      className="relative w-full h-full transition-colors duration-200"
      style={{ backgroundColor: mapBgColor }}
      ref={mapContainerRef}
    >
      <ComposableMap 
        projection="geoMercator"
        className={darkMode ? "opacity-90" : undefined}
        projectionConfig={{
          scale: 147
        }}
      >
        <ZoomableGroup
          zoom={position.zoom}
          center={position.coordinates}
          onMoveStart={handleMoveStart}
          onMoveEnd={handleMoveEnd}
          filterZoomEvent={(evt: any) => evt.type === 'wheel' ? !evt.ctrlKey : true}
        >
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                // Skip small islands and territories when zoomed out
                if (position.zoom < 2 && geo.properties.area && parseFloat(geo.properties.area) < 20) {
                  return null;
                }
                
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={getCountryColor(geo.properties.name)}
                    stroke={darkMode ? "#1f2937" : "#FFFFFF"}
                    strokeWidth={strokeWidth}
                    onClick={(event) => handleCountryClick(geo, event)}
                    onMouseMove={(event) => handleCountryHover(geo, event)}
                    onMouseLeave={handleMouseLeave}
                    style={{
                      default: { outline: "none" },
                      hover: { outline: "none", filter: "brightness(0.9)" },
                      pressed: { outline: "none" },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {/* Render all tooltips (both hover and pinned) */}
      {tooltips.map((tooltip, index) => 
        tooltip.visible && (
          <CountryTooltip
            key={`${tooltip.country.countryId}-${index}`}
            country={tooltip.country}
            x={tooltip.x}
            y={tooltip.y}
            darkMode={darkMode}
            isPinned={tooltip.isPinned}
            onPin={() => togglePinTooltip(tooltip.country.countryId)}
            mapRef={mapContainerRef}
          />
        )
      )}

      {/* Show the map legend */}
      {showLegend && (
        <MapLegend 
          globalAverage={globalAverage}
          darkMode={darkMode}
        />
      )}

      <MapControls 
        onZoomIn={handleZoomIn} 
        onZoomOut={handleZoomOut}
        onToggleLegend={toggleLegend}
        showLegend={showLegend}
      />
    </div>
  );
};

export default InteractiveMap;
