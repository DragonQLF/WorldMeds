import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface TrendAnalysisChartProps {
  data: Array<{
    month: string;
    averagePrice: number;
    totalTransactions: number;
  }>;
  darkMode: boolean;
}

export const TrendAnalysisChart: React.FC<TrendAnalysisChartProps> = ({ data, darkMode }) => {
  const chartData = {
    labels: data.map(item => new Date(item.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })),
    datasets: [
      {
        label: 'Average Price (USD)',
        data: data.map(item => item.averagePrice),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
      },
      {
        label: 'Total Transactions',
        data: data.map(item => item.totalTransactions),
        borderColor: 'rgba(153, 102, 255, 1)',
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        tension: 0.4,
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
        text: 'Monthly Price and Transaction Trends',
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
          Monthly Price and Transaction Trends
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Line data={chartData} options={options} />
      </CardContent>
    </Card>
  );
}; 