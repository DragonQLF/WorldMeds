import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { scaleLinear } from 'd3-scale';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'; // Importing missing components
import CountryLabel from './CountryLabel'; // Importing the new CountryLabel component

// Styled components
const MapContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%; /* Make the map responsive */
  margin: 2rem 0;
`;

const WorldMap = ({ onCountryClick }) => {
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const mapRef = useRef(null);
  const [mapPosition, setMapPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const updateMapPosition = () => {
      if (mapRef.current) {
        const rect = mapRef.current.getBoundingClientRect();
        setMapPosition({ top: rect.top, left: rect.left });
      }
    };

    updateMapPosition();
    window.addEventListener('resize', updateMapPosition);

    return () => {
      window.removeEventListener('resize', updateMapPosition);
    };
  }, []);

  const priceData = {
    Brazil: { price: 50, sold: 16001, flag: 'https://flagcdn.com/w20/br.png' },
    'United States': { price: 100, sold: 16001, flag: 'https://flagcdn.com/w20/us.png' },
    // ... other countries
  };

  const colorScale = scaleLinear()
    .domain([0, 50, 100, 150])
    .range(['#e6f3ff', '#ffd966', '#e69138', 'cc0000']);

  const handleMouseEnter = (event, geo) => {
    const countryName = geo.properties.NAME || geo.properties.name;
    if (priceData[countryName]) {
      const { clientX, clientY } = event;
      setHoveredCountry({
        name: countryName,
        price: priceData[countryName].price,
        sold: priceData[countryName].sold,
        flag: priceData[countryName].flag,
        x: clientX - mapPosition.left,
        y: clientY - mapPosition.top,
      });
    }
  };

  const handleMouseLeave = () => {
    setHoveredCountry(null);
  };

  const handleCountryClick = (geo) => {
    const countryName = geo.properties.NAME || geo.properties.name;
    if (priceData[countryName]) {
      onCountryClick(countryName);
    }
  };

  return (
    <MapContainer ref={mapRef}>
      <ComposableMap projection="geoMercator">
        <Geographies geography="/features.json">
          {({ geographies }) =>
            geographies.map((geo) => {
              const countryName = geo.properties.NAME || geo.properties.name;
              const countryData = priceData[countryName];
              const price = countryData ? countryData.price : 0;

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={colorScale(price)}
                  stroke="#FFFFFF"
                  strokeWidth={0.5}
                  onMouseEnter={(event) => handleMouseEnter(event, geo)}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => handleCountryClick(geo)}
                  style={{
                    default: { outline: 'none' },
                    hover: { fill: '#FF5722', outline: 'none' },
                    pressed: { outline: 'none' },
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {hoveredCountry && (
        <CountryLabel
          country={hoveredCountry.name}
          price={hoveredCountry.price}
          sold={hoveredCountry.sold}
          flag={hoveredCountry.flag}
          position={{ x: hoveredCountry.x, y: hoveredCountry.y }}
        />
      )}
    </MapContainer>
  );
};

export default WorldMap;
