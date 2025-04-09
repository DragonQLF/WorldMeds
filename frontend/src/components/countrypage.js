import React, { useState } from 'react';
import styled from 'styled-components';
import Chart from '../screens/Chart'; // Importing the new Chart component
import MedicineTable from '../screens/MedicineTable'; // Importing the new MedicineTable component

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

  @media (max-width: 768px) {
    width: 95%; // Adjust modal width for smaller screens
  }
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

const CountryPage = ({ countryName, onClose }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('Month');
  const [selectedMedicines, setSelectedMedicines] = useState({});

  // Sample data for medicines
  const countryData = {
    Brazil: {
      medicines: [
        { id: 1, name: 'Paracetamol', mg: 500, quantity: 20, status: 'COMPLETED', price: 19983 },
        { id: 2, name: 'Ibuprofeno', mg: 400, quantity: 20, status: 'PROCESSING', price: 19983 },
        // ... other medicines
      ],
    },
    'United States': {
      medicines: [
        { id: 1, name: 'Aspirina', mg: 500, quantity: 20, status: 'COMPLETED', price: 20000 },
        // ... other medicines
      ],
    },
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
          </PeriodSelector>
        </Header>

        <Chart data={data.medicines} selectedMedicines={selectedMedicines} />

        <MedicineTable
          medicines={data.medicines}
          selectedMedicines={selectedMedicines}
          handleMedicineToggle={(medicineName) => {
            setSelectedMedicines((prev) => ({
              ...prev,
              [medicineName]: !prev[medicineName],
            }));
          }}
        />

        <CloseButton onClick={onClose}>Close</CloseButton>
      </Modal>
    </Overlay>
  );
};

export default CountryPage;
