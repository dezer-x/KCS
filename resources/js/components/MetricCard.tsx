import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  className = ''
}) => {
  const formatValue = (val: string | number): string => {
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`;
      } else if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}K`;
      }
      return val.toLocaleString();
    }
    return val;
  };

  return (
    <div className={`bg-black/20 bg-opacity-60 border-1 border-[#f79631]/20 rounded p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-['FACERG'] text-[#f79631] text-lg font-bold uppercase tracking-wider">
          {title}
        </h3>
        {icon && (
          <div className="text-[#f79631] text-2xl">
            {icon}
          </div>
        )}
      </div>
      
      <div
        className="w-[20%] h-0.5 mb-4 rounded-full"
        style={{
          background: "linear-gradient(to right,rgba(247, 151, 49, 0.45) 0%, rgba(247, 151, 49, 0.25) 50%, rgba(247,151,49,0) 100%)"
        }}
      ></div>
      
      <div className="space-y-2">
        <div className="text-3xl font-bold text-white font-['Trebuchet']">
          {formatValue(value)}
        </div>
        
        {subtitle && (
          <div className="text-gray-400 text-sm font-['Trebuchet']">
            {subtitle}
          </div>
        )}
        
        {trend && (
          <div className={`flex items-center text-sm font-['Trebuchet'] ${
            trend.isPositive ? 'text-green-400' : 'text-red-400'
          }`}>
            <svg 
              className={`w-4 h-4 mr-1 ${trend.isPositive ? 'rotate-0' : 'rotate-180'}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
            </svg>
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricCard;
