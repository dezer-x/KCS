import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface BarData {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarData[];
  title: string;
  className?: string;
}

const BarChart: React.FC<BarChartProps> = ({ data, title, className = '' }) => {
  if (!data || data.length === 0) {
    return (
      <div className={`bg-black/20 bg-opacity-60 border-1 border-[#f79631]/20 rounded p-6 ${className}`}>
        <h3 className="font-['FACERG'] text-[#f79631] text-xl font-bold uppercase tracking-wider mb-4">
          {title}
        </h3>
        <div className="text-center text-gray-400 font-['Trebuchet']">
          No data available
        </div>
      </div>
    );
  }

  const colors = [
    '#f79631', // Orange - primary theme
    '#10B981', // Green
    '#3B82F6', // Blue
    '#8B5CF6', // Purple
    '#EF4444', // Red
    '#F59E0B', // Amber
    '#06B6D4', // Cyan
    '#84CC16'  // Lime
  ];

  const chartData = {
    labels: data.map(item => item.label),
    datasets: [
      {
        label: 'Count',
        data: data.map(item => item.value),
        backgroundColor: data.map((item, index) => 
          item.color || colors[index % colors.length]
        ),
        borderColor: data.map((item, index) => 
          item.color || colors[index % colors.length]
        ),
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#f79631',
        bodyColor: '#ffffff',
        borderColor: '#f79631',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        titleFont: {
          family: 'Trebuchet MS, sans-serif',
          size: 14,
          weight: 'bold',
        },
        bodyFont: {
          family: 'Trebuchet MS, sans-serif',
          size: 12,
        },
        callbacks: {
          label: function(context: any) {
            return `${context.parsed.y.toLocaleString()} users`;
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(55, 65, 81, 0.3)',
          drawBorder: false,
        },
        ticks: {
          color: '#9CA3AF',
          font: {
            family: 'Trebuchet MS, sans-serif',
            size: 10,
          },
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(55, 65, 81, 0.3)',
          drawBorder: false,
        },
        ticks: {
          color: '#9CA3AF',
          font: {
            family: 'Trebuchet MS, sans-serif',
            size: 12,
          },
          stepSize: 1,
        },
      },
    },
    // Make bars narrower when there are many categories
    barPercentage: data.length > 10 ? 0.6 : 0.8,
    categoryPercentage: data.length > 10 ? 0.8 : 0.9,
  };

  return (
    <div className={`bg-black/20 bg-opacity-60 border-1 border-[#f79631]/20 rounded p-6 ${className}`}>
      <h3 className="font-['FACERG'] text-[#f79631] text-xl font-bold uppercase tracking-wider mb-4">
        {title}
      </h3>
      
      <div
        className="w-[50%] h-0.5 mb-6 rounded-full"
        style={{
          background: "linear-gradient(to right,rgba(247, 151, 49, 0.45) 0%, rgba(247, 151, 49, 0.25) 50%, rgba(247,151,49,0) 100%)"
        }}
      ></div>

      <div className="h-80">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
};

export default BarChart;
