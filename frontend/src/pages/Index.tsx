import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import InteractiveMap from "@/components/map/InteractiveMap";
import { useMapContext } from "@/contexts/MapContext";
import { CountryDetail } from "@/components/map/CountryDetail";
import { ComparisonModal } from "@/components/comparison/ComparisonModal";
import { GitCompare, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { SearchSelectionModal } from "@/components/search/SearchSelectionModal";
import MedicineDetail from "@/components/map/MedicineDetail";
import { ModalType } from "@/components/Auth/AuthModals";
import AuthModals from "@/components/Auth/AuthModals";

const Index = () => {
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null);
  const [showCountryDetail, setShowCountryDetail] = useState<boolean>(false);
  const [comparisonModalOpen, setComparisonModalOpen] = useState<boolean>(false);
  const [searchSelectionOpen, setSearchSelectionOpen] = useState<boolean>(false);
  const { darkMode, visualizationType, selectedDate, dateRange, selectedMonth } = useMapContext();
  const isMobile = useIsMobile();
  const [selectedMedicineId, setSelectedMedicineId] = useState<string | null>(null);
  const [showMedicineDetail, setShowMedicineDetail] = useState<boolean>(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [authModalType, setAuthModalType] = useState<ModalType>(null);
  
  // Handlers for sidebar hover
  const handleSidebarMouseEnter = () => {
    if (!isMobile) {
      setIsSidebarExpanded(true);
    }
  };

  const handleSidebarMouseLeave = () => {
    if (!isMobile) {
      setIsSidebarExpanded(false);
    }
  };
  
  // Reset the detail view when component mounts or when date filters change
  useEffect(() => {
    // Only close the country detail if a date filter changes and a country is currently shown
    if (selectedCountryId && showCountryDetail) {
      // Keep the detail open but trigger a refresh by toggling and resetting
      setShowCountryDetail(false);
      setTimeout(() => {
        if (selectedCountryId) {
          setShowCountryDetail(true);
        }
      }, 100);
    }
  }, [selectedDate, dateRange, selectedMonth]);

  // Handle country selection from search or map
  const handleCountrySelect = (country: any) => {
    if (country && country.id) {
      // If selecting the same country that's already shown, close it instead
      if (selectedCountryId === country.id.toString() && showCountryDetail) {
        setSelectedCountryId(null);
        setShowCountryDetail(false);
      } else {
        setSelectedCountryId(country.id.toString());
        // Only show details panel if in graph mode or from search
        setShowCountryDetail(true);
      }
    }
  };

  // Handle closing the country detail
  const handleCloseCountryDetail = () => {
    setSelectedCountryId(null);
    setShowCountryDetail(false);
  };
  
  // Button style class for map control matching - re-adding original styles
  const controlButtonClass = "w-8 h-8 flex items-center justify-center transition-all duration-200 hover:scale-110 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md hover:border-primary active:border-primary";
  
  const handleSearchSelect = (item: any) => {
    if (item && item.id) {
      if (item.dosage !== undefined) {
        // It's a medicine
        if (selectedMedicineId === item.id.toString() && showMedicineDetail) {
          setSelectedMedicineId(null);
          setShowMedicineDetail(false);
        } else {
          setSelectedMedicineId(item.id.toString());
          setShowMedicineDetail(true);
          setSelectedCountryId(null);
          setShowCountryDetail(false);
        }
      } else {
        // It's a country
        handleCountrySelect(item);
        setSelectedMedicineId(null);
        setShowMedicineDetail(false);
      }
    }
  };

  useEffect(() => {
    const handleOpenAuthModal = (customEvent: CustomEvent<{ type: 'login' | 'register' }>) => {
      setAuthModalType(customEvent.detail.type);
    };
    window.addEventListener('open-auth-modal', handleOpenAuthModal);
    return () => {
      window.removeEventListener('open-auth-modal', handleOpenAuthModal);
    };
  }, []);

  return (
    <Layout 
      isExpanded={isSidebarExpanded}
      onMouseEnter={handleSidebarMouseEnter}
      onMouseLeave={handleSidebarMouseLeave}
    >
      {/* Auth Modals - always mounted at top level */}
      {authModalType && (
        <div id="auth-modals">
          <AuthModals 
            modalType={authModalType} 
            onClose={() => setAuthModalType(null)} 
          />
        </div>
      )}
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-background dark:bg-gray-950">
        {/* Search and actions buttons */}
        <div className={cn(
          "absolute z-10 flex space-x-2",
          isMobile ? "top-2 right-2" : "top-4 right-4"
        )}>
          {/* Search button that opens the selection modal */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    controlButtonClass,
                    searchSelectionOpen ? "border-primary bg-primary/10" : ""
                  )}
                  onClick={() => setSearchSelectionOpen(true)}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side={isMobile ? "left" : "bottom"}>
                Search countries or medicines
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {/* Comparison Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    controlButtonClass,
                    comparisonModalOpen ? "border-primary bg-primary/10" : ""
                  )}
                  onClick={() => setComparisonModalOpen(true)}
                >
                  <GitCompare className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side={isMobile ? "left" : "bottom"}>
                Compare medicine prices
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="flex-1 relative">
          <InteractiveMap 
            onCountryClick={handleCountrySelect} 
            isSidebarExpanded={isSidebarExpanded}
            authModalType={authModalType}
          />
        </div>
        
        {/* Country details modal - only show when in details view or explicitly opened */}
        {showCountryDetail && selectedCountryId && (
          <CountryDetail
            countryId={selectedCountryId}
            onClose={handleCloseCountryDetail}
          />
        )}
        
        {/* Medicine details modal - only show when in details view or explicitly opened */}
        {showMedicineDetail && selectedMedicineId && (
          <MedicineDetail
            medicineId={selectedMedicineId}
            onClose={() => {
              setSelectedMedicineId(null);
              setShowMedicineDetail(false);
            }}
          />
        )}
        
        {/* Comparison Modal */}
        <ComparisonModal
          isOpen={comparisonModalOpen}
          onClose={() => setComparisonModalOpen(false)}
        />

        {/* Search Selection Modal */}
        <SearchSelectionModal 
          isOpen={searchSelectionOpen}
          onClose={() => setSearchSelectionOpen(false)}
          onSelect={handleSearchSelect}
        />
      </div>
    </Layout>
  );
};

export default Index;
