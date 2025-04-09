import React from 'react';
import styled from 'styled-components';

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;

  @media (max-width: 768px) {
    display: block;
    overflow-x: auto;
    white-space: nowrap;
  }
`;

const TableHead = styled.thead`
  background: #e0e0e0;
`;

const TableHeader = styled.th`
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #333;

  @media (max-width: 768px) {
    display: none; // Hide headers on small screens
  }
`;

const TableRow = styled.tr`
  &:nth-child(even) {
    background: #f2f2f2;
  }

  @media (max-width: 768px) {
    display: flex;
    flex-direction: column;
    margin-bottom: 10px;
  }
`;

const TableCell = styled.td`
  padding: 12px;
  color: #555;

  @media (max-width: 768px) {
    display: flex;
    justify-content: space-between;
    padding: 10px;
    border: 1px solid #ddd;
    margin-bottom: 5px;
  }
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

const MedicineTable = ({ medicines, selectedMedicines, handleMedicineToggle }) => {
  return (
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
        {medicines.map((medicine) => (
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
              <input
                type="checkbox"
                checked={selectedMedicines[medicine.name] || false}
                onChange={() => handleMedicineToggle(medicine.name)}
              />
            </TableCell>
          </TableRow>
        ))}
      </tbody>
    </Table>
  );
};

export default MedicineTable;
