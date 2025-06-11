import React, { useEffect, useState, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, getCurrencyRate, convertToUSD } from "@/lib/api";
import { InfoIcon, DollarSign, AlertTriangle, Calendar, Globe } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMapContext, MapContext } from "@/contexts/MapContext";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MonthPicker } from "@/components/datepicker/MonthPicker";
import { format, parseISO } from "date-fns";

// Import our new components and utilities
import { DetailHeader } from "@/components/common/DetailHeader";
import { CurrencyToggle } from "@/components/common/CurrencyToggle";
import { LoadingState } from "@/components/common/LoadingState";
import { HistoryChart } from "@/components/common/HistoryChart";
import { MedicineHistoryModal } from "@/components/common/MedicineHistoryModal";
import { getDateParam, getCurrentSelectionLabel } from "@/utils/dateUtils";
import { getCurrencySymbol, formatPrice } from "@/utils/currencyUtils";
import { MedicineDetails, CountryMedicineData } from "@/types";
import useMediaQuery from "@/hooks/useMediaQuery";

interface MedicineDetailProps {
  medicineId: string | null;
  onClose: () => void;
}

const MedicineDetail: React.FC<MedicineDetailProps> = ({ medicineId, onClose }) => {
  const { isAuthenticated } = useAuth();
  const { selectedDate, dateRange, selectedMonth, setSelectedMonth, availableMonths } = useMapContext();
  const [showLocalCurrency, setShowLocalCurrency] = useState(false);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const calendarButtonRef = useRef<HTMLDivElement>(null);

  // Fetch medicine details
  const { data: medicineDetails, isLoading } = useQuery({
    queryKey: ["medicineDetails", medicineId, selectedDate, dateRange, selectedMonth],
    queryFn: async () => {
      if (!medicineId) return null;
      const dateParam = getDateParam(selectedDate, dateRange, selectedMonth);
      const response = await api.get(`/medicines/${medicineId}${dateParam}`);
      return response.data as MedicineDetails;
    },
    enabled: !!medicineId && isAuthenticated,
  });

  // Fetch per-country stats for this medicine
  const { data: countries = [], isLoading: isLoadingCountries } = useQuery({
    queryKey: ["medicineCountries", medicineId, selectedDate, dateRange, selectedMonth],
    queryFn: async () => {
      if (!medicineId) return [];
      const dateParam = getDateParam(selectedDate, dateRange, selectedMonth);
      const response = await api.get(`/medicines/${medicineId}/countries${dateParam}`);
      return response.data as CountryMedicineData[];
    },
    enabled: !!medicineId && isAuthenticated,
  });

  // Fetch available months for this medicine
  const [medicineMonths, setMedicineMonths] = useState<string[]>([]);
  useEffect(() => {
    const fetchMonths = async () => {
      if (!medicineId) return;
      try {
        const res = await api.get(`/medicines/${medicineId}/available-months`);
        setMedicineMonths(res.data || []);
      } catch (e) {
        setMedicineMonths([]);
      }
    };
    fetchMonths();
  }, [medicineId]);

  // Compute per-country prices in USD
  const [usdPrices, setUsdPrices] = useState<Record<string, number>>({});
  useEffect(() => {
    const convertAll = async () => {
      if (!countries || countries.length === 0) return;
      const prices: Record<string, number> = {};
      await Promise.all(
        countries.map(async (country) => {
          if (country.avg_price && country.currency && country.currency !== 'USD') {
            try {
              const rate = await getCurrencyRate(country.currency, 'USD');
              prices[country.id] = country.avg_price * rate;
            } catch (error) {
              console.error(`Error converting ${country.currency} to USD:`, error);
              prices[country.id] = country.avg_price;
            }
          } else {
            prices[country.id] = country.avg_price;
          }
        })
      );
      setUsdPrices(prices);
    };
    convertAll();
  }, [countries]);

  // Compute true average price in USD
  const usdAvgPrice = React.useMemo(() => {
    if (!countries || countries.length === 0) return 'N/A';
    let total = 0;
    let totalQty = 0;
    countries.forEach((country) => {
      const price = Number(usdPrices[country.id]);
      const qty = Number(country.total_quantity) || 0;
      if (!isNaN(price) && price > 0 && qty > 0) {
        total += price * qty;
        totalQty += qty;
      }
    });
    if (totalQty > 0) {
      return (total / totalQty).toFixed(2);
    } else {
      // fallback to simple average if no quantity
      const validPrices = countries
        .map((c) => Number(usdPrices[c.id]))
        .filter((p) => !isNaN(p) && p > 0);
      if (validPrices.length === 0) return 'N/A';
      return (validPrices.reduce((a, b) => a + b, 0) / validPrices.length).toFixed(2);
    }
  }, [countries, usdPrices]);

  // Fetch historical price data for the medicine across all countries
  const { data: historicalPrices, isLoading: isLoadingHistorical } = useQuery({
    queryKey: ["historicalMedicinePrices", medicineId],
    queryFn: async () => {
      if (!medicineId) return [];
      const response = await api.get(`/comparison/medicines/${medicineId}/historical-prices`);
      // The API response is expected to be an array of objects like { month: string, average_price_usd: number }
      return response.data;
    },
    enabled: !!medicineId && isAuthenticated,
  });

  // Prepare data for the chart
  const chartData = React.useMemo(() => {
    if (!historicalPrices || historicalPrices.length === 0) {
      return { labels: [], datasets: [] };
    }

    const sortedData = [...historicalPrices].sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

    const labels = sortedData.map((item: any) => format(parseISO(item.month + '-01'), 'MMM yyyy'));
    const prices = sortedData.map((item: any) => item.average_price_usd); // Assuming the API returns average price in USD

    return {
      labels,
      datasets: [
        {
          label: 'Average Price (USD)',
          data: prices,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          tension: 0.1,
        },
      ],
    };
  }, [historicalPrices]);

  // Determine if screen is large for modal display (using Tailwind's md breakpoint)
  const isLargeScreen = useMediaQuery('(min-width: 768px)');

  const openAuthModal = () => {
    const event = new CustomEvent("open-auth-modal", { detail: { type: "login" } });
    window.dispatchEvent(event);
  };

  return (
    <Sheet open={!!medicineId} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-background dark:bg-background border dark:border-border overflow-hidden" side="right">
        <DetailHeader 
          title={medicineDetails?.name || "Medicine Details"}
          description="Medicine pricing and consumption details"
        />

        {!isAuthenticated ? (
          <div className="space-y-4 my-6">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Authentication Required</AlertTitle>
              <AlertDescription>
                You must be logged in to view medicine details.
              </AlertDescription>
            </Alert>
            <Button onClick={openAuthModal} className="w-full">
              Log in to access data
            </Button>
          </div>
        ) : isLoading ? (
          <LoadingState message="Loading medicine details..." />
        ) : medicineDetails ? (
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
                      <p>Summary of medicine sales and pricing</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Dosage</span>
                  <span className="font-medium">{medicineDetails.dosage}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Total Quantity Sold</span>
                  <span className="font-medium">{medicineDetails.total_quantity?.toLocaleString()}</span>
                </div>
                <div className="flex flex-col col-span-2">
                  <span className="text-sm text-muted-foreground">Average Price (USD)</span>
                  <div className="font-medium flex items-center">
                    ${usdAvgPrice}
                    {medicineDetails.using_reference_price > 0 && (
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

            {/* Historical Average Price Chart Section */}
            {chartData.labels.length > 0 && (
              <div className="bg-card dark:bg-card rounded-lg p-4 shadow-sm">
                 <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  Historical Average Price (Global)
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-help">
                          <InfoIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[250px]">
                        <p>Global average price of this medicine over time</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </h3>
                {/* Conditionally render chart or button based on screen size */}
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
                   <div style={{ height: '300px' }}> {/* Added height for chart in inline view */}
                      <HistoryChart data={chartData} title="Global Average Price History" yAxisLabel="Price (USD)" />
                   </div>
                )}
              </div>
            )}

            {/* Countries Section */}
            <div className="bg-card dark:bg-card rounded-lg p-4 shadow-sm">
              <div className="flex items-center mb-2 gap-2">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Available In Countries
                </h3>
                <div className="flex-1" />
                <CurrencyToggle
                  showLocalCurrency={showLocalCurrency}
                  onToggle={setShowLocalCurrency}
                />
              </div>
              {isLoadingCountries ? (
                <LoadingState message="Loading countries..." />
              ) : (
                <div className="space-y-3">
                  {countries.map((country) => (
                    <div key={country.id} className="border-b dark:border-border pb-2 last:border-0">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{country.name}</span>
                        <span className="font-medium">
                          {showLocalCurrency
                            ? formatPrice(country.avg_price, country.currency, true)
                            : formatPrice(usdPrices[country.id], 'USD', false)}
                        </span>
                      </div>
                    </div>
                  ))}
                  {countries.length === 0 && (
                    <p className="text-center py-2">No countries found</p>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <LoadingState message="No data available for this medicine" />
        )}
      </SheetContent>

      {/* Render modal for large screens */}
      {isLargeScreen && medicineDetails && (
        <MedicineHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          chartData={chartData}
          medicineName={medicineDetails.name}
        />
      )}
    </Sheet>
  );
};

export default React.memo(MedicineDetail);