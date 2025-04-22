
import React, { useState, useEffect } from "react";
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
  averagePrice: number;
  totalMedicines: number;
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
    coordinates: [number, number];
    medicines: MedicineData[];
  } | null>(null);
  const [detailCountryId, setDetailCountryId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
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
        setCountriesData(countriesRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedDate, dateRange]);

  const getCountryColor = (countryName: string) => {
    if (!globalAverage) return darkMode ? "#333333" : "#EAEAEC";

    const country = countriesData.find((c) => c.countryName === countryName);
    if (!country || !country.averagePrice) return darkMode ? "#333333" : "#EAEAEC";

    const ratio = country.averagePrice / globalAverage;

    if (darkMode) {
      if (ratio >= 1.2) return "#FF6B6B80";
      if (ratio >= 1.1) return "#FFD93D80";
      if (ratio <= 0.8) return "#2B8A3E80";
      if (ratio < 1) return "#51CF6680";
      return "#88B0D080";
    } else {
      if (ratio >= 1.2) return "#FF6B6B";
      if (ratio >= 1.1) return "#FFD93D";
      if (ratio <= 0.8) return "#2B8A3E";
      if (ratio < 1) return "#51CF66";
      return "#88B0D0";
    }
  };

  const handleCountryClick = async (geo: any) => {
    const countryName = geo.properties.name;
    const country = countriesData.find((c) => c.countryName === countryName);
  
    // Call the parent component's handler
    onCountryClick?.(countryName);
  
    if (!country) return;
  
    try {
      const response = await api.get(
        `/country/${country.countryId}/top-medicines`
      );
      
      if (visualizationType === "markers") {
        setSelectedCountry({
          id: country.countryId,
          name: countryName,
          coordinates: geo.geometry.coordinates || [0, 0],
          medicines: response.data,
        });
      } else {
        // For graph visualization, open the detail view directly
        setDetailCountryId(country.countryId);
      }
    } catch (error) {
      console.error("Error fetching country details:", error);
    }
  };

  const handleZoomIn = () => {
    setPosition((prev) => ({ ...prev, zoom: Math.min(prev.zoom * 1.5, 8) }));
  };

  const handleZoomOut = () => {
    setPosition((prev) => ({ ...prev, zoom: Math.max(prev.zoom / 1.5, 1) }));
  };

  const handleMarkerClick = () => {
    if (selectedCountry) {
      setDetailCountryId(selectedCountry.id);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-full w-full ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'}`}>
        <div className="text-xl">Loading medicine price data...</div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
      <ComposableMap 
        projection="geoMercator"
        className={darkMode ? "opacity-90" : undefined}
      >
        <ZoomableGroup
          zoom={position.zoom}
          center={position.coordinates}
          onMoveEnd={({ coordinates, zoom }) => setPosition({ coordinates, zoom })}
        >
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={getCountryColor(geo.properties.name)}
                  stroke={darkMode ? "#ffffff30" : "#FFFFFF"}
                  strokeWidth={0.5}
                  onClick={() => handleCountryClick(geo)}
                  style={{
                    default: { outline: "none" },
                    hover: { outline: "none", filter: "brightness(0.9)" },
                    pressed: { outline: "none" },
                  }}
                />
              ))
            }
          </Geographies>

          {selectedCountry && visualizationType === "markers" && (
            <Marker coordinates={selectedCountry.coordinates as [number, number]}>
              <CountryMarker 
                coordinates={selectedCountry.coordinates}
                countryName={selectedCountry.name}
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