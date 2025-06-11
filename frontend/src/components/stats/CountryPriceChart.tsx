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

interface CountryPriceChartProps {
  data: Array<{
    country: string;
    medicineCount: number;
    averagePrice: number;
  }>;
  darkMode: boolean;
}

export const CountryPriceChart: React.FC<CountryPriceChartProps> = ({ data, darkMode }) => {
  const chartData = {
    labels: data.map(item => item.country),
    datasets: [
      {
        label: 'Average Price (USD)',
        data: data.map(item => item.averagePrice),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
      {
        label: 'Number of Medicines',
        data: data.map(item => item.medicineCount),
        backgroundColor: 'rgba(153, 102, 255, 0.6)',
        borderColor: 'rgba(153, 102, 255, 1)',
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
        text: 'Country-wise Medicine Distribution',
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
          Country-wise Medicine Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Bar data={chartData} options={options} />
      </CardContent>
    </Card>
  );
}; 