import React from 'react';
import WorldMap from './components/WorldMap';
import styled from 'styled-components';

const AppContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  font-family: Arial, sans-serif;
`;

const Header = styled.header`
  text-align: center;
  margin-bottom: 2rem;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 8px;
`;

function App() {
  return (
    <AppContainer>
      <Header>
        <h1>WorldMeds - Medicine Price Comparison</h1>
        <p>Compare medicine prices across countries</p>
      </Header>
      <WorldMap />
    </AppContainer>
  );
}

export default App;