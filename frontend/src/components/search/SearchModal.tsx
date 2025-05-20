
import React, { useState, useEffect } from "react";
import { Search, ArrowUpRight, ArrowDownRight, ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

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
import { api } from "@/lib/api";
import { Switch } from "@/components/ui/switch";

interface SearchResult {
  id: number;
  name: string;
  dosage?: string;
  averagePrice?: number;
  previousPrice?: number; 
  totalMedicines?: number;
  currency?: string;
  countryCount?: number;
  [key: string]: any;
}

interface SearchModalProps {
  type: "country" | "medicine";
  onSelect: (item: SearchResult) => void;
  onBack?: () => void; // New prop for nested modal navigation
  isNestedModal?: boolean; // Flag to indicate if this is a nested modal
}

export const SearchModal: React.FC<SearchModalProps> = ({ 
  type, 
  onSelect, 
  onBack, 
  isNestedModal = false 
}) => {
  const [open, setOpen] = useState(isNestedModal);
  const [searchTerm, setSearchTerm] = useState("");
  const { darkMode } = useMapContext();
  
  // Effect to reset open state when isNestedModal changes
  useEffect(() => {
    if (isNestedModal) {
      setOpen(true);
    }
  }, [isNestedModal]);

  // Query for all countries/medicines data
  const { data: allItems = [], isLoading: isLoadingAll } = useQuery({
    queryKey: [type, 'all-items'],
    queryFn: async () => {
      if (!open) return [];
      
      const endpoint = type === "country" 
        ? `/countries`
        : `/medicines`;
      
      try {
        console.log(`Fetching all ${type}s data from ${endpoint}`);
        const response = await api.get(endpoint);
        console.log(`Received ${type}s data:`, response.data);
        return response.data;
      } catch (error) {
        console.error(`Error fetching all ${type}s:`, error);
        return [];
      }
    },
    enabled: open,
  });
  
  // Query for search results only when a search term is entered
  const { data: searchResults = [], isLoading: isSearching } = useQuery({
    queryKey: [type, 'search', searchTerm, open],
    queryFn: async () => {
      if (!open || !searchTerm) return [];
      
      const endpoint = type === "country" 
        ? `/search/countries?q=${searchTerm}`
        : `/search/medicines?q=${searchTerm}`;
      
      try {
        const response = await api.get(endpoint);
        return response.data;
      } catch (error) {
        console.error("Error searching:", error);
        return [];
      }
    },
    enabled: open && searchTerm.length >= 2,
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  const handleSelect = (item: SearchResult) => {
    onSelect(item);
    setOpen(false);
  };
  
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && onBack && isNestedModal) {
      // If we're in a nested modal and closing, we should go back instead
      onBack();
    } else {
      setOpen(newOpen);
    }
  };
  
  // Determine which items to display
  const displayItems = searchTerm.length >= 2 ? searchResults : allItems;
  const isLoading = searchTerm.length >= 2 ? isSearching : isLoadingAll;
  
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

  // Function to get the flag URL
  const getCountryFlag = (countryName: string) => {
    const countryFlags: Record<string, string> = {
      "Argentina": "ar",
      "Australia": "au",
      "Brazil": "br",
      "Canada": "ca",
      "Chile": "cl",
      "Mexico": "mx",
      "Russia": "ru",
      "USA": "us",
      "United States": "us",
      "South Korea": "kr",
      "India": "in",
      "Algeria": "dz",
      "Angola": "ao"
    };
    
    const code = countryFlags[countryName] || "un";
    return `https://flagcdn.com/w80/${code.toLowerCase()}.png`;
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
            
            <DialogTitle className="text-xl">
              {type === "country" ? "Countries" : "Medicines"}
            </DialogTitle>
            <DialogDescription className={darkMode ? 'text-gray-300' : 'text-gray-500'}>
              {searchTerm.length >= 2 ? `Search results for "${searchTerm}"` : "All available items"}
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
                  <div className="flex items-start space-x-3 max-w-[70%]">
                    {type === "country" && (
                      <div className="w-10 h-6 overflow-hidden rounded shrink-0">
                        <img 
                          src={getCountryFlag(item.name)} 
                          alt={`${item.name} flag`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}
                    
                    <div className="min-w-0">
                      <p className="font-medium truncate">{item.name}</p>
                      <div className="flex items-center mt-1 text-sm flex-wrap">
                        {item.averagePrice !== undefined ? (
                          <>
                            <span className="font-medium">${Number(item.averagePrice).toFixed(2)}</span>
                            {item.totalMedicines !== undefined && (
                              <span className="ml-2 flex items-center text-muted-foreground text-xs">
                                •
                                <svg className="h-3 w-3 mx-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                                </svg>
                                {item.totalMedicines.toLocaleString()}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-muted-foreground">No price data</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {item.averagePrice !== undefined && item.previousPrice !== undefined && (
                    <div className="flex items-center">
                      {calculateChange(item.averagePrice, item.previousPrice) !== null && (
                        <div className={`mr-3 flex items-center ${
                          item.averagePrice < item.previousPrice 
                            ? 'text-green-500' 
                            : item.averagePrice > item.previousPrice 
                              ? 'text-red-500' 
                              : 'text-gray-400'
                        }`}>
                          {item.averagePrice < item.previousPrice ? (
                            <ArrowDownRight className="h-4 w-4 mr-1" />
                          ) : item.averagePrice > item.previousPrice ? (
                            <ArrowUpRight className="h-4 w-4 mr-1" />
                          ) : null}
                          {Math.abs(calculateChange(item.averagePrice, item.previousPrice) || 0).toFixed(1)}%
                        </div>
                      )}
                      
                      <Switch 
                        checked={true} 
                        className="data-[state=checked]:bg-green-500" 
                        aria-label={`Select ${item.name}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(item);
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
