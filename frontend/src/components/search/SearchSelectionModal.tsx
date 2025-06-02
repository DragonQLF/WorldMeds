import React, { useState } from "react";
import { MapPin, Pill, Search, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CommandSearch } from "@/components/search/CommandSearch";
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
    setSelectedType(null); // Reset selected type
    // onClose(); // CommandSearch will call its own onClose, which then calls this main onClose
  };

  // Handle going back to type selection from CommandSearch
  const handleBackToSelection = () => {
    setSelectedType(null);
  };

  // Close the entire modal flow
  const handleCloseModal = () => {
    setSelectedType(null); // Ensure type is reset
    onClose(); // Call the main onClose prop
  };

  return (
    <>
      {/* Type Selection Dialog */}
      <Dialog open={isOpen && selectedType === null} onOpenChange={handleCloseModal}>
        <DialogContent 
          className={cn(
            "sm:max-w-lg p-0 gap-0 overflow-hidden",
            "bg-gradient-to-br from-background via-background to-muted/20",
            darkMode ? "border-gray-700" : "border-gray-200",
            "shadow-2xl"
          )}
        >
          {/* Header with gradient */}
          <div className="relative p-6 pb-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-full bg-primary/10">
                <Search className="h-5 w-5 text-primary" />
              </div>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                What would you like to search?
              </DialogTitle>
            </div>
            <p className="text-muted-foreground ml-11">
              Choose your search category to get started
            </p>
          </div>
          
          {/* Search Options */}
          <div className="p-6 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button
                variant="outline"
                size="lg"
                className={cn(
                  "relative flex flex-col items-center justify-center p-8 gap-4 h-auto transition-all duration-300",
                  "hover:scale-[1.02] hover:shadow-lg group overflow-hidden",
                  "border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5",
                  "before:absolute before:inset-0 before:bg-gradient-to-br before:from-blue-500/10 before:to-transparent before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100",
                  darkMode ? "hover:bg-blue-950/20" : "hover:bg-blue-50/80"
                )}
                onClick={() => handleTypeSelection("country")}
              >
                <div className="relative z-10 flex flex-col items-center gap-4 w-full">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <MapPin className="h-8 w-8 text-blue-600 dark:text-blue-300" />
                  </div>
                  <div className="flex flex-col items-center text-center w-full">
                    <span className="font-semibold text-lg mb-1">Countries</span>
                    <span className="text-sm text-muted-foreground leading-relaxed">
                      Discover medicine prices by geographic location
                    </span>
                  </div>
                </div>
                <Sparkles className="absolute top-2 right-2 h-4 w-4 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Button>
              
              <Button
                variant="outline"
                size="lg"
                className={cn(
                  "relative flex flex-col items-center justify-center p-8 gap-4 h-auto transition-all duration-300",
                  "hover:scale-[1.02] hover:shadow-lg group overflow-hidden",
                  "border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5",
                  "before:absolute before:inset-0 before:bg-gradient-to-br before:from-green-500/10 before:to-transparent before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100",
                  darkMode ? "hover:bg-green-950/20" : "hover:bg-green-50/80"
                )}
                onClick={() => handleTypeSelection("medicine")}
              >
                <div className="relative z-10 flex flex-col items-center gap-4 w-full">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900 dark:to-green-800 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <Pill className="h-8 w-8 text-green-600 dark:text-green-300" />
                  </div>
                  <div className="flex flex-col items-center text-center w-full">
                    <span className="font-semibold text-lg mb-1">Medicines</span>
                    <span className="text-sm text-muted-foreground leading-relaxed">
                      Compare pharmaceutical prices worldwide
                    </span>
                  </div>
                </div>
                <Sparkles className="absolute top-2 right-2 h-4 w-4 text-green-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Button>
            </div>
            
            {/* Decorative element */}
            <div className="mt-6 pt-4 border-t border-border/50">
              <p className="text-xs text-center text-muted-foreground">
                Use the search to quickly find and compare data across our global database
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Command Search Modal - Shown when a type is selected */}
      {selectedType && (
        <CommandSearch
          type={selectedType}
          isOpen={!!selectedType} // CommandSearch is open if a type is selected
          onSelect={handleSearchComplete}
          onClose={handleCloseModal} // This closes the entire flow
          onBack={handleBackToSelection} // This goes back to the type selection dialog
        />
      )}
    </>
  );
};

export default SearchSelectionModal;
