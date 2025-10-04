import { type SharedData } from '@/types';
import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import { useRef, useState } from 'react';
import AdminNavbar from '@/components/AdminNavbar';
import { 
  FaArrowLeft, 
  FaSave, 
  FaMap, 
  FaServer,
  FaGlobe,
  FaGamepad,
  FaFileAlt
} from 'react-icons/fa';

interface AdminPracticeCreateProps extends SharedData {
  mapImages: string[];
}

export default function AdminPracticeCreate() {
  const { auth, mapImages } = usePage<AdminPracticeCreateProps>().props;
  const audioRef = useRef<HTMLAudioElement>(null);
  const [selectedMapImage, setSelectedMapImage] = useState<string>('');

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
    name: '',
    map_name: '',
    map_image: '',
    description: '',
    ip_address: '',
    port: 27015,
    is_active: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/admin/practice');
  };

  return (
    <>
      <Head title="Create Practice Server">
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
                  Create Practice Server
                </h1>
                <p className="text-gray-300 text-lg font-['Trebuchet']">
                  Add a new practice server to the platform
                </p>
              </div>
              <Link
                href="/admin/practice"
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
              {/* Basic Information */}
              <div className="bg-black/20 bg-opacity-60 border-1 border-[#f79631]/20 rounded p-6">
                <h2 className="font-['FACERG'] text-[#f79631] text-2xl font-bold uppercase tracking-wider mb-6 flex items-center">
                  <FaServer className="w-6 h-6 mr-3" />
                  Basic Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-300 font-['Trebuchet'] font-medium mb-2">
                      Server Name *
                    </label>
                    <input
                      type="text"
                      value={data.name}
                      onChange={(e) => setData('name', e.target.value)}
                      className="w-full px-4 py-3 bg-black/40 border border-[#f79631]/30  text-white placeholder-gray-400 focus:border-[#f79631] focus:outline-none transition-colors"
                      placeholder="Enter server name"
                      required
                    />
                    {errors.name && (
                      <p className="text-red-400 text-sm mt-1 font-['Trebuchet']">{errors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-300 font-['Trebuchet'] font-medium mb-2">
                      Map Name *
                    </label>
                    <input
                      type="text"
                      value={data.map_name}
                      onChange={(e) => setData('map_name', e.target.value)}
                      className="w-full px-4 py-3 bg-black/40 border border-[#f79631]/30  text-white placeholder-gray-400 focus:border-[#f79631] focus:outline-none transition-colors"
                      placeholder="e.g., de_dust2, de_mirage"
                      required
                    />
                    {errors.map_name && (
                      <p className="text-red-400 text-sm mt-1 font-['Trebuchet']">{errors.map_name}</p>
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-gray-300 font-['Trebuchet'] font-medium mb-2">
                    Description
                  </label>
                  <textarea
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-black/40 border border-[#f79631]/30   text-white placeholder-gray-400 focus:border-[#f79631] focus:outline-none transition-colors resize-none"
                    placeholder="Describe the practice server..."
                  />
                  {errors.description && (
                    <p className="text-red-400 text-sm mt-1 font-['Trebuchet']">{errors.description}</p>
                  )}
                </div>
              </div>

              {/* Map Selection */}
              <div className="bg-black/20 bg-opacity-60 border-1 border-[#f79631]/20 rounded p-6">
                <h2 className="font-['FACERG'] text-[#f79631] text-2xl font-bold uppercase tracking-wider mb-6 flex items-center">
                  <FaMap className="w-6 h-6 mr-3" />
                  Map Selection
                </h2>

                <div>
                  <label className="block text-gray-300 font-['Trebuchet'] font-medium mb-4">
                    Choose Map Image
                  </label>
                  
                  {mapImages.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <FaMap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="font-['Trebuchet']">No map images found in /public/maps/</p>
                      <p className="text-sm mt-2">Upload map images to the public/maps directory</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {mapImages.map((image) => (
                        <div
                          key={image}
                          className={`relative cursor-pointer  overflow-hidden border-2 transition-all duration-200 ${
                            selectedMapImage === image
                              ? 'border-[#f79631]'
                              : 'border-gray-600 hover:border-[#f79631]/50'
                          }`}
                          onClick={() => {
                            setSelectedMapImage(image);
                            setData('map_image', image);
                          }}
                        >
                          <img
                            src={`/maps/${image}`}
                            alt={image}
                            className="w-full h-20 object-cover"
                          />
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <FaMap className="w-6 h-6 text-white" />
                          </div>
                          {selectedMapImage === image && (
                            <div className="absolute top-1 right-1 w-4 h-4 bg-[#f79631] rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {errors.map_image && (
                    <p className="text-red-400 text-sm mt-2 font-['Trebuchet']">{errors.map_image}</p>
                  )}
                </div>
              </div>

              {/* Server Configuration */}
              <div className="bg-black/20 bg-opacity-60 border-1 border-[#f79631]/20 rounded p-6">
                <h2 className="font-['FACERG'] text-[#f79631] text-2xl font-bold uppercase tracking-wider mb-6 flex items-center">
                  <FaGlobe className="w-6 h-6 mr-3" />
                  Server Configuration
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      Server is active (visible to users)
                    </span>
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-4">
                <Link
                  href="/admin/practice"
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
                  <span>{processing ? 'Creating...' : 'Create Server'}</span>
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
