import React, { useState, useEffect } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
  Marker
} from "react-simple-maps";
import axios from 'axios';
import { ZoomIn, ZoomOut } from "lucide-react";

interface CountryData {
  countryId: string;
  countryName: string;
  averagePrice: number;
  totalMedicines: number;
  coordinates: [number, number];
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
    zoom: 1.2
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

  // Sample coordinates - replace with your actual data
  const countryCoordinates: Record<string, [number, number]> = {
    "United States": [-98.5795, 39.8283],
    "Canada": [-106.3468, 56.1304],
    "Brazil": [-51.9253, -14.2350],
    "United Kingdom": [-3.4360, 55.3781],
    // Add more countries as needed...
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [globalRes, countriesRes] = await Promise.all([
          axios.get('/api/global-average-medicine-price'),
          axios.get('/api/countries-average-prices')
        ]);

        setGlobalAverage(globalRes.data.global_average || 10);
        
        const countriesWithCoords = countriesRes.data.map((country: any) => ({
          ...country,
          coordinates: countryCoordinates[country.countryName] || [0, 0]
        }));

        setCountriesData(countriesWithCoords);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getCountryColor = (countryName: string) => {
    if (!globalAverage) return '#EAEAEC';
    
    const country = countriesData.find(c => c.countryName === countryName);
    if (!country || !country.averagePrice) return '#EAEAEC';

    const ratio = country.averagePrice / globalAverage;
    
    if (ratio >= 1.2) return '#FF6B6B';
    if (ratio >= 1.1) return '#FFD93D';
    if (ratio <= 0.8) return '#2B8A3E';
    if (ratio < 1) return '#51CF66';
    return '#88B0D0';
  };

  const handleCountryClick = async (geo: any) => {
    const countryName = geo.properties.name;
    const country = countriesData.find(c => c.countryName === countryName);
    
    // Call the parent component's handler
    onCountryClick?.(countryName);

    if (!country) return;

    try {
      const response = await axios.get(`/api/country/${country.countryId}/top-medicines`);
      setSelectedCountry({
        name: countryName,
        average: country.averagePrice,
        medicines: response.data,
        coordinates: country.coordinates
      });
    } catch (error) {
      console.error("Error fetching country details:", error);
    }
  };

  const handleZoomIn = () => {
    setPosition(prev => ({ ...prev, zoom: prev.zoom * 1.5 }));
  };

  const handleZoomOut = () => {
    setPosition(prev => ({ ...prev, zoom: prev.zoom / 1.5 }));
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
                    pressed: { outline: "none" }
                  }}
                />
              ))
            }
          </Geographies>

          {selectedCountry && (
            <Marker coordinates={selectedCountry.coordinates}>
              <div className="relative">
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 -translate-y-full">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z"
                      fill="#3B82F6"
                      stroke="white"
                      strokeWidth="2"
                    />
                    <circle cx="12" cy="9" r="3" fill="white" />
                  </svg>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-xl border border-gray-200 min-w-[200px] text-center transform -translate-x-1/2">
                  <div className="font-bold text-gray-800">{selectedCountry.name}</div>
                  <div className="text-blue-600 font-bold text-xl my-1">
                    ${selectedCountry.average.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    {globalAverage > 0 && (
                      <span className={selectedCountry.average > globalAverage ? 'text-red-500' : 'text-green-500'}>
                        {Math.abs((selectedCountry.average - globalAverage) / globalAverage * 100).toFixed(1)}%
                        {selectedCountry.average > globalAverage ? ' above' : ' below'} average
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

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-md border border-gray-200 text-sm">
        <div className="font-semibold mb-2">Price Comparison</div>
        <div className="flex items-center mb-1">
          <div className="w-4 h-4 bg-[#FF6B6B] mr-2"></div>
          <span>20%+ above</span>
        </div>
        <div className="flex items-center mb-1">
          <div className="w-4 h-4 bg-[#FFD93D] mr-2"></div>
          <span>10-19% above</span>
        </div>
        <div className="flex items-center mb-1">
          <div className="w-4 h-4 bg-[#88B0D0] mr-2"></div>
          <span>Near average</span>
        </div>
        <div className="flex items-center mb-1">
          <div className="w-4 h-4 bg-[#51CF66] mr-2"></div>
          <span>Below average</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-[#2B8A3E] mr-2"></div>
          <span>20%+ below</span>
        </div>
      </div>
    </div>
  );
};

export default InteractiveMap;