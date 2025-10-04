import React from 'react';

interface CountryDisplayProps {
  country: string | null;
  canChange: boolean;
  className?: string;
}

const CountryDisplay: React.FC<CountryDisplayProps> = ({ 
  country, 
  canChange, 
  className = '' 
}) => {
  if (!country) {
    return (
      <div className={`text-gray-500 ${className}`}>
        No country selected
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-sm font-medium text-gray-700">
        Country: {country}
      </span>
      {!canChange && (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Locked
        </span>
      )}
    </div>
  );
};

export default CountryDisplay;
