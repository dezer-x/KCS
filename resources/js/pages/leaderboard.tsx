import { type SharedData } from '@/types';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { useRef, useState, useMemo } from 'react';
import FriendsFilter from '@/components/FriendsFilter';

interface LeaderboardUser {
    rank: number;
    id: number;
    name: string;
    steam_username: string;
    steam_avatar_medium?: string;
    country: string;
    elo: number;
}

interface PaginatedData {
    data: LeaderboardUser[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
}

interface LeaderboardProps extends SharedData {
    globalLeaderboard: PaginatedData;
    localLeaderboard: PaginatedData;
    userCountry: string | null;
    userGlobalRank: number | null;
    userLocalRank: number | null;
    userElo: number;
    activeTab: string;
    search: string;
}

export default function Leaderboard() {
    const { auth, globalLeaderboard, localLeaderboard, userCountry, userGlobalRank, userLocalRank, userElo, activeTab: initialActiveTab, search: initialSearch } = usePage<LeaderboardProps>().props;
    const user = auth?.user;
    const audioRef = useRef<HTMLAudioElement>(null);
    const [activeTab, setActiveTab] = useState<'global' | 'local'>(initialActiveTab as 'global' | 'local');
    const [searchQuery, setSearchQuery] = useState(initialSearch);
    const [isSearching, setIsSearching] = useState(false);

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

    const getRankIcon = (rank: number) => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return `#${rank}`;
    };

    const getRankColor = (rank: number) => {
        if (rank === 1) return 'text-gray-400';
        if (rank === 2) return 'text-gray-400 ';
        if (rank === 3) return 'text-gray-400 ';
        if (rank <= 10) return 'text-gray-400 text-sm';
        if (rank <= 50) return 'text-gray-400 text-sm';
        return 'text-white text-sm';
    };

    const getEloColor = (elo: number) => {
        if (elo >= 2000) return 'text-gray-300';
        if (elo >= 1500) return 'text-gray-300';
        if (elo >= 1000) return 'text-gray-300';
        if (elo >= 500) return 'text-gray-300';
        return 'text-gray-300';
    };

    const currentLeaderboard = activeTab === 'global' ? globalLeaderboard : localLeaderboard;
    const currentUserRank = activeTab === 'global' ? userGlobalRank : userLocalRank;

    const handleTabChange = (tab: 'global' | 'local') => {
        setActiveTab(tab);
        router.get('/leaderboard', {
            tab,
            search: searchQuery,
            page: 1
        }, {
            preserveState: true,
            replace: true
        });
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        setIsSearching(true);

        router.get('/leaderboard', {
            tab: activeTab,
            search: query,
            page: 1
        }, {
            preserveState: true,
            replace: true,
            onFinish: () => setIsSearching(false)
        });
    };

    const handlePageChange = (page: number) => {
        router.get('/leaderboard', {
            tab: activeTab,
            search: searchQuery,
            page
        }, {
            preserveState: true,
            replace: true
        });
    };

    return (
        <>
            <Head title="Leaderboard">
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
                    <div className="relative bg-black/5 bg-opacity-60 border-1 border-[#f79631]/20 rounded p-6 mb-8 overflow-hidden">
                        <div
                            className="absolute inset-0 bg-right bg-center bg-no-repeat opacity-20"
                            style={{
                                backgroundImage: 'url("/images/trophy.webp")',
                            }}
                        ></div>
                        <div className="absolute inset-0 bg-black/40"></div>
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <h1 className="font-['FACERG'] text-[#f79631] text-4xl font-bold uppercase tracking-wider">
                                    LEADERBOARD
                                </h1>
                                <p className="text-gray-300 text-lg font-['Trebuchet']">
                                    Compete with players worldwide and in your country
                                </p>
                            </div>
                            {user && (
                                <div className="text-right">
                                    <div className="text-sm text-gray-400 uppercase tracking-wider font-['Trebuchet'] mb-2">YOUR RANK</div>
                                    <div className="text-4xl font-bold text-[#f79631] font-['FACERG']">
                                        {currentUserRank || 'N/A'}
                                    </div>
                                    <div className="text-xs text-gray-500 font-['Trebuchet'] mt-1">
                                        ELO: {userElo}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex mb-8">
                        <button
                            onClick={() => handleTabChange('global')}
                            className={`px-8 py-4 text-xl font-bold uppercase tracking-wider transition-colors relative ${activeTab === 'global'
                                ? 'text-[#f79631]'
                                : 'text-gray-400 hover:text-[#f79631]'
                                }`}
                            onMouseEnter={playHoverSound}
                            style={{
                                border: 'none',
                                background: 'none',
                            }}
                        >
                            <span className="relative z-10">GLOBAL ({globalLeaderboard.total})</span>
                            {activeTab === 'global' && (
                                <div className="absolute left-1/2 bottom-0 w-16 rounded-full h-1 bg-[#f79631] transform -translate-x-1/2" />
                            )}
                        </button>
                        <button
                            onClick={() => handleTabChange('local')}
                            className={`px-8 py-4 text-xl font-bold uppercase tracking-wider transition-colors relative ${activeTab === 'local'
                                ? 'text-[#f79631]'
                                : 'text-gray-400 hover:text-[#f79631]'
                                }`}
                            onMouseEnter={playHoverSound}
                            style={{
                                border: 'none',
                                background: 'none',
                            }}
                        >
                            <span className="relative z-10">LOCAL ({userCountry || 'N/A'}) ({localLeaderboard.total})</span>
                            {activeTab === 'local' && (
                                <div className="absolute left-1/2 bottom-0 w-16 rounded-full h-1 bg-[#f79631] transform -translate-x-1/2" />
                            )}
                        </button>
                    </div>

                    {/* Leaderboard Table */}
                    <div className="bg-black/5 bg-opacity-60 border-1 border-[#f79631]/20 rounded">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[#f79631]/20">
                            <h3 className="font-['FACERG'] text-[#f79631] text-2xl font-bold uppercase tracking-wider">
                                {activeTab === 'global' ? 'GLOBAL LEADERBOARD' : `LOCAL LEADERBOARD (${userCountry || 'N/A'})`}
                            </h3>
                            <div className="w-80">
                                <FriendsFilter
                                    onFilterChange={handleSearch}
                                    placeholder="Search players by username, real name, or country..."
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm font-['Trebuchet']">
                                <thead>
                                    <tr className="border-b border-[#f79631]/10">
                                        <th className="text-left py-4 px-6 text-[#f79631] font-bold uppercase tracking-wider">RANK</th>
                                        <th className="text-left py-4 px-6 text-[#f79631] font-bold uppercase tracking-wider">PLAYER</th>
                                        <th className="text-left py-4 px-6 text-[#f79631] font-bold uppercase tracking-wider">COUNTRY</th>
                                        <th className="text-right py-4 px-6 text-[#f79631] font-bold uppercase tracking-wider">ELO RATING</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentLeaderboard.data.length > 0 ? (
                                        currentLeaderboard.data.map((player, index) => (
                                            <tr key={player.id} className="border-b border-[#f79631]/5 hover:bg-black/20 transition-colors">
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center space-x-3">
                                                        <span className={`text-2xl font-bold ${getRankColor(player.rank)}`}>
                                                            {getRankIcon(player.rank)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center space-x-4">
                                                        {player.steam_avatar_medium && (
                                                            <img
                                                                src={player.steam_avatar_medium}
                                                                alt="Avatar"
                                                                className="w-12 h-12 rounded border border-[#f79631]/20"
                                                            />
                                                        )}
                                                        <div>
                                                            <div className="text-white font-semibold text-lg">
                                                                {player.name}
                                                            </div>
                                                            <div className="text-gray-400 text-sm">
                                                                {player.steam_username}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className="text-gray-300 font-medium">
                                                        {player.country || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <span className={`font-bold text-xl ${getEloColor(player.elo)}`}>
                                                        {player.elo.toLocaleString()}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="py-12 text-center">
                                                <div className="text-gray-400 font-['Trebuchet'] text-lg">
                                                    {activeTab === 'local' && !userCountry
                                                        ? 'Please select your country to view local leaderboard'
                                                        : searchQuery
                                                            ? `No players found matching "${searchQuery}"`
                                                            : 'No players found'
                                                    }
                                                </div>
                                                {searchQuery && (
                                                    <button
                                                        onClick={() => handleSearch('')}
                                                        className="mt-4 px-4 py-2 text-[#f79631] hover:text-yellow-300 text-sm font-['Trebuchet'] transition-colors border border-[#f79631]/20 rounded"
                                                    >
                                                        Clear search
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {currentLeaderboard.last_page > 1 && (
                            <div className="px-6 py-4 border-t border-[#f79631]/20">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-gray-400 font-['Trebuchet']">
                                        Showing {currentLeaderboard.from} to {currentLeaderboard.to} of {currentLeaderboard.total} players
                                        {searchQuery && (
                                            <span className="text-[#f79631] ml-2">
                                                (filtered by "{searchQuery}")
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        {/* Previous Page */}
                                        <button
                                            onClick={() => handlePageChange(currentLeaderboard.current_page - 1)}
                                            disabled={currentLeaderboard.current_page <= 1}
                                            className="px-3 py-2 text-sm font-['Trebuchet'] border border-[#f79631]/30 rounded disabled:opacity-50 disabled:cursor-not-allowed text-[#f79631] hover:bg-[#f79631]/10 disabled:hover:bg-transparent transition-colors"
                                        >
                                            Previous
                                        </button>

                                        {/* Page Numbers */}
                                        <div className="flex items-center space-x-1">
                                            {currentLeaderboard.links.map((link, index) => {
                                                if (link.label === '...') {
                                                    return (
                                                        <span key={index} className="px-3 py-2 text-gray-400">
                                                            ...
                                                        </span>
                                                    );
                                                }

                                                const pageNumber = parseInt(link.label);
                                                if (isNaN(pageNumber)) return null;

                                                return (
                                                    <button
                                                        key={index}
                                                        onClick={() => handlePageChange(pageNumber)}
                                                        className={`px-3 py-2 text-sm font-['Trebuchet'] border rounded transition-colors ${link.active
                                                                ? 'bg-[#f79631] text-black border-[#f79631]'
                                                                : 'border-[#f79631]/30 text-[#f79631] hover:bg-[#f79631]/10'
                                                            }`}
                                                    >
                                                        {pageNumber}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Next Page */}
                                        <button
                                            onClick={() => handlePageChange(currentLeaderboard.current_page + 1)}
                                            disabled={currentLeaderboard.current_page >= currentLeaderboard.last_page}
                                            className="px-3 py-2 text-sm font-['Trebuchet'] border border-[#f79631]/30 rounded disabled:opacity-50 disabled:cursor-not-allowed text-[#f79631] hover:bg-[#f79631]/10 disabled:hover:bg-transparent transition-colors"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Stats Summary */}
                    {currentLeaderboard.data.length > 0 && (
                        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-black/20 bg-opacity-60 border-1 border-[#f79631]/20 rounded p-6">
                                <h3 className="font-['FACERG'] text-[#f79631] text-xl font-bold uppercase tracking-wider">TOTAL PLAYERS</h3>
                                <div
                                    className="w-[20%] h-0.5 my-4 rounded-full"
                                    style={{
                                        background: "linear-gradient(to right,rgba(247, 151, 49, 0.45) 0%, rgba(247, 151, 49, 0.25) 50%, rgba(247,151,49,0) 100%)"
                                    }}
                                ></div>
                                <div className="text-3xl font-bold text-white font-['Trebuchet']">
                                    {currentLeaderboard.total}
                                </div>
                            </div>

                            <div className="bg-black/20 bg-opacity-60 border-1 border-[#f79631]/20 rounded p-6">
                                <h3 className="font-['FACERG'] text-[#f79631] text-xl font-bold uppercase tracking-wider">HIGHEST ELO</h3>
                                <div
                                    className="w-[20%] h-0.5 my-4 rounded-full"
                                    style={{
                                        background: "linear-gradient(to right,rgba(247, 151, 49, 0.45) 0%, rgba(247, 151, 49, 0.25) 50%, rgba(247,151,49,0) 100%)"
                                    }}
                                ></div>
                                <div className="text-3xl font-bold text-yellow-400 font-['Trebuchet']">
                                    {currentLeaderboard.data.length > 0 ? Math.max(...currentLeaderboard.data.map(p => p.elo)).toLocaleString() : '0'}
                                </div>
                            </div>

                            <div className="bg-black/20 bg-opacity-60 border-1 border-[#f79631]/20 rounded p-6">
                                <h3 className="font-['FACERG'] text-[#f79631] text-xl font-bold uppercase tracking-wider">AVERAGE ELO</h3>
                                <div
                                    className="w-[20%] h-0.5 my-4 rounded-full"
                                    style={{
                                        background: "linear-gradient(to right,rgba(247, 151, 49, 0.45) 0%, rgba(247, 151, 49, 0.25) 50%, rgba(247,151,49,0) 100%)"
                                    }}
                                ></div>
                                <div className="text-3xl font-bold text-blue-400 font-['Trebuchet']">
                                    {currentLeaderboard.data.length > 0 ? Math.round(currentLeaderboard.data.reduce((sum, p) => sum + p.elo, 0) / currentLeaderboard.data.length).toLocaleString() : '0'}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <audio ref={audioRef} preload="auto">
                    <source src="/cs2-sound.mp3" type="audio/mpeg" />
                </audio>
            </div>
        </>
    );
}
