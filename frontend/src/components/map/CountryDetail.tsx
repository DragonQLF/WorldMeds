import React, { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, getCurrencyRate } from "@/lib/api";
import { InfoIcon, AlertTriangle, Calendar, TrendingUp, TrendingDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useMapContext } from "@/contexts/MapContext";
import { subMonths, parseISO, format } from "date-fns";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MonthPicker } from "@/components/datepicker/MonthPicker";

// Import our new components and utilities
import { DetailHeader } from "@/components/common/DetailHeader";
import { CurrencyToggle } from "@/components/common/CurrencyToggle";
import { LoadingState } from "@/components/common/LoadingState";
import { HistoryChart } from "@/components/common/HistoryChart";
import { CountryHistoryModal } from "@/components/common/CountryHistoryModal";
import { getDateParam, getCurrentSelectionLabel } from "@/utils/dateUtils";
import { getCurrencySymbol, formatPrice } from "@/utils/currencyUtils";
import { CountryDetails, CountryMedicineData, PriceChange } from "@/types";
import useMediaQuery from "@/hooks/useMediaQuery";

interface CountryDetailProps {
  countryId: string | null;
  onClose: () => void;
}

export const CountryDetail: React.FC<CountryDetailProps> = ({ countryId, onClose }) => {
  const { isAuthenticated } = useAuth();
  const [showLocalCurrency, setShowLocalCurrency] = useState(false);
  const [conversionRate, setConversionRate] = useState<number>(1);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const calendarButtonRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  const { 
    selectedDate, 
    dateRange,
    selectedMonth,
    setSelectedMonth,
    isMonthAvailable,
    availableMonths
  } = useMapContext();

  // Calculate previous month string for API calls
  const getPreviousMonthParam = () => {
    if (!selectedMonth || selectedMonth === 'all') return '';
    try {
      const currentDate = parseISO(selectedMonth + '-01');
      const prevDate = subMonths(currentDate, 1);
      return `?month=${format(prevDate, 'yyyy-MM')}`;
    } catch (e) {
      console.error("Error calculating previous month:", e);
      return '';
    }
  };

  // Fetch country details
  const { data: countryDetails, isLoading } = useQuery({
    queryKey: ["countryDetails", countryId, selectedDate, dateRange, selectedMonth],
    queryFn: async () => {
      if (!countryId) return null;
      const dateParam = getDateParam(selectedDate, dateRange, selectedMonth);
      const response = await api.get(`/country/${countryId}/details${dateParam}`);
      return response.data as CountryDetails;
    },
    enabled: !!countryId && isAuthenticated,
  });

  // Fetch previous month's data
  const previousMonthParam = getPreviousMonthParam();
  const { data: previousMonthCountryData } = useQuery({
    queryKey: ["previousMonthCountryData", countryId, previousMonthParam],
    queryFn: async () => {
      if (!countryId || !previousMonthParam) return null;
      const response = await api.get(`/countries-average-prices${previousMonthParam}`);
      const countryData = response.data.find((c: CountryMedicineData) => String(c.id) === String(countryId));
      return countryData || null;
    },
    enabled: !!countryId && isAuthenticated && !!previousMonthParam,
  });

  // Fetch top medicines
  const { data: topMedicines = [], isLoading: isLoadingMedicines } = useQuery({
    queryKey: ["topMedicines", countryId, selectedDate, dateRange, selectedMonth],
    queryFn: async () => {
      if (!countryId) return [];
      const dateParam = getDateParam(selectedDate, dateRange, selectedMonth);
      const response = await api.get(`/country/${countryId}/top-medicines${dateParam}`);
      return response.data;
    },
    enabled: !!countryId && isAuthenticated,
  });

  // Fetch currency conversion rate
  useEffect(() => {
    const fetchCurrencyRate = async () => {
      if (countryDetails?.currency && countryDetails?.currency !== 'USD') {
        try {
          const rate = await getCurrencyRate(countryDetails.currency, 'USD');
          setConversionRate(rate);
        } catch (error) {
          console.error('Error fetching currency rate:', error);
          setConversionRate(1);
        }
      } else {
        setConversionRate(1);
      }
    };
    
    fetchCurrencyRate();
  }, [countryDetails]);

  // Fetch historical price data
  const { data: historicalPrices, isLoading: isLoadingHistorical } = useQuery({
    queryKey: ["historicalCountryPrices", countryId],
    queryFn: async () => {
      if (!countryId) return [];
      const response = await api.get(`/comparison/country/${countryId}/historical-prices`);
      return response.data;
    },
    enabled: !!countryId && isAuthenticated,
  });

  // Prepare data for the chart
  const chartData = React.useMemo(() => {
    if (!historicalPrices || historicalPrices.length === 0) {
      return { labels: [], datasets: [] };
    }

    const sortedData = [...historicalPrices].sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

    const labels = sortedData.map((item: any) => format(parseISO(item.month + '-01'), 'MMM yyyy'));
    // Convert historical prices to USD using the fetched conversion rate
    const pricesInUsd = sortedData.map((item: any) => item.average_price * conversionRate);

    return {
      labels,
      datasets: [
        {
          label: 'Average Price (USD)',
          data: pricesInUsd,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          tension: 0.1,
        },
      ],
    };
  }, [historicalPrices, conversionRate]);

  // Determine if screen is large for modal display (using Tailwind's md breakpoint)
  const isLargeScreen = useMediaQuery('(min-width: 768px)');

  // Calculate price change percentage
  const calculatePriceChange = (currentPrice?: number | null, previousPrice?: number | null): PriceChange | null => {
    if (currentPrice != null && previousPrice != null && !isNaN(currentPrice) && !isNaN(previousPrice) && previousPrice > 0) {
      const change = ((currentPrice - previousPrice) / previousPrice) * 100;
      return {
        value: change,
        increased: change > 0,
        percentage: Math.abs(change).toFixed(1) + '%'
      };
    }
    return null;
  };

  // Function to open auth modal
  const openAuthModal = () => {
    const event = new CustomEvent('open-auth-modal', { 
      detail: { type: 'login' } 
    });
    window.dispatchEvent(event);
  };

  return (
    <Sheet open={!!countryId} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <SheetContent 
        className="w-full sm:max-w-md overflow-y-auto bg-background dark:bg-background border dark:border-border overflow-hidden" 
        side="right"
      >
        <DetailHeader 
          title={countryDetails?.name || "Country Details"}
          description="Medicine pricing and consumption details"
        />

        {!isAuthenticated ? (
          <div className="space-y-4 my-6">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Authentication Required</AlertTitle>
              <AlertDescription>
                You must be logged in to view country medicine details.
              </AlertDescription>
            </Alert>
            <Button onClick={openAuthModal} className="w-full">
              Log in to access data
            </Button>
          </div>
        ) : isLoading ? (
          <LoadingState message="Loading country details..." />
        ) : countryDetails ? (
          <div className="space-y-6">
            {/* Month selector */}
            <div className="flex items-center gap-2">
              <div 
                ref={calendarButtonRef} 
                className="flex-1 flex items-center space-x-2 cursor-pointer border rounded-md p-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => setMonthPickerOpen(!monthPickerOpen)}
              >
                <Calendar className="h-4 w-4" />
                <div className="flex-1 text-sm">{getCurrentSelectionLabel(selectedMonth)}</div>
              </div>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-full"
                    >
                      <InfoIcon className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left" align="center" className="max-w-[220px]">
                    <p>Select a specific month to view medicine prices and consumption data for that period</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <MonthPicker 
              isOpen={monthPickerOpen} 
              onClose={() => setMonthPickerOpen(false)} 
              position="right"
              anchor={calendarButtonRef}
            />
          
            {countryDetails.currency && countryDetails.currency !== 'USD' && (
              <CurrencyToggle
                showLocalCurrency={showLocalCurrency}
                onToggle={setShowLocalCurrency}
                localCurrencyCode={countryDetails.currency}
              />
            )}
            
            {/* Historical Price Chart Section */}
            {chartData.labels.length > 0 && (
              <div className="bg-card dark:bg-card rounded-lg p-4 shadow-sm">
                 <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  Historical Average Price
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-help">
                          <InfoIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[250px]">
                        <p>Average price of medicines over time in {countryDetails.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </h3>
                {isLargeScreen ? (
                  <Button 
                    onClick={() => setIsHistoryModalOpen(true)} 
                    className="w-full"
                    variant="ghost"
                  >
                    View Historical Graph
                  </Button>
                ) : isLoadingHistorical ? (
                   <LoadingState message="Loading historical data..." />
                ) : (
                   <div style={{ height: '300px' }}>
                      <HistoryChart data={chartData} title="Average Price History" yAxisLabel="Price (USD)" />
                   </div>
                )}
              </div>
            )}

            {/* Overview Section */}
            <div className="bg-card dark:bg-card rounded-lg p-4 shadow-sm">
              <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                Overview
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-help">
                        <InfoIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[250px]">
                      <p>Summary of medicine prices and consumption in {countryDetails.name}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Currency</span>
                  <span className="font-medium">
                    {countryDetails.currency}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="inline-block cursor-help">
                            <InfoIcon className="inline-block h-3 w-3 ml-1 text-muted-foreground" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p>Local currency used for medicine prices</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Total Quantity Bought</span>
                  <span className="font-medium">{countryDetails.total_medicines?.toLocaleString()}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Average Package Price</span>
                  <div className="font-medium flex items-center">
                    {showLocalCurrency ? getCurrencySymbol(countryDetails.currency) : '$'}
                    {formatPrice(
                      countryDetails.avg_price,
                      countryDetails.currency,
                      showLocalCurrency,
                      conversionRate
                    )}
                    {(() => {
                      const priceChange = calculatePriceChange(
                        countryDetails.avg_price,
                        previousMonthCountryData?.avg_price
                      );
                      return priceChange ? (
                        <span className={`ml-2 flex items-center text-sm ${ 
                          priceChange.increased ? 'text-red-500' : 'text-emerald-500'
                        }`}>
                          {priceChange.increased ? (
                            <TrendingUp className="h-4 w-4 mr-1" />
                          ) : (
                            <TrendingDown className="h-4 w-4 mr-1" />
                          )}
                          {priceChange.percentage}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <InfoIcon className="h-4 w-4 ml-1 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">
                                <p>
                                  {priceChange.increased ? 'Increased' : 'Decreased'} by {priceChange.percentage} since previous month
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </span>
                      ) : null;
                    })()}
                    {countryDetails.using_reference_price > 0 && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="ml-1.5 cursor-help">
                              <AlertTriangle className="h-4 w-4 text-amber-500" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>No sales price available. Using reference price.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Top Medicines Section */}
            <div className="bg-card dark:bg-card rounded-lg p-4 shadow-sm">
              <h3 className="text-lg font-medium mb-2 flex items-center gap-2">
                Top Medicines
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-help">
                        <InfoIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[250px]">
                      <p>Most purchased medicines in {countryDetails.name}, sorted by quantity sold</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </h3>
              {isLoadingMedicines ? (
                <LoadingState message="Loading medicines..." />
              ) : (
                <div className="space-y-3">
                  {topMedicines.map((medicine: any) => {
                    const previousMedicine = previousMonthCountryData?.topMedicines?.find(
                      (prevMed: any) => prevMed.name === medicine.name
                    );
                    const priceChange = calculatePriceChange(
                      medicine.averagePrice,
                      previousMedicine?.averagePrice
                    );
                    
                    return (
                      <div key={medicine.name} className="border-b dark:border-border pb-2 last:border-0">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{medicine.name}</span>
                          <div className="flex items-center">
                            <span>
                              {showLocalCurrency ? getCurrencySymbol(countryDetails.currency) : '$'}
                              {formatPrice(
                                medicine.averagePrice,
                                countryDetails.currency,
                                showLocalCurrency,
                                conversionRate
                              )}
                            </span>
                            
                            {priceChange && (
                              <span className={`ml-2 flex items-center text-sm ${ 
                                priceChange.increased ? 'text-red-500' : 'text-emerald-500'
                              }`}>
                                {priceChange.increased ? (
                                  <TrendingUp className="h-4 w-4 mr-1" />
                                ) : (
                                  <TrendingDown className="h-4 w-4 mr-1" />
                                )}
                                {priceChange.percentage}
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <InfoIcon className="h-4 w-4 ml-1 text-muted-foreground cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="text-xs">
                                      <p>
                                        {priceChange.increased ? 'Increased' : 'Decreased'} by {priceChange.percentage} since previous month
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </span>
                            )}
                            
                            {medicine.using_reference_price > 0 && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="ml-1 cursor-help">
                                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>No sales price available. Using reference price.</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-help">{medicine.dosage}</span>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p>Strength and formulation</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-help">Bought: {medicine.totalSold}</span>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p>Units/packages purchased</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    );
                  })}

                  {topMedicines.length === 0 && (
                    <p className="text-center py-2">No medicines found</p>
                  )}
                </div>
              )}
            </div>

            {isAuthenticated && (
              <Button 
                onClick={() => navigate(`/country/${countryId}/stats`)} 
                className="w-full"
              >
                View Detailed Statistics
              </Button>
            )}
          </div>
        ) : (
          <LoadingState message="No country details available" />
        )}
      </SheetContent>

      {/* Render modal for large screens */}
      {isLargeScreen && countryDetails && (
        <CountryHistoryModal 
          isOpen={isHistoryModalOpen} 
          onClose={() => setIsHistoryModalOpen(false)} 
          chartData={chartData} 
          countryName={countryDetails.name}
        />
      )}
    </Sheet>
  );
};

export default React.memo(CountryDetail);
