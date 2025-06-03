import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useMapContext } from "@/contexts/MapContext";
import { searchCountries, searchMedicines, getAllCountries, getAllMedicines, convertToUSD } from "@/lib/api";
import { Pill, TrendingUp, TrendingDown, ArrowLeft, Building, DollarSign } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
  // Fields for local currency comparison
  averagePriceLocal?: number;
  previousPriceLocal?: number;
  iso_code?: string;
  [key: string]: any;
}

interface CommandSearchProps {
  type: "country" | "medicine";
  isOpen: boolean;
  onSelect: (item: SearchResult) => void;
  onClose: () => void; // For closing the command dialog
  onBack?: () => void; // For going back to type selection
}

export const CommandSearch: React.FC<CommandSearchProps> = ({
  type,
  isOpen,
  onSelect,
  onClose,
  onBack,
}) => {
  const [searchTerm, setSearchTerm] = React.useState("");
  const { darkMode, selectedDate, selectedMonth } = useMapContext();

  const getFilters = () => {
    const filters: any = {};
    if (selectedDate) {
      filters.date = selectedDate.toISOString().split("T")[0];
    } else if (selectedMonth && selectedMonth !== "all") {
      filters.month = selectedMonth;
    }
    return filters;
  };

  const processItems = async (itemsToProcess: any[]): Promise<SearchResult[]> => {
    if (type !== 'country' || !itemsToProcess.length) {
      return itemsToProcess.map(item => ({
        ...item,
        averagePrice: typeof item.averagePrice === 'string' ? parseFloat(item.averagePrice) : item.averagePrice,
        previousPrice: typeof item.previousPrice === 'string' ? parseFloat(item.previousPrice) : item.previousPrice,
      })) as SearchResult[];
    }
    return Promise.all(
      itemsToProcess.map(async (item: any) => {
        const avgLocal = typeof item.averagePrice === 'string' ? parseFloat(item.averagePrice) : item.averagePrice;
        const prevLocal = typeof item.previousPrice === 'string' ? parseFloat(item.previousPrice) : item.previousPrice;
        let avgUSD = avgLocal;
        if (item.currency && item.currency !== 'USD' && typeof avgLocal === 'number' && !isNaN(avgLocal)) {
          avgUSD = await convertToUSD(avgLocal, item.currency);
        }
        let noPriceForSelectedMonth = false;
        if ((selectedMonth && selectedMonth !== 'all') || selectedDate) {
          if (avgLocal === null || avgLocal === undefined || isNaN(avgLocal)) {
            noPriceForSelectedMonth = true;
          }
        }
        return {
          ...item,
          averagePrice: avgUSD, // always USD for display
          previousPriceLocal: prevLocal,
          averagePriceLocal: avgLocal,
          currency: 'USD', // for display
          noPriceForSelectedMonth,
        };
      })
    );
  };

  const queryKeyBase = [type, 'command-search', selectedDate, selectedMonth];

  const { data: allItemsProcessed = [], isLoading: isLoadingAll } = useQuery({
    queryKey: [...queryKeyBase, 'all-items'],
    queryFn: async () => {
      if (!isOpen) return [];
      const data = type === "country" 
        ? await getAllCountries(getFilters())
        : await getAllMedicines();
      return processItems(data);
    },
    enabled: isOpen && searchTerm.length < 2,
  });

  const { data: searchResultsProcessed = [], isLoading: isSearching } = useQuery({
    queryKey: [...queryKeyBase, 'search', searchTerm],
    queryFn: async () => {
      if (!isOpen || !searchTerm || searchTerm.length < 2) return [];
      const data = type === "country"
        ? await searchCountries(searchTerm, getFilters())
        : await searchMedicines(searchTerm);
      return processItems(data);
    },
    enabled: isOpen && searchTerm.length >= 2,
  });

  const handleSelectResult = (item: SearchResult) => {
    onSelect(item);
    onClose(); // Close CommandDialog
    setSearchTerm(""); // Reset search term
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setSearchTerm("");
    }
  };
  
  const displayItems = searchTerm.length >= 2 ? searchResultsProcessed : allItemsProcessed;
  const isLoading = searchTerm.length >= 2 ? isSearching : isLoadingAll;

  const getCountryFlag = (countryName: string) => {
    const countryFlags: Record<string, string> = {
      "Argentina": "ar", "Australia": "au", "Brazil": "br", "Canada": "ca",
      "Chile": "cl", "Mexico": "mx", "Russia": "ru", "USA": "us",
      "United States": "us", "South Korea": "kr", "India": "in",
      "Algeria": "dz", "Angola": "ao"
    };
    const code = countryFlags[countryName] || "un";
    return `https://flagcdn.com/w20/${code.toLowerCase()}.png`;
  };

  // Helper function to determine price trend and get appropriate icon
  const getPriceTrendIcon = (current: number, previous: number) => {
    if (current < previous) {
      return <TrendingDown className="h-4 w-4 text-green-600 dark:text-green-400" />;
    } else if (current > previous) {
      return <TrendingUp className="h-4 w-4 text-red-600 dark:text-red-400" />;
    }
    return null;
  };

  return (
    <CommandDialog open={isOpen} onOpenChange={handleOpenChange}>
      {onBack && (
        <button
          onClick={() => {
            setSearchTerm("");
            onBack();
          }}
          className="absolute left-4 top-4 p-2 rounded-md hover:bg-accent z-20"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      )}
      <div className="p-4 pt-2 text-center">
        <DialogTitle className="text-xl font-semibold">
          Search {type === "country" ? "Countries" : "Medicines"}
        </DialogTitle>
        <DialogDescription className="text-sm text-muted-foreground">
          Type to search for a {type}.
        </DialogDescription>
      </div>
      <CommandInput
        placeholder={`Search for a ${type}...`}
        value={searchTerm}
        onValueChange={setSearchTerm}
        className="text-base"
      />
      <CommandList>
        {isLoading && <CommandEmpty>Loading...</CommandEmpty>}
        {!isLoading && displayItems.length === 0 && searchTerm.length > 0 && (
          <CommandEmpty>No results found for "{searchTerm}".</CommandEmpty>
        )}
        {!isLoading && displayItems.length === 0 && searchTerm.length === 0 && (
            <CommandEmpty>No {type}s available or start typing to search.</CommandEmpty>
        )}
        {!isLoading && displayItems.length > 0 && (
          <CommandGroup heading={searchTerm.length >=2 ? "Search Results" : `All ${type}s`}>
            {displayItems.map((item) => (
              <CommandItem
                key={item.id}
                onSelect={() => handleSelectResult(item)}
                value={`${item.name} ${item.id} ${type === 'medicine' && item.dosage ? item.dosage : ''}`}
                className="data-[selected=true]:bg-primary/10 data-[selected=true]:text-primary cursor-pointer"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-3 min-w-0">
                    {type === "country" ? (
                      <div className="flex items-center justify-center rounded-sm shrink-0">
                        <FlagIcon isoCode={item.iso_code} title={`${item.name} flag`} className="h-8 w-8 object-cover" />
                      </div>
                    ) : (
                      <Pill className="h-5 w-5 text-primary shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.name}</p>
                      {type === "medicine" && item.dosage && (
                        <p className="text-xs text-muted-foreground">{item.dosage}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-sm shrink-0">
                    {typeof item.averagePrice === 'number' && !item.noPriceForSelectedMonth && (
                      <TooltipProvider>
                        <Tooltip delayDuration={100}>
                          <TooltipTrigger asChild>
                            <span className={cn(
                              "font-semibold flex items-center",
                              darkMode ? "text-slate-300" : "text-slate-700"
                            )}>
                              <DollarSign className="h-3 w-3 mr-0.5 opacity-70" />
                              {item.averagePrice.toFixed(2)}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="left">
                            Average Price (USD)
                            {item.noPriceForSelectedMonth && <span className="block text-xs">(Latest available)</span>}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                     {(item.noPriceForSelectedMonth && typeof item.averagePrice === 'number') && (
                        <TooltipProvider>
                        <Tooltip delayDuration={100}>
                          <TooltipTrigger asChild>
                            <span className={cn(
                              "font-semibold flex items-center text-amber-600 dark:text-amber-400",
                            )}>
                              <DollarSign className="h-3 w-3 mr-0.5" />
                              {item.averagePrice.toFixed(2)}*
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="bg-amber-500/10 border-amber-500/50 text-amber-700 dark:text-amber-300">
                            Price for latest available data
                            <br/> (not for selected date/month)
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    
                    {/* ADDED: Price trend arrow indicator for countries */}
                    {type === "country" && typeof item.averagePriceLocal === 'number' && typeof item.previousPriceLocal === 'number' && 
                     item.averagePriceLocal !== item.previousPriceLocal && (
                        <TooltipProvider>
                          <Tooltip delayDuration={100}>
                            <TooltipTrigger asChild>
                              <span className="flex items-center">
                                {getPriceTrendIcon(item.averagePriceLocal, item.previousPriceLocal)}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="left">
                              Price {item.averagePriceLocal < item.previousPriceLocal ? 'decreased' : 'increased'} vs. previous period
                              <br />
                              {Math.abs(((item.averagePriceLocal - item.previousPriceLocal) / item.previousPriceLocal) * 100).toFixed(1)}% change
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}

                    {type === "country" && typeof item.totalMedicines === 'number' && (
                      <TooltipProvider>
                        <Tooltip delayDuration={100}>
                          <TooltipTrigger asChild>
                            <span className="flex items-center text-muted-foreground">
                              <Pill className="h-4 w-4 mr-1" />
                              {item.totalMedicines.toLocaleString()}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="left">
                            Total medicines tracked
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {!isLoading && displayItems.length > 0 && <CommandSeparator />}
      </CommandList>
    </CommandDialog>
  );
};
