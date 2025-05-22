
import React, { useState } from "react";
import { MapPin, Pill, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SearchModal } from "@/components/search/SearchModal";
import { cn } from "@/lib/utils";
import { useMapContext } from "@/contexts/MapContext";

interface SearchSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: any) => void;
}

export const SearchSelectionModal: React.FC<SearchSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const [selectedType, setSelectedType] = useState<"country" | "medicine" | null>(null);
  const { darkMode } = useMapContext();

  // Handle search type selection
  const handleTypeSelection = (type: "country" | "medicine") => {
    setSelectedType(type);
  };

  // Handle search completion
  const handleSearchComplete = (item: any) => {
    onSelect(item);
    setSelectedType(null);
    onClose();
  };

  // Handle going back to type selection
  const handleBackToSelection = () => {
    setSelectedType(null);
  };

  // Close the entire modal
  const handleCloseModal = () => {
    setSelectedType(null);
    onClose();
  };

  return (
    <>
      {/* Type Selection Dialog */}
      <Dialog open={isOpen && selectedType === null} onOpenChange={handleCloseModal}>
        <DialogContent 
          className={cn(
            "sm:max-w-md p-6",
            darkMode ? "bg-gray-900 text-white border-gray-700" : "bg-white",
            "overflow-hidden" // Prevent content from overflowing
          )}
        >
          <DialogTitle className="text-xl font-bold text-center mb-8">Choose Search Option</DialogTitle>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Button
              variant="outline"
              size="lg"
              className={cn(
                "flex flex-col items-center justify-center p-6 gap-4 h-auto transition-all duration-300",
                "hover:scale-105 hover:shadow-lg group",
                "border border-primary/20 hover:border-primary hover:bg-primary/5",
                darkMode ? "hover:bg-gray-800" : "hover:bg-gray-50"
              )}
              onClick={() => handleTypeSelection("country")}
            >
              <div className="p-4 rounded-full bg-blue-100 dark:bg-blue-900 group-hover:scale-110 transition-transform">
                <MapPin className="h-8 w-8 text-blue-600 dark:text-blue-300" />
              </div>
              <div className="flex flex-col items-center text-center w-full">
                <span className="font-medium text-lg truncate w-full">Countries</span>
                <span className="text-xs text-center text-muted-foreground w-full px-2 line-clamp-2">
                  Find medicine prices by location
                </span>
              </div>
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              className={cn(
                "flex flex-col items-center justify-center p-6 gap-4 h-auto transition-all duration-300",
                "hover:scale-105 hover:shadow-lg group",
                "border border-primary/20 hover:border-primary hover:bg-primary/5",
                darkMode ? "hover:bg-gray-800" : "hover:bg-gray-50"
              )}
              onClick={() => handleTypeSelection("medicine")}
            >
              <div className="p-4 rounded-full bg-green-100 dark:bg-green-900 group-hover:scale-110 transition-transform">
                <Pill className="h-8 w-8 text-green-600 dark:text-green-300" />
              </div>
              <div className="flex flex-col items-center text-center w-full">
                <span className="font-medium text-lg truncate w-full">Medicines</span>
                <span className="text-xs text-center text-muted-foreground w-full px-2 line-clamp-2">
                  Compare prices across countries
                </span>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Search Modal - Shown when a type is selected */}
      {selectedType && (
        <SearchModal 
          type={selectedType} 
          onSelect={handleSearchComplete}
          onBack={handleBackToSelection}
          isNestedModal={true}
        />
      )}
    </>
  );
};

export default SearchSelectionModal;
