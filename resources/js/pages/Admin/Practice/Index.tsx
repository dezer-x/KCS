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
  FaMap,
  FaGlobe,
  FaGamepad
} from 'react-icons/fa';

interface PracticeServer {
  id: number;
  name: string;
  map_name: string;
  map_image?: string;
  description?: string;
  ip_address: string;
  port: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AdminPracticeIndexProps extends SharedData {
  servers: PracticeServer[];
  mapImages: string[];
}

export default function AdminPracticeIndex() {
  const { auth, servers, mapImages } = usePage<AdminPracticeIndexProps>().props;
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
    if (confirm('Are you sure you want to delete this practice server?')) {
      console.log('User confirmed deletion, sending delete request...');
      router.delete(`/admin/practice/${id}`, {
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
    router.patch(`/admin/practice/${id}/toggle`, {
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

  return (
    <>
      <Head title="Practice Servers">
        <link rel="preconnect" href="https://fonts.bunny.net" />
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
      </Head>

      <div className="bg-black/30 min-h-screen backdrop-blur-sm relative">
        {/* Admin Navigation */}
        <AdminNavbar 
          currentPage="practice"
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
                  Practice Servers
                </h1>
                <p className="text-gray-300 text-lg font-['Trebuchet']">
                  Manage practice servers and maps
                </p>
              </div>
              <Link
                href="/admin/practice/create"
                className="bg-[#f79631] hover:bg-[#f79631]/80 text-black font-['FACERG'] font-bold uppercase tracking-wider px-6 py-3  transition-all duration-200 flex items-center space-x-2"
                onMouseEnter={playHoverSound}
              >
                <FaPlus className="w-5 h-5" />
                <span>Create Server</span>
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                    Unique Maps
                  </h3>
                  <p className="font-['FACERG'] text-white text-3xl font-bold">
                    {new Set(servers.map(server => server.map_name)).size}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Servers List */}
          <div className="bg-black/20 bg-opacity-60 border-1 border-[#f79631]/20  p-6">
            <h2 className="font-['FACERG'] text-[#f79631] text-2xl font-bold uppercase tracking-wider mb-6">
              Practice Servers
            </h2>

            {servers.length === 0 ? (
              <div className="text-center py-12">
                <FaServer className="w-16 h-16 text-gray-400 mx-auto mb-4 opacity-50" />
                <h3 className="text-xl text-gray-400 font-['Trebuchet'] mb-2">No Practice Servers</h3>
                <p className="text-gray-500 font-['Trebuchet'] mb-6">
                  Create your first practice server to get started
                </p>
                <Link
                  href="/admin/practice/create"
                  className="bg-[#f79631] hover:bg-[#f79631]/80 text-black font-['FACERG'] font-bold uppercase tracking-wider px-6 py-3 rounded-lg transition-all duration-200 inline-flex items-center space-x-2"
                  onMouseEnter={playHoverSound}
                >
                  <FaPlus className="w-5 h-5" />
                  <span>Create Server</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {servers.map((server) => (
                  <div
                    key={server.id}
                    className="bg-black/30 border border-[#f79631]/20  p-6 hover:border-[#f79631]/40 transition-all duration-200"
                  >
                    {/* Server Image */}
                    <div className="relative mb-4">
                      {server.map_image ? (
                        <img
                          src={`/maps/${server.map_image}`}
                          alt={server.map_name}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-32 bg-gray-800 rounded-lg flex items-center justify-center">
                          <FaMap className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold ${
                        server.is_active 
                          ? 'bg-green-600/20 text-green-400' 
                          : 'bg-red-600/20 text-red-400'
                      }`}>
                        {server.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </div>
                    </div>

                    {/* Server Info */}
                    <div className="mb-4">
                      <h3 className="font-['FACERG'] text-white text-xl font-bold mb-2">
                        {server.name}
                      </h3>
                      <p className="text-gray-300 font-['Trebuchet'] text-sm mb-2">
                        <FaMap className="w-4 h-4 inline mr-2" />
                        {server.map_name}
                      </p>
                      <p className="text-gray-300 font-['Trebuchet'] text-sm mb-2">
                        <FaGlobe className="w-4 h-4 inline mr-2" />
                        {server.ip_address}:{server.port}
                      </p>
                      {server.description && (
                        <p className="text-gray-400 font-['Trebuchet'] text-sm">
                          {server.description}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-2">
                        <Link
                          href={`/admin/practice/${server.id}`}
                          className="p-2 text-orange-400 rounded transition-colors"
                          onMouseEnter={playHoverSound}
                          title="View Details"
                        >
                          <FaEye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/admin/practice/${server.id}/edit`}
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
                      <button
                        onClick={() => toggleServerStatus(server.id, server.is_active)}
                        className={`px-3 py-1  text-xs font-bold transition-colors ${
                          server.is_active
                            ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
                            : 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                        }`}
                        onMouseEnter={playHoverSound}
                      >
                        {server.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                ))}
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
