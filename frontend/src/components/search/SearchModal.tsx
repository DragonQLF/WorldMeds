import React, { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

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
  
  const { data: results = [], isLoading } = useQuery({
    queryKey: [type, searchTerm, open],
    queryFn: async () => {
      if (!open || !searchTerm) return [];
      
      const endpoint = type === "country" 
        ? `/search/countries?q=${searchTerm}`
        : `/search/medicines?q=${searchTerm}`;
      
      const response = await api.get(endpoint);
      return response.data;
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
            {type === "country" ? "Find countries and view their medicine data" : "Search for medicines across different countries"}
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
          
          <div className={`space-y-2 max-h-[40vh] overflow-y-auto ${darkMode ? 'scrollbar-dark' : 'scrollbar-light'}`}>
            {isLoading && <p className="text-center py-4">Loading...</p>}
            {!isLoading && results.length === 0 && searchTerm.length > 0 && (
              <p className="text-center py-4">No results found</p>
            )}
            {results.length === 0 && searchTerm.length === 0 && (
              <p className="text-center py-4">Type to search</p>
            )}
            {results.map((item: SearchResult) => (
              <Button
                key={item.id}
                variant="ghost"
                className={`w-full justify-start text-left ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                onClick={() => handleSelect(item)}
              >
                {item.name}
              </Button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};