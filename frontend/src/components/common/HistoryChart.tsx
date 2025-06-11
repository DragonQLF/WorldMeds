import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface HistoryChartProps {
  data: { labels: string[]; datasets: { label: string; data: number[]; borderColor: string; backgroundColor: string; tension?: number; }[] };
  title: string;
  yAxisLabel?: string;
}

export const HistoryChart: React.FC<HistoryChartProps> = ({ data, title, yAxisLabel }) => {
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: title,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        title: {
          display: !!yAxisLabel,
          text: yAxisLabel,
        }
      },
    },
  };

  return <Line options={options} data={data} />;
}; 