import { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import InteractiveMap from "@/components/map/InteractiveMap";
import { SearchModal } from "@/components/search/SearchModal";
import { useMapContext } from "@/contexts/MapContext";
import { CountryDetail } from "@/components/map/CountryDetail";

const Index = () => {
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null);
  const [showCountryDetail, setShowCountryDetail] = useState<boolean>(false);
  const { darkMode } = useMapContext();
  
  // Reset the detail view when component mounts
  useEffect(() => {
    setShowCountryDetail(false);
  }, []);

  // Handle country selection from search or map
  const handleCountrySelect = (country: any) => {
    console.log("Selected country from search:", country);
    if (country && country.id) {
      // If selecting the same country that's already shown, close it instead
      if (selectedCountryId === country.id.toString() && showCountryDetail) {
        setSelectedCountryId(null);
        setShowCountryDetail(false);
      } else {
        setSelectedCountryId(country.id.toString());
        setShowCountryDetail(true);
      }
    }
  };

  // Handle closing the country detail
  const handleCloseCountryDetail = () => {
    setSelectedCountryId(null);
    setShowCountryDetail(false);
  };

  return (
    <Layout>
      <div className="flex flex-col h-screen w-screen overflow-hidden bg-background dark:bg-gray-950">
        {/* Search buttons */}
        <div className="absolute top-4 right-4 z-10 flex space-x-2">
          <SearchModal type="country" onSelect={handleCountrySelect} />
        </div>
        
        <InteractiveMap 
          onCountryClick={handleCountrySelect} 
        />
        
        {/* Country details modal */}
        {showCountryDetail && (
          <CountryDetail
            countryId={selectedCountryId}
            onClose={handleCloseCountryDetail}
          />
        )}
      </div>
    </Layout>
  );
};

export default Index;
