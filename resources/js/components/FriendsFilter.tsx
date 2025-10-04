import { useState } from 'react';

interface FriendsFilterProps {
    onFilterChange: (filter: string) => void;
    placeholder?: string;
}

export default function FriendsFilter({ onFilterChange, placeholder = "Filter friends..." }: FriendsFilterProps) {
    const [filter, setFilter] = useState('');

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFilter(value);
        onFilterChange(value);
    };

    return (
        <div className="relative mb-6">
            <div className="relative">
                <input
                    type="text"
                    value={filter}
                    onChange={handleFilterChange}
                    placeholder={placeholder}
                    className="w-full px-4 py-3 pl-12 bg-black/30 border border-[#f79631]/30  text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#f79631]/50 focus:border-[#f79631] transition-all duration-200 font-['Trebuchet']"
                    style={{
                        background: 'linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 100%)',
                        backdropFilter: 'blur(10px)',
                    }}
                />
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg 
                        className="w-5 h-5 text-[#f79631]" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                        />
                    </svg>
                </div>
                {filter && (
                    <button
                        onClick={() => {
                            setFilter('');
                            onFilterChange('');
                        }}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white transition-colors"
                    >
                        <svg 
                            className="w-5 h-5" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M6 18L18 6M6 6l12 12" 
                            />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
}
