import React, { useState } from 'react';
import styled from 'styled-components';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const Modal = styled.div`
  background: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  width: 90%;
  max-width: 1200px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  font-family: 'Segoe UI', sans-serif;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const Title = styled.h2`
  font-size: 24px;
  color: #333;
`;

const PeriodSelector = styled.div`
  display: flex;
  gap: 10px;
`;

const PeriodButton = styled.button`
  padding: 8px 12px;
  border-radius: 4px;
  border: none;
  background: ${(props) => (props.active ? '#4285f4' : '#e0e0e0')};
  color: ${(props) => (props.active ? 'white' : '#555')};
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background: ${(props) => (props.active ? '#2860e2' : '#d0d0d0')};
  }
`;

const Select = styled.select`
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #ccc;
  font-size: 14px;
  color: #555;
`;

const ChartContainer = styled.div`
  margin-bottom: 20px;
  display: flex;
  justify-content: center; /* Centraliza o gráfico */
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHead = styled.thead`
  background: #e0e0e0;
`;

const TableHeader = styled.th`
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #333;
`;

const TableRow = styled.tr`
  &:nth-child(even) {
    background: #f2f2f2;
  }
`;

const TableCell = styled.td`
  padding: 12px;
  color: #555;
`;

const StatusBadge = styled.span`
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  color: white;
  background: ${(props) =>
    props.status === 'COMPLETED'
      ? '#4CAF50'
      : props.status === 'PROCESSING'
      ? '#FF9800'
      : '#F44336'};
`;

const CloseButton = styled.button`
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  background: #4285f4;
  color: white;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background: #2860e2;
  }
`;

const SwitchContainer = styled.label`
  position: relative;
  display: inline-block;
  width: 40px;
  height: 20px;
`;

const SwitchInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;
`;

const Slider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 20px;

  &:before {
    position: absolute;
    content: "";
    height: 16px;
    width: 16px;
    left: 2px;
    bottom: 2px;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
  }
`;

const SwitchInputChecked = styled(SwitchInput)`
  &:checked + ${Slider} {
    background-color: #2196F3;
  }

  &:focus + ${Slider} {
    box-shadow: 0 0 1px #2196F3;
  }

  &:checked + ${Slider}:before {
    transform: translateX(20px);
  }
`;

const CountryPage = ({ countryName, onClose }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('Month');
  const [selectedMedicines, setSelectedMedicines] = useState({});

  // Dados fictícios para o gráfico
  const allChartData = {
    Month: {
      Paracetamol: [
        { name: 'Jan', uv: 4000, pv: 2400, amt: 2400 },
        { name: 'Feb', uv: 3000, pv: 1398, amt: 2210 },
        { name: 'Mar', uv: 2000, pv: 9800, amt: 2290 },
        { name: 'Apr', uv: 2780, pv: 3908, amt: 2000 },
        { name: 'May', uv: 1890, pv: 4800, amt: 2181 },
        { name: 'Jun', uv: 2390, pv: 3800, amt: 2500 },
        { name: 'Jul', uv: 3490, pv: 4300, amt: 2100 },
        { name: 'Aug', uv: 4000, pv: 2400, amt: 2400 },
        { name: 'Sep', uv: 3000, pv: 1398, amt: 2210 },
        { name: 'Oct', uv: 2000, pv: 9800, amt: 2290 },
        { name: 'Nov', uv: 2780, pv: 3908, amt: 2000 },
        { name: 'Dec', uv: 1890, pv: 4800, amt: 2181 },
      ],
      Ibuprofeno: [
        { name: 'Jan', uv: 2000, pv: 1400, amt: 1400 },
        { name: 'Feb', uv: 1500, pv: 699, amt: 1105 },
        { name: 'Mar', uv: 1000, pv: 4900, amt: 1145 },
        { name: 'Apr', uv: 1390, pv: 1954, amt: 1000 },
        { name: 'May', uv: 945, pv: 2400, amt: 1090 },
        { name: 'Jun', uv: 1195, pv: 1900, amt: 1250 },
        { name: 'Jul', uv: 1745, pv: 2150, amt: 1050 },
        { name: 'Aug', uv: 2000, pv: 1200, amt: 1200 },
        { name: 'Sep', uv: 1500, pv: 699, amt: 1105 },
        { name: 'Oct', uv: 1000, pv: 4900, amt: 1145 },
        { name: 'Nov', uv: 1390, pv: 1954, amt: 1000 },
        { name: 'Dec', uv: 945, pv: 2400, amt: 1090 },
      ],
      Astorvastina: [
        { name: 'Jan', uv: 1000, pv: 9800, amt: 2290 },
        { name: 'Feb', uv: 2000, pv: 3908, amt: 2000 },
        { name: 'Mar', uv: 3000, pv: 4800, amt: 2181 },
        { name: 'Apr', uv: 4000, pv: 3800, amt: 2500 },
        { name: 'May', uv: 5000, pv: 4300, amt: 2100 },
        { name: 'Jun', uv: 6000, pv: 2400, amt: 2400 },
        { name: 'Jul', uv: 7000, pv: 1398, amt: 2210 },
        { name: 'Aug', uv: 8000, pv: 9800, amt: 2290 },
        { name: 'Sep', uv: 9000, pv: 3908, amt: 2000 },
        { name: 'Oct', uv: 10000, pv: 4800, amt: 2181 },
        { name: 'Nov', uv: 11000, pv: 3800, amt: 2500 },
        { name: 'Dec', uv: 12000, pv: 4300, amt: 2100 },
      ],
    },
    Half: {
      Paracetamol: [
        { name: 'Jan-Jun', uv: 2500, pv: 3400, amt: 2800 },
        { name: 'Jul-Dec', uv: 3500, pv: 2300, amt: 2600 },
      ],
      Ibuprofeno: [
        { name: 'Jan-Jun', uv: 1250, pv: 1700, amt: 1400 },
        { name: 'Jul-Dec', uv: 1750, pv: 1150, amt: 1300 },
      ],
      Astorvastina: [
        { name: 'Jan-Jun', uv: 3750, pv: 5100, amt: 4200 },
        { name: 'Jul-Dec', uv: 5250, pv: 3450, amt: 3900 },
      ],
    },
    Year: {
      Paracetamol: [{ name: '2024', uv: 3000, pv: 2800, amt: 2700 }],
      Ibuprofeno: [{ name: '2024', uv: 1500, pv: 1400, amt: 1350 }],
      Astorvastina: [{ name: '2024', uv: 4500, pv: 4200, amt: 4050 }],
    },
  };

  const chartData = Object.keys(selectedMedicines)
    .filter((medicine) => selectedMedicines[medicine])
    .flatMap((medicine) => {
      return (allChartData[selectedPeriod][medicine] || []).map(item => ({
        ...item,
        medicineName: medicine
      }));
    });

  // Dados fictícios para o país
  const countryData = {
    Brazil: {
      medicines: [
        { id: 1, name: 'Paracetamol', mg: 500, quantity: 20, status: 'COMPLETED', price: 19983 },
        { id: 2, name: 'Ibuprofeno', mg: 400, quantity: 20, status: 'PROCESSING', price: 19983 },
        { id: 3, name: 'Astorvastina', mg: 200, quantity: 20, status: 'COMPLETED', price: 19983 },
        { id: 4, name: 'Metformina', mg: 200, quantity: 20, status: 'UNAVAILABLE', price: 19983 },
        { id: 5, name: 'Simvastatina', mg: 200, quantity: 20, status: 'COMPLETED', price: 19983 },
        { id: 6, name: 'Omeprazol', mg: 20, quantity: 20, status: 'PROCESSING', price: 18000 },
        { id: 7, name: 'Salbutamol', mg: 200, quantity: 20, status: 'COMPLETED', price: 19983 },
        { id: 8, name: 'Insulina Glargina', mg: 200, quantity: 20, status: 'UNAVAILABLE', price: 18000 },
      ],
    },
    'United States': {
      medicines: [
        { id: 1, name: 'Aspirina', mg: 500, quantity: 20, status: 'COMPLETED', price: 20000 },
        { id: 2, name: 'Omeprazol', mg: 20, quantity: 20, status: 'UNAVAILABLE', price: 18000 },
      ],
    },
    // ... dados para outros países
  };

  const data = countryData[countryName];

  if (!data) {
    return (
      <Overlay onClick={onClose}>
        <Modal onClick={(e) => e.stopPropagation()}>
          <Title>No data for {countryName}</Title>
          <CloseButton onClick={onClose}>Close</CloseButton>
        </Modal>
      </Overlay>
    );
  }

  const handlePeriodClick = (period) => {
    setSelectedPeriod(period);
  };

  const handleMedicineToggle = (medicineName) => {
    setSelectedMedicines((prev) => ({
      ...prev,
      [medicineName]: !prev[medicineName],
    }));
  };

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <Header>
          <Title>{countryName}</Title>
          <PeriodSelector>
            <PeriodButton
              active={selectedPeriod === 'Month'}
              onClick={() => handlePeriodClick('Month')}
            >
              Month
            </PeriodButton>
            <PeriodButton
              active={selectedPeriod === 'Half'}
              onClick={() => handlePeriodClick('Half')}
            >
              Half
            </PeriodButton>
            <PeriodButton
              active={selectedPeriod === 'Year'}
              onClick={() => handlePeriodClick('Year')}
            >
              Year
            </PeriodButton>
            <Select>
              <option>Select period</option>
            </Select>
          </PeriodSelector>
        </Header>

        <ChartContainer>
          <LineChart width={800} height={300}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            {Object.keys(selectedMedicines)
              .filter((medicine) => selectedMedicines[medicine])
              .map((medicine, index) => (
                <Line
                  key={medicine}
                  type="monotone"
                  data={allChartData[selectedPeriod][medicine]}
                  dataKey="uv"
                  stroke={`#${Math.floor(Math.random() * 16777215).toString(16)}`} // Cor aleatória
                  name={medicine}
                />
              ))}
          </LineChart>
        </ChartContainer>

        <Table>
          <TableHead>
            <tr>
              <TableHeader>No</TableHeader>
              <TableHeader>Medicine</TableHeader>
              <TableHeader>Mg</TableHeader>
              <TableHeader>Quantity</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Price</TableHeader>
              <TableHeader>View on Graph</TableHeader>
            </tr>
          </TableHead>
          <tbody>
            {data.medicines.map((medicine) => (
              <TableRow key={medicine.id}>
                <TableCell>{medicine.id}</TableCell>
                <TableCell>{medicine.name}</TableCell>
                <TableCell>{medicine.mg}</TableCell>
                <TableCell>{medicine.quantity}</TableCell>
                <TableCell>
                  <StatusBadge status={medicine.status}>{medicine.status}</StatusBadge>
                </TableCell>
                <TableCell>${medicine.price}</TableCell>
                <TableCell>
                  <SwitchContainer>
                    <SwitchInputChecked
                      type="checkbox"
                      checked={selectedMedicines[medicine.name] || false}
                      onChange={() => handleMedicineToggle(medicine.name)}
                    />
                    <Slider />
                  </SwitchContainer>
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>

        <CloseButton onClick={onClose}>Close</CloseButton>
      </Modal>
    </Overlay>
  );
};

export default CountryPage;
