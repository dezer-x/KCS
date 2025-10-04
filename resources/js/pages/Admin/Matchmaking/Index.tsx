import { type SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useRef } from 'react';
import AdminNavbar from '@/components/AdminNavbar';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaEye,
  FaServer,
  FaGlobe,
  FaGamepad,
  FaUsers,
  FaPlay,
  FaPause,
  FaClock
} from 'react-icons/fa';

interface MatchmakingServer {
  id: number;
  ip_address: string;
  port: number;
  is_active: boolean;
  max_players: number;
  current_players: number;
  is_occupied: boolean;
  occupied_by_team_1?: string;
  occupied_by_team_2?: string;
  match_id?: string;
  match_started_at?: string;
  match_ended_at?: string;
  server_password?: string;
  rcon_password?: string;
  region?: string;
  tickrate?: number;
  created_at: string;
  updated_at: string;
}

interface AdminMatchmakingIndexProps extends SharedData {
  servers: MatchmakingServer[];
}

export default function AdminMatchmakingIndex() {
  const { auth, servers } = usePage<AdminMatchmakingIndexProps>().props;
  const audioRef = useRef<HTMLAudioElement>(null);

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

  const handleDelete = (id: number) => {
    console.log('Delete button clicked for server ID:', id);
    if (confirm('Are you sure you want to delete this matchmaking server?')) {
      console.log('User confirmed deletion, sending delete request...');
      router.delete(`/admin/matchmaking/${id}`, {
        onSuccess: () => {
          console.log('Server deleted successfully');
        },
        onError: (errors) => {
          console.error('Error deleting server:', errors);
        }
      });
    } else {
      console.log('User cancelled deletion');
    }
  };

  const toggleServerStatus = (id: number, currentStatus: boolean) => {
    console.log('Toggle status clicked for server ID:', id, 'Current status:', currentStatus);
    router.patch(`/admin/matchmaking/${id}/toggle`, {
      is_active: !currentStatus
    }, {
      onSuccess: () => {
        console.log('Server status toggled successfully');
      },
      onError: (errors) => {
        console.error('Error toggling server status:', errors);
      }
    });
  };

  const endMatch = (id: number) => {
    if (confirm('Are you sure you want to end this match?')) {
      router.patch(`/admin/matchmaking/${id}/end-match`, {}, {
        onSuccess: () => {
          console.log('Match ended successfully');
        },
        onError: (errors) => {
          console.error('Error ending match:', errors);
        }
      });
    }
  };

  const getServerStatus = (server: MatchmakingServer) => {
    if (!server.is_active) return { text: 'INACTIVE', color: 'bg-red-600/20 text-red-400' };
    if (server.is_occupied) return { text: 'IN MATCH', color: 'bg-blue-600/20 text-blue-400' };
    if (server.current_players > 0) return { text: 'WAITING', color: 'bg-yellow-600/20 text-yellow-400' };
    return { text: 'AVAILABLE', color: 'bg-green-600/20 text-green-400' };
  };

  const getPlayerStatus = (server: MatchmakingServer) => {
    return `${server.current_players}/${server.max_players}`;
  };

  return (
    <>
      <Head title="Matchmaking Servers">
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
          <div className="relative bg-black/5 bg-opacity-60 border-1 border-[#f79631]/20  p-6 mb-8 overflow-hidden">
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
                  Matchmaking Servers
                </h1>
                <p className="text-gray-300 text-lg font-['Trebuchet']">
                  Manage matchmaking servers for 5v5 matches
                </p>
              </div>
              <Link
                href="/admin/matchmaking/create"
                className="bg-[#f79631] hover:bg-[#f79631]/80 text-black font-['FACERG'] font-bold uppercase tracking-wider px-6 py-3  transition-all duration-200 flex items-center space-x-2"
                onMouseEnter={playHoverSound}
              >
                <FaPlus className="w-5 h-5" />
                <span>Create Server</span>
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-black/20 bg-opacity-60 border-1 border-[#f79631]/20  p-6">
              <div className="flex items-center space-x-4">
                <div>
                  <h3 className="font-['FACERG'] text-gray-400 text-sm uppercase tracking-wider mb-1">
                    Total Servers
                  </h3>
                  <p className="font-['FACERG'] text-white text-3xl font-bold">
                    {servers.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-black/20 bg-opacity-60 border-1 border-[#f79631]/20  p-6">
              <div className="flex items-center space-x-4">
                <div>
                  <h3 className="font-['FACERG'] text-gray-400 text-sm uppercase tracking-wider mb-1">
                    Active Servers
                  </h3>
                  <p className="font-['FACERG'] text-white text-3xl font-bold">
                    {servers.filter(server => server.is_active).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-black/20 bg-opacity-60 border-1 border-[#f79631]/20  p-6">
              <div className="flex items-center space-x-4">
                <div>
                  <h3 className="font-['FACERG'] text-gray-400 text-sm uppercase tracking-wider mb-1">
                    In Matches
                  </h3>
                  <p className="font-['FACERG'] text-white text-3xl font-bold">
                    {servers.filter(server => server.is_occupied).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-black/20 bg-opacity-60 border-1 border-[#f79631]/20  p-6">
              <div className="flex items-center space-x-4">
                <div>
                  <h3 className="font-['FACERG'] text-gray-400 text-sm uppercase tracking-wider mb-1">
                    Available
                  </h3>
                  <p className="font-['FACERG'] text-white text-3xl font-bold">
                    {servers.filter(server => server.is_active && !server.is_occupied).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Servers List */}
          <div className="bg-black/20 bg-opacity-60 border-1 border-[#f79631]/20  p-6">
            <h2 className="font-['FACERG'] text-[#f79631] text-2xl font-bold uppercase tracking-wider mb-6">
              Matchmaking Servers
            </h2>

            {servers.length === 0 ? (
              <div className="text-center py-12">
                <FaServer className="w-16 h-16 text-gray-400 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl text-gray-400 font-['Trebuchet'] mb-2">No Matchmaking Servers</h3>
                <p className="text-gray-500 font-['Trebuchet'] mb-6">
                  Create your first matchmaking server to get started
                </p>
                <Link
                  href="/admin/matchmaking/create"
                  className="bg-[#f79631] hover:bg-[#f79631]/80 text-black font-['FACERG'] font-bold uppercase tracking-wider px-6 py-3 rounded-lg transition-all duration-200 inline-flex items-center space-x-2"
                  onMouseEnter={playHoverSound}
                >
                  <FaPlus className="w-5 h-5" />
                  <span>Create Server</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {servers.map((server) => {
                  const status = getServerStatus(server);
                  const playerCount = getPlayerStatus(server);
                  
                  return (
                    <div
                      key={server.id}
                      className="bg-black/30 border border-[#f79631]/20  p-6 hover:border-[#f79631]/40 transition-all duration-200"
                    >
                      {/* Server Header */}
                      <div className="relative mb-4">
                        <div className="w-full h-32 bg-gradient-to-br from-[#f79631]/20 to-[#f79631]/5 rounded-lg flex items-center justify-center border border-[#f79631]/30">
                          <div className="text-center">
                            <FaServer className="w-12 h-12 text-[#f79631] mb-2" />
                            <div className="text-[#f79631] font-['FACERG'] font-bold text-lg">
                              MatchyZ Server
                            </div>
                          </div>
                        </div>
                        <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold ${status.color}`}>
                          {status.text}
                        </div>
                        {server.is_occupied && (
                          <div className="absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-bold bg-blue-600/20 text-blue-400">
                            <FaClock className="w-3 h-3 inline mr-1" />
                            MATCH IN PROGRESS
                          </div>
                        )}
                      </div>

                      {/* Server Info */}
                      <div className="mb-4">
                        <h3 className="font-['FACERG'] text-white text-xl font-bold mb-2">
                          {server.ip_address}:{server.port}
                        </h3>
                        <p className="text-gray-300 font-['Trebuchet'] text-sm mb-2">
                          <FaGlobe className="w-4 h-4 inline mr-2" />
                          Region: {server.region || 'US'}
                        </p>
                        <p className="text-gray-300 font-['Trebuchet'] text-sm mb-2">
                          <FaUsers className="w-4 h-4 inline mr-2" />
                          Players: {playerCount}
                        </p>
                        <p className="text-gray-300 font-['Trebuchet'] text-sm mb-2">
                          <FaGamepad className="w-4 h-4 inline mr-2" />
                          Tickrate: {server.tickrate || 128} tick
                        </p>
                        {server.is_occupied && server.match_started_at && (
                          <p className="text-blue-400 font-['Trebuchet'] text-xs mt-2">
                            <FaPlay className="w-3 h-3 inline mr-1" />
                            Match started: {new Date(server.match_started_at).toLocaleString()}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex space-x-2">
                          <Link
                            href={`/admin/matchmaking/${server.id}`}
                            className="p-2 text-orange-400 rounded transition-colors"
                            onMouseEnter={playHoverSound}
                            title="View Details"
                          >
                            <FaEye className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/admin/matchmaking/${server.id}/edit`}
                            className="p-2 text-orange-400 rounded transition-colors"
                            onMouseEnter={playHoverSound}
                            title="Edit Server"
                          >
                            <FaEdit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(server.id)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-600/20 rounded transition-colors"
                            onMouseEnter={playHoverSound}
                            title="Delete Server"
                          >
                            <FaTrash className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex space-x-2">
                          {server.is_occupied ? (
                            <button
                              onClick={() => endMatch(server.id)}
                              className="px-3 py-1 bg-red-600/20 text-red-400 hover:bg-red-600/30 text-xs font-bold transition-colors"
                              onMouseEnter={playHoverSound}
                              title="End Match"
                            >
                              <FaPause className="w-3 h-3 inline mr-1" />
                              End Match
                            </button>
                          ) : (
                            <button
                              onClick={() => toggleServerStatus(server.id, server.is_active)}
                              className={`px-3 py-1 text-xs font-bold transition-colors ${
                                server.is_active
                                  ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
                                  : 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                              }`}
                              onMouseEnter={playHoverSound}
                            >
                              {server.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <audio ref={audioRef} preload="auto">
          <source src="/cs2-sound.mp3" type="audio/mpeg" />
        </audio>
      </div>
    </>
  );
}
