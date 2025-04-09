import React from 'react';
import styled from 'styled-components';

const CountryLabelContainer = styled.div`
  position: absolute;
  background: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 100;
  min-width: 160px;
  pointer-events: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Flag = styled.img`
  width: 20px;
  height: 15px;
  border-radius: 2px;
`;

const CountryLabel = ({ country, price, sold, flag, position }) => {
  return (
    <CountryLabelContainer style={{ top: position.y - 40, left: position.x + 10 }}>
      {flag && <Flag src={flag} alt={`${country} Flag`} />}
      <h4>{country}</h4>
      <p>Average Price: ${price.toFixed(2)}</p>
      <p>Medicines Sold: {sold}</p>
    </CountryLabelContainer>
  );
};

export default CountryLabel;
