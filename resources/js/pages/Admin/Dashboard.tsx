import { type SharedData } from '@/types';
import { Head, usePage, router } from '@inertiajs/react';
import { useRef, useState, useMemo, useEffect } from 'react';
import MetricCard from '@/components/MetricCard';
import LineChart from '@/components/LineChart';
import BarChart from '@/components/BarChart';
import UserTable from '@/components/UserTable';
import AdminNavbar from '@/components/AdminNavbar';
import FriendsFilter from '@/components/FriendsFilter';
import { 
  FaUsers, 
  FaUserPlus, 
  FaTrophy, 
  FaShieldAlt,
  FaBan,
  FaUserSlash,
  FaSearch
} from 'react-icons/fa';

interface AdminDashboardProps extends SharedData {
  metrics: {
    totalUsers: number;
    usersLast24Hours: number;
    totalElo: number;
    usersByRole: {
      admin?: number;
      user?: number;
    };
    bannedUsers: number;
  };
  charts: {
    usersLast7Days: Array<{
      date: string;
      count: number;
    }>;
    eloDistribution: {
      '0-500': number;
      '501-1000': number;
      '1001-1500': number;
      '1501-2000': number;
      '2000+': number;
    };
  };
  recentUsers: {
    data: Array<{
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
    }>;
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{
      url: string | null;
      label: string;
      active: boolean;
    }>;
  };
  flash?: {
    success?: string;
    error?: string;
  };
  bannedUsers: {
    data: Array<{
      id: number;
      name: string;
      steam_id: string;
      steam_username?: string;
      steam_real_name?: string;
      elo: number;
      role: string;
      created_at: string;
      steam_avatar_medium?: string;
      is_banned: boolean;
      banned_at?: string;
      ban_reason?: string;
      ban_duration?: string;
      banned_until?: string;
      banned_by?: string | { name: string };
    }>;
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{
      url: string | null;
      label: string;
      active: boolean;
    }>;
  };
}

export default function AdminDashboard() {
  const { auth, metrics, charts, recentUsers = { data: [], current_page: 1, last_page: 1, per_page: 6, total: 0, links: [] }, bannedUsers = { data: [], current_page: 1, last_page: 1, per_page: 6, total: 0, links: [] }, flash } = usePage<AdminDashboardProps>().props;
  const user = auth?.user;
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Get tab from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const tabFromUrl = urlParams.get('tab') as 'overview' | 'elo' | 'users' | 'banned' | null;
  const [activeTab, setActiveTab] = useState<'overview' | 'elo' | 'users' | 'banned'>(
    tabFromUrl && ['overview', 'elo', 'users', 'banned'].includes(tabFromUrl) ? tabFromUrl : 'overview'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [showUnbanModal, setShowUnbanModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [bannedUsersSearch, setBannedUsersSearch] = useState('');

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showUnbanModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showUnbanModal]);

  const playHoverSound = () => {
    if (audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(console.error);
      }
    }
  };

  const handleTabChange = (tab: 'overview' | 'elo' | 'users' | 'banned') => {
    setActiveTab(tab);
    // Update URL with tab parameter
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.replaceState({}, '', url.toString());
  };

  const handleLogout = () => {
    router.post('/logout');
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    router.get('/admin/dashboard', { search: query }, {
      preserveState: true,
      replace: true,
    });
  };

  const handleBanUser = (user: any) => {
    router.visit(`/admin/users/ban/${user.id}`);
  };

  const handleUnbanUser = (user: any) => {
    setSelectedUser(user);
    setShowUnbanModal(true);
  };


  const confirmUnbanUser = () => {
    if (!selectedUser) return;

    router.post('/admin/users/unban', {
      steam_id: selectedUser.steam_id,
    }, {
      onSuccess: () => {
        setShowUnbanModal(false);
        setSelectedUser(null);
        // Refresh the page to show updated user list
        router.reload();
      },
      onError: (errors) => {
        console.error('Unban error:', errors);
      }
    });
  };

  const handleBannedUsersSearch = (query: string) => {
    setBannedUsersSearch(query);
    router.get('/admin/dashboard', { 
      tab: 'banned',
      banned_search: query 
    }, {
      preserveState: true,
      replace: true,
    });
  };

  // Convert ELO distribution to bar chart format with same color
  const eloDistributionData = Object.entries(charts.eloDistribution).map(([label, value]) => {
    return {
      label,
      value,
      color: '#f79631' // Same orange color for all bars
    };
  });

  // Convert users by role to bar chart format
  const usersByRoleData = Object.entries(metrics.usersByRole).map(([role, count]) => ({
    label: role.charAt(0).toUpperCase() + role.slice(1),
    value: count,
    color: role === 'admin' ? '#EF4444' : '#3B82F6'
  }));

  return (
    <>
      <Head title="Admin Dashboard">
        <link rel="preconnect" href="https://fonts.bunny.net" />
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
      </Head>

      <div className="bg-black/30 min-h-screen backdrop-blur-sm relative">
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
                  ADMIN DASHBOARD
                </h1>
                <p className="text-gray-300 text-lg font-['Trebuchet']">
                  Platform analytics and user management
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                </div>
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard
              title="Total Users"
              value={metrics.totalUsers}
              subtitle="Registered users"
              icon={<FaUsers className="w-6 h-6" />}
            />
            
            <MetricCard
              title="New Users (24h)"
              value={metrics.usersLast24Hours}
              subtitle="Last 24 hours"
              icon={<FaUserPlus className="w-6 h-6" />}
            />
            
            <MetricCard
              title="Total ELO"
              value={metrics.totalElo}
              subtitle="Combined ELO points"
              icon={<FaTrophy className="w-6 h-6" />}
            />
            
            <MetricCard
              title="Banned Users"
              value={metrics.bannedUsers}
              subtitle="Currently banned"
              icon={<FaBan className="w-6 h-6" />}
            />
          </div>

          {/* Tab Navigation */}
          <div className="flex mb-8">
            <button
              onClick={() => handleTabChange('overview')}
              className={`px-8 py-4 text-xl font-bold uppercase tracking-wider transition-colors relative ${activeTab === 'overview'
                ? 'text-[#f79631]'
                : 'text-gray-400 hover:text-[#f79631]'
              }`}
              onMouseEnter={playHoverSound}
              style={{
                border: 'none',
                background: 'none',
              }}
            >
              <span className="relative z-10">OVERVIEW</span>
              {activeTab === 'overview' && (
                <div className="absolute left-1/2 bottom-0 w-16 rounded-full h-1 bg-[#f79631] transform -translate-x-1/2" />
              )}
            </button>
            <button
              onClick={() => handleTabChange('elo')}
              className={`px-8 py-4 text-xl font-bold uppercase tracking-wider transition-colors relative ${activeTab === 'elo'
                ? 'text-[#f79631]'
                : 'text-gray-400 hover:text-[#f79631]'
              }`}
              onMouseEnter={playHoverSound}
              style={{
                border: 'none',
                background: 'none',
              }}
            >
              <span className="relative z-10">ELO DISTRIBUTION</span>
              {activeTab === 'elo' && (
                <div className="absolute left-1/2 bottom-0 w-16 rounded-full h-1 bg-[#f79631] transform -translate-x-1/2" />
              )}
            </button>
            <button
              onClick={() => handleTabChange('users')}
              className={`px-8 py-4 text-xl font-bold uppercase tracking-wider transition-colors relative ${activeTab === 'users'
                ? 'text-[#f79631]'
                : 'text-gray-400 hover:text-[#f79631]'
              }`}
              onMouseEnter={playHoverSound}
              style={{
                border: 'none',
                background: 'none',
              }}
            >
              <span className="relative z-10">RECENT USERS</span>
              {activeTab === 'users' && (
                <div className="absolute left-1/2 bottom-0 w-16 rounded-full h-1 bg-[#f79631] transform -translate-x-1/2" />
              )}
            </button>
            <button
              onClick={() => handleTabChange('banned')}
              className={`px-8 py-4 text-xl font-bold uppercase tracking-wider transition-colors relative ${activeTab === 'banned'
                ? 'text-[#f79631]'
                : 'text-gray-400 hover:text-[#f79631]'
              }`}
              onMouseEnter={playHoverSound}
              style={{
                border: 'none',
                background: 'none',
              }}
            >
              <span className="relative z-10">BANNED USERS</span>
              {activeTab === 'banned' && (
                <div className="absolute left-1/2 bottom-0 w-16 rounded-full h-1 bg-[#f79631] transform -translate-x-1/2" />
              )}
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <LineChart
                  data={charts.usersLast7Days}
                  title="User Registration Trend (7 Days)"
                />
                
                <BarChart
                  data={usersByRoleData}
                  title="Users by Role"
                />
              </div>
            </div>
          )}

          {activeTab === 'elo' && (
            <div className="space-y-8">
              <BarChart
                data={eloDistributionData}
                title="ELO Distribution"
              />
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-8">
              <div className="bg-black/5 bg-opacity-60 border-1 border-[#f79631]/20 rounded">
                <div className="flex items-center justify-between px-4 pt-6">
                  <h3 className="font-['FACERG'] text-[#f79631] text-2xl font-bold uppercase tracking-wider">USER MANAGEMENT</h3>
                  <div className="w-80">
                    <FriendsFilter 
                      onFilterChange={handleSearch}
                      placeholder="Search users by name, Steam ID, or username..."
                    />
                  </div>
                </div>
                <div
                  className="w-[50%] h-0.5 my-4 rounded-full"
                  style={{
                    background: "linear-gradient(to right,rgba(247, 151, 49, 0.45) 0%, rgba(247, 151, 49, 0.25) 50%, rgba(247,151,49,0) 100%)"
                  }}
                ></div>

                {/* Results count */}
                <div className="px-4 mb-4">
                  <div className="text-sm text-gray-400 font-['Trebuchet']">
                    Showing {recentUsers.data?.length || 0} of {recentUsers.total || 0} users
                    {searchQuery && (
                      <span className="text-[#f79631] ml-2">
                        (filtered by "{searchQuery}")
                      </span>
                    )}
                  </div>
                </div>

                {recentUsers.data && recentUsers.data.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm font-['Trebuchet']">
                      <thead>
                        <tr className="">
                          <th className="text-left py-4 px-6 text-[#f79631] font-bold uppercase tracking-wider border-b border-[#f79631]/20">#</th>
                          <th className="text-left py-4 px-6 text-[#f79631] font-bold uppercase tracking-wider border-b border-[#f79631]/20">User</th>
                          <th className="text-left py-4 px-6 text-[#f79631] font-bold uppercase tracking-wider border-b border-[#f79631]/20">ELO</th>
                          <th className="text-left py-4 px-6 text-[#f79631] font-bold uppercase tracking-wider border-b border-[#f79631]/20">Joined</th>
                          <th className="text-left py-4 px-6 text-[#f79631] font-bold uppercase tracking-wider border-b border-[#f79631]/20">Status</th>
                          <th className="text-left py-4 px-6 text-[#f79631] font-bold uppercase tracking-wider border-b border-[#f79631]/20">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentUsers.data?.map((user, index) => (
                          <tr key={user.id} className="border-b border-[#f79631]/10 hover:bg-black/20 transition-all duration-200 group">
                            <td className="py-4 px-6 text-white font-medium">{(recentUsers.current_page - 1) * recentUsers.per_page + index + 1}</td>
                            <td className="py-4 px-6">
                              <div className="flex items-center space-x-4">
                                {user.steam_avatar_medium && (
                                  <img
                                    src={user.steam_avatar_medium}
                                    alt="Avatar"
                                    className="w-12 h-12 rounded-lg border border-[#f79631]/20"
                                  />
                                )}
                                <div>
                                  <div className="text-white font-semibold text-base">
                                    {user.name}
                                  </div>
                                  <div className="text-gray-400 text-sm">
                                    {user.steam_id}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center">
                                <span className="text-[#f79631] font-bold text-lg">{user.elo || 0}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-gray-300">{user.created_at}</td>
                            <td className="py-4 px-6">
                              {user.is_banned ? (
                                <span className="px-3 py-1 bg-red-600/20 text-red-400 text-xs font-['Trebuchet'] border border-red-600/30">
                                  Banned
                                </span>
                              ) : (
                                <span className="px-3 py-1 bg-green-600/20 text-green-400 text-xs font-['Trebuchet'] border border-green-600/30">
                                  Active
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex space-x-3">
                                {user.is_banned ? (
                                  <button
                                    onClick={() => handleUnbanUser(user)}
                                    className="px-3 py-1.5 bg-green-600/20 text-green-400 hover:bg-green-600/30 hover:text-green-300 text-xs font-['Trebuchet'] transition-all duration-200 border border-green-600/30 hover:border-green-600/50"
                                    onMouseEnter={playHoverSound}
                                  >
                                    Unban
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleBanUser(user)}
                                    className="px-3 py-1.5 bg-red-600/20 text-red-400 hover:bg-red-600/30 hover:text-red-300 text-xs font-['Trebuchet'] transition-all duration-200 border border-red-600/30 hover:border-red-600/50"
                                    onMouseEnter={playHoverSound}
                                  >
                                    Ban
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-gray-400 font-['Trebuchet'] text-lg">No users found</p>
                    {searchQuery && (
                      <p className="text-gray-500 font-['Trebuchet'] text-sm mt-2">
                        No users match "{searchQuery}"
                      </p>
                    )}
                  </div>
                )}

                {/* Pagination */}
                {recentUsers.last_page && recentUsers.last_page > 1 && (
                  <div className="flex items-center justify-between px-4 py-4">
                    <div className="text-sm text-gray-400 font-['Trebuchet']">
                      Showing {((recentUsers.current_page - 1) * recentUsers.per_page) + 1} to {Math.min(recentUsers.current_page * recentUsers.per_page, recentUsers.total || 0)} of {recentUsers.total || 0} results
                    </div>
                    <div className="flex space-x-2">
                      {recentUsers.links?.map((link, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            if (link.url) {
                              const url = new URL(link.url);
                              const page = url.searchParams.get('page') || '1';
                              router.get('/admin/dashboard', { page, search: searchQuery }, {
                                preserveState: true,
                                replace: true,
                              });
                            }
                          }}
                          disabled={!link.url}
                          className={`px-3 py-2 text-sm font-['Trebuchet'] transition-colors ${
                            link.active
                              ? 'bg-[#f79631] text-black'
                              : link.url
                              ? 'bg-black/30 text-white hover:bg-[#f79631]/20'
                              : 'bg-black/10 text-gray-500 cursor-not-allowed'
                          }`}
                          onMouseEnter={playHoverSound}
                        >
                          {link.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'banned' && (
            <div className="space-y-8">
              <div className="bg-black/5 bg-opacity-60 border-1 border-[#f79631]/20 rounded">
                <div className="flex items-center justify-between px-4 pt-6">
                  <h3 className="font-['FACERG'] text-[#f79631] text-2xl font-bold uppercase tracking-wider">BANNED USERS</h3>
                  <div className="w-80">
                    <FriendsFilter 
                      onFilterChange={handleBannedUsersSearch}
                      placeholder="Search banned users by name, Steam ID, or username..."
                    />
                  </div>
                </div>
                <div
                  className="w-[50%] h-0.5 my-4 rounded-full"
                  style={{
                    background: "linear-gradient(to right,rgba(247, 151, 49, 0.45) 0%, rgba(247, 151, 49, 0.25) 50%, rgba(247,151,49,0) 100%)"
                  }}
                ></div>

                {/* Results count */}
                <div className="px-4 mb-4">
                  <div className="text-sm text-gray-400 font-['Trebuchet']">
                    Showing {bannedUsers.data?.length || 0} of {bannedUsers.total || 0} banned users
                    {bannedUsersSearch && (
                      <span className="text-[#f79631] ml-2">
                        (filtered by "{bannedUsersSearch}")
                      </span>
                    )}
                  </div>
                </div>

                {bannedUsers.data && bannedUsers.data.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm font-['Trebuchet']">
                      <thead>
                        <tr className="">
                          <th className="text-left py-4 px-6 text-[#f79631] font-bold uppercase tracking-wider border-b border-[#f79631]/20">#</th>
                          <th className="text-left py-4 px-6 text-[#f79631] font-bold uppercase tracking-wider border-b border-[#f79631]/20">User</th>
                          <th className="text-left py-4 px-6 text-[#f79631] font-bold uppercase tracking-wider border-b border-[#f79631]/20">ELO</th>
                          <th className="text-left py-4 px-6 text-[#f79631] font-bold uppercase tracking-wider border-b border-[#f79631]/20">Ban Reason</th>
                          <th className="text-left py-4 px-6 text-[#f79631] font-bold uppercase tracking-wider border-b border-[#f79631]/20">Duration</th>
                          <th className="text-left py-4 px-6 text-[#f79631] font-bold uppercase tracking-wider border-b border-[#f79631]/20">Banned By</th>
                          <th className="text-left py-4 px-6 text-[#f79631] font-bold uppercase tracking-wider border-b border-[#f79631]/20">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bannedUsers.data?.map((bannedUser, index) => (
                          <tr key={bannedUser.id} className="border-b border-[#f79631]/10 hover:bg-black/20 transition-all duration-200 group">
                            <td className="py-4 px-6 text-white font-medium">{index + 1}</td>
                            <td className="py-4 px-6">
                              <div className="flex items-center space-x-4">
                                {bannedUser.steam_avatar_medium && (
                                  <img
                                    src={bannedUser.steam_avatar_medium}
                                    alt="Avatar"
                                    className="w-12 h-12 rounded-lg border border-[#f79631]/20"
                                  />
                                )}
                                <div>
                                  <div className="text-white font-semibold text-base">
                                    {bannedUser.steam_real_name || bannedUser.steam_username || bannedUser.name}
                                  </div>
                                  <div className="text-gray-400 text-sm">
                                    {bannedUser.steam_id}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center">
                                <span className="text-[#f79631] font-bold text-lg">{bannedUser.elo || 0}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-gray-300 max-w-xs truncate" title={bannedUser.ban_reason}>
                              {bannedUser.ban_reason}
                            </td>
                            <td className="py-4 px-6 text-gray-300">
                              {bannedUser.ban_duration === 'permanent' ? 'Permanent' : bannedUser.ban_duration}
                            </td>
                            <td className="py-4 px-6 text-gray-300">
                              {typeof bannedUser.banned_by === 'object' ? bannedUser.banned_by?.name : bannedUser.banned_by || 'System'}
                            </td>
                            <td className="py-4 px-6">
                              <button
                                onClick={() => handleUnbanUser(bannedUser)}
                                className="px-3 py-1.5 bg-green-600/20 text-green-400 hover:bg-green-600/30 hover:text-green-300 text-xs font-['Trebuchet'] transition-all duration-200 border border-green-600/30 hover:border-green-600/50"
                                onMouseEnter={playHoverSound}
                              >
                                Unban
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-gray-400 font-['Trebuchet'] text-lg">No banned users found</p>
                    {bannedUsersSearch && (
                      <p className="text-gray-500 font-['Trebuchet'] text-sm mt-2">
                        No banned users match "{bannedUsersSearch}"
                      </p>
                    )}
                  </div>
                )}

                {/* Pagination for banned users */}
                {bannedUsers.last_page && bannedUsers.last_page > 1 && (
                  <div className="flex items-center justify-between px-4 py-4">
                    <div className="text-sm text-gray-400 font-['Trebuchet']">
                      Showing {((bannedUsers.current_page - 1) * bannedUsers.per_page) + 1} to {Math.min(bannedUsers.current_page * bannedUsers.per_page, bannedUsers.total || 0)} of {bannedUsers.total || 0} results
                    </div>
                    <div className="flex space-x-2">
                      {bannedUsers.links?.map((link, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            if (link.url) {
                              const url = new URL(link.url);
                              const page = url.searchParams.get('page') || '1';
                              router.get('/admin/dashboard', { 
                                tab: 'banned',
                                page,
                                banned_search: bannedUsersSearch 
                              }, {
                                preserveState: true,
                                replace: true,
                              });
                            }
                          }}
                          disabled={!link.url}
                          className={`px-3 py-2 text-sm font-['Trebuchet'] transition-colors ${
                            link.active
                              ? 'bg-[#f79631] text-black'
                              : link.url
                              ? 'bg-black/30 text-white hover:bg-[#f79631]/20'
                              : 'bg-black/10 text-gray-500 cursor-not-allowed'
                          }`}
                          onMouseEnter={playHoverSound}
                        >
                          {link.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>


        {/* Unban User Modal */}
        {showUnbanModal && selectedUser && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-black/50 border border-[#f79631]/30 p-6 w-full max-w-md" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="font-['FACERG'] text-[#f79631] text-xl font-bold uppercase tracking-wider mb-4">CONFIRM UNBAN</h3>
                <p className="text-gray-300 font-['Trebuchet'] mb-6">
                  Are you sure you want to unban {selectedUser.name}?
                </p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => {
                      setShowUnbanModal(false);
                      setSelectedUser(null);
                    }}
                    className="px-6 py-2 text-gray-400 hover:text-white font-['Trebuchet'] transition-colors border border-[#f79631]/30"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmUnbanUser}
                    className="px-6 py-2 bg-green-600/20 text-green-400 hover:bg-green-600/30 hover:text-green-300 font-['Trebuchet'] border border-green-600/30 hover:border-green-600/50 transition-all duration-200"
                  >
                    Unban User
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <audio ref={audioRef} preload="auto">
          <source src="/cs2-sound.mp3" type="audio/mpeg" />
        </audio>
      </div>
    </>
  );
}
