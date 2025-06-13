import React, { useState, useEffect } from "react";
import { Search, ArrowUpRight, ArrowDownRight, ArrowLeft, TrendingUp, TrendingDown, Pill } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useMapContext } from "@/contexts/MapContext";
import { api, convertToUSD } from "@/lib/api";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import FlagIcon from "@/components/flags/FlagIcon";

interface SearchResult {
  id: number;
  name: string;
  dosage?: string;
  averagePrice?: number;
  previousPrice?: number; 
  totalMedicines?: number;
  currency?: string;
  countryCount?: number;
  noPriceForSelectedMonth?: boolean;
  iso_code?: string;
  [key: string]: any;
}

interface SearchModalProps {
  type: "country" | "medicine";
  onSelect: (item: SearchResult) => void;
  onBack?: () => void; 
  isNestedModal?: boolean; 
}

export const SearchModal: React.FC<SearchModalProps> = ({ 
  type, 
  onSelect, 
  onBack, 
  isNestedModal = false 
}) => {
  const [open, setOpen] = useState(isNestedModal);
  const [searchTerm, setSearchTerm] = useState("");
  const { darkMode, selectedDate, selectedMonth } = useMapContext();
  
  // Effect to reset open state when isNestedModal changes
  useEffect(() => {
    if (isNestedModal) {
      setOpen(true);
    }
  }, [isNestedModal]);

  // Helper to build date params for API
  const getDateParam = () => {
    if (selectedDate) {
      return `?date=${selectedDate.toISOString().split('T')[0]}`;
    } else if (selectedMonth && selectedMonth !== 'all') {
      return `?month=${selectedMonth}`;
    }
    return '';
  };

  // Query for all countries/medicines data
  const { data: allItemsRaw = [], isLoading: isLoadingAll } = useQuery({
    queryKey: [type, 'all-items', selectedDate, selectedMonth],
    queryFn: async () => {
      if (!open) return [];
      const endpoint = type === "country"
        ? `/countries${getDateParam()}`
        : `/medicines`; // Medicines don't need date/month param for general listing in search
      const response = await api.get(endpoint);
      return response.data;
    },
    enabled: open,
  });
  
  const [allItems, setAllItems] = React.useState<SearchResult[]>([]);
  const [convertingAll, setConvertingAll] = React.useState(false);

  React.useEffect(() => {
    if (type !== 'country' || !allItemsRaw.length) {
      setAllItems(allItemsRaw as SearchResult[]);
      return;
    }
    let cancelled = false;
    setConvertingAll(true);
    
    // Convert each item's price to USD
    const convertPrices = async () => {
      try {
        const converted = await Promise.all(allItemsRaw.map(async (item: any) => {
          if (item.currency && 
              item.currency !== 'USD' && 
              typeof item.averagePrice === 'number' && 
              !isNaN(item.averagePrice)) {
            try {
              const usdPrice = await convertToUSD(item.averagePrice, item.currency);
              return {
                ...item,
                averagePrice: usdPrice,
                averagePriceLocal: item.averagePrice,
                previousPriceLocal: item.previousPrice,
                noPriceForSelectedMonth: false
              };
            } catch (error) {
              console.error('Error converting price to USD:', error);
              return {
                ...item,
                noPriceForSelectedMonth: false
              };
            }
          }
          return {
            ...item,
            noPriceForSelectedMonth: false
          };
        }));
        
        if (!cancelled) {
          setAllItems(converted as SearchResult[]);
        }
      } catch (error) {
        console.error('Error converting prices:', error);
        if (!cancelled) {
          // On error, use original prices
          const fallback = allItemsRaw.map((item: any) => ({
            ...item,
            averagePrice: parseFloat(item.averagePrice) || 0,
            previousPriceLocal: parseFloat(item.previousPrice) || 0,
            averagePriceLocal: parseFloat(item.averagePrice) || 0,
            currency: item.currency || 'USD',
            noPriceForSelectedMonth: false,
          }));
          setAllItems(fallback as SearchResult[]);
        }
      } finally {
        if (!cancelled) {
          setConvertingAll(false);
        }
      }
    };
    
    convertPrices();
    
    return () => { cancelled = true; };
  }, [allItemsRaw, type, selectedMonth, selectedDate]);
  
  // Query for search results only when a search term is entered
  const { data: searchResultsRaw = [], isLoading: isSearching } = useQuery({
    queryKey: [type, 'search', searchTerm, open, selectedDate, selectedMonth],
    queryFn: async () => {
      if (!open || !searchTerm) return [];
      const endpoint = type === "country"
        ? `/search/countries${getDateParam()}&q=${searchTerm}`
        : `/search/medicines?q=${searchTerm}`; // Medicines don't need date/month param for search query
      const response = await api.get(endpoint);
      return response.data;
    },
    enabled: open && searchTerm.length >= 2,
  });
  
  const [searchResults, setSearchResults] = React.useState<SearchResult[]>([]);
  const [convertingSearch, setConvertingSearch] = React.useState(false);

  React.useEffect(() => {
    if (type !== 'country' || !searchResultsRaw.length) {
      setSearchResults(searchResultsRaw as SearchResult[]);
      return;
    }
    let cancelled = false;
    setConvertingSearch(true);
    
    // Convert each search result's price to USD
    const convertPrices = async () => {
      try {
        const converted = await Promise.all(searchResultsRaw.map(async (item: any) => {
          if (item.currency && 
              item.currency !== 'USD' && 
              typeof item.averagePrice === 'number' && 
              !isNaN(item.averagePrice)) {
            try {
              const usdPrice = await convertToUSD(item.averagePrice, item.currency);
              return {
                ...item,
                averagePrice: usdPrice,
                averagePriceLocal: item.averagePrice,
                previousPriceLocal: item.previousPrice,
                noPriceForSelectedMonth: false
              };
            } catch (error) {
              console.error('Error converting price to USD:', error);
              return {
                ...item,
                noPriceForSelectedMonth: false
              };
            }
          }
          return {
            ...item,
            noPriceForSelectedMonth: false
          };
        }));
        
        if (!cancelled) {
          setSearchResults(converted as SearchResult[]);
        }
      } catch (error) {
        console.error('Error converting prices:', error);
        if (!cancelled) {
          // On error, use original prices
          const fallback = searchResultsRaw.map((item: any) => ({
            ...item,
            averagePrice: parseFloat(item.averagePrice) || 0,
            previousPriceLocal: parseFloat(item.previousPrice) || 0,
            averagePriceLocal: parseFloat(item.averagePrice) || 0,
            currency: item.currency || 'USD',
            noPriceForSelectedMonth: false,
          }));
          setSearchResults(fallback as SearchResult[]);
        }
      } finally {
        if (!cancelled) {
          setConvertingSearch(false);
        }
      }
    };
    
    convertPrices();
    
    return () => { cancelled = true; };
  }, [searchResultsRaw, type, selectedMonth, selectedDate]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  const handleSelect = (item: SearchResult) => {
    onSelect(item);
    setOpen(false);
  };
  
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && onBack && isNestedModal) {
      onBack();
    } else {
      setOpen(newOpen);
    }
  };
  
  // Determine which items to display
  const displayItems = searchTerm.length >= 2 ? searchResults : allItems;
  const isLoading = searchTerm.length >= 2 ? (isSearching || convertingSearch) : (isLoadingAll || convertingAll);
  
  // Format price to display
  const formatPrice = (price?: number) => {
    if (typeof price !== 'number' || isNaN(price)) return 'N/A';
    return `$${price.toFixed(2)}`;
  };

  // Calculate percentage change (only comparing USD to USD)
  const calculateChange = (current?: number, previous?: number) => {
    if (typeof current !== 'number' || typeof previous !== 'number' || 
        isNaN(current) || isNaN(previous) || previous === 0) {
      return null;
    }
    
    // Only calculate if both prices are in the same currency
    const change = ((current - previous) / previous) * 100;
    
    // Limit to reasonable values (-50% to +50%)
    if (Math.abs(change) > 50) {
      return null;
    }
    
    return change;
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {/* Only show trigger button if not in nested modal mode */}
      {!isNestedModal && (
        <DialogTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm"
            className={`flex items-center group transition-all duration-300 ${
              darkMode ? 'text-white bg-gray-800/50' : 'text-gray-700 bg-white/80'
            } rounded-full hover:w-auto w-9 h-9`}
          >
            <Search className="h-4 w-4 min-w-4" />
            <span className="ml-2 max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap">
              {type === "country" ? "Search Countries" : "Search Medicines"}
            </span>
          </Button>
        </DialogTrigger>
      )}
      
      <DialogContent 
        className={`sm:max-w-md p-0 overflow-hidden ${darkMode ? 'bg-gray-900 text-white border-gray-700' : 'bg-white'}`}
        style={{ maxWidth: "400px" }}
      >
        <div className="p-4 pb-0">
          <DialogHeader className="pb-2">
            {/* Show back button in nested modal mode */}
            {isNestedModal && onBack && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={onBack}
                className="absolute left-4 top-4"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
              </Button>
            )}
            
            <DialogTitle className="text-xl text-center"> {/* Centered Title */}
              {type === "country" ? "Countries" : "Medicines"}
            </DialogTitle>
            <DialogDescription className={`${darkMode ? 'text-gray-300' : 'text-gray-500'} text-center`}> {/* Centered Description */}
              {searchTerm.length >= 2 ? `Search results for "${searchTerm}"` : (type === "country" ? "All available items" : "Compare pharmaceutical prices worldwide")}
            </DialogDescription>
          </DialogHeader>
          
          <Input 
            placeholder={`Search Any ${type === "country" ? "Country" : "Medicine"}...`}
            onChange={handleInputChange}
            className={`mb-4 ${darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white'}`}
            autoFocus
            aria-label={`Search ${type}`}
            value={searchTerm}
          />
        </div>
        
        <div className={`max-h-[70vh] overflow-y-auto ${darkMode ? 'scrollbar-dark' : 'scrollbar-light'}`}>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : displayItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No results found</div>
          ) : (
            <div className="py-2">
              {displayItems.map((item: SearchResult) => (
                <div 
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className={`px-4 py-3 flex items-center justify-between cursor-pointer ${
                    darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                  }`}
                >
                  {/* Modified left section to allow text wrapping and pill count */}
                  <div className="flex items-start space-x-3 flex-1 min-w-0 mr-2"> {/* Added flex-1, min-w-0 and mr-2 */}
                    {type === "country" && (
                      <div className="h-5 w-auto rounded-sm shrink-0 overflow-hidden">
                        {/* Use the new FlagIcon component */}
                        <FlagIcon isoCode={item.iso_code} title={`${item.name} flag`} className="h-full w-full object-cover" />
                      </div>
                    )}
                    
                    <div className="min-w-0 flex-1"> {/* Added flex-1 */}
                      <p className="font-medium break-words">{item.name}</p> {/* Removed truncate, added break-words */}
                      <div className="flex items-center mt-1 text-sm flex-wrap">
                        {typeof item.averagePrice === 'number' ? (
                          <>
                            <span className="font-medium">{Number(item.averagePrice).toFixed(2)}</span>
                            {/* Price change indicator */}
                            {typeof item.previousPriceLocal === 'number' && !isNaN(item.previousPriceLocal) && typeof item.averagePriceLocal === 'number' && !isNaN(item.averagePriceLocal) ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className={`ml-2 flex items-center ${
                                      item.averagePriceLocal < item.previousPriceLocal
                                        ? 'text-green-500'
                                        : item.averagePriceLocal > item.previousPriceLocal
                                          ? 'text-red-500'
                                          : 'text-gray-400'
                                    }`}>
                                      {item.averagePriceLocal < item.previousPriceLocal ? (
                                        <TrendingDown className="h-4 w-4 mr-1" />
                                      ) : item.averagePriceLocal > item.previousPriceLocal ? (
                                        <TrendingUp className="h-4 w-4 mr-1" />
                                      ) : null}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="text-xs">
                                    <p>
                                      {item.averagePriceLocal > item.previousPriceLocal
                                        ? 'Increased'
                                        : 'Decreased'} by {Math.abs(
                                          ((item.averagePriceLocal - item.previousPriceLocal) / item.previousPriceLocal) * 100 || 0
                                        ).toFixed(1)}% (local currency)
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="ml-2 text-xs text-muted-foreground flex items-center cursor-help">
                                      <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="8"/></svg>
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="text-xs">
                                    No previous price data
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            {/* Display total medicines for countries */}
                            {type === "country" && item.totalMedicines !== undefined && (
                              <span className="ml-2 flex items-center text-muted-foreground text-xs">
                                •
                                <Pill className="h-3 w-3 mx-1" /> {/* Using Pill icon */}
                                {item.totalMedicines.toLocaleString()}
                              </span>
                            )}
                            {/* Info for no price for selected month */}
                            {item.noPriceForSelectedMonth && (
                              <span className="ml-2 text-xs text-muted-foreground flex items-center">
                                <svg className="h-3 w-3 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="8"/></svg>
                                No price for {selectedMonth || 'this date'}, using latest available
                              </span>
                            )}
                          </>
                        ) : type === "country" && item.totalMedicines !== undefined ? (
                            // Show only total medicines if no price data for country
                            <span className="ml-0 flex items-center text-muted-foreground text-xs">
                                <Pill className="h-3 w-3 mr-1" />
                                {item.totalMedicines.toLocaleString()} medicines
                            </span>
                        ) : (
                          <span className="text-muted-foreground">No price data</span>
                        )}
                         {/* Display dosage for medicines */}
                         {type === "medicine" && item.dosage && (
                            <span className="ml-2 text-xs text-muted-foreground">
                                ({item.dosage})
                            </span>
                         )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Right section with switch, kept as is but ensured it doesn't get squeezed */}
                  <div className="flex items-center shrink-0"> {/* Added shrink-0 */}
                    {item.averagePrice !== undefined && item.previousPrice !== undefined && calculateChange(item.averagePrice, item.previousPrice) !== null && (
                      <div className={`mr-3 flex items-center ${
                        item.averagePrice < item.previousPrice 
                          ? 'text-green-500' 
                          : item.averagePrice > item.previousPrice 
                            ? 'text-red-500' 
                            : 'text-gray-400'
                      }`}>
                        {item.averagePrice < item.previousPrice ? (
                          <TrendingDown className="h-4 w-4 mr-1" />
                        ) : item.averagePrice > item.previousPrice ? (
                          <TrendingUp className="h-4 w-4 mr-1" />
                        ) : null}
                      </div>
                    )}
                    
                    <Switch 
                      checked={true} // This makes it always appear selected. Is this intended?
                                     // Consider managing selection state if items can be de-selected
                      className="data-[state=checked]:bg-green-500" 
                      aria-label={`Select ${item.name}`}
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent triggering the outer div's onClick
                        handleSelect(item);
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
