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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface SearchResult {
  id: number;
  name: string;
  dosage?: string;
  averagePrice?: number;
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
      <DialogContent className={`sm:max-w-2xl ${darkMode ? 'bg-gray-800 text-white border-gray-700' : 'bg-white'}`}>
        <DialogHeader>
          <DialogTitle>{type === "country" ? "Countries" : "Medicines"}</DialogTitle>
          <DialogDescription className={darkMode ? 'text-gray-300' : 'text-gray-500'}>
            {searchTerm.length >= 2 ? `Search results for "${searchTerm}"` : "All available items"}
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
          
          <div className={`max-h-[50vh] overflow-y-auto ${darkMode ? 'scrollbar-dark' : 'scrollbar-light'}`}>
            {isLoading ? (
              <p className="text-center py-4">Loading...</p>
            ) : displayItems.length === 0 ? (
              <p className="text-center py-4">No items found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    {type === "medicine" && <TableHead>Dosage</TableHead>}
                    {type === "country" && <TableHead>Currency</TableHead>}
                    <TableHead>{type === "country" ? "Medicines" : "Countries"}</TableHead>
                    <TableHead>Avg. Price</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayItems.map((item: SearchResult) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      {type === "medicine" && <TableCell>{item.dosage || 'N/A'}</TableCell>}
                      {type === "country" && <TableCell>{item.currency || 'N/A'}</TableCell>}
                      <TableCell>
                        {type === "country" 
                          ? (item.totalMedicines !== undefined ? item.totalMedicines : 'N/A') 
                          : (item.countryCount !== undefined ? item.countryCount : 'N/A')}
                      </TableCell>
                      <TableCell>{item.averagePrice !== undefined ? formatPrice(item.averagePrice) : 'N/A'}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSelect(item)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
