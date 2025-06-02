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

interface MedicineDetailProps {
  medicineId: string | null;
  onClose: () => void;
}

const MedicineDetail: React.FC<MedicineDetailProps> = ({ medicineId, onClose }) => {
  const { isAuthenticated } = useAuth();
  const { selectedDate, dateRange, selectedMonth, setSelectedMonth, availableMonths } = useMapContext();
  const [showLocalCurrency, setShowLocalCurrency] = useState(false); // Always show USD by default
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const calendarButtonRef = useRef<HTMLDivElement>(null);

  // Date param logic (copied from CountryDetail)
  const getDateParam = () => {
    let dateParam = '';
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      dateParam = `?date=${formattedDate}`;
    } else if (dateRange && dateRange.from) {
      const from = dateRange.from.toISOString().split('T')[0];
      const to = dateRange.to ? dateRange.to.toISOString().split('T')[0] : '';
      dateParam = `?start=${from}${to ? `&end=${to}` : ''}`;
    } else if (selectedMonth && selectedMonth !== 'all') {
      dateParam = `?month=${selectedMonth}`;
    }
    return dateParam;
  };

  // Fetch medicine details
  const { data: medicineDetails, isLoading } = useQuery({
    queryKey: ["medicineDetails", medicineId, selectedDate, dateRange, selectedMonth],
    queryFn: async () => {
      if (!medicineId) return null;
      const dateParam = getDateParam();
      const response = await api.get(`/medicines/${medicineId}${dateParam}`);
      return response.data;
    },
    enabled: !!medicineId && isAuthenticated,
  });

  // Fetch per-country stats for this medicine
  const { data: countries = [], isLoading: isLoadingCountries } = useQuery({
    queryKey: ["medicineCountries", medicineId, selectedDate, dateRange, selectedMonth],
    queryFn: async () => {
      if (!medicineId) return [];
      const dateParam = getDateParam();
      const response = await api.get(`/medicines/${medicineId}/countries${dateParam}`);
      return response.data;
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

  // Compute per-country prices in USD and local
  const [usdPrices, setUsdPrices] = useState<Record<string, number>>({});
  useEffect(() => {
    const convertAll = async () => {
      if (!countries || countries.length === 0) return;
      const prices: Record<string, number> = {};
      await Promise.all(
        countries.map(async (country: any) => {
          if (country.avg_price && country.currency && country.currency !== 'USD') {
            prices[country.id] = await convertToUSD(country.avg_price, country.currency);
          } else {
            prices[country.id] = country.avg_price;
          }
        })
      );
      setUsdPrices(prices);
    };
    convertAll();
  }, [countries]);

  // Compute true average price in USD (weighted by quantity sold if available)
  const usdAvgPrice = useMemo(() => {
    if (!countries || countries.length === 0) return 'N/A';
    let total = 0;
    let totalQty = 0;
    countries.forEach((country: any) => {
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
        .map((c: any) => Number(usdPrices[c.id]))
        .filter((p) => !isNaN(p) && p > 0);
      if (validPrices.length === 0) return 'N/A';
      return (validPrices.reduce((a, b) => a + b, 0) / validPrices.length).toFixed(2);
    }
  }, [countries, usdPrices]);

  // Month label logic (copied from CountryDetail)
  const getCurrentSelectionLabel = () => {
    if (!selectedMonth || selectedMonth === "all") {
      return "All Time";
    }
    try {
      const date = new Date(selectedMonth + "-01");
      return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    } catch (e) {
      return "All Time";
    }
  };

  // Only allow available months for this medicine in MonthPicker
  const isMonthAvailable = (month: string) => medicineMonths.includes(month);

  const openAuthModal = () => {
    const event = new CustomEvent("open-auth-modal", { detail: { type: "login" } });
    window.dispatchEvent(event);
  };

  // Add getCurrencySymbol helper (copy from CountryDetail if not present)
  const getCurrencySymbol = (currencyCode: string): string => {
    const currencySymbols: Record<string, string> = {
      USD: "$", EUR: "€", GBP: "£", JPY: "¥", CNY: "¥", BRL: "R$", MXN: "$", ARS: "$", CLP: "$", COP: "$", PEN: "S/", UYU: "$U", VES: "Bs.", BOB: "Bs.", PYG: "₲", CAD: "C$", CHF: "Fr.", RUB: "₽", PLN: "zł", TRY: "₺", SEK: "kr", NOK: "kr", DKK: "kr", CZK: "Kč", HUF: "Ft", RON: "lei", INR: "₹", KRW: "₩", AUD: "A$", NZD: "NZ$", SGD: "S$", HKD: "HK$", THB: "฿", PHP: "₱", IDR: "Rp", MYR: "RM", VND: "₫", ZAR: "R", SAR: "﷼", AED: "د.إ", EGP: "E£", NGN: "₦", KES: "KSh", MAD: "د.م.", AOA: "Kz"
    };
    return currencySymbols[currencyCode] || currencyCode;
  };

  return (
    <Sheet open={!!medicineId} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-background dark:bg-background border dark:border-border overflow-hidden" side="right">
        <SheetHeader className="pb-4">
          <SheetTitle>{medicineDetails?.name || "Medicine Details"}</SheetTitle>
          <SheetDescription>
            Medicine pricing and consumption details
          </SheetDescription>
        </SheetHeader>
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
          <div className="flex items-center justify-center h-32">
            <p>Loading medicine details...</p>
          </div>
        ) : medicineDetails ? (
          <div className="space-y-6">
            {/* Month selector with tooltip */}
            <div className="flex items-center gap-2">
              <div
                ref={calendarButtonRef}
                className="flex-1 flex items-center space-x-2 cursor-pointer border rounded-md p-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => setMonthPickerOpen(!monthPickerOpen)}
              >
                <Calendar className="h-4 w-4" />
                <div className="flex-1 text-sm">{getCurrentSelectionLabel()}</div>
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
            <MapContext.Provider value={{
              ...useMapContext(),
              availableMonths: medicineMonths
            }}>
              <MonthPicker
                isOpen={monthPickerOpen}
                onClose={() => setMonthPickerOpen(false)}
                position="right"
                anchor={calendarButtonRef}
              />
            </MapContext.Provider>
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
                          <TooltipContent className="bg-card dark:bg-card text-foreground dark:text-foreground border dark:border-border">
                            <p>No sales price available. Using reference price.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {/* Countries Section */}
            <div className="bg-card dark:bg-card rounded-lg p-4 shadow-sm">
              <div className="flex items-center mb-2 gap-2">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Available In Countries
                </h3>
                <div className="flex-1" />
                <div className="flex items-center space-x-2 mb-4">
                  <div className="flex-1">
                    <Label htmlFor="currency-toggle" className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4" />
                      <span>Show in {showLocalCurrency ? 'Local' : 'USD'}</span>
                    </Label>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center">
                          <Switch
                            id="currency-toggle"
                            checked={showLocalCurrency}
                            onCheckedChange={setShowLocalCurrency}
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="left" align="center">
                        <p>Toggle between local currency and USD</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              {isLoadingCountries ? (
                <p className="text-center py-2">Loading countries...</p>
              ) : (
                <div className="space-y-3">
                  {countries.map((country: any) => (
                    <div key={country.id} className="border-b dark:border-border pb-2 last:border-0">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{country.name}</span>
                        <span className="font-medium">
                          {showLocalCurrency
                            ? (!isNaN(Number(country.avg_price)) ? getCurrencySymbol(country.currency) + Number(country.avg_price).toFixed(2) : 'N/A')
                            : (!isNaN(Number(usdPrices[country.id])) ? '$' + Number(usdPrices[country.id]).toFixed(2) : 'N/A')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-32">
            <p>No data available for this medicine</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default MedicineDetail;