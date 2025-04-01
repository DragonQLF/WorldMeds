import React, { useState } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';
import styled from 'styled-components';

// Styled components
const MapContainer = styled.div`
  position: relative;
  width: 100%;
  height: 500px;
  margin: 2rem 0;
`;

const TooltipBox = styled.div`
  position: absolute;
  top: 1rem;
  left: 1rem;
  background: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 100;
  min-width: 160px;
`;

const WorldMap = () => {
  const [tooltip, setTooltip] = useState(null);

  // Hardcoded price data (you can adjust these values as needed)
  const priceData = {
    Brazil: 50,
    USA: 100,
    Canada: 75,
    France: 80,
    Germany: 60,
    Japan: 90,
    Australia: 85,
    India: 30,
    Russia: 40,
    China: 55
  };

  const colorScale = scaleLinear()
    .domain([0, 50, 100])
    .range(['#e6f3ff', '#66a3ff', '#0047b3']);

  return (
    <MapContainer>
      <ComposableMap projection="geoMercator">
        <Geographies geography="/features.json">
          {({ geographies }) =>
            geographies.map(geo => {
              const countryName = geo.properties.NAME || geo.properties.name;
              const price = priceData[countryName] || 0;
              
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={colorScale(price)}
                  stroke="#FFFFFF"
                  strokeWidth={0.5}
                  onMouseEnter={() => setTooltip({
                    name: countryName,
                    price: price || 'N/A'
                  })}
                  onMouseLeave={() => setTooltip(null)}
                  style={{
                    default: { outline: 'none' },
                    hover: { fill: '#FF5722', outline: 'none' },
                    pressed: { outline: 'none' }
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {tooltip && (
        <TooltipBox>
          <h4>{tooltip.name}</h4>
          <p>Average Price: {typeof tooltip.price === 'number' 
              ? `$${tooltip.price.toFixed(2)}` 
              : tooltip.price}
          </p>
        </TooltipBox>
      )}
    </MapContainer>
  );
};

export default WorldMap;
