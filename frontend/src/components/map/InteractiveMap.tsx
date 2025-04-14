import React, { useState, useEffect } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
  Marker,
} from "react-simple-maps";
import axios from "axios";
import { ZoomIn, ZoomOut } from "lucide-react";

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
  const [position, setPosition] = useState({
    coordinates: [20, 45] as [number, number],
    zoom: 1.2,
  });
  const [globalAverage, setGlobalAverage] = useState<number>(0);
  const [countriesData, setCountriesData] = useState<CountryData[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<{
    name: string;
    average: number;
    medicines: MedicineData[];
    coordinates: [number, number];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [globalRes, countriesRes] = await Promise.all([
          axios.get("/api/global-average-medicine-price"),
          axios.get("/api/countries-average-prices"),
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
  }, []);

  const getCountryColor = (countryName: string) => {
    if (!globalAverage) return "#EAEAEC";

    const country = countriesData.find((c) => c.countryName === countryName);
    if (!country || !country.averagePrice) return "#EAEAEC";

    const ratio = country.averagePrice / globalAverage;

    if (ratio >= 1.2) return "#FF6B6B";
    if (ratio >= 1.1) return "#FFD93D";
    if (ratio <= 0.8) return "#2B8A3E";
    if (ratio < 1) return "#51CF66";
    return "#88B0D0";
  };

  const handleCountryClick = async (geo: any) => {
    const countryName = geo.properties.name;
    const country = countriesData.find((c) => c.countryName === countryName);
  
    // Call the parent component's handler
    onCountryClick?.(countryName);
  
    if (!country) return;
  
    try {
      const response = await axios.get(
        `/api/country/${country.countryId}/top-medicines`
      );
      setSelectedCountry({
        name: countryName,
        average: country.averagePrice,
        medicines: response.data,
        coordinates: geo.geometry.coordinates,
      });
    } catch (error) {
      console.error("Error fetching country details:", error);
    }
  };
  const handleZoomIn = () => {
    setPosition((prev) => ({ ...prev, zoom: prev.zoom * 1.5 }));
  };

  const handleZoomOut = () => {
    setPosition((prev) => ({ ...prev, zoom: prev.zoom / 1.5 }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="text-xl">Loading medicine price data...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <ComposableMap projection="geoMercator">
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
                  stroke="#FFFFFF"
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

          {selectedCountry && (
            <Marker coordinates={selectedCountry.coordinates}>
              <div className="relative">
                <div className="bg-white p-4 rounded-lg shadow-xl border border-gray-200 min-w-[200px] text-center transform -translate-x-1/2">
                  <div className="font-bold text-gray-800">{selectedCountry.name}</div>
                  <div className="text-blue-600 font-bold text-xl my-1">
                    ${selectedCountry.average.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    {globalAverage > 0 && (
                      <span
                        className={
                          selectedCountry.average > globalAverage
                            ? "text-red-500"
                            : "text-green-500"
                        }
                      >
                        {Math.abs(
                          (selectedCountry.average - globalAverage) /
                            globalAverage *
                            100
                        ).toFixed(1)}
                        %
                        {selectedCountry.average > globalAverage
                          ? " above"
                          : " below"}{" "}
                        average
                      </span>
                    )}
                  </div>
                  <div className="border-t pt-2">
                    <h4 className="font-semibold text-sm">Top Medicines:</h4>
                    <ul className="text-xs">
                      {selectedCountry.medicines.slice(0, 3).map((med, index) => (
                        <li key={index} className="truncate">
                          {med.name} - ${med.averagePrice.toFixed(2)}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button
                    onClick={() => setSelectedCountry(null)}
                    className="absolute top-1 right-1 text-gray-400 hover:text-gray-600"
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>
              </div>
            </Marker>
          )}
        </ZoomableGroup>
      </ComposableMap>

      {/* Zoom Controls */}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-10">
        <button
          onClick={handleZoomIn}
          className="bg-white rounded-t-md p-2 border border-gray-300 hover:bg-gray-100 transition-colors shadow-sm w-10 h-10 flex items-center justify-center"
          aria-label="Zoom in"
        >
          <ZoomIn size={20} />
        </button>
        <button
          onClick={handleZoomOut}
          className="bg-white rounded-b-md p-2 border border-gray-300 hover:bg-gray-100 transition-colors shadow-sm w-10 h-10 flex items-center justify-center"
          aria-label="Zoom out"
        >
          <ZoomOut size={20} />
        </button>
      </div>
    </div>
  );
};

export default InteractiveMap;