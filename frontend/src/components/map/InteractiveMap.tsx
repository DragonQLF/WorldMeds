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
import DateSlider from "./DateSlider";
import { ModalType } from "@/components/Auth/AuthModals";

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
  month?: string;
  iso_code: string;
  bgColor?: string;
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
  isSidebarExpanded: boolean;
  authModalType: ModalType | null;
}

interface CurrencyRates {
  [key: string]: number;
}

const geoUrl = "/features.json";

const InteractiveMap = ({ onCountryClick, isSidebarExpanded, authModalType }: InteractiveMapProps) => {
  const { 
    selectedMonth, 
    setSelectedMonth, 
    showMonthPicker, 
    setShowMonthPicker,
    useTimeFiltering,
    darkMode,
    visualizationType,
    setVisualizationType,
    selectedDate,
    dateRange
  } = useMapContext();
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
  const [showLegend, setShowLegend] = useState(true);
  
  // Store multiple tooltips in an array
  const [tooltips, setTooltips] = useState<TooltipData[]>([]);
  
  // Performance optimization refs
  const zoomLevel = useRef(position.zoom);
  const frameId = useRef<number | null>(null);
  const isMoving = useRef(false);

  // State for map container dimensions
  const [mapDimensions, setMapDimensions] = useState({ width: 800, height: 600 }); // Initial dimensions

  // ResizeObserver to update map dimensions
  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        setMapDimensions({ width, height });
      }
    });

    if (mapContainerRef.current) {
      observer.observe(mapContainerRef.current);
    }

    return () => {
      if (mapContainerRef.current) {
        observer.unobserve(mapContainerRef.current);
      }
    };
  }, [mapContainerRef]);

  // Initialize currency exchange rates from API
  useEffect(() => {
    const loadCurrencyRates = async () => {
      try {
        // Use the fetchCurrencyRates function from api.ts
        const rates = await fetchCurrencyRates();
        setCurrencyRates(rates);
      } catch (error) {
        console.error('Error loading currency rates:', error);
        // We'll still have fallback rates from the API module
      }
    };
    
    loadCurrencyRates();
  }, [selectedMonth]); // Reload rates when month changes

  // Currency conversion function
  const convertToUSDWithRates = useCallback(async (amount: number, currency: string) => {
    if (!currency || currency.toUpperCase() === 'USD') return amount;
    
    try {
      // If we don't have the rate cached, get it from the API
      const rate = currencyRates[currency.toLowerCase()];
      if (!rate) {
        console.warn(`No rate found for ${currency}, fetching from API`);
        // If we don't have the rate cached, get it from the API
        const convertedAmount = await convertToUSD(amount, currency);
        return convertedAmount;
      }
      
      // If currency is not USD, and we have a rate, convert to USD
      // API rates are USD to currency, so we divide
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
      
      if (useTimeFiltering) {
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
        }
      } catch (error) {
        console.warn("Could not fetch global average price, using default value", error);
      }

      // If we have a selected month that's not "all", fetch previous month data for comparison
      if (previousMonth && useTimeFiltering) {
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
        
        // Simple hash function to generate a consistent color based on country ID
        const stringToColor = (str: string | number) => {
          let hash = 0;
          const s = String(str);
          for (let i = 0; i < s.length; i++) {
            hash = s.charCodeAt(i) + ((hash << 5) - hash);
          }
          
          // Use bitwise operations and multiplication for better hue distribution
          const hue = (Math.abs(hash * 131) % 360 + 360) % 360; // Ensure positive and within 0-359
          const saturation = 75; // Adjusted saturation
          const lightness = 45; // Adjusted lightness

          // Convert HSL to hexadecimal
          const hslToHex = (h: number, s: number, l: number) => {
            s /= 100;
            l /= 100;
            const k = (n: number) => (n + h / 30) % 12;
            const a = s * Math.min(l, 1 - l);
            const f = (n: number) =>
              l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
            return `#${Math.round(255 * f(0)).toString(16).padStart(2, '0')}${Math.round(255 * f(8)).toString(16).padStart(2, '0')}${Math.round(255 * f(4)).toString(16).padStart(2, '0')}`;
          };
          
          return hslToHex(hue, saturation, lightness);
        };

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
          
          // Convert price to USD if needed
          if (averagePrice !== null && country.localCurrency && country.localCurrency !== 'USD') {
            try {
              averagePrice = await convertToUSDWithRates(averagePrice, country.localCurrency);
            } catch (err) {
              console.warn(`Currency conversion failed for ${country.countryName}:`, err);
              // Keep averagePrice as originalPrice if conversion fails
            }
          }
          
          const generatedColor = stringToColor(country.countryId);
          
          return {
            countryId: country.countryId,
            countryName: country.countryName,
            averagePrice: averagePrice,
            originalPrice: originalPrice,
            previousPrice: country.previousPrice,
            localCurrency: country.localCurrency,
            totalMedicines: country.totalMedicines,
            pillsPerPackage: country.pillsPerPackage,
            month: country.month,
            iso_code: country.iso_code,
            bgColor: generatedColor
          };
        }));
        
        countriesDataValue = processedData;
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
  }, [selectedDate, dateRange, selectedMonth, convertToUSDWithRates, useTimeFiltering]);

  // Fetch data when date filters change or useTimeFiltering changes
  useEffect(() => {
    fetchData();
  }, [selectedDate, dateRange, selectedMonth, useTimeFiltering]);

  // Improved getCountryColor function for better map visualization with gradual colors
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
      return darkMode ? "#374151" : "#9ca3af"; // Gray for invalid data
    }

    // Use price comparison to determine color with safe division
    const priceRatio = globalAverage > 0 ? priceForComparison / globalAverage : 1;

    // Ensure ratio is a valid number
    if (isNaN(priceRatio)) {
      return darkMode ? "#374151" : "#9ca3af"; // Gray for invalid data
    }

    // Return colors based on price ratio with more gradual colors
    if (priceRatio < 0.70) {
      // Much cheaper (<70% of global average)
      return darkMode ? "#10b981" : "#34d399"; // emerald-600/400
    } else if (priceRatio < 0.85) {
      // Cheaper (70-85% of global average)
      return darkMode ? "#059669" : "#6ee7b7"; // emerald-700/300
    } else if (priceRatio < 0.95) {
      // Slightly cheaper (85-95% of global average)
      return darkMode ? "#047857" : "#a7f3d0"; // emerald-800/200
    } else if (priceRatio < 1.05) {
      // Close to average (95-105% of global average)
      return darkMode ? "#ca8a04" : "#fcd34d"; // amber-600/300
    } else if (priceRatio < 1.15) {
      // Slightly more expensive (105-115% of global average)
      return darkMode ? "#b91c1c" : "#fca5a5"; // red-700/300
    } else if (priceRatio < 1.30) {
      // More expensive (115-130% of global average)
      return darkMode ? "#dc2626" : "#f87171"; // red-600/400
    } else {
      // Much more expensive (>130% of global average)
      return darkMode ? "#ef4444" : "#ef4444"; // red-500/500 - stronger red
    }
  }, [countriesData, globalAverage, darkMode]);

  // Fix for scroll event listeners with passive option
  useEffect(() => {
    // Add passive scroll listeners to improve performance
    const mapElement = mapContainerRef.current;
    if (mapElement) {
      const options = { passive: true };

      // Add passive listeners for wheel and touch events
      const noop = () => {};
      mapElement.addEventListener('wheel', noop, options);
      mapElement.addEventListener('touchstart', noop, options);
      mapElement.addEventListener('touchmove', noop, options);
      mapElement.addEventListener('touchend', noop, options);

      return () => {
        // Cleanup listeners on unmount
        mapElement.removeEventListener('wheel', noop);
        mapElement.removeEventListener('touchstart', noop);
        mapElement.removeEventListener('touchmove', noop);
        mapElement.removeEventListener('touchend', noop);
      };
    }
  }, []);

  const handleCountryClick = useCallback(async (geo: any, event?: React.MouseEvent) => {
    // Stop event propagation if provided to prevent double-click
    if (event) {
      event.stopPropagation();
    }
    
    // Validate geo object
    if (!geo || !geo.properties || !geo.properties.name) {
      return;
    }
    
    const countryName = geo.properties.name;
    
    // Check if we're just closing a tooltip
    const existingTooltipIndex = tooltips.findIndex(
      tooltip => tooltip.country.countryName.toLowerCase() === countryName.toLowerCase()
    );
    
    if (existingTooltipIndex >= 0 && tooltips[existingTooltipIndex].isPinned) {
      // If tooltip exists and is pinned, just remove it without fetching data
      setTooltips(prev => prev.filter((_, i) => i !== existingTooltipIndex));
      return;
    }
    
    // Case-insensitive matching
    const country = countriesData.find(
      (c) => c.countryName.toLowerCase() === countryName.toLowerCase()
    );
  
    // If we didn't find the country in our data, we can't proceed
    if (!country) {
      toast({
        title: "No Data Available",
        description: `${countryName} has no medicine data available.`,
        variant: "destructive"
      });
      return;
    }
  
    // Check if the country has data (averagePrice and totalMedicines)
    if (!country.averagePrice && !country.totalMedicines) {
      toast({
        title: "No Data Available",
        description: `${countryName} has no medicine data available.`,
        variant: "destructive"
      });
      return;
    }
  
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
      setDetailCountryId(country.countryId);
    } else {
      // For tooltips view, handle tooltip display
      if (event && mapContainerRef.current) {
        const mapRect = mapContainerRef.current.getBoundingClientRect();
        const x = event.clientX - mapRect.left;
        const y = event.clientY - mapRect.top;
        
        if (existingTooltipIndex >= 0) {
          // If not pinned, pin it
          if (!tooltips[existingTooltipIndex].isPinned) {
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

      if (country && mapContainerRef.current) {
        // Check if this country has a valid average price. If not, don't show tooltip.
        if (typeof country.averagePrice !== 'number' || isNaN(country.averagePrice) || country.averagePrice === null) {
          // If there was a temporary hover tooltip for this country, remove it
          setTooltips(prev => prev.filter(t => !(t.country.countryId === country.countryId && !t.isPinned)));
          return; // Exit if no valid price
        }

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
          
          const mapRect = mapContainerRef.current.getBoundingClientRect();
          const x = event.clientX - mapRect.left;
          const y = event.clientY - mapRect.top;

          if (existingTooltipIndex >= 0) {
            // Update existing hover tooltip
            setTooltips(prev => prev.map((tooltip, i) => 
              i === existingTooltipIndex 
                ? { ...tooltip, x: x, y: y, visible: true }
                : tooltip
            ));
          } else {
            // Add a new hover tooltip
            setTooltips(prev => [
              ...prev.filter(t => t.isPinned), // Keep only pinned tooltips
              { 
                x: x,
                y: y,
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
    setPosition((prev) => ({ ...prev, zoom: Math.min(prev.zoom * 1.5, 16) }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setPosition((prev) => ({ ...prev, zoom: Math.max(prev.zoom / 1.5, 0.5) }));
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
      className="relative w-full h-full min-h-screen transition-colors duration-200"
      style={{ backgroundColor: mapBgColor }}
      ref={mapContainerRef}
    >
      <ComposableMap 
        projection="geoMercator"
        className={darkMode ? "opacity-90" : undefined}
        projectionConfig={{
          scale: 147
        }}
        width={mapDimensions.width}
        height={mapDimensions.height}
        style={{ width: "100%", height: "100%" }}
      >
        <ZoomableGroup
          zoom={position.zoom}
          center={position.coordinates}
          minZoom={0.5}
          maxZoom={16}
          onMoveStart={handleMoveStart}
          onMoveEnd={handleMoveEnd}
          filterZoomEvent={(evt: any) => evt.type === 'wheel' ? !evt.ctrlKey : true}
          translateExtent={[
            [-1000, -1000], // [xMin, yMin] - symmetric limits
            [2600, 2600],  // [xMax, yMax] - symmetric limits
          ]}
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
      {!authModalType && tooltips.map((tooltip, index) => 
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
            zoom={position.zoom}
          />
        )
      )}

      {/* Show the map legend */}
      {showLegend && (
        <MapLegend 
          globalAverage={globalAverage}
          darkMode={darkMode}
          selectedMonth={useTimeFiltering ? selectedMonth : null}
          isSidebarExpanded={isSidebarExpanded}
          isMobile={isMobile}
          isDateSliderOpen={showMonthPicker}
        />
      )}

      <MapControls 
        onZoomIn={handleZoomIn} 
        onZoomOut={handleZoomOut}
        onToggleLegend={toggleLegend}
        showLegend={showLegend}
        isDateSliderOpen={showMonthPicker}
      />

      {/* Render Date Slider */}
      <DateSlider isVisible={showMonthPicker} />
    </div>
  );
};

export default InteractiveMap;