import React, { useState, useRef } from 'react';
import { Head, useForm } from '@inertiajs/react';
import CountrySelector from '@/components/CountrySelector';
import country from '@/routes/country';

interface CountrySelectionProps {
  defaultCountry?: string;
  user: {
    id: number;
    name: string;
    steam_username: string;
    steam_avatar_medium?: string;
  };
}

const CountrySelection: React.FC<CountrySelectionProps> = ({ defaultCountry, user }) => {
  const [selectedCountry, setSelectedCountry] = useState<string>(defaultCountry || '');
  const audioRef = useRef<HTMLAudioElement>(null);

  const { data, setData, post, processing, errors } = useForm({
    country: defaultCountry || selectedCountry,
  });

  const playHoverSound = () => {
    if (audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(console.error);
      }
    }
  };

  const handleCountrySelect = (countryCode: string) => {
    setSelectedCountry(countryCode);
    setData('country', countryCode);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCountry) {
      post(country.selection.store.url());
    }
  };

  return (
    <>
      <Head title="Select Your Country">
        <link rel="preconnect" href="https://fonts.bunny.net" />
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
      </Head>
      
      <div className="bg-black/30 min-h-screen backdrop-blur-sm relative">
        {/* Header */}
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="font-['FACERG'] text-[#f79631] text-2xl font-bold uppercase tracking-wider">
              COUNTRY SELECTION
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="relative bg-black/5 bg-opacity-60 border-1 border-[#f79631]/20 rounded p-6 mb-8 overflow-hidden">
            <div
              className="absolute inset-0 bg-right bg-center bg-no-repeat opacity-20"
              style={{
                backgroundImage: 'url("/images/binchilli.png")',
              }}
            ></div>

            <div className="absolute inset-0 bg-black/40"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h1 className="font-['FACERG'] text-[#f79631] text-4xl font-bold uppercase tracking-wider">
                  WELCOME, {user.steam_username?.toUpperCase()}!
                </h1>
                <p className="text-gray-300 text-lg font-['Trebuchet']">
                  Please select your country to complete your profile setup
                </p>
              </div>
              {user.steam_avatar_medium && (
                <img 
                  src={user.steam_avatar_medium} 
                  alt="Steam Avatar" 
                  className="w-16 h-16 rounded border border-[#f79631]/20"
                />
              )}
            </div>
          </div>

          {/* Country Selection Form */}
          <div className="bg-black/5 bg-opacity-60 border-1 border-[#f79631]/20 rounded p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-4">
                <h3 className="font-['FACERG'] text-[#f79631] text-2xl font-bold uppercase tracking-wider mb-6">
                  SELECT YOUR COUNTRY
                </h3>
                
                <div
                  className="w-[50%] h-0.5 mb-6 rounded-full"
                  style={{
                    background: "linear-gradient(to right,rgba(247, 151, 49, 0.45) 0%, rgba(247, 151, 49, 0.25) 50%, rgba(247,151,49,0) 100%)"
                  }}
                ></div>

                <CountrySelector
                  defaultCountry={defaultCountry}
                  onCountrySelect={handleCountrySelect}
                  className="w-full"
                />

                {errors.country && (
                  <div className="bg-red-600/20 border border-red-600/30 text-red-400 px-4 py-3 rounded-lg">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      {errors.country}
                    </div>
                  </div>
                )}

              </div>

              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={!selectedCountry || processing}
                  className="font-['FACERG'] text-[#f79631] text-2xl font-bold uppercase tracking-wider hover:text-yellow-300 transition-colors px-8 py-4 border border-[#f79631]/30 rounded hover:border-[#f79631]/60 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-[#f79631]"
                  onMouseEnter={playHoverSound}
                >
                  {processing ? 'SETTING UP PROFILE...' : 'COMPLETE SETUP'}
                </button>
              </div>
            </form>

          </div>
        </div>

        <audio ref={audioRef} preload="auto">
          <source src="/cs2-sound.mp3" type="audio/mpeg" />
        </audio>
      </div>
    </>
  );
};

export default CountrySelection;
