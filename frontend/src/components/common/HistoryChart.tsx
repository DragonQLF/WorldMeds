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
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          boxWidth: 12,
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 14
        },
        padding: {
          bottom: 10
        }
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        title: {
          display: !!yAxisLabel,
          text: yAxisLabel,
          font: {
            size: 12
          }
        },
        ticks: {
          font: {
            size: 11
          },
          maxTicksLimit: 6
        }
      },
      x: {
        ticks: {
          font: {
            size: 11
          },
          maxRotation: 45,
          minRotation: 45,
          maxTicksLimit: 6
        }
      }
    },
  };

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '250px' }}>
      <Line options={options} data={data} />
    </div>
  );
}; 