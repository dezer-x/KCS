import React, { useState, useEffect, useRef } from 'react';
import countryList from 'react-select-country-list';

interface CountrySelectorProps {
  defaultCountry?: string;
  onCountrySelect: (countryCode: string) => void;
  disabled?: boolean;
  className?: string;
}

const CountrySelector: React.FC<CountrySelectorProps> = ({
  defaultCountry,
  onCountrySelect,
  disabled = false,
  className = ''
}) => {
  const [selectedCountry, setSelectedCountry] = useState<string>(defaultCountry || '');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [countries] = useState(() => countryList().getData());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (defaultCountry) {
      setSelectedCountry(defaultCountry);
    }
  }, [defaultCountry]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredCountries = countries.filter(country =>
    country.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedCountryData = countries.find(country => country.value === selectedCountry);

  const handleCountrySelect = (countryCode: string) => {
    if (!disabled && countryCode) {
      setSelectedCountry(countryCode);
      onCountrySelect(countryCode);
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  const handleToggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setTimeout(() => searchRef.current?.focus(), 0);
      }
    }
  };

  return (
    <div className={`country-selector relative ${className}`}>
      <label className="block text-gray-300 text-lg font-['Trebuchet'] mb-4">
        Select your country:
      </label>
      
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={handleToggleDropdown}
          disabled={disabled}
          className="w-full px-4 py-3 bg-black/50 border border-[#f79631]/20 rounded text-white font-['Trebuchet'] disabled:bg-black/30 disabled:cursor-not-allowed disabled:opacity-50 hover:border-[#f79631]/60 transition-colors text-left flex items-center justify-between"
        >
          <span className={selectedCountryData ? 'text-white' : 'text-gray-400'}>
            {selectedCountryData ? selectedCountryData.label : 'Choose your country...'}
          </span>
          <svg 
            className={`w-5 h-5 text-[#f79631] transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-black/90 border border-[#f79631]/20 rounded shadow-lg max-h-60 overflow-hidden">
            <div className="p-2 border-b border-[#f79631]/20">
              <input
                ref={searchRef}
                type="text"
                placeholder="Search countries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 bg-black/50 border border-[#f79631]/10 rounded text-white placeholder-gray-400 focus:border-[#f79631]/20 focus:outline-none font-['Trebuchet'] text-sm"
              />
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filteredCountries.length > 0 ? (
                filteredCountries.map((country) => (
                  <button
                    key={country.value}
                    type="button"
                    onClick={() => handleCountrySelect(country.value)}
                    className="w-full px-4 py-2 text-left text-white hover:bg-[#f79631]/20 hover:text-[#f79631] transition-colors font-['Trebuchet'] text-sm flex items-center justify-between"
                  >
                    <span>{country.label}</span>
                    {selectedCountry === country.value && (
                      <svg className="w-4 h-4 text-[#f79631]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))
              ) : (
                <div className="px-4 py-2 text-gray-400 font-['Trebuchet'] text-sm text-center">
                  No countries found
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CountrySelector;
