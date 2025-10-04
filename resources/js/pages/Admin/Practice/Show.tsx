import { type SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
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
  FaCalendarAlt,
  FaClock,
  FaToggleOn,
  FaToggleOff
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

interface AdminPracticeShowProps extends SharedData {
  server: PracticeServer;
}

export default function AdminPracticeShow() {
  const { auth, server } = usePage<AdminPracticeShowProps>().props;
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
    if (confirm('Are you sure you want to delete this practice server? This action cannot be undone.')) {
      router.delete(`/admin/practice/${server.id}`);
    }
  };

  const toggleServerStatus = () => {
    router.patch(`/admin/practice/${server.id}`, {
      is_active: !server.is_active
    });
  };

  return (
    <>
      <Head title={server.name}>
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
                  Practice Server Details
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <Link
                  href="/admin/practice"
                  className="font-['FACERG'] text-[#f79631] text-xl font-bold uppercase tracking-wider hover:text-yellow-300 transition-colors flex items-center space-x-2"
                  onMouseEnter={playHoverSound}
                >
                  <FaArrowLeft className="w-5 h-5" />
                  <span>Back to Servers</span>
                </Link>
                <Link
                  href={`/admin/practice/${server.id}/edit`}
                  className="bg-[#f79631] hover:bg-[#f79631]/80 text-black font-['FACERG'] font-bold uppercase tracking-wider px-6 py-3 rounded-lg transition-all duration-200 flex items-center space-x-2"
                  onMouseEnter={playHoverSound}
                >
                  <FaEdit className="w-5 h-5" />
                  <span>Edit</span>
                </Link>
              </div>
            </div>
          </div>

          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Server Image and Status */}
              <div className="lg:col-span-2">
                <div className="bg-black/20 bg-opacity-60 border-1 border-[#f79631]/20 rounded p-6 mb-6">
                  <h2 className="font-['FACERG'] text-[#f79631] text-2xl font-bold uppercase tracking-wider mb-6 flex items-center">
                    <FaMap className="w-6 h-6 mr-3" />
                    Map Preview
                  </h2>
                  
                  <div className="relative">
                    {server.map_image ? (
                      <img
                        src={`/maps/${server.map_image}`}
                        alt={server.map_name}
                        className="w-full h-64 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-64 bg-gray-800 rounded-lg flex items-center justify-center">
                        <FaMap className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                    <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-bold ${
                      server.is_active 
                        ? 'bg-green-600/20 text-green-400' 
                        : 'bg-red-600/20 text-red-400'
                    }`}>
                      {server.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </div>
                  </div>
                </div>

                {/* Server Information */}
                <div className="bg-black/20 bg-opacity-60 border-1 border-[#f79631]/20 rounded p-6">
                  <h2 className="font-['FACERG'] text-[#f79631] text-2xl font-bold uppercase tracking-wider mb-6 flex items-center">
                    <FaServer className="w-6 h-6 mr-3" />
                    Server Information
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-400 font-['Trebuchet'] font-medium mb-1">
                        Server Name
                      </label>
                      <p className="text-white text-xl font-['Trebuchet']">{server.name}</p>
                    </div>

                    <div>
                      <label className="block text-gray-400 font-['Trebuchet'] font-medium mb-1">
                        Map Name
                      </label>
                      <p className="text-white text-lg font-['Trebuchet']">{server.map_name}</p>
                    </div>

                    <div>
                      <label className="block text-gray-400 font-['Trebuchet'] font-medium mb-1">
                        Connection String
                      </label>
                      <p className="text-[#f79631] text-lg font-['Trebuchet'] font-mono">
                        {server.ip_address}:{server.port}
                      </p>
                    </div>

                    {server.description && (
                      <div>
                        <label className="block text-gray-400 font-['Trebuchet'] font-medium mb-1">
                          Description
                        </label>
                        <p className="text-gray-300 font-['Trebuchet']">{server.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Server Status */}
                <div className="bg-black/20 bg-opacity-60 border-1 border-[#f79631]/20 rounded p-6">
                  <h3 className="font-['FACERG'] text-[#f79631] text-xl font-bold uppercase tracking-wider mb-4 flex items-center">
                    <FaGamepad className="w-5 h-5 mr-2" />
                    Server Status
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 font-['Trebuchet']">Status</span>
                      <button
                        onClick={toggleServerStatus}
                        className={`flex items-center space-x-2 px-3 py-1 rounded text-sm font-bold transition-colors ${
                          server.is_active
                            ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                            : 'bg-red-600/20 text-red-400 hover:bg-red-600/30'
                        }`}
                        onMouseEnter={playHoverSound}
                      >
                        {server.is_active ? (
                          <FaToggleOn className="w-4 h-4" />
                        ) : (
                          <FaToggleOff className="w-4 h-4" />
                        )}
                        <span>{server.is_active ? 'Active' : 'Inactive'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Server Details */}
                <div className="bg-black/20 bg-opacity-60 border-1 border-[#f79631]/20 rounded p-6">
                  <h3 className="font-['FACERG'] text-[#f79631] text-xl font-bold uppercase tracking-wider mb-4 flex items-center">
                    <FaGlobe className="w-5 h-5 mr-2" />
                    Connection Details
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-gray-400 font-['Trebuchet'] text-sm mb-1">
                        IP Address
                      </label>
                      <p className="text-white font-['Trebuchet'] font-mono">{server.ip_address}</p>
                    </div>
                    
                    <div>
                      <label className="block text-gray-400 font-['Trebuchet'] text-sm mb-1">
                        Port
                      </label>
                      <p className="text-white font-['Trebuchet'] font-mono">{server.port}</p>
                    </div>
                  </div>
                </div>

                {/* Timestamps */}
                <div className="bg-black/20 bg-opacity-60 border-1 border-[#f79631]/20 rounded p-6">
                  <h3 className="font-['FACERG'] text-[#f79631] text-xl font-bold uppercase tracking-wider mb-4 flex items-center">
                    <FaCalendarAlt className="w-5 h-5 mr-2" />
                    Timestamps
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-gray-400 font-['Trebuchet'] text-sm mb-1">
                        Created
                      </label>
                      <p className="text-white font-['Trebuchet'] text-sm">
                        {new Date(server.created_at).toLocaleDateString()} at {new Date(server.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-gray-400 font-['Trebuchet'] text-sm mb-1">
                        Last Updated
                      </label>
                      <p className="text-white font-['Trebuchet'] text-sm">
                        {new Date(server.updated_at).toLocaleDateString()} at {new Date(server.updated_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="bg-black/20 bg-opacity-60 border-1 border-[#f79631]/20 rounded p-6">
                  <h3 className="font-['FACERG'] text-[#f79631] text-xl font-bold uppercase tracking-wider mb-4">
                    Actions
                  </h3>
                  
                  <div className="space-y-3">
                    <Link
                      href={`/admin/practice/${server.id}/edit`}
                      className="w-full bg-[#f79631] hover:bg-[#f79631]/80 text-black font-['FACERG'] font-bold uppercase tracking-wider px-4 py-3 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
                      onMouseEnter={playHoverSound}
                    >
                      <FaEdit className="w-4 h-4" />
                      <span>Edit Server</span>
                    </Link>
                    
                    <button
                      onClick={handleDelete}
                      className="w-full bg-red-600 hover:bg-red-500 text-white font-['FACERG'] font-bold uppercase tracking-wider px-4 py-3 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
                      onMouseEnter={playHoverSound}
                    >
                      <FaTrash className="w-4 h-4" />
                      <span>Delete Server</span>
                    </button>
                  </div>
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
