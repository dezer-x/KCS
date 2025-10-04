import { type SharedData } from '@/types';
import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import { useRef, useState } from 'react';
import AdminNavbar from '@/components/AdminNavbar';
import CustomDropdown from '@/components/CustomDropdown';
import { 
  FaArrowLeft, 
  FaSave, 
  FaGlobe,
  FaGamepad,
  FaUsers
} from 'react-icons/fa';

interface AdminMatchmakingCreateProps extends SharedData {}

export default function AdminMatchmakingCreate() {
  const { auth } = usePage<AdminMatchmakingCreateProps>().props;
  const audioRef = useRef<HTMLAudioElement>(null);

  const regionOptions = [
    { value: 'US', label: 'United States' },
    { value: 'EU', label: 'Europe' },
    { value: 'AS', label: 'Asia' },
    { value: 'SA', label: 'South America' },
  ];

  const tickrateOptions = [
    { value: '64', label: '64 tick' },
    { value: '128', label: '128 tick' },
  ];

  const playHoverSound = () => {
    if (audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(console.error);
      }
    }
  };

  const handleLogout = () => {
    router.post('/logout');
  };

  const { data, setData, post, processing, errors } = useForm({
    ip_address: '',
    port: 27015,
    max_players: 10,
    is_active: true,
    server_password: '',
    rcon_password: '',
    region: 'US',
    tickrate: 128,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/admin/matchmaking');
  };

  return (
    <>
      <Head title="Create Matchmaking Server">
        <link rel="preconnect" href="https://fonts.bunny.net" />
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
      </Head>

      <div className="bg-black/30 min-h-screen backdrop-blur-sm relative">
        {/* Admin Navigation */}
        <AdminNavbar 
          currentPage="matchmaking"
          onLogout={handleLogout}
          onHoverSound={playHoverSound}
        />

        <div className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="relative bg-black/5 bg-opacity-60 border-1 border-[#f79631]/20 rounded p-6 mb-8 overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-20"
              style={{
                backgroundImage: 'url("/images/cs.png")',
              }}
            ></div>
            <div className="absolute inset-0 bg-black/40"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h1 className="font-['FACERG'] text-[#f79631] text-4xl font-bold uppercase tracking-wider">
                  Add MatchyZ Server
                </h1>
                <p className="text-gray-300 text-lg font-['Trebuchet']">
                  Add a new MatchyZ CSGO server for matchmaking
                </p>
              </div>
              <Link
                href="/admin/matchmaking"
                className="font-['FACERG'] text-[#f79631] text-xl font-bold uppercase tracking-wider hover:text-yellow-300 transition-colors flex items-center space-x-2"
                onMouseEnter={playHoverSound}
              >
                <FaArrowLeft className="w-5 h-5" />
                <span>Back to Servers</span>
              </Link>
            </div>
          </div>

          <div className="">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Server Configuration */}
              <div className="bg-black/20 bg-opacity-60 border-1 border-[#f79631]/20 rounded p-6">
                <h2 className="font-['FACERG'] text-[#f79631] text-2xl font-bold uppercase tracking-wider mb-6 flex items-center">
                  <FaGlobe className="w-6 h-6 mr-3" />
                  Server Configuration
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-gray-300 font-['Trebuchet'] font-medium mb-2">
                      IP Address *
                    </label>
                    <input
                      type="text"
                      value={data.ip_address}
                      onChange={(e) => setData('ip_address', e.target.value)}
                      className="w-full px-4 py-3 bg-black/40 border border-[#f79631]/30  text-white placeholder-gray-400 focus:border-[#f79631] focus:outline-none transition-colors"
                      placeholder="e.g., 192.168.1.100"
                      required
                    />
                    {errors.ip_address && (
                      <p className="text-red-400 text-sm mt-1 font-['Trebuchet']">{errors.ip_address}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-300 font-['Trebuchet'] font-medium mb-2">
                      Port *
                    </label>
                    <input
                      type="number"
                      value={data.port}
                      onChange={(e) => setData('port', parseInt(e.target.value))}
                      min="1"
                      max="65535"
                      className="w-full px-4 py-3 bg-black/40 border border-[#f79631]/30  text-white placeholder-gray-400 focus:border-[#f79631] focus:outline-none transition-colors"
                      placeholder="27015"
                      required
                    />
                    {errors.port && (
                      <p className="text-red-400 text-sm mt-1 font-['Trebuchet']">{errors.port}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-300 font-['Trebuchet'] font-medium mb-2">
                      Max Players *
                    </label>
                    <input
                      type="number"
                      value={data.max_players}
                      onChange={(e) => setData('max_players', parseInt(e.target.value))}
                      min="2"
                      max="20"
                      className="w-full px-4 py-3 bg-black/40 border border-[#f79631]/30  text-white placeholder-gray-400 focus:border-[#f79631] focus:outline-none transition-colors"
                      placeholder="10"
                      required
                    />
                    <p className="text-gray-400 text-xs mt-1 font-['Trebuchet']">
                      Recommended: 10 for 5v5 matches
                    </p>
                    {errors.max_players && (
                      <p className="text-red-400 text-sm mt-1 font-['Trebuchet']">{errors.max_players}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-300 font-['Trebuchet'] font-medium mb-2">
                      Server Password
                    </label>
                    <input
                      type="password"
                      value={data.server_password}
                      onChange={(e) => setData('server_password', e.target.value)}
                      className="w-full px-4 py-3 bg-black/40 border border-[#f79631]/30  text-white placeholder-gray-400 focus:border-[#f79631] focus:outline-none transition-colors"
                      placeholder="Server password (optional)"
                    />
                    {errors.server_password && (
                      <p className="text-red-400 text-sm mt-1 font-['Trebuchet']">{errors.server_password}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-300 font-['Trebuchet'] font-medium mb-2">
                      RCON Password *
                    </label>
                    <input
                      type="password"
                      value={data.rcon_password}
                      onChange={(e) => setData('rcon_password', e.target.value)}
                      className="w-full px-4 py-3 bg-black/40 border border-[#f79631]/30  text-white placeholder-gray-400 focus:border-[#f79631] focus:outline-none transition-colors"
                      placeholder="RCON password for server control"
                      required
                    />
                    {errors.rcon_password && (
                      <p className="text-red-400 text-sm mt-1 font-['Trebuchet']">{errors.rcon_password}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-300 font-['Trebuchet'] font-medium mb-2">
                      Region *
                    </label>
                    <CustomDropdown
                      options={regionOptions}
                      value={data.region}
                      onChange={(value) => setData('region', value)}
                      placeholder="Select region"
                      required
                    />
                    {errors.region && (
                      <p className="text-red-400 text-sm mt-1 font-['Trebuchet']">{errors.region}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-300 font-['Trebuchet'] font-medium mb-2">
                      Tickrate *
                    </label>
                    <CustomDropdown
                      options={tickrateOptions}
                      value={data.tickrate.toString()}
                      onChange={(value) => setData('tickrate', parseInt(value))}
                      placeholder="Select tickrate"
                      required
                    />
                    <p className="text-gray-400 text-xs mt-1 font-['Trebuchet']">
                      Higher tickrate = better gameplay
                    </p>
                    {errors.tickrate && (
                      <p className="text-red-400 text-sm mt-1 font-['Trebuchet']">{errors.tickrate}</p>
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={data.is_active}
                        onChange={(e) => setData('is_active', e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-6 h-6 border-2 transition-all duration-200 ${
                        data.is_active 
                          ? 'bg-[#f79631] border-[#f79631]' 
                          : 'bg-transparent border-[#f79631]/50'
                      }`}>
                        {data.is_active && (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-gray-300 font-['Trebuchet'] font-medium">
                      Server is active (available for matchmaking)
                    </span>
                  </label>
                </div>
              </div>
              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-4">
                <Link
                  href="/admin/matchmaking"
                  className="px-6 py-3 bg-transparent border border-[#f79631]/50 hover:border-[#f79631] text-[#f79631] hover:text-yellow-300 font-['FACERG'] font-bold uppercase tracking-wider transition-colors"
                  onMouseEnter={playHoverSound}
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-6 py-3 bg-[#f79631] hover:bg-[#f79631]/80 disabled:opacity-50 disabled:cursor-not-allowed text-black font-['FACERG'] font-bold uppercase tracking-wider transition-colors flex items-center space-x-2"
                  onMouseEnter={playHoverSound}
                >
                  <FaSave className="w-5 h-5" />
                  <span>{processing ? 'Adding...' : 'Add Server'}</span>
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
}
