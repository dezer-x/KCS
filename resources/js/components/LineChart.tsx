import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DataPoint {
  date: string;
  count: number;
}

interface LineChartProps {
  data: DataPoint[];
  title: string;
  className?: string;
}

const LineChart: React.FC<LineChartProps> = ({ data, title, className = '' }) => {
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

  const chartData = {
    labels: data.map(point => point.date),
    datasets: [
      {
        label: 'Registrations',
        data: data.map(point => point.count),
        borderColor: '#f79631',
        backgroundColor: 'rgba(247, 150, 49, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#f79631',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
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
            size: 12,
          },
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
    elements: {
      point: {
        hoverBackgroundColor: '#f79631',
      },
    },
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
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export default LineChart;
