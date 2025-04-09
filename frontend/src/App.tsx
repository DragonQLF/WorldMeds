import React, { useState } from "react";
import styled from "styled-components";
import WorldMap from "./screens/WorldMap";
import CountryPage from "./components/countrypage";
import Sidebar from "./components/Sidebar"; // Import Sidebar

const AppContainer = styled.div`
  display: flex;
  height: 100vh;
  overflow: hidden; /* Prevent scrolling */
  font-family: 'Segoe UI', sans-serif;
`;

const MainContent = styled.main`
  flex: 1;
  position: relative;
  background: #DFDFDF;
`;

function App() {
  const [activePage, setActivePage] = useState("home");
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  const handleCountryClick = (countryName: string) => {
    setSelectedCountry(countryName);
  };

  const handleCloseCountryPage = () => {
    setSelectedCountry(null);
  };

  return (
    <AppContainer>
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <MainContent>
        <WorldMap onCountryClick={handleCountryClick} />
        {selectedCountry && (
          <CountryPage
            countryName={selectedCountry}
            onClose={handleCloseCountryPage}
          />
        )}
      </MainContent>
    </AppContainer>
  );
}

export default App;