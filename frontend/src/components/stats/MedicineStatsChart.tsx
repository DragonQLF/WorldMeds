import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface MedicineStatsChartProps {
  data: Array<{
    medicine: string;
    averagePrice: number;
    minPrice: number;
    maxPrice: number;
    countryCount: number;
  }>;
  darkMode: boolean;
}

export const MedicineStatsChart: React.FC<MedicineStatsChartProps> = ({ data, darkMode }) => {
  const chartData = {
    labels: data.map(item => item.medicine),
    datasets: [
      {
        label: 'Average Price (USD)',
        data: data.map(item => item.averagePrice),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
      {
        label: 'Minimum Price (USD)',
        data: data.map(item => item.minPrice),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
      {
        label: 'Maximum Price (USD)',
        data: data.map(item => item.maxPrice),
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: darkMode ? 'white' : 'black',
        },
      },
      title: {
        display: true,
        text: 'Medicine Price Statistics',
        color: darkMode ? 'white' : 'black',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: darkMode ? 'white' : 'black',
        },
        grid: {
          color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
      },
      x: {
        ticks: {
          color: darkMode ? 'white' : 'black',
        },
        grid: {
          color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
  };

  return (
    <Card className={darkMode ? "bg-gray-800 border-gray-700" : "bg-white"}>
      <CardHeader>
        <CardTitle className={darkMode ? "text-white" : "text-gray-900"}>
          Medicine Price Statistics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Bar data={chartData} options={options} />
      </CardContent>
    </Card>
  );
}; 