
import React, { useState, useEffect } from "react";
import { Search, ArrowUpRight, ArrowDownRight } from "lucide-react";
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
import CountryTrendIndicator from "../map/CountryTrendIndicator";

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
}

export const SearchModal: React.FC<SearchModalProps> = ({ type, onSelect }) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { darkMode } = useMapContext();
  
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
  
  // Determine which items to display
  const displayItems = searchTerm.length >= 2 ? searchResults : allItems;
  const isLoading = searchTerm.length >= 2 ? isSearching : isLoadingAll;
  
  // Format price to display
  const formatPrice = (price?: number) => {
    if (typeof price !== 'number' || isNaN(price)) return 'N/A';
    return `$${price.toFixed(2)}`;
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
      "South Korea": "kr",
      "India": "in",
      "Algeria": "dz",
      "Angola": "ao"
    };
    
    const code = countryFlags[countryName] || "un";
    return `https://flagcdn.com/w80/${code.toLowerCase()}.png`;
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className={`flex items-center ${darkMode ? 'text-white bg-gray-800/50' : 'text-gray-700 bg-white/80'}`}
        >
          <Search className="h-4 w-4 mr-2" />
          {type === "country" ? "Search Countries" : "Search Medicines"}
        </Button>
      </DialogTrigger>
      <DialogContent 
        className={`sm:max-w-md ${darkMode ? 'bg-gray-900 text-white border-gray-700' : 'bg-white'}`}
        style={{ maxWidth: "400px" }}
      >
        <DialogHeader>
          <DialogTitle className="text-xl">{type === "country" ? "Countries" : "Medicines"}</DialogTitle>
          <DialogDescription className={darkMode ? 'text-gray-300' : 'text-gray-500'}>
            {searchTerm.length >= 2 ? `Search results for "${searchTerm}"` : "All available items"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <Input 
            placeholder={`Search Any ${type === "country" ? "Country" : "Medicine"}...`}
            onChange={handleInputChange}
            className={`mb-4 ${darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white'}`}
            autoFocus
            aria-label={`Search ${type}`}
            value={searchTerm}
          />
          
          <div className={`max-h-[60vh] overflow-y-auto ${darkMode ? 'scrollbar-dark' : 'scrollbar-light'}`}>
            {isLoading ? (
              <p className="text-center py-4">Loading...</p>
            ) : displayItems.length === 0 ? (
              <p className="text-center py-4">No items found</p>
            ) : (
              <ul className="space-y-2">
                {displayItems.map((item: SearchResult) => (
                  <li 
                    key={item.id}
                    className={`px-4 py-3 rounded-md flex items-center justify-between ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                  >
                    <div className="flex items-center space-x-3">
                      {type === "country" && (
                        <div className="w-10 h-6 overflow-hidden rounded">
                          <img 
                            src={getCountryFlag(item.name)} 
                            alt={`${item.name} flag`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <div className="flex items-center mt-1 text-sm">
                          {item.averagePrice !== undefined ? (
                            <>
                              <CountryTrendIndicator
                                currentPrice={item.averagePrice}
                                previousPrice={item.previousPrice}
                                className="mr-2"
                                showValue={false}
                              />
                              <span className="font-medium">${Number(item.averagePrice).toFixed(2)}</span>
                              {item.totalMedicines !== undefined && (
                                <span className="ml-3 flex items-center text-gray-500">
                                  • <svg className="h-3 w-3 mx-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                                    </svg> {item.totalMedicines.toLocaleString()}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-gray-500">No price data</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <div className={`w-12 h-6 rounded-full ${
                        item.averagePrice !== undefined && item.previousPrice !== undefined && 
                        item.averagePrice < item.previousPrice 
                          ? 'bg-green-400' 
                          : 'bg-gray-300'
                      } relative`}>
                        <div className={`absolute inset-y-1 right-1 w-4 h-4 rounded-full bg-white`}></div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
