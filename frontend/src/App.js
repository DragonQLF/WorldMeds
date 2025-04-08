import React, { useState } from 'react';
import styled from 'styled-components';
import WorldMap from './components/WorldMap';
import CountryPage from './components/countrypage';

const AppContainer = styled.div`
  display: flex;
  height: 100vh;
  font-family: 'Segoe UI', sans-serif;
`;

const Sidebar = styled.aside`
  width: 280px;
  background: #FFFFFF;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const MainContent = styled.main`
  flex: 1;
  position: relative;
  background: #DFDFDF;
`;

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 0 1rem;
`;

const Logo = styled.img`
  height: 40px;
  width: 40px;
`;

const NavButton = styled.button`
  width: 100%;
  padding: 0.75rem;
  margin: 0.25rem 0;
  border: none;
  border-radius: 8px;
  background: #F3F4F6;
  color: #1F2937;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.2s;

  &:hover {
    opacity: 0.9;
  }
`;

const ControlBar = styled.div`
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  display: flex;
  gap: 1rem;
  z-index: 1000;
`;

const IconButton = styled.button`
  background: #F3F4F6;
  border: none;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  color: #1F2937;

  &:hover {
    opacity: 0.9;
  }
`;

function App() {
  const [activePage, setActivePage] = useState('home');
  const [selectedCountry, setSelectedCountry] = useState(null);

  const handleCountryClick = (countryName) => {
    setSelectedCountry(countryName);
  };

  const handleCloseCountryPage = () => {
    setSelectedCountry(null);
  };

  return (
    <AppContainer>
      <Sidebar>
        <div>
          <LogoContainer>
            <Logo src="/logo.png" alt="WorldMeds Logo" />
            <h2>WorldMeds</h2>
          </LogoContainer>

          <NavButton active={activePage === 'home'} onClick={() => setActivePage('home')}>
            <span>🏠</span>
            Home
          </NavButton>

          <NavButton active={activePage === 'statistics'} onClick={() => setActivePage('statistics')}>
            <span>📊</span>
            Statistics
          </NavButton>

          <NavButton active={activePage === 'settings'} onClick={() => setActivePage('settings')}>
            <span>⚙️</span>
            Settings
          </NavButton>
        </div>

        <div>
          <NavButton>
            <span>🚪</span>
            Logout
          </NavButton>
        </div>
      </Sidebar>

      <MainContent>
        <ControlBar>
          <IconButton>
            <span>🔍</span>
            Search Country
          </IconButton>
          <IconButton>
            <span>💊</span>
            Search Medicine
          </IconButton>
        </ControlBar>

        <WorldMap onCountryClick={handleCountryClick} />

        {selectedCountry && (
          <CountryPage countryName={selectedCountry} onClose={handleCloseCountryPage} />
        )}
      </MainContent>
    </AppContainer>
  );
}

export default App;
