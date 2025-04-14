import { Layout } from "@/components/layout/Layout";
import InteractiveMap from "@/components/map/InteractiveMap";

const Index = () => {
  const handleCountryClick = (countryName: string) => {
    console.log(`Country clicked: ${countryName}`);
    // You can add additional logic here
    // For example: fetch country details, show modal, etc.
  };

  return (
    <Layout>
      <div className="h-screen w-screen overflow-hidden">
        <InteractiveMap onCountryClick={handleCountryClick} />
      </div>
    </Layout>
  );
};

export default Index;