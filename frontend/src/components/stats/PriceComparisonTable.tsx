import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PriceComparisonTableProps {
  data: Array<{
    medicine: string;
    averagePrice: number;
    minPrice: number;
    maxPrice: number;
    countryCount: number;
  }>;
  darkMode: boolean;
}

export const PriceComparisonTable: React.FC<PriceComparisonTableProps> = ({ data, darkMode }) => {
  return (
    <Card className={darkMode ? "bg-gray-800 border-gray-700" : "bg-white"}>
      <CardHeader>
        <CardTitle className={darkMode ? "text-white" : "text-gray-900"}>
          Medicine Price Comparison
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className={darkMode ? "text-white" : "text-gray-900"}>Medicine</TableHead>
              <TableHead className={darkMode ? "text-white" : "text-gray-900"}>Average Price (USD)</TableHead>
              <TableHead className={darkMode ? "text-white" : "text-gray-900"}>Min Price (USD)</TableHead>
              <TableHead className={darkMode ? "text-white" : "text-gray-900"}>Max Price (USD)</TableHead>
              <TableHead className={darkMode ? "text-white" : "text-gray-900"}>Countries</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, index) => (
              <TableRow key={index}>
                <TableCell className={darkMode ? "text-white" : "text-gray-900"}>{item.medicine}</TableCell>
                <TableCell className={darkMode ? "text-white" : "text-gray-900"}>${item.averagePrice.toFixed(2)}</TableCell>
                <TableCell className={darkMode ? "text-white" : "text-gray-900"}>${item.minPrice.toFixed(2)}</TableCell>
                <TableCell className={darkMode ? "text-white" : "text-gray-900"}>${item.maxPrice.toFixed(2)}</TableCell>
                <TableCell className={darkMode ? "text-white" : "text-gray-900"}>{item.countryCount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}; 