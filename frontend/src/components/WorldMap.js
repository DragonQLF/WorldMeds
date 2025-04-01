import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import axios from 'axios';
import { scaleLinear } from 'd3-scale';

const WorldMap = () => {
  const [tooltip, setTooltip] = useState(null);
  const [prices, setPrices] = useState({});

  // Fetch data on mount
  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/api/pais/1`).then(res => {
      // Process country prices here
    });
  }, []);

  // Color scale for prices
  const colorScale = scaleLinear()
    .domain([0, 100])
    .range(['#ffedea', '#ff5233']);

  return (
    <div>
      <ComposableMap>
        <Geographies geography="/features.json">  {/* Provide your SVG geoJSON */}
          {({ geographies }) =>
            geographies.map(geo => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill={colorScale(prices[geo.properties.name] || 0)}
                onMouseEnter={() => setTooltip(geo.properties.name)}
                onMouseLeave={() => setTooltip(null)}
              />
            ))
          }
        </Geographies>
      </ComposableMap>
      {tooltip && <div className="tooltip">{tooltip}</div>}
    </div>
  );
};