import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, getCurrencyRate } from "@/lib/api";
import { ArrowUpRight, ArrowDownRight, ShieldAlert, AlertTriangle, InfoIcon, DollarSign, BarChart4 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

  // Debug logging
  useEffect(() => {
    console.log("CountryDetail rendered with countryId:", countryId);
  }, [countryId]);

  const { data: countryDetails, isLoading } = useQuery({
    queryKey: ["countryDetails", countryId],
    queryFn: async () => {
      if (!countryId) return null;
      console.log(`Fetching details for country ID: ${countryId}`);
      try {
        const response = await api.get(`/country/${countryId}/details`);
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
    queryKey: ["topMedicines", countryId],
    queryFn: async () => {
      if (!countryId) return [];
      const response = await api.get(`/country/${countryId}/top-medicines`);
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
      
      // North America
      'CAD': 'C$',       // Canadian Dollar
      
      // Europe
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
      
      // Asia and Pacific
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
      
      // Middle East and Africa
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
          const rate = await getCurrencyRate('USD', countryDetails.currency);
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

  const formatPrice = (price: any, convertCurrency: boolean = false): string => {
    if (typeof price !== 'number' && isNaN(parseFloat(String(price)))) {
      return "N/A";
    }
    
    const numericPrice = typeof price === 'number' ? price : parseFloat(String(price));
    
    // Convert to USD if toggled, otherwise show in local currency
    const finalPrice = convertCurrency && !showLocalCurrency
      ? numericPrice / conversionRate  // Convert local to USD
      : numericPrice;
    
    return finalPrice.toFixed(2);
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
        <SheetHeader className="pb-4">
          <SheetTitle>{countryDetails?.name || "Country Details"}</SheetTitle>
          <SheetDescription>
            Medicine pricing and consumption details
          </SheetDescription>
        </SheetHeader>

        {!isAuthenticated ? (
          <div className="space-y-4 my-6">
            <Alert variant="destructive">
              <ShieldAlert className="h-4 w-4" />
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
            {countryDetails.currency && countryDetails.currency !== 'USD' && (
              <div className="flex items-center space-x-2 mb-4">
                <div className="flex-1">
                  <Label htmlFor="currency-toggle" className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4" />
                    <span>Show in {showLocalCurrency ? 'USD' : currencyCode}</span>
                  </Label>
                </div>
                <Switch
                  id="currency-toggle"
                  checked={!showLocalCurrency}
                  onCheckedChange={(checked) => setShowLocalCurrency(!checked)}
                />
              </div>
            )}
            
            <div className="bg-card dark:bg-card rounded-lg p-4 shadow-sm">
              <h3 className="text-lg font-medium mb-2">Overview</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Currency</span>
                  <span className="font-medium">{countryDetails.currency}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Total Quantity Bought</span>
                  <span className="font-medium">{countryDetails.total_medicines?.toLocaleString()}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Average Price</span>
                  <div className="font-medium flex items-center">
                    {showLocalCurrency ? currencySymbol : '$'}
                    {formatPrice(countryDetails.avg_price, true)}
                    {countryDetails.previous_price && (
                      countryDetails.avg_price > countryDetails.previous_price ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span><ArrowUpRight className="ml-1 h-4 w-4 text-red-500" /></span>
                            </TooltipTrigger>
                            <TooltipContent className="bg-card dark:bg-card text-foreground dark:text-foreground border dark:border-border">
                              <p>Price increased (bad)</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span><ArrowDownRight className="ml-1 h-4 w-4 text-green-500" /></span>
                            </TooltipTrigger>
                            <TooltipContent className="bg-card dark:bg-card text-foreground dark:text-foreground border dark:border-border">
                              <p>Price decreased (good)</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )
                    )}
                    
                    {countryDetails.using_reference_price > 0 && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="ml-1.5 cursor-help">
                              <AlertTriangle className="h-4 w-4 text-amber-500" />
                            </span>
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

            <div className="bg-card dark:bg-card rounded-lg p-4 shadow-sm">
              <h3 className="text-lg font-medium mb-2">Top Medicines</h3>
              {isLoadingMedicines ? (
                <p className="text-center py-2">Loading medicines...</p>
              ) : (
                <div className="space-y-3">
                  {topMedicines.map((medicine: any) => (
                    <div key={medicine.name} className="border-b dark:border-border pb-2 last:border-0">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{medicine.name}</span>
                        <div className="flex items-center">
                          <span>{showLocalCurrency ? currencySymbol : '$'}{formatPrice(medicine.averagePrice, true)}</span>
                          
                          {medicine.previousPrice && (
                            medicine.averagePrice > medicine.previousPrice ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span><ArrowUpRight className="ml-1 h-4 w-4 text-red-500" /></span>
                                  </TooltipTrigger>
                                  <TooltipContent className="bg-card dark:bg-card text-foreground dark:text-foreground border dark:border-border">
                                    <p>Price increased (bad)</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span><ArrowDownRight className="ml-1 h-4 w-4 text-green-500" /></span>
                                  </TooltipTrigger>
                                  <TooltipContent className="bg-card dark:bg-card text-foreground dark:text-foreground border dark:border-border">
                                    <p>Price decreased (good)</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )
                          )}
                          
                          {medicine.using_reference_price > 0 && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="ml-1 cursor-help">
                                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                                  </span>
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
                        <span>{medicine.dosage}</span>
                        <span>Bought: {medicine.totalSold}</span>
                      </div>
                    </div>
                  ))}

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
