
import React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useMapContext } from "@/contexts/MapContext";

interface CountryMarkerProps {
  coordinates: [number, number];
  countryName: string;
  countryCode: string;
  averagePrice: number | string;
  globalAverage: number;
  totalMedicines: number;
  topMedicines: Array<{
    name: string;
    averagePrice: number | string;
  }>;
  onClick: () => void;
}

export const CountryMarker: React.FC<CountryMarkerProps> = ({
  countryName,
  countryCode,
  averagePrice,
  globalAverage,
  totalMedicines,
  topMedicines,
  onClick,
}) => {
  const { visualizationType } = useMapContext();
  
  // Convert averagePrice to number if it's a string to prevent toFixed errors
  const price = typeof averagePrice === 'number' 
    ? averagePrice 
    : parseFloat(String(averagePrice));
  
  const priceDisplay = !isNaN(price) ? `$${price.toFixed(2)}` : "N/A";
  const isHigher = !isNaN(price) && price > globalAverage;
  
  if (visualizationType === "graphs") {
    // For graphs view, we'll return a simplified view
    return (
      <div 
        className="bg-white p-2 rounded-md shadow-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onClick}
      >
        <div className="font-bold text-sm">{countryName}</div>
        <div className="flex items-center space-x-1">
          <span className="text-blue-600 text-xs font-medium">{priceDisplay}</span>
          {!isNaN(price) && (
            isHigher ? (
              <ArrowUpRight className="h-3 w-3 text-red-500" />
            ) : (
              <ArrowDownRight className="h-3 w-3 text-green-500" />
            )
          )}
        </div>
      </div>
    );
  }
  
  // Get country flag URL
  const flagUrl = `https://flagcdn.com/w80/${countryCode.toLowerCase()}.png`;
  
  // For markers view (default), we'll show the detailed marker like in the image
  return (
    <div 
      className="relative animate-fade-in"
      onClick={onClick}
    >
      <div className="bg-white p-4 rounded-lg shadow-xl border border-gray-200 min-w-[200px] transform -translate-x-1/2 cursor-pointer hover:translate-y-[-2px] transition-all">
        <div className="flex items-center gap-2 mb-2">
          {countryCode && (
            <div className="w-8 h-8 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
              <img src={flagUrl} alt={`${countryName} flag`} className="max-w-full max-h-full object-cover" />
            </div>
          )}
          <div className="font-bold text-gray-800">{countryName}</div>
        </div>
        
        <div className="text-blue-600 font-bold text-xl my-1 flex items-center">
          {priceDisplay}
          {!isNaN(price) && (
            <span className="ml-1 text-sm">
              {isHigher ? (
                <span className="text-red-500 inline-flex items-center">
                  (+{Math.abs((price - globalAverage) / globalAverage * 100).toFixed(1)}%)
                  <ArrowUpRight className="h-3 w-3" />
                </span>
              ) : (
                <span className="text-green-500 inline-flex items-center">
                  (-{Math.abs((price - globalAverage) / globalAverage * 100).toFixed(1)}%)
                  <ArrowDownRight className="h-3 w-3" />
                </span>
              )}
            </span>
          )}
        </div>
        
        <div className="text-sm text-gray-600 mb-2 flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
          <span>{totalMedicines.toLocaleString()} medicines</span>
        </div>
        
        {topMedicines?.length > 0 && (
          <div className="border-t pt-2">
            <h4 className="font-semibold text-sm">Top Medicines:</h4>
            <ul className="text-xs">
              {topMedicines.slice(0, 3).map((med, index) => {
                const medPrice = typeof med.averagePrice === 'number' 
                  ? med.averagePrice 
                  : parseFloat(String(med.averagePrice));
                
                const medPriceDisplay = !isNaN(medPrice) ? `$${medPrice.toFixed(2)}` : "N/A";
                  
                return (
                  <li key={index} className="truncate">
                    {med.name} - {medPriceDisplay}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
