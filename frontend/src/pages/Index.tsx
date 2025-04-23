import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import InteractiveMap from "@/components/map/InteractiveMap";
import { SearchModal } from "@/components/search/SearchModal";
import { useMapContext } from "@/contexts/MapContext";

const Index = () => {
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null);
  const { darkMode } = useMapContext();

  // Debounce country clicks to prevent duplicate logging
  const handleCountryClick = (countryName: string) => {
    // We don't need to log country clicks here anymore
    // The InteractiveMap component already handles everything
  };

  const handleCountrySelect = (country: any) => {
    console.log("Selected country:", country);
    setSelectedCountryId(country.id);
  };

  const handleMedicineSelect = (medicine: any) => {
    console.log("Selected medicine:", medicine);
    // Implement medicine selection logic
  };

  return (
    <Layout>
      <div className={`flex flex-col h-screen w-screen overflow-hidden ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
        {/* Search buttons */}
        <div className="absolute top-4 right-4 z-10 flex space-x-2">
          <SearchModal type="country" onSelect={handleCountrySelect} />
          <SearchModal type="medicine" onSelect={handleMedicineSelect} />
        </div>
        
        <InteractiveMap onCountryClick={handleCountryClick} />
      </div>
    </Layout>
  );
};

export default Index;
