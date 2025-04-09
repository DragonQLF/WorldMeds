import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import styled from 'styled-components';

const ChartContainer = styled.div`
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
  width: 100%; // Ensure the container is responsive
`;

const Chart = ({ data, selectedMedicines }) => {
  return (
    <ChartContainer>
      <LineChart width="100%" height={300}> {/* Set width to 100% for responsiveness */}
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        {Object.keys(selectedMedicines)
          .filter((medicine) => selectedMedicines[medicine])
          .map((medicine) => (
            <Line
              key={medicine}
              type="monotone"
              data={data[medicine]}
              dataKey="uv"
              stroke={`#${Math.floor(Math.random() * 16777215).toString(16)}`} // Random color
              name={medicine}
            />
          ))}
      </LineChart>
    </ChartContainer>
  );
};

export default Chart;
