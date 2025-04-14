import React, { useState, useRef, useEffect } from 'react';
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

const CountryLabel = styled.div`
  position: absolute;
  background: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 100;
  min-width: 160px;
  pointer-events: none; /* Para permitir que o clique seja detectado */
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Flag = styled.img`
  width: 20px;
  height: 15px;
  border-radius: 2px;
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

  // Dados de preços (você pode ajustar esses valores conforme necessário)
  const priceData = {
    Brazil: { price: 50, sold: 16001, flag: 'https://flagcdn.com/w20/br.png' },
    'United States': { price: 100, sold: 16001, flag: 'https://flagcdn.com/w20/us.png' }, // Ajustado para corresponder ao nome no GeoJSON
    Canada: { price: 75, sold: 16000, flag: 'https://flagcdn.com/w20/ca.png' },
    France: { price: 80, sold: 15000, flag: 'https://flagcdn.com/w20/fr.png' },
    Germany: { price: 60, sold: 10000, flag: 'https://flagcdn.com/w20/de.png' },
    Japan: { price: 90, sold: 12000, flag: 'https://flagcdn.com/w20/jp.png' },
    Australia: { price: 185, sold: 13000, flag: 'https://flagcdn.com/w20/au.png' },
    India: { price: 30, sold: 10001, flag: 'https://flagcdn.com/w20/in.png' },
    Russia: { price: 40, sold: 9000, flag: 'https://flagcdn.com/w20/ru.png' },
    China: { price: 155, sold: 11000, flag: 'https://flagcdn.com/w20/cn.png' },
  };

  const colorScale = scaleLinear()
  .domain([0, 50, 100,150])
  .range(['#e6f3ff', '#ffd966', '#e69138','#cc0000']);

  const handleMouseEnter = (event, geo) => {
    const countryName = geo.properties.NAME || geo.properties.name;
    if (priceData[countryName]) {
      const { clientX, clientY } = event;
      setHoveredCountry({
        name: countryName,
        price: priceData[countryName].price,
        sold: priceData[countryName].sold,
        flag: priceData[countryName].flag,
        x: clientX - mapPosition.left, // Ajustado para a posição do mapa
        y: clientY - mapPosition.top, // Ajustado para a posição do mapa
      });
    }
  };

  const handleMouseLeave = () => {
    setHoveredCountry(null);
  };

  const handleCountryClick = (geo) => {
    const countryName = geo.properties.NAME || geo.properties.name;
    if (priceData[countryName]) {
      onCountryClick(countryName); // Chama a função passada pelo pai
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
          style={{
            top: hoveredCountry.y - 40, // Ajusta a posição vertical
            left: hoveredCountry.x + 10, // Ajusta a posição horizontal
          }}
        >
          {hoveredCountry.flag && <Flag src={hoveredCountry.flag} alt={`${hoveredCountry.name} Flag`} />}
          <h4>{hoveredCountry.name}</h4>
          <p>Average Price: ${hoveredCountry.price.toFixed(2)}</p>
          <p>Medicines Sold: {hoveredCountry.sold}</p>
        </CountryLabel>
      )}
    </MapContainer>
  );
};

export default WorldMap;
