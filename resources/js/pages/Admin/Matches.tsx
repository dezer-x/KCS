import { type SharedData } from '@/types';
import { Head, usePage, router } from '@inertiajs/react';
import { useRef, useState, useEffect } from 'react';
import AdminNavbar from '@/components/AdminNavbar';
import FriendsFilter from '@/components/FriendsFilter';
import {
  FaPlay,
  FaClock,
  FaCheckCircle,
  FaBan,
  FaDownload,
  FaTimes
} from 'react-icons/fa';

interface Team {
    id: number;
    name: string;
    elo: number;
}

interface Match {
    id: number;
    match_id: string;
    api_match_id: number;
    server_ip: string;
    server_port: number;
    server_display_name?: string;
    team1_id: number;
    team2_id: number;
    status: string;
    map: string;
    title: string;
    started_at?: string;
    ended_at?: string;
    winner_team_id?: number;
    team1_score?: number;
    team2_score?: number;
    is_finished: boolean;
    is_cancelled: boolean;
    created_at: string;
    team1?: Team;
    team2?: Team;
    winner_team?: Team;
}

interface MatchesProps extends SharedData {
    matches: {
        data: Match[];
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
    counts: {
        all: number;
        active: number;
        pending: number;
        finished: number;
        cancelled: number;
    };
    currentTab: string;
    searchQuery: string;
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function AdminMatches() {
    const { auth, matches, counts, currentTab, searchQuery, flash } = usePage<MatchesProps>().props;
    const audioRef = useRef<HTMLAudioElement>(null);
    const [activeTab, setActiveTab] = useState<string>(currentTab || 'all');
    const [search, setSearch] = useState(searchQuery || '');
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

    useEffect(() => {
        if (showCancelModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [showCancelModal]);

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

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        router.get('/admin/matches', { tab, search }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleSearch = (query: string) => {
        setSearch(query);
        router.get('/admin/matches', { tab: activeTab, search: query }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleDownloadDemo = (match: Match) => {
        window.location.href = `/admin/matches/${match.id}/download-demo`;
    };

    const handleCancelMatch = (match: Match) => {
        setSelectedMatch(match);
        setShowCancelModal(true);
    };

    const confirmCancelMatch = () => {
        if (!selectedMatch) return;

        router.post(`/admin/matches/${selectedMatch.id}/cancel`, {}, {
            onSuccess: () => {
                setShowCancelModal(false);
                setSelectedMatch(null);
            },
            onError: (errors) => {
                console.error('Cancel error:', errors);
            }
        });
    };

    const getStatusBadge = (match: Match) => {
        if (match.is_cancelled) {
            return (
                <span className="px-3 py-1 bg-gray-600/20 text-gray-400 text-xs font-['Trebuchet'] border border-gray-600/30 flex items-center space-x-2">
                    <FaBan className="w-3 h-3" />
                    <span>Cancelled</span>
                </span>
            );
        }
        if (match.is_finished) {
            return (
                <span className="px-3 py-1 bg-green-600/20 text-green-400 text-xs font-['Trebuchet'] border border-green-600/30 flex items-center space-x-2">
                    <FaCheckCircle className="w-3 h-3" />
                    <span>Finished</span>
                </span>
            );
        }
        if (match.started_at) {
            return (
                <span className="px-3 py-1 bg-blue-600/20 text-blue-400 text-xs font-['Trebuchet'] border border-blue-600/30 flex items-center space-x-2">
                    <FaPlay className="w-3 h-3" />
                    <span>Active</span>
                </span>
            );
        }
        return (
            <span className="px-3 py-1 bg-yellow-600/20 text-yellow-400 text-xs font-['Trebuchet'] border border-yellow-600/30 flex items-center space-x-2">
                <FaClock className="w-3 h-3" />
                <span>Pending</span>
            </span>
        );
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString();
    };

    const tabs = [
        { key: 'all', label: 'All Matches', count: counts.all },
        { key: 'active', label: 'Active', count: counts.active },
        { key: 'pending', label: 'Pending', count: counts.pending },
        { key: 'finished', label: 'Finished', count: counts.finished },
        { key: 'cancelled', label: 'Cancelled', count: counts.cancelled },
    ];

    return (
        <>
            <Head title="Match Management">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
            </Head>

            <div className="bg-black/30 min-h-screen backdrop-blur-sm relative">
                <AdminNavbar
                    currentPage="matches"
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
                        <div className="relative z-10">
                            <h1 className="font-['FACERG'] text-[#f79631] text-4xl font-bold uppercase tracking-wider">
                                MATCH MANAGEMENT
                            </h1>
                            <p className="text-gray-300 text-lg font-['Trebuchet']">
                                View and manage all platform matches
                            </p>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex mb-8 overflow-x-auto">
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => handleTabChange(tab.key)}
                                className={`px-6 py-4 text-lg font-bold uppercase tracking-wider transition-colors relative whitespace-nowrap ${
                                    activeTab === tab.key
                                        ? 'text-[#f79631]'
                                        : 'text-gray-400 hover:text-[#f79631]'
                                }`}
                                onMouseEnter={playHoverSound}
                                style={{
                                    border: 'none',
                                    background: 'none',
                                }}
                            >
                                <span className="relative z-10">
                                    {tab.label} ({tab.count})
                                </span>
                                {activeTab === tab.key && (
                                    <div className="absolute left-1/2 bottom-0 w-16 rounded-full h-1 bg-[#f79631] transform -translate-x-1/2" />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Matches Table */}
                    <div className="bg-black/5 bg-opacity-60 border-1 border-[#f79631]/20 rounded">
                        <div className="flex items-center justify-between px-4 pt-6">
                            <h3 className="font-['FACERG'] text-[#f79631] text-2xl font-bold uppercase tracking-wider">
                                {tabs.find(t => t.key === activeTab)?.label}
                            </h3>
                            <div className="w-80">
                                <FriendsFilter
                                    onFilterChange={handleSearch}
                                    placeholder="Search matches by ID, title, map, team..."
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
                                Showing {matches.data?.length || 0} of {matches.total || 0} matches
                                {search && (
                                    <span className="text-[#f79631] ml-2">
                                        (filtered by "{search}")
                                    </span>
                                )}
                            </div>
                        </div>

                        {matches.data && matches.data.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm font-['Trebuchet']">
                                    <thead>
                                        <tr>
                                            <th className="text-left py-4 px-6 text-[#f79631] font-bold uppercase tracking-wider border-b border-[#f79631]/20">#</th>
                                            <th className="text-left py-4 px-6 text-[#f79631] font-bold uppercase tracking-wider border-b border-[#f79631]/20">Match</th>
                                            <th className="text-left py-4 px-6 text-[#f79631] font-bold uppercase tracking-wider border-b border-[#f79631]/20">Teams</th>
                                            <th className="text-left py-4 px-6 text-[#f79631] font-bold uppercase tracking-wider border-b border-[#f79631]/20">Score</th>
                                            <th className="text-left py-4 px-6 text-[#f79631] font-bold uppercase tracking-wider border-b border-[#f79631]/20">Map</th>
                                            <th className="text-left py-4 px-6 text-[#f79631] font-bold uppercase tracking-wider border-b border-[#f79631]/20">Status</th>
                                            <th className="text-left py-4 px-6 text-[#f79631] font-bold uppercase tracking-wider border-b border-[#f79631]/20">Started</th>
                                            <th className="text-left py-4 px-6 text-[#f79631] font-bold uppercase tracking-wider border-b border-[#f79631]/20">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {matches.data.map((match, index) => (
                                            <tr key={match.id} className="border-b border-[#f79631]/10 hover:bg-black/20 transition-all duration-200">
                                                <td className="py-4 px-6 text-white font-medium">
                                                    {(matches.current_page - 1) * matches.per_page + index + 1}
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="text-white font-semibold text-base">
                                                        {match.title}
                                                    </div>
                                                    <div className="text-gray-400 text-sm">
                                                        ID: {match.match_id}
                                                    </div>
                                                    <div className="text-gray-400 text-xs">
                                                        {match.server_ip}:{match.server_port}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="space-y-1">
                                                        <div className="text-white">
                                                            {match.team1?.name || 'Team 1'}
                                                            {match.winner_team_id === match.team1_id && (
                                                                <span className="text-yellow-400 ml-2">👑</span>
                                                            )}
                                                        </div>
                                                        <div className="text-gray-400">vs</div>
                                                        <div className="text-white">
                                                            {match.team2?.name || 'Team 2'}
                                                            {match.winner_team_id === match.team2_id && (
                                                                <span className="text-yellow-400 ml-2">👑</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    {match.is_finished ? (
                                                        <div className="text-[#f79631] font-bold text-lg">
                                                            {match.team1_score || 0} - {match.team2_score || 0}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400">-</span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className="text-white font-medium">{match.map || 'N/A'}</span>
                                                </td>
                                                <td className="py-4 px-6">
                                                    {getStatusBadge(match)}
                                                </td>
                                                <td className="py-4 px-6 text-gray-300">
                                                    {formatDate(match.started_at)}
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex space-x-2">
                                                        {match.is_finished && !match.is_cancelled && (
                                                            <button
                                                                onClick={() => handleDownloadDemo(match)}
                                                                className="px-3 py-1.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 hover:text-blue-300 text-xs font-['Trebuchet'] transition-all duration-200 border border-blue-600/30 hover:border-blue-600/50 flex items-center space-x-1"
                                                                onMouseEnter={playHoverSound}
                                                                title="Download Demo"
                                                            >
                                                                <FaDownload className="w-3 h-3" />
                                                                <span>Demo</span>
                                                            </button>
                                                        )}
                                                        {!match.is_finished && !match.is_cancelled && (
                                                            <button
                                                                onClick={() => handleCancelMatch(match)}
                                                                className="px-3 py-1.5 bg-red-600/20 text-red-400 hover:bg-red-600/30 hover:text-red-300 text-xs font-['Trebuchet'] transition-all duration-200 border border-red-600/30 hover:border-red-600/50 flex items-center space-x-1"
                                                                onMouseEnter={playHoverSound}
                                                                title="Cancel Match"
                                                            >
                                                                <FaTimes className="w-3 h-3" />
                                                                <span>Cancel</span>
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
                                <p className="text-gray-400 font-['Trebuchet'] text-lg">No matches found</p>
                                {search && (
                                    <p className="text-gray-500 font-['Trebuchet'] text-sm mt-2">
                                        No matches match "{search}"
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Pagination */}
                        {matches.last_page && matches.last_page > 1 && (
                            <div className="flex items-center justify-between px-4 py-4">
                                <div className="text-sm text-gray-400 font-['Trebuchet']">
                                    Showing {((matches.current_page - 1) * matches.per_page) + 1} to {Math.min(matches.current_page * matches.per_page, matches.total || 0)} of {matches.total || 0} results
                                </div>
                                <div className="flex space-x-2">
                                    {matches.links?.map((link, index) => (
                                        <button
                                            key={index}
                                            onClick={() => {
                                                if (link.url) {
                                                    const url = new URL(link.url);
                                                    const page = url.searchParams.get('page') || '1';
                                                    router.get('/admin/matches', { page, tab: activeTab, search }, {
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

                {/* Cancel Match Modal */}
                {showCancelModal && selectedMatch && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
                        <div className="bg-black/50 border border-[#f79631]/30 p-6 w-full max-w-md" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
                            <div className="text-center">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center">
                                    <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                </div>
                                <h3 className="font-['FACERG'] text-[#f79631] text-xl font-bold uppercase tracking-wider mb-4">CONFIRM CANCEL</h3>
                                <p className="text-gray-300 font-['Trebuchet'] mb-6">
                                    Are you sure you want to cancel this match?
                                </p>
                                <div className="text-gray-400 text-sm mb-6">
                                    <div>{selectedMatch.title}</div>
                                    <div>{selectedMatch.team1?.name} vs {selectedMatch.team2?.name}</div>
                                </div>
                                <div className="flex justify-center space-x-4">
                                    <button
                                        onClick={() => {
                                            setShowCancelModal(false);
                                            setSelectedMatch(null);
                                        }}
                                        className="px-6 py-2 text-gray-400 hover:text-white font-['Trebuchet'] transition-colors border border-[#f79631]/30"
                                    >
                                        No, Keep Match
                                    </button>
                                    <button
                                        onClick={confirmCancelMatch}
                                        className="px-6 py-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 hover:text-red-300 font-['Trebuchet'] border border-red-600/30 hover:border-red-600/50 transition-all duration-200"
                                    >
                                        Yes, Cancel Match
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