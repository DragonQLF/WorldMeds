import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
  Marker,
} from "react-simple-maps";
import { api } from "@/lib/api";
import { useMapContext } from "@/contexts/MapContext";
import { MapControls } from "./MapControls";
import { CountryMarker } from "./CountryMarker";
import { CountryDetail } from "./CountryDetail";

interface CountryData {
  countryId: string;
  countryName: string;
  countryCode: string;
  averagePrice: number;
  totalMedicines: number;
  previousPrice?: number;
}

interface MedicineData {
  name: string;
  dosage: string;
  averagePrice: number;
  totalSold: number;
}

interface InteractiveMapProps {
  onCountryClick?: (countryName: string) => void;
}

const geoUrl = "/features.json";

// ISO country codes mapping
const countryCodeMap: Record<string, string> = {
  "United States": "us",
  "Canada": "ca",
  "Brazil": "br",
  "Mexico": "mx",
  "Australia": "au",
  "Germany": "de",
  "United Kingdom": "gb",
  "France": "fr",
  "Spain": "es",
  "Italy": "it",
  "Russia": "ru",
  "China": "cn",
  "India": "in",
  "Japan": "jp",
  "South Africa": "za",
  "Argentina": "ar",
  "Egypt": "eg",
  "Saudi Arabia": "sa",
  "Nigeria": "ng",
  "Kenya": "ke",
  "Sweden": "se",
  "Norway": "no",
  "Finland": "fi",
  "Denmark": "dk",
  "Netherlands": "nl",
  "Belgium": "be",
  "Switzerland": "ch",
  "Austria": "at",
  "Poland": "pl",
  "Turkey": "tr",
  // Add more as needed
};

const InteractiveMap = ({ onCountryClick }: InteractiveMapProps) => {
  const { visualizationType, darkMode, selectedDate, dateRange } = useMapContext();
  const [position, setPosition] = useState({
    coordinates: [20, 45] as [number, number],
    zoom: 1.2,
  });
  const [globalAverage, setGlobalAverage] = useState<number>(0);
  const [countriesData, setCountriesData] = useState<CountryData[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<{
    id: string;
    name: string;
    code: string;
    coordinates: [number, number];
    medicines: MedicineData[];
  } | null>(null);
  const [detailCountryId, setDetailCountryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Performance optimization refs
  const zoomLevel = useRef(position.zoom);
  const frameId = useRef<number | null>(null);
  const isMoving = useRef(false);
  
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

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      let dateParam = '';
      if (selectedDate) {
        const formattedDate = selectedDate.toISOString().split('T')[0];
        dateParam = `?date=${formattedDate}`;
      } else if (dateRange && dateRange.from) {
        const from = dateRange.from.toISOString().split('T')[0];
        const to = dateRange.to ? dateRange.to.toISOString().split('T')[0] : '';
        dateParam = `?start=${from}${to ? `&end=${to}` : ''}`;
      }

      const [globalRes, countriesRes] = await Promise.all([
        api.get(`/global-average-medicine-price${dateParam}`),
        api.get(`/countries-average-prices${dateParam}`),
      ]);

      setGlobalAverage(globalRes.data.global_average || 10);
      
      // Add country codes to the data
      const countriesWithCodes = countriesRes.data.map((country: any) => ({
        ...country,
        countryCode: countryCodeMap[country.countryName] || 'un' // Default to UN flag if code not found
      }));
      
      setCountriesData(countriesWithCodes);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Memoize getCountryColor to prevent recalculations
  const getCountryColor = useCallback((countryName: string) => {
    // Find the country in our data
    const country = countriesData.find(
      (c) => c.countryName.toLowerCase() === countryName.toLowerCase()
    );

    if (!country) {
      // Default color for countries with no data - darker gray
      return darkMode ? "#374151" : "#9ca3af"; // gray-700 in dark mode, gray-400 in light
    }

    // Use price comparison to determine color
    const priceRatio = country.averagePrice / globalAverage;

    if (priceRatio < 0.8) {
      // Much cheaper than average - use green
      return darkMode ? "#10b981" : "#34d399"; // emerald-600 in dark, emerald-400 in light
    } else if (priceRatio < 0.95) {
      // Slightly cheaper - lighter green
      return darkMode ? "#059669" : "#6ee7b7"; // emerald-700 in dark, emerald-300 in light
    } else if (priceRatio > 1.2) {
      // Much more expensive - use red
      return darkMode ? "#ef4444" : "#f87171"; // red-500 in dark, red-400 in light
    } else if (priceRatio > 1.05) {
      // Slightly more expensive - lighter red
      return darkMode ? "#dc2626" : "#fca5a5"; // red-600 in dark, red-300 in light
    } else {
      // Close to average - use gold/yellow
      return darkMode ? "#ca8a04" : "#fcd34d"; // amber-600 in dark, amber-300 in light
    }
  }, [countriesData, globalAverage, darkMode]);

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
  
    // Call the parent component's handler
    onCountryClick?.(countryName);
  
    if (!country) {
      console.log("Country not found in data:", countryName);
      return;
    }
  
    console.log("Found country data:", country);
  
    try {
      console.log(`Fetching top medicines for country ID: ${country.countryId}`);
      const response = await api.get(
        `/country/${country.countryId}/top-medicines`
      );
      console.log("API response:", response.data);
      
      // Always set the country ID to show the detail panel regardless of visualization type
      console.log("Setting detailCountryId:", country.countryId);
      setDetailCountryId(country.countryId);
      
      if (visualizationType === "markers") {
        // Validate coordinates to prevent NaN
        let coordinates: [number, number] = [0, 0];
        
        if (geo.geometry && 
            Array.isArray(geo.geometry.coordinates) && 
            geo.geometry.coordinates.length >= 2 &&
            !isNaN(parseFloat(geo.geometry.coordinates[0])) && 
            !isNaN(parseFloat(geo.geometry.coordinates[1]))) {
          coordinates = [
            parseFloat(geo.geometry.coordinates[0]),
            parseFloat(geo.geometry.coordinates[1])
          ];
        }
        
        console.log("Setting selectedCountry with coordinates:", coordinates);
        setSelectedCountry({
          id: country.countryId,
          name: countryName,
          code: country.countryCode || 'un',
          coordinates,
          medicines: response.data,
        });
      }
    } catch (error) {
      console.error("Error fetching country details:", error);
    }
  }, [countriesData, onCountryClick, visualizationType]);

  const handleZoomIn = useCallback(() => {
    setPosition((prev) => ({ ...prev, zoom: Math.min(prev.zoom * 1.5, 8) }));
  }, []);

  const handleZoomOut = useCallback(() => {
    setPosition((prev) => ({ ...prev, zoom: Math.max(prev.zoom / 1.5, 1) }));
  }, []);

  const handleMoveStart = useCallback(() => {
    isMoving.current = true;
  }, []);
  
  const handleMoveEnd = useCallback(({ coordinates, zoom }: { coordinates: [number, number], zoom: number }) => {
    // Update position after movement ends
    setPosition({ coordinates, zoom });
    zoomLevel.current = zoom;
    isMoving.current = false;
  }, []);

  const handleMarkerClick = useCallback(() => {
    if (selectedCountry) {
      // Open country detail when marker is clicked
      setDetailCountryId(selectedCountry.id);
    }
  }, [selectedCountry]);

  // Render optimization - only render certain elements based on zoom level
  const shouldRenderDetail = useMemo(() => {
    return position.zoom > 2.5; // Only show details at higher zoom
  }, [position.zoom]);

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
          filterZoomEvent={(evt) => evt.type === 'wheel' ? !evt.ctrlKey : true}
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

          {selectedCountry && visualizationType === "markers" && shouldRenderDetail && (
            <Marker coordinates={selectedCountry.coordinates as [number, number]}>
              <CountryMarker 
                coordinates={selectedCountry.coordinates}
                countryName={selectedCountry.name}
                countryCode={selectedCountry.code}
                averagePrice={countriesData.find(c => c.countryId === selectedCountry.id)?.averagePrice || 0}
                globalAverage={globalAverage}
                totalMedicines={countriesData.find(c => c.countryId === selectedCountry.id)?.totalMedicines || 0}
                topMedicines={selectedCountry.medicines}
                onClick={handleMarkerClick}
              />
            </Marker>
          )}
        </ZoomableGroup>
      </ComposableMap>

      <MapControls 
        onZoomIn={handleZoomIn} 
        onZoomOut={handleZoomOut} 
      />

      {/* Country details modal */}
      <CountryDetail 
        countryId={detailCountryId} 
        onClose={() => setDetailCountryId(null)} 
      />
    </div>
  );
};

export default InteractiveMap;
