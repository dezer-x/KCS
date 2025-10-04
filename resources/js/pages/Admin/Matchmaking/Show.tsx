import { type SharedData } from '@/types';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { useRef } from 'react';
import AdminNavbar from '@/components/AdminNavbar';
import { 
  FaArrowLeft, 
  FaEdit, 
  FaTrash, 
  FaMap, 
  FaServer,
  FaGlobe,
  FaGamepad,
  FaUsers,
  FaClock,
  FaPlay,
  FaPause,
  FaCheckCircle,
  FaTimesCircle
} from 'react-icons/fa';

interface MatchmakingServer {
  id: number;
  name: string;
  map_name: string;
  map_image?: string;
  description?: string;
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
  created_at: string;
  updated_at: string;
}

interface AdminMatchmakingShowProps extends SharedData {
  server: MatchmakingServer;
}

export default function AdminMatchmakingShow() {
  const { auth, server } = usePage<AdminMatchmakingShowProps>().props;
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

  const handleDelete = () => {
    if (server.is_occupied) {
      alert('Cannot delete server that is currently in a match!');
      return;
    }

    if (confirm('Are you sure you want to delete this matchmaking server?')) {
      router.delete(`/admin/matchmaking/${server.id}`, {
        onSuccess: () => {
          console.log('Server deleted successfully');
        },
        onError: (errors) => {
          console.error('Error deleting server:', errors);
        }
      });
    }
  };

  const handleEndMatch = () => {
    if (confirm('Are you sure you want to end this match?')) {
      router.patch(`/admin/matchmaking/${server.id}/end-match`, {}, {
        onSuccess: () => {
          console.log('Match ended successfully');
        },
        onError: (errors) => {
          console.error('Error ending match:', errors);
        }
      });
    }
  };

  const getServerStatus = () => {
    if (!server.is_active) return { text: 'INACTIVE', color: 'bg-red-600/20 text-red-400', icon: FaTimesCircle };
    if (server.is_occupied) return { text: 'IN MATCH', color: 'bg-blue-600/20 text-blue-400', icon: FaPlay };
    if (server.current_players > 0) return { text: 'WAITING', color: 'bg-yellow-600/20 text-yellow-400', icon: FaClock };
    return { text: 'AVAILABLE', color: 'bg-green-600/20 text-green-400', icon: FaCheckCircle };
  };

  const status = getServerStatus();
  const StatusIcon = status.icon;

  return (
    <>
      <Head title={server.name}>
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
                  {server.name}
                </h1>
                <p className="text-gray-300 text-lg font-['Trebuchet']">
                  Matchmaking Server Details
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <Link
                  href="/admin/matchmaking"
                  className="font-['FACERG'] text-[#f79631] text-xl font-bold uppercase tracking-wider hover:text-yellow-300 transition-colors flex items-center space-x-2"
                  onMouseEnter={playHoverSound}
                >
                  <FaArrowLeft className="w-5 h-5" />
                  <span>Back to Servers</span>
                </Link>
                <Link
                  href={`/admin/matchmaking/${server.id}/edit`}
                  className="px-4 py-2 bg-[#f79631] hover:bg-[#f79631]/80 text-black font-['FACERG'] font-bold uppercase tracking-wider transition-colors flex items-center space-x-2"
                  onMouseEnter={playHoverSound}
                >
                  <FaEdit className="w-4 h-4" />
                  <span>Edit</span>
                </Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Server Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <div className="bg-black/20 bg-opacity-60 border-1 border-[#f79631]/20 rounded p-6">
                <h2 className="font-['FACERG'] text-[#f79631] text-2xl font-bold uppercase tracking-wider mb-6 flex items-center">
                  <FaServer className="w-6 h-6 mr-3" />
                  Server Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-300 font-['Trebuchet'] font-medium mb-2">
                      Server Name
                    </label>
                    <p className="text-white font-['Trebuchet'] text-lg">{server.name}</p>
                  </div>

                  <div>
                    <label className="block text-gray-300 font-['Trebuchet'] font-medium mb-2">
                      Map Name
                    </label>
                    <p className="text-white font-['Trebuchet'] text-lg">{server.map_name}</p>
                  </div>

                  <div>
                    <label className="block text-gray-300 font-['Trebuchet'] font-medium mb-2">
                      IP Address
                    </label>
                    <p className="text-white font-['Trebuchet'] text-lg">{server.ip_address}</p>
                  </div>

                  <div>
                    <label className="block text-gray-300 font-['Trebuchet'] font-medium mb-2">
                      Port
                    </label>
                    <p className="text-white font-['Trebuchet'] text-lg">{server.port}</p>
                  </div>

                  <div>
                    <label className="block text-gray-300 font-['Trebuchet'] font-medium mb-2">
                      Max Players
                    </label>
                    <p className="text-white font-['Trebuchet'] text-lg">{server.max_players}</p>
                  </div>

                  <div>
                    <label className="block text-gray-300 font-['Trebuchet'] font-medium mb-2">
                      Current Players
                    </label>
                    <p className="text-white font-['Trebuchet'] text-lg">{server.current_players}</p>
                  </div>
                </div>

                {server.description && (
                  <div className="mt-6">
                    <label className="block text-gray-300 font-['Trebuchet'] font-medium mb-2">
                      Description
                    </label>
                    <p className="text-gray-300 font-['Trebuchet']">{server.description}</p>
                  </div>
                )}
              </div>

              {/* Map Image */}
              {server.map_image && (
                <div className="bg-black/20 bg-opacity-60 border-1 border-[#f79631]/20 rounded p-6">
                  <h2 className="font-['FACERG'] text-[#f79631] text-2xl font-bold uppercase tracking-wider mb-6 flex items-center">
                    <FaMap className="w-6 h-6 mr-3" />
                    Map Preview
                  </h2>
                  <img
                    src={`/maps/${server.map_image}`}
                    alt={server.map_name}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
              )}

              {/* Match Information */}
              {server.is_occupied && (
                <div className="bg-black/20 bg-opacity-60 border-1 border-[#f79631]/20 rounded p-6">
                  <h2 className="font-['FACERG'] text-[#f79631] text-2xl font-bold uppercase tracking-wider mb-6 flex items-center">
                    <FaGamepad className="w-6 h-6 mr-3" />
                    Current Match
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-300 font-['Trebuchet'] font-medium mb-2">
                        Match ID
                      </label>
                      <p className="text-white font-['Trebuchet'] text-lg font-mono">{server.match_id}</p>
                    </div>

                    <div>
                      <label className="block text-gray-300 font-['Trebuchet'] font-medium mb-2">
                        Match Started
                      </label>
                      <p className="text-white font-['Trebuchet'] text-lg">
                        {server.match_started_at ? new Date(server.match_started_at).toLocaleString() : 'Unknown'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-gray-300 font-['Trebuchet'] font-medium mb-2">
                        Team 1 ID
                      </label>
                      <p className="text-white font-['Trebuchet'] text-lg font-mono">{server.occupied_by_team_1 || 'N/A'}</p>
                    </div>

                    <div>
                      <label className="block text-gray-300 font-['Trebuchet'] font-medium mb-2">
                        Team 2 ID
                      </label>
                      <p className="text-white font-['Trebuchet'] text-lg font-mono">{server.occupied_by_team_2 || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <button
                      onClick={handleEndMatch}
                      className="px-6 py-3 bg-red-600/20 text-red-400 hover:bg-red-600/30 hover:text-red-300 font-['FACERG'] font-bold uppercase tracking-wider transition-colors flex items-center space-x-2"
                      onMouseEnter={playHoverSound}
                    >
                      <FaPause className="w-5 h-5" />
                      <span>End Match</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Status Card */}
              <div className="bg-black/20 bg-opacity-60 border-1 border-[#f79631]/20 rounded p-6">
                <h3 className="font-['FACERG'] text-[#f79631] text-xl font-bold uppercase tracking-wider mb-4 flex items-center">
                  <StatusIcon className="w-5 h-5 mr-2" />
                  Server Status
                </h3>
                <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-bold ${status.color}`}>
                  {status.text}
                </div>
              </div>

              {/* Connection Info */}
              <div className="bg-black/20 bg-opacity-60 border-1 border-[#f79631]/20 rounded p-6">
                <h3 className="font-['FACERG'] text-[#f79631] text-xl font-bold uppercase tracking-wider mb-4 flex items-center">
                  <FaGlobe className="w-5 h-5 mr-2" />
                  Connection
                </h3>
                <div className="space-y-2">
                  <p className="text-gray-300 font-['Trebuchet']">
                    <span className="text-gray-400">IP:</span> {server.ip_address}
                  </p>
                  <p className="text-gray-300 font-['Trebuchet']">
                    <span className="text-gray-400">Port:</span> {server.port}
                  </p>
                  <p className="text-gray-300 font-['Trebuchet']">
                    <span className="text-gray-400">Connect:</span> {server.ip_address}:{server.port}
                  </p>
                </div>
              </div>

              {/* Player Info */}
              <div className="bg-black/20 bg-opacity-60 border-1 border-[#f79631]/20 rounded p-6">
                <h3 className="font-['FACERG'] text-[#f79631] text-xl font-bold uppercase tracking-wider mb-4 flex items-center">
                  <FaUsers className="w-5 h-5 mr-2" />
                  Players
                </h3>
                <div className="space-y-2">
                  <p className="text-gray-300 font-['Trebuchet']">
                    <span className="text-gray-400">Current:</span> {server.current_players}
                  </p>
                  <p className="text-gray-300 font-['Trebuchet']">
                    <span className="text-gray-400">Maximum:</span> {server.max_players}
                  </p>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                    <div 
                      className="bg-[#f79631] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(server.current_players / server.max_players) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="bg-black/20 bg-opacity-60 border-1 border-[#f79631]/20 rounded p-6">
                <h3 className="font-['FACERG'] text-[#f79631] text-xl font-bold uppercase tracking-wider mb-4 flex items-center">
                  <FaClock className="w-5 h-5 mr-2" />
                  Timestamps
                </h3>
                <div className="space-y-2">
                  <p className="text-gray-300 font-['Trebuchet'] text-sm">
                    <span className="text-gray-400">Created:</span><br />
                    {new Date(server.created_at).toLocaleString()}
                  </p>
                  <p className="text-gray-300 font-['Trebuchet'] text-sm">
                    <span className="text-gray-400">Updated:</span><br />
                    {new Date(server.updated_at).toLocaleString()}
                  </p>
                  {server.match_ended_at && (
                    <p className="text-gray-300 font-['Trebuchet'] text-sm">
                      <span className="text-gray-400">Last Match Ended:</span><br />
                      {new Date(server.match_ended_at).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="bg-black/20 bg-opacity-60 border-1 border-[#f79631]/20 rounded p-6">
                <h3 className="font-['FACERG'] text-[#f79631] text-xl font-bold uppercase tracking-wider mb-4">
                  Actions
                </h3>
                <div className="space-y-3">
                  <Link
                    href={`/admin/matchmaking/${server.id}/edit`}
                    className="w-full px-4 py-2 bg-[#f79631] hover:bg-[#f79631]/80 text-black font-['FACERG'] font-bold uppercase tracking-wider transition-colors flex items-center justify-center space-x-2"
                    onMouseEnter={playHoverSound}
                  >
                    <FaEdit className="w-4 h-4" />
                    <span>Edit Server</span>
                  </Link>
                  
                  <button
                    onClick={handleDelete}
                    disabled={server.is_occupied}
                    className={`w-full px-4 py-2 font-['FACERG'] font-bold uppercase tracking-wider transition-colors flex items-center justify-center space-x-2 ${
                      server.is_occupied
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-red-600/20 text-red-400 hover:bg-red-600/30 hover:text-red-300'
                    }`}
                    onMouseEnter={playHoverSound}
                    title={server.is_occupied ? 'Cannot delete server in match' : 'Delete server'}
                  >
                    <FaTrash className="w-4 h-4" />
                    <span>Delete Server</span>
                  </button>
                </div>
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
