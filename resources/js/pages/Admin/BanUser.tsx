import { type SharedData } from '@/types';
import { Head, usePage, router } from '@inertiajs/react';
import { useRef, useState, useEffect } from 'react';
import AdminNavbar from '@/components/AdminNavbar';

interface BanUserProps extends SharedData {
  user: {
    id: number;
    name: string;
    steam_id: string;
    elo: number;
    role: string;
    created_at: string;
    steam_avatar_medium?: string;
    is_banned: boolean;
    banned_at?: string;
    ban_reason?: string;
    ban_duration?: string;
    banned_until?: string;
    banned_by?: string;
  };
  flash?: {
    success?: string;
    error?: string;
  };
}

export default function BanUser() {
  const { auth, user, flash } = usePage<BanUserProps>().props;
  const audioRef = useRef<HTMLAudioElement>(null);
  const [banReason, setBanReason] = useState('');
  const [banDuration, setBanDuration] = useState('permanent');
  const [isDurationDropdownOpen, setIsDurationDropdownOpen] = useState(false);
  const durationDropdownRef = useRef<HTMLDivElement>(null);

  const banDurationOptions = [
    { value: 'permanent', label: 'Permanent' },
    { value: '1_day', label: '1 Day' },
    { value: '1_week', label: '1 Week' },
    { value: '1_month', label: '1 Month' },
    { value: '3_months', label: '3 Months' },
    { value: '6_months', label: '6 Months' },
    { value: '1_year', label: '1 Year' },
  ];

  // Handle click outside for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (durationDropdownRef.current && !durationDropdownRef.current.contains(event.target as Node)) {
        setIsDurationDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  const handleBanUser = () => {
    if (!banReason.trim()) return;

    router.post('/admin/users/ban', {
      steam_id: user.steam_id,
      reason: banReason,
      duration: banDuration,
    });
  };

  const handleCancel = () => {
    router.visit('/admin/dashboard');
  };

  return (
    <>
      <Head title="Ban User">
        <link rel="preconnect" href="https://fonts.bunny.net" />
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
      </Head>

      <div className="bg-black/30 backdrop-blur-sm relative min-h-screen">
        {/* Admin Navigation */}
        <AdminNavbar 
          currentPage="dashboard"
          onLogout={handleLogout}
          onHoverSound={playHoverSound}
        />

        <div className="container mx-auto px-4 py-8">
          {/* Flash Messages */}
          {flash?.success && (
            <div className="bg-green-600/20 border border-green-600/30 text-green-400 px-4 py-3 mb-6 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {flash.success}
              </div>
            </div>
          )}
          {flash?.error && (
            <div className="bg-red-600/20 border border-red-600/30 text-red-400 px-4 py-3 mb-6 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                {flash.error}
              </div>
            </div>
          )}

          <div className="bg-black/5 bg-opacity-60 border-1 border-[#f79631]/20 rounded p-8 max-w-2xl mx-auto">
            <div className="space-y-8">
              {/* User Info */}
              <div className="flex items-center space-x-4 p-6 bg-black/30 border border-[#f79631]/20 rounded">
                {user.steam_avatar_medium && (
                  <img
                    src={user.steam_avatar_medium}
                    alt="Avatar"
                    className="w-16 h-16 rounded-lg border border-[#f79631]/20"
                  />
                )}
                <div>
                  <div className="text-white font-semibold text-xl">
                    {user.name}
                  </div>
                  <div className="text-gray-400 text-sm">
                    Steam ID: {user.steam_id}
                  </div>
                  <div className="text-gray-400 text-sm">
                    ELO: {user.elo || 0}
                  </div>
                </div>
              </div>

              {/* Ban Reason */}
              <div>
                <label className="block text-gray-300 text-lg font-['Trebuchet'] mb-4">
                  Ban Reason: <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Enter reason for banning this user..."
                  className="w-full px-4 py-4 bg-black/50 border border-[#f79631]/30 text-white placeholder-gray-400 focus:border-[#f79631]/60 focus:outline-none h-32 resize-none font-['Trebuchet'] text-lg"
                />
              </div>

              {/* Ban Duration */}
              <div>
                <label className="block text-gray-300 text-lg font-['Trebuchet'] mb-4">
                  Ban Duration:
                </label>
                <div className="relative" ref={durationDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsDurationDropdownOpen(!isDurationDropdownOpen)}
                    className="w-full px-4 py-4 bg-black/50 border border-[#f79631]/30 text-white font-['Trebuchet'] text-lg text-left flex items-center justify-between hover:border-[#f79631]/60 transition-colors"
                  >
                    <span className={banDuration ? 'text-white' : 'text-gray-400'}>
                      {banDurationOptions.find(option => option.value === banDuration)?.label || 'Select duration...'}
                    </span>
                    <svg 
                      className={`w-6 h-6 text-[#f79631] transition-transform ${isDurationDropdownOpen ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isDurationDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-black/90 border border-[#f79631]/30 z-50">
                      <div className="max-h-48 overflow-y-auto">
                        {banDurationOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              setBanDuration(option.value);
                              setIsDurationDropdownOpen(false);
                            }}
                            className="w-full px-4 py-4 text-left text-white hover:bg-[#f79631]/20 hover:text-[#f79631] transition-colors font-['Trebuchet'] text-lg flex items-center justify-between"
                          >
                            <span>{option.label}</span>
                            {banDuration === option.value && (
                              <svg className="w-5 h-5 text-[#f79631]" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-6 pt-6">
                <button
                  onClick={handleCancel}
                  className="px-8 py-3 text-gray-400 hover:text-white font-['Trebuchet'] text-lg transition-colors border border-[#f79631]/20 hover:border-[#f79631]/40"
                  onMouseEnter={playHoverSound}
                >
                  Cancel
                </button>
                <button
                  onClick={handleBanUser}
                  disabled={!banReason.trim()}
                  className="px-8 py-3 bg-red-600/20 text-red-400 hover:bg-red-600/30 hover:text-red-300 font-['Trebuchet'] text-lg border border-red-600/30 hover:border-red-600/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  onMouseEnter={playHoverSound}
                >
                  Ban User
                </button>
              </div>
            </div>
          </div>
        </div>

        <audio ref={audioRef} preload="auto">
          <source src="/cs2-sound.mp3" type="audio/mpeg" />
        </audio>
      </div>
    </>
  );
}
