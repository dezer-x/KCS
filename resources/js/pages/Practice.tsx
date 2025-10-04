import { type SharedData } from '@/types';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { useRef } from 'react';

interface PracticeServer {
    id: number;
    name: string;
    map_name: string;
    map_image: string | null;
    description: string | null;
    ip_address: string;
    port: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface PracticeProps extends SharedData {
    servers: PracticeServer[];
}

export default function Practice() {
    const { auth, servers } = usePage<PracticeProps>().props;
    const user = auth?.user;
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

    const connectToServer = (ip: string, port: number) => {
        // Steam protocol URL format: steam://connect/IP:PORT
        // This will open Steam and attempt to connect to the server
        const steamConnectUrl = `steam://connect/${ip}:${port}`;
        window.open(steamConnectUrl, '_blank');
    };

    const getMapImageUrl = (mapImage: string | null, mapName: string) => {
        if (mapImage) {
            return `/maps/${mapImage}`;
        }
        // Fallback to map name based image
        const cleanName = mapName.replace('de_', '').replace('cs_', '');
        return `/maps/${cleanName.charAt(0).toUpperCase() + cleanName.slice(1)}.png`;
    };

    return (
        <>
            <Head title="Practice">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
            </Head>

            <div className="bg-black/30 min-h-screen backdrop-blur-sm relative">
                {/* Header */}
                <div className="p-4">
                    <div className="flex items-center justify-between">
                        <Link href="/" className="font-['FACERG'] text-[#f79631] text-2xl font-bold uppercase tracking-wider hover:text-yellow-300 transition-colors">
                            ← BACK
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="font-['FACERG'] text-[#f79631] text-xl font-bold uppercase tracking-wider hover:text-yellow-300 transition-colors"
                            onMouseEnter={playHoverSound}
                        >
                            LOGOUT
                        </button>
                    </div>
                </div>

                <div className="container mx-auto px-4 py-8">
                    {/* Page Header */}
                    <div className="relative bg-black/5 bg-opacity-60 border-1 border-[#f79631]/20  p-6 mb-8 overflow-hidden">
                        <div
                            className="absolute inset-0 bg-right bg-center bg-no-repeat opacity-20"
                            style={{
                                backgroundImage: 'url("/images/cs.png")',
                            }}
                        ></div>
                        <div className="absolute inset-0 bg-black/40"></div>
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <h1 className="font-['FACERG'] text-[#f79631] text-4xl font-bold uppercase tracking-wider">
                                    PRACTICE SERVERS
                                </h1>
                                <p className="text-gray-300 text-lg font-['Trebuchet']">
                                    Join our practice servers to improve your skills
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-gray-400 uppercase tracking-wider font-['Trebuchet'] mb-2">AVAILABLE SERVERS</div>
                                <div className="text-4xl font-bold text-[#f79631] font-['FACERG']">
                                    {servers.length}
                                </div>
                                <div className="text-xs text-gray-500 font-['Trebuchet'] mt-1">
                                    Active servers
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Servers Grid */}
                    {servers.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {servers.map((server) => (
                                <div key={server.id} className="bg-black/20 bg-opacity-60 border-1 border-[#f79631]/20  overflow-hidden hover:bg-black/30 transition-colors">
                                    {/* Server Image */}
                                    <div className="relative h-48 bg-gray-800">
                                        <img
                                            src={getMapImageUrl(server.map_image, server.map_name)}
                                            alt={server.map_name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                // Fallback to a default image if the map image doesn't exist
                                                e.currentTarget.src = '/images/default-map.png';
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-black/40"></div>
                                        <div className="absolute top-4 left-4">
                                            <span className="bg-[#f79631] text-black px-3 py-1 rounded-full text-sm font-bold font-['FACERG'] uppercase tracking-wider">
                                                {server.map_name.replace('de_', '').replace('cs_', '').toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="absolute top-4 right-4">
                                            <span className={`px-3 py-1 rounded-md text-sm font-bold font-['Trebuchet'] ${
                                                server.is_active 
                                                    ? 'bg-green-500 text-white' 
                                                    : 'bg-red-500 text-white'
                                            }`}>
                                                {server.is_active ? 'ONLINE' : 'OFFLINE'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Server Info */}
                                    <div className="p-6">
                                        <h3 className="font-['FACERG'] text-[#f79631] text-xl font-bold uppercase tracking-wider mb-2">
                                            {server.name}
                                        </h3>
                                        
                                        {server.description && (
                                            <p className="text-gray-300 text-sm font-['Trebuchet'] mb-4">
                                                {server.description}
                                            </p>
                                        )}

                                        {/* Server Details */}
                                        <div className="space-y-2 mb-6">
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-400 text-sm font-['Trebuchet']">Map:</span>
                                                <span className="text-white text-sm font-['Trebuchet'] capitalize">
                                                    {server.map_name.replace('de_', '').replace('cs_', '')}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-400 text-sm font-['Trebuchet']">IP Address:</span>
                                                <span className="text-white text-sm font-['Trebuchet'] font-mono">
                                                    {server.ip_address}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-400 text-sm font-['Trebuchet']">Port:</span>
                                                <span className="text-white text-sm font-['Trebuchet'] font-mono">
                                                    {server.port}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-400 text-sm font-['Trebuchet']">Connection:</span>
                                                <span className="text-white text-sm font-['Trebuchet'] font-mono">
                                                    {server.ip_address}:{server.port}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Connect Button */}
                                        <button
                                            onClick={() => connectToServer(server.ip_address, server.port)}
                                            disabled={!server.is_active}
                                            className={`w-full py-3 px-4  font-['FACERG'] text-lg font-bold uppercase tracking-wider transition-colors ${
                                                server.is_active
                                                    ? 'bg-[#f79631] text-black hover:bg-yellow-300'
                                                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                            }`}
                                            onMouseEnter={playHoverSound}
                                        >
                                            {server.is_active ? 'CONNECT TO SERVER' : 'SERVER OFFLINE'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-black/20 bg-opacity-60 border-1 border-[#f79631]/20  p-8">
                            <div className="text-center">
                                <h3 className="font-['FACERG'] text-[#f79631] text-2xl font-bold uppercase tracking-wider mb-4">
                                    NO PRACTICE SERVERS
                                </h3>
                                <p className="text-gray-400 font-['Trebuchet'] text-lg">
                                    No practice servers are currently available
                                </p>
                                <p className="text-gray-500 font-['Trebuchet'] text-sm mt-2">
                                    Check back later or contact an administrator
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Instructions Section */}
                    <div className="mt-8 bg-black/20 bg-opacity-60 border-1 border-[#f79631]/20  p-6">
                        <h3 className="font-['FACERG'] text-[#f79631] text-2xl font-bold uppercase tracking-wider mb-4">
                            HOW TO CONNECT
                        </h3>
                        <div
                            className="w-[50%] h-0.5 my-4 rounded-full"
                            style={{
                                background: "linear-gradient(to right,rgba(247, 151, 49, 0.45) 0%, rgba(247, 151, 49, 0.25) 50%, rgba(247,151,49,0) 100%)"
                            }}
                        ></div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-[#f79631] rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-black text-2xl font-bold">1</span>
                                </div>
                                <h4 className="font-['FACERG'] text-[#f79631] text-lg font-bold uppercase tracking-wider mb-2">
                                    CLICK CONNECT
                                </h4>
                                <p className="text-gray-300 text-sm font-['Trebuchet']">
                                    Click the "CONNECT TO SERVER" button on any active server
                                </p>
                            </div>
                            
                            <div className="text-center">
                                <div className="w-16 h-16 bg-[#f79631] rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-black text-2xl font-bold">2</span>
                                </div>
                                <h4 className="font-['FACERG'] text-[#f79631] text-lg font-bold uppercase tracking-wider mb-2">
                                    STEAM OPENS
                                </h4>
                                <p className="text-gray-300 text-sm font-['Trebuchet']">
                                    Steam will automatically open and connect you to the server
                                </p>
                            </div>
                            
                            <div className="text-center">
                                <div className="w-16 h-16 bg-[#f79631] rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-black text-2xl font-bold">3</span>
                                </div>
                                <h4 className="font-['FACERG'] text-[#f79631] text-lg font-bold uppercase tracking-wider mb-2">
                                    START PRACTICING
                                </h4>
                                <p className="text-gray-300 text-sm font-['Trebuchet']">
                                    Counter-Strike will launch and connect you to the practice server
                                </p>
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
