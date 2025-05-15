
import React, { useEffect, useState, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, convertToUSD, getCurrencyRate } from "@/lib/api";
import { InfoIcon, DollarSign, BarChart4, AlertTriangle, Calendar, HelpCircle, TrendingUp, TrendingDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useMapContext } from "@/contexts/MapContext";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MonthPicker } from "@/components/datepicker/MonthPicker";

interface CountryDetailProps {
  countryId: string | null;
  onClose: () => void;
}

export const CountryDetail: React.FC<CountryDetailProps> = ({ countryId, onClose }) => {
  const { isAuthenticated } = useAuth();
  const [showLocalCurrency, setShowLocalCurrency] = useState(true); // Default to local currency
  const [conversionRate, setConversionRate] = useState<number>(1);
  const [currencySymbol, setCurrencySymbol] = useState<string>('$');
  const [currencyCode, setCurrencyCode] = useState<string>('USD');
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const navigate = useNavigate();
  const calendarButtonRef = useRef<HTMLDivElement>(null);
  
  const { 
    selectedDate, 
    setSelectedDate,
    dateRange,
    setDateRange,
    selectedMonth,
    setSelectedMonth,
    isMonthAvailable,
    availableMonths
  } = useMapContext();

  // Debug logging
  useEffect(() => {
    console.log("CountryDetail rendered with countryId:", countryId);
    console.log("Date filters:", { selectedDate, dateRange, selectedMonth });
  }, [countryId, selectedDate, dateRange, selectedMonth]);
  
  // Get formatted label for current selection
  const getCurrentSelectionLabel = () => {
    if (!selectedMonth || selectedMonth === "all") {
      return "All Time";
    }
    
    try {
      const date = parseISO(selectedMonth);
      return format(date, 'MMMM yyyy');
    } catch (e) {
      console.error("Error parsing date:", e);
      return "All Time";
    }
  };

  // Prepare date parameter for API calls
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

  const { data: countryDetails, isLoading } = useQuery({
    queryKey: ["countryDetails", countryId, selectedDate, dateRange, selectedMonth],
    queryFn: async () => {
      if (!countryId) return null;
      console.log(`Fetching details for country ID: ${countryId}`);
      try {
        const dateParam = getDateParam();
        const response = await api.get(`/country/${countryId}/details${dateParam}`);
        console.log("Country details API response:", response.data);
        return response.data;
      } catch (error) {
        console.error("Error fetching country details:", error);
        return null;
      }
    },
    enabled: !!countryId && isAuthenticated,
  });

  const { data: topMedicines = [], isLoading: isLoadingMedicines } = useQuery({
    queryKey: ["topMedicines", countryId, selectedDate, dateRange, selectedMonth],
    queryFn: async () => {
      if (!countryId) return [];
      const dateParam = getDateParam();
      const response = await api.get(`/country/${countryId}/top-medicines${dateParam}`);
      return response.data;
    },
    enabled: !!countryId && isAuthenticated,
  });

  // Function to get currency symbol for a currency code
  const getCurrencySymbol = (currencyCode: string): string => {
    const currencySymbols: Record<string, string> = {
      // Major world currencies
      'USD': '$',        // US Dollar
      'EUR': '€',        // Euro
      'GBP': '£',        // British Pound
      'JPY': '¥',        // Japanese Yen
      'CNY': '¥',        // Chinese Yuan
      
      // Latin America
      'BRL': 'R$',       // Brazilian Real
      'MXN': '$',        // Mexican Peso
      'ARS': '$',        // Argentine Peso
      'CLP': '$',        // Chilean Peso
      'COP': '$',        // Colombian Peso
      'PEN': 'S/',       // Peruvian Sol
      'UYU': '$U',       // Uruguayan Peso
      'VES': 'Bs.',      // Venezuelan Bolivar
      'BOB': 'Bs.',      // Bolivian Boliviano
      'PYG': '₲',        // Paraguayan Guarani
      
      // Other currencies
      'CAD': 'C$',       // Canadian Dollar
      'CHF': 'Fr.',      // Swiss Franc
      'RUB': '₽',        // Russian Ruble
      'PLN': 'zł',       // Polish Zloty
      'TRY': '₺',        // Turkish Lira
      'SEK': 'kr',       // Swedish Krona
      'NOK': 'kr',       // Norwegian Krone
      'DKK': 'kr',       // Danish Krone
      'CZK': 'Kč',       // Czech Koruna
      'HUF': 'Ft',       // Hungarian Forint
      'RON': 'lei',      // Romanian Leu
      'INR': '₹',        // Indian Rupee
      'KRW': '₩',        // South Korean Won
      'AUD': 'A$',       // Australian Dollar
      'NZD': 'NZ$',      // New Zealand Dollar
      'SGD': 'S$',       // Singapore Dollar
      'HKD': 'HK$',      // Hong Kong Dollar
      'THB': '฿',        // Thai Baht
      'PHP': '₱',        // Philippine Peso
      'IDR': 'Rp',       // Indonesian Rupiah
      'MYR': 'RM',       // Malaysian Ringgit
      'VND': '₫',        // Vietnamese Dong
      'ZAR': 'R',        // South African Rand
      'SAR': '﷼',        // Saudi Riyal
      'AED': 'د.إ',      // UAE Dirham
      'EGP': 'E£',       // Egyptian Pound
      'NGN': '₦',        // Nigerian Naira
      'KES': 'KSh',      // Kenyan Shilling
      'MAD': 'د.م.',     // Moroccan Dirham
    };
    
    return currencySymbols[currencyCode] || currencyCode;
  };

  // Fetch currency conversion rate when country details changes
  useEffect(() => {
    const fetchCurrencyRate = async () => {
      if (countryDetails?.currency && countryDetails?.currency !== 'USD') {
        try {
          // Ensure we're using the same conversion logic as everywhere else
          const rate = await getCurrencyRate(countryDetails.currency, 'USD');
          setConversionRate(rate);
          
          // Set the currency symbol based on currency code
          setCurrencySymbol(getCurrencySymbol(countryDetails.currency));
          setCurrencyCode(countryDetails.currency);
        } catch (error) {
          console.error('Error fetching currency rate:', error);
          setConversionRate(1);
          setCurrencySymbol('$');
          setCurrencyCode('USD');
        }
      } else {
        setConversionRate(1);
        setCurrencySymbol('$');
        setCurrencyCode('USD');
      }
    };
    
    fetchCurrencyRate();
  }, [countryDetails]);

  // Format price with appropriate currency
  const formatPrice = (price: any): string => {
    if (price === undefined || price === null) {
      return "N/A";
    }
    
    // Handle non-numeric values
    if (typeof price !== 'number') {
      const numericPrice = parseFloat(String(price));
      if (isNaN(numericPrice)) {
        return "N/A";
      }
      price = numericPrice;
    }
    
    // Apply conversion if needed using the consistent conversion rate
    if (!showLocalCurrency && countryDetails?.currency && countryDetails?.currency !== 'USD') {
      const convertedPrice = price * conversionRate;
      return convertedPrice.toFixed(2);
    }
    
    return price.toFixed(2);
  };

  // Function to open auth modal
  const openAuthModal = () => {
    const event = new CustomEvent('open-auth-modal', { 
      detail: { type: 'login' } 
    });
    window.dispatchEvent(event);
  };

  // Calculate price change percentage for a medicine if previous price exists
  const calculatePriceChange = (currentPrice?: number, previousPrice?: number) => {
    if (previousPrice && currentPrice && previousPrice > 0) {
      const change = ((currentPrice - previousPrice) / previousPrice) * 100;
      return {
        value: change,
        increased: change > 0,
        percentage: Math.abs(change).toFixed(1) + '%'
      };
    }
    return null;
  };

  // Safely display currency value with proper formatting
  const displayCurrencyValue = (value: any): React.ReactNode => {
    return formatPrice(value);
  };

  return (
    <Sheet open={!!countryId} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <SheetContent 
        className="w-full sm:max-w-md overflow-y-auto bg-background dark:bg-background border dark:border-border overflow-hidden" 
        side="right"
      >
        <SheetHeader className="pb-4">
          <SheetTitle>{countryDetails?.name || "Country Details"}</SheetTitle>
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
                You must be logged in to view country medicine details.
              </AlertDescription>
            </Alert>
            <Button onClick={openAuthModal} className="w-full">
              Log in to access data
            </Button>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center h-32">
            <p>Loading country details...</p>
          </div>
        ) : countryDetails ? (
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
            
            {/* Month picker popup */}
            <MonthPicker 
              isOpen={monthPickerOpen} 
              onClose={() => setMonthPickerOpen(false)} 
              position="right"
              anchor={calendarButtonRef}
            />
          
            {countryDetails.currency && countryDetails.currency !== 'USD' && (
              <div className="flex items-center space-x-2 mb-4">
                <div className="flex-1">
                  <Label htmlFor="currency-toggle" className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4" />
                    <span>Show in {showLocalCurrency ? countryDetails.currency : 'USD'}</span>
                  </Label>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center">
                        <Switch
                          id="currency-toggle"
                          checked={!showLocalCurrency}
                          onCheckedChange={(checked) => setShowLocalCurrency(!checked)}
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="left" align="center">
                      <p>Toggle between local currency and USD</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
            
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
                    {showLocalCurrency ? currencySymbol : '$'}
                    {displayCurrencyValue(countryDetails.avg_price)}
                    
                    {(countryDetails.using_reference_price > 0) && (
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
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="cursor-help">
                            <InfoIcon className="ml-1 h-3 w-3 text-muted-foreground" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[250px]">
                          <p>Average price per package across all medicines</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </div>
            </div>

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
                <p className="text-center py-2">Loading medicines...</p>
              ) : (
                <div className="space-y-3">
                  {topMedicines.map((medicine: any) => {
                    const priceChange = calculatePriceChange(medicine.averagePrice, medicine.previousPrice);
                    
                    return (
                      <div key={medicine.name} className="border-b dark:border-border pb-2 last:border-0">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{medicine.name}</span>
                          <div className="flex items-center">
                            <span>
                              {showLocalCurrency ? currencySymbol : '$'}
                              {displayCurrencyValue(medicine.averagePrice)}
                            </span>
                            
                            {/* Price change indicator with arrow icon */}
                            {priceChange && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className={`ml-1 flex items-center ${
                                      priceChange.increased ? 'text-red-500' : 'text-emerald-500'
                                    }`}>
                                      {priceChange.increased ? (
                                        <TrendingUp className="h-4 w-4" />
                                      ) : (
                                        <TrendingDown className="h-4 w-4" />
                                      )}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="text-xs">
                                    <p>
                                      {priceChange.increased ? 'Increased' : 'Decreased'} by {priceChange.percentage}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            
                            {(medicine.using_reference_price > 0) && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="ml-1 cursor-help">
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
          <div className="flex items-center justify-center h-32">
            <p>No country details available</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default React.memo(CountryDetail);
