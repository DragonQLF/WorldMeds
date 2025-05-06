
import React from "react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

interface CountryTrendIndicatorProps {
  currentPrice?: number;
  previousPrice?: number;
  className?: string;
  showValue?: boolean;
}

const CountryTrendIndicator: React.FC<CountryTrendIndicatorProps> = ({
  currentPrice,
  previousPrice,
  className = "",
  showValue = true
}) => {
  // If we don't have both prices, we can't determine a trend
  if (typeof currentPrice !== 'number' || typeof previousPrice !== 'number' || 
      isNaN(currentPrice) || isNaN(previousPrice) || previousPrice === 0) {
    return (
      <span className={`inline-flex items-center text-gray-400 ${className}`}>
        <Minus className="h-4 w-4" />
      </span>
    );
  }

  const percentChange = ((currentPrice - previousPrice) / previousPrice) * 100;
  const isIncreasing = percentChange > 0;
  const isUnchanged = percentChange === 0;

  if (isUnchanged) {
    return (
      <span className={`inline-flex items-center text-gray-400 ${className}`}>
        <Minus className="h-4 w-4" />
        {showValue && <span className="ml-1">0%</span>}
      </span>
    );
  }

  return (
    <span 
      className={`inline-flex items-center ${isIncreasing ? 'text-red-500' : 'text-green-500'} ${className}`}
    >
      {isIncreasing ? (
        <ArrowUpRight className="h-4 w-4" />
      ) : (
        <ArrowDownRight className="h-4 w-4" />
      )}
      {showValue && (
        <span className="ml-1">{Math.abs(percentChange).toFixed(1)}%</span>
      )}
    </span>
  );
};

export default CountryTrendIndicator;
