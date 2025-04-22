
import React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useMapContext } from "@/contexts/MapContext";

interface CountryMarkerProps {
  coordinates: [number, number];
  countryName: string;
  averagePrice: number;
  globalAverage: number;
  totalMedicines: number;
  topMedicines: Array<{
    name: string;
    averagePrice: number;
  }>;
  onClick: () => void;
}

export const CountryMarker: React.FC<CountryMarkerProps> = ({
  countryName,
  averagePrice,
  globalAverage,
  totalMedicines,
  topMedicines,
  onClick,
}) => {
  const { visualizationType } = useMapContext();
  
  if (visualizationType === "graphs") {
    // For graphs view, we'll return a simplified view
    return (
      <div 
        className="bg-white p-2 rounded-md shadow-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onClick}
      >
        <div className="font-bold text-sm">{countryName}</div>
        <div className="flex items-center space-x-1">
          <span className="text-blue-600 text-xs font-medium">${averagePrice.toFixed(2)}</span>
          {averagePrice > globalAverage ? (
            <ArrowUpRight className="h-3 w-3 text-red-500" />
          ) : (
            <ArrowDownRight className="h-3 w-3 text-green-500" />
          )}
        </div>
      </div>
    );
  }
  
  // For markers view (default), we'll show more details
  return (
    <div 
      className="relative animate-fade-in"
      onClick={onClick}
    >
      <div className="bg-white p-4 rounded-lg shadow-xl border border-gray-200 min-w-[200px] text-center transform -translate-x-1/2 cursor-pointer hover:translate-y-[-2px] transition-all">
        <div className="font-bold text-gray-800">{countryName}</div>
        <div className="text-blue-600 font-bold text-xl my-1">
          ${averagePrice.toFixed(2)}
          <span className="ml-1 text-sm">
            {averagePrice > globalAverage ? (
              <span className="text-red-500 inline-flex items-center">
                (+{Math.abs((averagePrice - globalAverage) / globalAverage * 100).toFixed(1)}%)
                <ArrowUpRight className="h-3 w-3" />
              </span>
            ) : (
              <span className="text-green-500 inline-flex items-center">
                (-{Math.abs((averagePrice - globalAverage) / globalAverage * 100).toFixed(1)}%)
                <ArrowDownRight className="h-3 w-3" />
              </span>
            )}
          </span>
        </div>
        <div className="text-sm text-gray-600 mb-2">
          Total: {totalMedicines.toLocaleString()} medicines
        </div>
        {topMedicines?.length > 0 && (
          <div className="border-t pt-2">
            <h4 className="font-semibold text-sm">Top Medicines:</h4>
            <ul className="text-xs">
              {topMedicines.slice(0, 3).map((med, index) => (
                <li key={index} className="truncate">
                  {med.name} - ${med.averagePrice.toFixed(2)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
