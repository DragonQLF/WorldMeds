
import React, { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
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

interface SearchResult {
  id: number;
  name: string;
  dosage?: string;
  averagePrice?: number;
  totalMedicines?: number;
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
  
  // Query for popular/trending items that will show by default
  const { data: popularItems = [], isLoading: isLoadingPopular } = useQuery({
    queryKey: [type, 'popular'],
    queryFn: async () => {
      if (!open) return [];
      
      const endpoint = type === "country" 
        ? `/popular-countries`
        : `/popular-medicines`;
      
      try {
        const response = await api.get(endpoint);
        return response.data;
      } catch (error) {
        console.error("Error fetching popular items:", error);
        // Return mock data if API fails
        if (type === "country") {
          return [
            { id: 1, name: "United States", totalMedicines: 1240, averagePrice: 45.99 },
            { id: 2, name: "Brazil", totalMedicines: 980, averagePrice: 23.50 },
            { id: 3, name: "Germany", totalMedicines: 890, averagePrice: 38.75 },
            { id: 4, name: "India", totalMedicines: 1450, averagePrice: 12.30 },
            { id: 5, name: "Japan", totalMedicines: 760, averagePrice: 56.20 }
          ];
        } else {
          return [
            { id: 1, name: "Paracetamol", dosage: "500mg", averagePrice: 5.99 },
            { id: 2, name: "Amoxicillin", dosage: "250mg", averagePrice: 12.50 },
            { id: 3, name: "Ibuprofen", dosage: "400mg", averagePrice: 8.75 },
            { id: 4, name: "Lisinopril", dosage: "10mg", averagePrice: 24.30 },
            { id: 5, name: "Metformin", dosage: "500mg", averagePrice: 18.20 }
          ];
        }
      }
    },
    enabled: open,
  });
  
  // Query for search results
  const { data: results = [], isLoading } = useQuery({
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
    enabled: open && !!searchTerm,
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  const handleSelect = (item: SearchResult) => {
    onSelect(item);
    setOpen(false);
  };
  
  // Determine which items to display
  const displayItems = searchTerm ? results : popularItems;
  const isLoadingItems = searchTerm ? isLoading : isLoadingPopular;
  
  // Format price to display
  const formatPrice = (price?: number) => {
    if (typeof price !== 'number') return 'N/A';
    return `$${price.toFixed(2)}`;
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
      <DialogContent className={`sm:max-w-md ${darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white'}`}>
        <DialogHeader>
          <DialogTitle>{type === "country" ? "Search Countries" : "Search Medicines"}</DialogTitle>
          <DialogDescription className={darkMode ? 'text-gray-300' : 'text-gray-500'}>
            {searchTerm ? "Search results" : "Popular items"}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input 
            placeholder={`Search ${type === "country" ? "countries" : "medicines"}...`}
            onChange={handleInputChange}
            className={`mb-4 ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white'}`}
            autoFocus
            aria-label={`Search ${type}`}
            value={searchTerm}
          />
          
          <div className={`space-y-2 max-h-[50vh] overflow-y-auto ${darkMode ? 'scrollbar-dark' : 'scrollbar-light'}`}>
            {isLoadingItems && <p className="text-center py-4">Loading...</p>}
            
            {!isLoadingItems && displayItems.length === 0 && searchTerm && (
              <p className="text-center py-4">No results found</p>
            )}
            
            {!isLoadingItems && displayItems.length === 0 && !searchTerm && (
              <p className="text-center py-4">No popular items found</p>
            )}
            
            {displayItems.map((item: SearchResult) => (
              <Button
                key={item.id}
                variant="ghost"
                className={`w-full justify-start text-left p-3 h-auto ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                onClick={() => handleSelect(item)}
              >
                <div className="flex flex-col items-start">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs opacity-70 flex gap-2 mt-1">
                    {type === "medicine" && item.dosage && (
                      <span>{item.dosage}</span>
                    )}
                    {item.averagePrice !== undefined && (
                      <span>{formatPrice(item.averagePrice)}</span>
                    )}
                    {type === "country" && item.totalMedicines !== undefined && (
                      <span>{item.totalMedicines} medicines</span>
                    )}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
