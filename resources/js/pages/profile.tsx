import { type SharedData } from '@/types';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { useRef, useState, useMemo } from 'react';
import FriendsFilter from '@/components/FriendsFilter';

// Leetify data types
interface LeetifyRank {
    map_name: string;
    rank: number;
}

interface LeetifyRanks {
    leetify: number;
    premier: number | null;
    faceit: number;
    faceit_elo: number;
    wingman: number;
    renown: number;
    competitive: LeetifyRank[];
}

interface LeetifyRating {
    aim: number;
    positioning: number;
    utility: number;
    clutch: number;
    opening: number;
    ct_leetify: number;
    t_leetify: number;
}

interface LeetifyStats {
    accuracy_enemy_spotted: number;
    accuracy_head: number;
    counter_strafing_good_shots_ratio: number;
    ct_opening_aggression_success_rate: number;
    ct_opening_duel_success_percentage: number;
    flashbang_hit_foe_avg_duration: number;
    flashbang_hit_foe_per_flashbang: number;
    flashbang_hit_friend_per_flashbang: number;
    flashbang_leading_to_kill: number;
    flashbang_thrown: number;
    he_foes_damage_avg: number;
    he_friends_damage_avg: number;
    preaim: number;
    reaction_time_ms: number;
    spray_accuracy: number;
    t_opening_aggression_success_rate: number;
    t_opening_duel_success_percentage: number;
    traded_deaths_success_percentage: number;
    trade_kill_opportunities_per_round: number;
    trade_kills_success_percentage: number;
    utility_on_death_avg: number;
}

interface LeetifyData {
    winrate: number;
    total_matches: number;
    first_match_date: string;
    name: string;
    bans: any[];
    steam64_id: string;
    id: string;
    ranks: LeetifyRanks;
    rating: LeetifyRating;
    stats: LeetifyStats;
    recent_matches: any[];
    recent_teammates: any[];
}

interface MatchStats {
    steam64_id: string;
    name: string;
    mvps: number;
    preaim: number;
    reaction_time: number;
    accuracy: number;
    accuracy_enemy_spotted: number;
    accuracy_head: number;
    shots_fired_enemy_spotted: number;
    shots_fired: number;
    shots_hit_enemy_spotted: number;
    shots_hit_friend: number;
    shots_hit_friend_head: number;
    shots_hit_foe: number;
    shots_hit_foe_head: number;
    utility_on_death_avg: number;
    he_foes_damage_avg: number;
    he_friends_damage_avg: number;
    he_thrown: number;
    molotov_thrown: number;
    smoke_thrown: number;
    counter_strafing_shots_all: number;
    counter_strafing_shots_bad: number;
    counter_strafing_shots_good: number;
    counter_strafing_shots_good_ratio: number;
    flashbang_hit_foe: number;
    flashbang_leading_to_kill: number;
    flashbang_hit_foe_avg_duration: number;
    flashbang_hit_friend: number;
    flashbang_thrown: number;
    flash_assist: number;
    score: number;
    initial_team_number: number;
    spray_accuracy: number;
    total_kills: number;
    total_deaths: number;
    kd_ratio: number;
    rounds_survived: number;
    rounds_survived_percentage: number;
    dpr: number;
    total_assists: number;
    total_damage: number;
    leetify_rating: number;
    ct_leetify_rating: number;
    t_leetify_rating: number;
    multi1k: number;
    multi2k: number;
    multi3k: number;
    multi4k: number;
    multi5k: number;
    rounds_count: number;
    rounds_won: number;
    rounds_lost: number;
    total_hs_kills: number;
    trade_kill_opportunities: number;
    trade_kill_attempts: number;
    trade_kills_succeed: number;
    trade_kill_attempts_percentage: number;
    trade_kills_success_percentage: number;
    trade_kill_opportunities_per_round: number;
    traded_death_opportunities: number;
    traded_death_attempts: number;
    traded_deaths_succeed: number;
    traded_death_attempts_percentage: number;
    traded_deaths_success_percentage: number;
    traded_deaths_opportunities_per_round: number;
}

interface TeamScore {
    team_number: number;
    score: number;
}

interface RecentMatch {
    id: string;
    finished_at: string;
    data_source: string;
    data_source_match_id: string;
    map_name: string;
    has_banned_player: boolean;
    replay_url: string;
    team_scores: TeamScore[];
    stats: MatchStats[];
}

export default function Profile() {
    const { auth, leetifyData, recentMatches, steamFriends, userElo } = usePage<SharedData & { leetifyData: LeetifyData | null; recentMatches: RecentMatch[] | null; steamFriends: any[] | null; userElo: number }>().props;
    const user = auth?.user;
    const audioRef = useRef<HTMLAudioElement>(null);
    const [activeTab, setActiveTab] = useState<'matches' | 'leetify' | 'friends'>('leetify');
    const [friendsFilter, setFriendsFilter] = useState('');

    // Filter friends based on search term
    const filteredFriends = useMemo(() => {
        if (!steamFriends || !friendsFilter.trim()) {
            return steamFriends || [];
        }

        const searchTerm = friendsFilter.toLowerCase().trim();
        return steamFriends.filter((friend: any) => {
            const username = (friend.personaname || '').toLowerCase();
            const steamId = (friend.steamid || '').toLowerCase();
            const realName = (friend.realname || '').toLowerCase();
            
            return username.includes(searchTerm) || 
                   steamId.includes(searchTerm) || 
                   realName.includes(searchTerm);
        });
    }, [steamFriends, friendsFilter]);

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

    const formatPlaytime = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleDateString();
    };

    const getPersonaStateText = (state: string) => {
        const states = {
            '0': 'Offline',
            '1': 'Online',
            '2': 'Busy',
            '3': 'Away',
            '4': 'Snooze',
            '5': 'Looking to trade',
            '6': 'Looking to play'
        };
        return states[state as keyof typeof states] || 'Unknown';
    };

    const getCommunityVisibilityText = (state: string) => {
        const states = {
            '1': 'Private',
            '2': 'Friends only',
            '3': 'Public'
        };
        return states[state as keyof typeof states] || 'Unknown';
    };

    const formatPercentage = (value: number) => {
        return `${(value * 100).toFixed(1)}%`;
    };

    const formatRating = (value: number) => {
        return value.toFixed(1);
    };

    const formatReactionTime = (ms: number) => {
        return `${ms.toFixed(0)}ms`;
    };

    const getRankName = (rank: number) => {
        const ranks = [
            'Unranked', 'Silver I', 'Silver II', 'Silver III', 'Silver IV', 'Silver Elite', 'Silver Elite Master',
            'Gold Nova I', 'Gold Nova II', 'Gold Nova III', 'Gold Nova Master', 'Master Guardian I', 'Master Guardian II',
            'Master Guardian Elite', 'Distinguished Master Guardian', 'Legendary Eagle', 'Legendary Eagle Master',
            'Supreme Master First Class', 'Global Elite'
        ];
        return ranks[rank] || 'Unknown';
    };

    const getFaceitLevel = (level: number) => {
        return `Level ${level}`;
    };

    const formatMatchDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    const formatMatchTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getMapImageName = (mapName: string) => {
        const cleanName = mapName.replace('de_', '').replace('cs_', '');
        return cleanName.charAt(0).toUpperCase() + cleanName.slice(1) + '.png';
    };

    const getMatchResult = (match: RecentMatch, playerStats: MatchStats) => {
        const playerTeam = playerStats.initial_team_number;
        const teamScore = match.team_scores.find(score => score.team_number === playerTeam);
        const enemyScore = match.team_scores.find(score => score.team_number !== playerTeam);

        if (teamScore && enemyScore) {
            return teamScore.score > enemyScore.score ? 'W' : 'L';
        }
        return '?';
    };

    const getMatchScore = (match: RecentMatch, playerStats: MatchStats) => {
        const playerTeam = playerStats.initial_team_number;
        const teamScore = match.team_scores.find(score => score.team_number === playerTeam);
        const enemyScore = match.team_scores.find(score => score.team_number !== playerTeam);

        if (teamScore && enemyScore) {
            return `${teamScore.score}-${enemyScore.score}`;
        }
        return '?';
    };

    return (
        <>
            <Head title="Profile">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />

            </Head>


            <div className="bg-black/60 min-h-screen backdrop-blur-sm relative">
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
                    {/* Profile Header */}
                    <div className="relative bg-black/5 bg-opacity-60 border-1 border-[#f79631]/20 rounded p-6 mb-8 overflow-hidden">
                        {/* Banner Background Image */}
                        <div 
                            className="absolute inset-0 bg-cover bg-center opacity-20"
                            style={{
                                backgroundImage: 'url("/images/cs.png")',
                            }}
                        ></div>
                        {/* Dark overlay for better text readability */}
                        <div className="absolute inset-0 bg-black/40"></div>
                        <div className="relative z-10 flex items-center space-x-6">
                            {user?.steam_avatar_full ? (
                                <img
                                    src={String(user.steam_avatar_full)}
                                    alt="Steam Avatar"
                                    className="w-24 h-24 rounded border-2 border-[#f79631]"
                                />
                            ) : null}
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h1 className="font-['FACERG'] text-[#f79631] text-4xl font-bold uppercase tracking-wider">
                                            {String(user?.steam_real_name || user?.steam_username || user?.name || 'Unknown User')}
                                        </h1>
                                        <p className="text-gray-300 text-lg font-['Trebuchet']">
                                            Steam ID: {String(user?.steam_id || 'N/A')}
                                        </p>
                                        {user?.steam_profile_url ? (
                                            <a
                                                href={String(user.steam_profile_url)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-400 hover:text-blue-300 text-sm font-['Trebuchet']"
                                            >
                                                View Steam Profile →
                                            </a>
                                        ) : null}
                                    </div>
                                    <div className="text-right flex items-center space-x-6">
                                        <div>
                                            <div className="text-sm text-gray-400 uppercase tracking-wider font-['Trebuchet'] mb-2">ELO RATING</div>
                                            <div className="text-4xl font-bold text-[#f79631] font-['FACERG']">
                                                {userElo || 0}
                                            </div>
                                            <div className="text-xs text-gray-500 font-['Trebuchet'] mt-1">
                                                Current Rating
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <img 
                                                src="/leetify.png" 
                                                alt="Leetify" 
                                                className="w-20 h-20 object-contain"
                                            />
                                          
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Steam Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        {/* Profile Stats */}
                        <div className="bg-black/20 bg-opacity-60 border-1 border-[#f79631]/20 rounded p-4">
                            <h3 className="font-['FACERG'] text-[#f79631] text-xl font-bold uppercase tracking-wider">PROFILE INFO</h3>
                            <div
                                className="w-[20%] h-0.5 my-4 rounded-full"
                                style={{
                                    background: "linear-gradient(to right,rgba(247, 151, 49, 0.45) 0%, rgba(247, 151, 49, 0.25) 50%, rgba(247,151,49,0) 100%)"
                                }}
                            ></div>                            <div className="space-y-2 text-sm font-['Trebuchet']">
                                <div className="flex justify-between">
                                    <span className="text-gray-300">Status:</span>
                                    <span className="text-white">{getPersonaStateText(String(user?.steam_persona_state || '0'))}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-300">Visibility:</span>
                                    <span className="text-white">{getCommunityVisibilityText(String(user?.steam_community_visibility_state || '1'))}</span>
                                </div>
                                {user?.steam_last_logoff ? (
                                    <div className="flex justify-between">
                                        <span className="text-gray-300">Last Logoff:</span>
                                        <span className="text-white">{new Date(Number(user.steam_last_logoff) * 1000).toLocaleDateString()}</span>
                                    </div>
                                ) : null}
                                {user?.steam_country_code ? (
                                    <div className="flex justify-between">
                                        <span className="text-gray-300">Country:</span>
                                        <span className="text-white">{String(user.steam_country_code)}</span>
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        {/* Account Stats */}
                        <div className="bg-black/20 bg-opacity-60 border-1 border-[#f79631]/20 rounded p-4">
                            <h3 className="font-['FACERG'] text-[#f79631] text-xl font-bold uppercase tracking-wider">ACCOUNT INFO</h3>
                            <div
                                className="w-[20%] h-0.5 my-4 rounded-full"
                                style={{
                                    background: "linear-gradient(to right,rgba(247, 151, 49, 0.45) 0%, rgba(247, 151, 49, 0.25) 50%, rgba(247,151,49,0) 100%)"
                                }}
                            ></div>
                            <div className="space-y-2 text-sm font-['Trebuchet']">
                                {user?.created_at ? (
                                    <div className="flex justify-between">
                                        <span className="text-gray-300">Joined:</span>
                                        <span className="text-white">{new Date(String(user.created_at)).toLocaleDateString()}</span>
                                    </div>
                                ) : null}
                                {user?.steam_authenticated_at ? (
                                    <div className="flex justify-between">
                                        <span className="text-gray-300">Steam Auth:</span>
                                        <span className="text-white">{new Date(String(user.steam_authenticated_at)).toLocaleDateString()}</span>
                                    </div>
                                ) : null}
                                {user?.steam_profile_state ? (
                                    <div className="flex justify-between">
                                        <span className="text-gray-300">Profile State:</span>
                                        <span className="text-white">{String(user.steam_profile_state) === '1' ? 'Set' : 'Not Set'}</span>
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        {/* Game Stats */}
                        <div className="bg-black/20 bg-opacity-60 border-1 border-[#f79631]/20 rounded p-4">
                            <h3 className="font-['FACERG'] text-[#f79631] text-xl font-bold uppercase tracking-wider">GAME STATS</h3>
                            <div
                                className="w-[20%] h-0.5 my-4 rounded-full"
                                style={{
                                    background: "linear-gradient(to right,rgba(247, 151, 49, 0.45) 0%, rgba(247, 151, 49, 0.25) 50%, rgba(247,151,49,0) 100%)"
                                }}
                            ></div>
                            <div className="space-y-2 text-sm font-['Trebuchet']">
                                <div className="flex justify-between">
                                    <span className="text-gray-300">Total Games:</span>
                                    <span className="text-white">{(user?.steam_games as any[])?.length || 0}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-300">Friends:</span>
                                    <span className="text-white">{steamFriends?.length || 0}</span>
                                </div>
                                {user?.steam_state_code ? (
                                    <div className="flex justify-between">
                                        <span className="text-gray-300">State Code:</span>
                                        <span className="text-white">{String(user.steam_state_code)}</span>
                                    </div>
                                ) : null}
                                {user?.steam_city_id ? (
                                    <div className="flex justify-between">
                                        <span className="text-gray-300">City ID:</span>
                                        <span className="text-white">{String(user.steam_city_id)}</span>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex mb-8">
                        <button
                            onClick={() => setActiveTab('leetify')}
                            className={`px-8 py-4  text-xl font-bold uppercase tracking-wider transition-colors relative ${activeTab === 'leetify'
                                    ? 'text-[#f79631]'
                                    : 'text-gray-400 hover:text-[#f79631]'
                                }`}
                            onMouseEnter={playHoverSound}
                            style={{
                                border: 'none',
                                background: 'none',
                            }}
                        >
                            <span className="relative z-10">LEETIFY</span>
                            {activeTab === 'leetify' && (
                                <div className="absolute left-1/2 bottom-0 w-16 rounded-full h-1 bg-[#f79631] transform -translate-x-1/2" />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('matches')}
                            className={`px-2 py-4  text-xl font-bold uppercase tracking-wider transition-colors relative ${activeTab === 'matches'
                                    ? 'text-[#f79631]'
                                    : 'text-gray-400 hover:text-[#f79631]'
                                }`}
                            onMouseEnter={playHoverSound}
                            style={{
                                border: 'none',
                                background: 'none',
                            }}
                        >
                            <span className="relative z-10">RECENT MATCHES</span>
                            {activeTab === 'matches' && (
                                <div className="absolute left-1/2 bottom-0 w-16 rounded-full h-1 bg-[#f79631] transform -translate-x-1/2" />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('friends')}
                            className={`px-6 py-4  text-lg font-bold uppercase tracking-wider transition-colors relative ${activeTab === 'friends'
                                    ? 'text-[#f79631]'
                                    : 'text-gray-400 hover:text-[#f79631]'
                                }`}
                            onMouseEnter={playHoverSound}
                            style={{
                                border: 'none',
                                background: 'none',
                            }}
                        >
                            <span className="relative z-10">STEAM FRIENDS</span>
                            {activeTab === 'friends' && (
                                <div className="absolute left-1/2 bottom-0 w-16 rounded-full h-1 bg-[#f79631] transform -translate-x-1/2" />
                            )}
                        </button>
                    </div>

                    {/* Leetify Tab */}
                    {activeTab === 'leetify' ? (
                        <div className="space-y-6">
                            {leetifyData ? (
                                <>
                                    {/* Overview Stats */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="bg-black/20 bg-opacity-60 border-1 border-[#f79631]/20 rounded p-4">
                                            <h3 className="font-['FACERG'] text-[#f79631] text-xl font-bold uppercase tracking-wider">WIN RATE</h3>
                                            <div
                                                className="w-[20%] h-0.5 my-4 rounded-full"
                                                style={{
                                                    background: "linear-gradient(to right,rgba(247, 151, 49, 0.45) 0%, rgba(247, 151, 49, 0.25) 50%, rgba(247,151,49,0) 100%)"
                                                }}
                                            ></div>
                                            <div className="flex items-center justify-center mb-4">
                                                <div className="relative w-24 h-24">
                                                    <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                                                        {/* Background circle */}
                                                        <circle
                                                            cx="50"
                                                            cy="50"
                                                            r="40"
                                                            stroke="#374151"
                                                            strokeWidth="8"
                                                            fill="none"
                                                        />
                                                        {/* Progress circle */}
                                                        <circle
                                                            cx="50"
                                                            cy="50"
                                                            r="40"
                                                            stroke="#10B981"
                                                            strokeWidth="8"
                                                            fill="none"
                                                            strokeLinecap="round"
                                                            strokeDasharray={`${2 * Math.PI * 40}`}
                                                            strokeDashoffset={`${2 * Math.PI * 40 * (1 - leetifyData.winrate)}`}
                                                            className="transition-all duration-1000 ease-out"
                                                        />
                                                    </svg>
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <span className="text-white text-xl font-bold">
                                                            {formatPercentage(leetifyData.winrate)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <span className="text-emerald-400 text-sm font-medium">
                                                    {leetifyData.winrate >= 0.6 ? 'Great' : leetifyData.winrate >= 0.5 ? 'Good' : 'Needs Improvement'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="bg-black/20 bg-opacity-60 border-1 border-[#f79631]/20 rounded p-4">
                                            <h3 className="font-['FACERG'] text-[#f79631] text-xl font-bold uppercase tracking-wider">LEETIFY RATING</h3>
                                            <div
                                                className="w-[20%] h-0.5 my-4 rounded-full"
                                                style={{
                                                    background: "linear-gradient(to right,rgba(247, 151, 49, 0.45) 0%, rgba(247, 151, 49, 0.25) 50%, rgba(247,151,49,0) 100%)"
                                                }}
                                            ></div>
                                            <div className="flex items-center justify-center mb-4">
                                                <div className="relative w-24 h-24">
                                                    <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                                                        {/* Background circle */}
                                                        <circle
                                                            cx="50"
                                                            cy="50"
                                                            r="40"
                                                            stroke="#374151"
                                                            strokeWidth="8"
                                                            fill="none"
                                                        />
                                                        {/* Progress circle */}
                                                        <circle
                                                            cx="50"
                                                            cy="50"
                                                            r="40"
                                                            stroke="#84CC16"
                                                            strokeWidth="8"
                                                            fill="none"
                                                            strokeLinecap="round"
                                                            strokeDasharray={`${2 * Math.PI * 40}`}
                                                            strokeDashoffset={`${2 * Math.PI * 40 * (1 - leetifyData.ranks.leetify)}`}
                                                            className="transition-all duration-1000 ease-out"
                                                        />
                                                    </svg>
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <span className="text-white text-xl font-bold">
                                                            +{formatRating(leetifyData.ranks.leetify)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <span className="text-lime-400 text-sm font-medium">
                                                    {leetifyData.ranks.leetify >= 0.7 ? 'Excellent' : leetifyData.ranks.leetify >= 0.5 ? 'Good' : 'Needs Improvement'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="bg-black/20 bg-opacity-60 border-1 border-[#f79631]/20 rounded p-4 text-left">
                                            <h3 className="font-['FACERG'] text-[#f79631] text-xl font-bold uppercase tracking-wider">TOTAL MATCHES</h3>
                                            <div
                                                className="w-[20%] h-0.5 my-4 rounded-full"
                                                style={{
                                                    background: "linear-gradient(to right,rgba(247, 151, 49, 0.45) 0%, rgba(247, 151, 49, 0.25) 50%, rgba(247,151,49,0) 100%)"
                                                }}
                                            ></div>
                                            <div className="text-3xl font-bold text-white font-['Trebuchet'] text-center flex items-center justify-center min-h-[120px]">
                                                {leetifyData.total_matches}
                                            </div>
                                        </div>

                                        <div className="bg-black/20 bg-opacity-60 border-1 border-[#f79631]/20 rounded p-4 text-center">
                                            <h3 className="font-['FACERG'] text-[#f79631] text-xl font-bold uppercase tracking-wider">FACEIT LEVEL</h3>
                                            <div
                                                className="w-[20%] h-0.5 my-4 rounded-full"
                                                style={{
                                                    background: "linear-gradient(to right,rgba(247, 151, 49, 0.45) 0%, rgba(247, 151, 49, 0.25) 50%, rgba(247,151,49,0) 100%)"
                                                }}
                                            ></div>
                                            <div className="flex items-center justify-center mb-4">
                                                <div className="relative w-20 h-20">
                                                    <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
                                                        {/* Background circle */}
                                                        <circle
                                                            cx="50"
                                                            cy="50"
                                                            r="35"
                                                            stroke="#374151"
                                                            strokeWidth="6"
                                                            fill="none"
                                                        />
                                                        {/* Progress circle */}
                                                        <circle
                                                            cx="50"
                                                            cy="50"
                                                            r="35"
                                                            stroke="#f79631"
                                                            strokeWidth="6"
                                                            fill="none"
                                                            strokeLinecap="round"
                                                            strokeDasharray={`${2 * Math.PI * 35}`}
                                                            strokeDashoffset={`${2 * Math.PI * 35 * (1 - leetifyData.ranks.faceit / 10)}`}
                                                            className="transition-all duration-1000 ease-out"
                                                        />
                                                    </svg>
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <span className="text-white text-lg font-bold">
                                                            {leetifyData.ranks.faceit}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-sm text-gray-300 font-['Trebuchet']">
                                                Level {leetifyData.ranks.faceit}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Ranks Section */}
                                    <div className="bg-black/20 bg-opacity-60 border-1 border-[#f79631]/20 rounded p-6">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                            <div className="space-y-6">
                                                <h4 className="font-['FACERG'] text-[#f79631] text-xl font-bold uppercase tracking-wider">COMPETITIVE RANKS</h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {leetifyData.ranks.competitive
                                                        .filter(rank => rank.rank > 0) // Only show ranked maps
                                                        .map((rank, index) => {
                                                            const mapName = rank.map_name.replace('de_', '').replace('cs_', '');
                                                            const mapImageName = mapName.charAt(0).toUpperCase() + mapName.slice(1) + '.png';

                                                            return (
                                                                <div key={index} className="flex items-center justify-between rounded p-4 hover:bg-black/30 transition-colors border border-[#f79631]/10">
                                                                    <div className="flex items-center space-x-3">
                                                                        <img
                                                                            src={`/maps/${mapImageName}`}
                                                                            alt={mapName}
                                                                            className="w-10 h-10 rounded object-cover"
                                                                            onError={(e) => {
                                                                                // Fallback if image doesn't exist
                                                                                e.currentTarget.style.display = 'none';
                                                                            }}
                                                                        />
                                                                        <span className="text-gray-300 capitalize font-medium text-sm">{mapName}</span>
                                                                    </div>
                                                                    <span className="text-white font-semibold text-sm">{getRankName(rank.rank)}</span>
                                                                </div>
                                                            );
                                                        })}
                                                </div>
                                            </div>

                                            <div className="space-y-6">
                                                <h4 className="font-['FACERG'] text-[#f79631] text-xl font-bold uppercase tracking-wider">OTHER RANKS</h4>
                                                <div className="space-y-2">
                                                    <div className="bg-black/20 rounded p-4 border border-[#f79631]/10">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-gray-300 font-medium">Wingman</span>
                                                            <span className="text-white font-semibold">{getRankName(leetifyData.ranks.wingman)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="bg-black/20 rounded p-4 border border-[#f79631]/10">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-gray-300 font-medium">Renown</span>
                                                            <span className="text-white font-semibold">{leetifyData.ranks.renown?.toLocaleString() || '0'}</span>
                                                        </div>
                                                    </div>
                                                    <div className="bg-black/20 rounded p-4 border border-[#f79631]/10">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-gray-300 font-medium">Leetify Rating</span>
                                                            <span className="text-white font-semibold">{formatRating(leetifyData.ranks.leetify)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Rating Section */}


                                    {/* Detailed Stats */}
                                    <div className="bg-black/20 bg-opacity-60 border-1 border-[#f79631]/20 rounded p-6">
                                        <h3 className="font-['FACERG'] text-[#f79631] text-2xl font-bold uppercase tracking-wider">DETAILED STATISTICS</h3>
                                        <div
                                            className="w-[50%] h-0.5 my-4 rounded-full"
                                            style={{
                                                background: "linear-gradient(to right,rgba(247, 151, 49, 0.45) 0%, rgba(247, 151, 49, 0.25) 50%, rgba(247,151,49,0) 100%)"
                                            }}
                                        ></div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            <div className="space-y-3 text-sm font-['Trebuchet']">
                                                <h4 className="font-['FACERG'] text-[#f79631] text-lg font-bold uppercase tracking-wider mb-4">ACCURACY</h4>

                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-gray-300 text-xs">Enemy Spotted:</span>
                                                        <div className="flex items-center space-x-2">
                                                            <div className="w-16 h-1 bg-gray-700 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-gradient-to-r from-[#f79631] to-[#ffa500] rounded-full transition-all duration-1000"
                                                                    style={{ width: `${Math.min(leetifyData.stats.accuracy_enemy_spotted, 100)}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="text-white text-xs font-semibold w-12 text-right">{formatPercentage(leetifyData.stats.accuracy_enemy_spotted / 100)}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between">
                                                        <span className="text-gray-300 text-xs">Headshot:</span>
                                                        <div className="flex items-center space-x-2">
                                                            <div className="w-16 h-1 bg-gray-700 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-gradient-to-r from-[#f79631] to-[#ffa500] rounded-full transition-all duration-1000"
                                                                    style={{ width: `${Math.min(leetifyData.stats.accuracy_head, 100)}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="text-white text-xs font-semibold w-12 text-right">{formatPercentage(leetifyData.stats.accuracy_head / 100)}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between">
                                                        <span className="text-gray-300 text-xs">Spray Accuracy:</span>
                                                        <div className="flex items-center space-x-2">
                                                            <div className="w-16 h-1 bg-gray-700 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-gradient-to-r from-[#f79631] to-[#ffa500] rounded-full transition-all duration-1000"
                                                                    style={{ width: `${Math.min(leetifyData.stats.spray_accuracy, 100)}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="text-white text-xs font-semibold w-12 text-right">{formatPercentage(leetifyData.stats.spray_accuracy / 100)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-3 text-sm font-['Trebuchet']">
                                                <h4 className="font-['FACERG'] text-[#f79631] text-lg font-bold uppercase tracking-wider mb-4">PERFORMANCE</h4>

                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-gray-300 text-xs">Reaction Time:</span>
                                                        <div className="flex items-center space-x-2">
                                                            <div className="w-16 h-1 bg-gray-700 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-gradient-to-r from-[#f79631] to-[#ffa500] rounded-full transition-all duration-1000"
                                                                    style={{ width: `${Math.max(0, 100 - (leetifyData.stats.reaction_time_ms - 200) / 4)}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="text-white text-xs font-semibold w-12 text-right">{formatReactionTime(leetifyData.stats.reaction_time_ms)}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between">
                                                        <span className="text-gray-300 text-xs">Preaim:</span>
                                                        <div className="flex items-center space-x-2">
                                                            <div className="w-16 h-1 bg-gray-700 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-gradient-to-r from-[#f79631] to-[#ffa500] rounded-full transition-all duration-1000"
                                                                    style={{ width: `${Math.min(leetifyData.stats.preaim * 10, 100)}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="text-white text-xs font-semibold w-12 text-right">{formatRating(leetifyData.stats.preaim)}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between">
                                                        <span className="text-gray-300 text-xs">Counter Strafing:</span>
                                                        <div className="flex items-center space-x-2">
                                                            <div className="w-16 h-1 bg-gray-700 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-gradient-to-r from-[#f79631] to-[#ffa500] rounded-full transition-all duration-1000"
                                                                    style={{ width: `${Math.min(leetifyData.stats.counter_strafing_good_shots_ratio, 100)}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="text-white text-xs font-semibold w-12 text-right">{formatPercentage(leetifyData.stats.counter_strafing_good_shots_ratio / 100)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-3 text-sm font-['Trebuchet']">
                                                <h4 className="font-['FACERG'] text-[#f79631] text-lg font-bold uppercase tracking-wider mb-4">UTILITY</h4>

                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-gray-300 text-xs">Flashbangs Thrown:</span>
                                                        <div className="flex items-center space-x-2">
                                                            <div className="w-16 h-1 bg-gray-700 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-gradient-to-r from-[#f79631] to-[#ffa500] rounded-full transition-all duration-1000"
                                                                    style={{ width: `${Math.min(leetifyData.stats.flashbang_thrown * 10, 100)}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="text-white text-xs font-semibold w-12 text-right">{formatRating(leetifyData.stats.flashbang_thrown)}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between">
                                                        <span className="text-gray-300 text-xs">Flash Hit Foe:</span>
                                                        <div className="flex items-center space-x-2">
                                                            <div className="w-16 h-1 bg-gray-700 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-gradient-to-r from-[#f79631] to-[#ffa500] rounded-full transition-all duration-1000"
                                                                    style={{ width: `${Math.min(leetifyData.stats.flashbang_hit_foe_per_flashbang * 100, 100)}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="text-white text-xs font-semibold w-12 text-right">{formatPercentage(leetifyData.stats.flashbang_hit_foe_per_flashbang)}</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between">
                                                        <span className="text-gray-300 text-xs">HE Damage (Foes):</span>
                                                        <div className="flex items-center space-x-2">
                                                            <div className="w-16 h-1 bg-gray-700 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-gradient-to-r from-[#f79631] to-[#ffa500] rounded-full transition-all duration-1000"
                                                                    style={{ width: `${Math.min(leetifyData.stats.he_foes_damage_avg * 10, 100)}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="text-white text-xs font-semibold w-12 text-right">{formatRating(leetifyData.stats.he_foes_damage_avg)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="bg-black/20 bg-opacity-60 border-1 border-[#f79631]/20 rounded p-8">
                                    <h3 className="font-['FACERG'] text-[#f79631] text-2xl font-bold uppercase tracking-wider mb-4">LEETIFY DATA</h3>
                                    <div className="text-center">
                                        <p className="text-gray-400 font-['Trebuchet'] text-lg">No Leetify data found</p>
                                        <p className="text-gray-500 font-['Trebuchet'] text-sm mt-2">Make sure you have played CS lil bro</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : null}

                    {/* Recent Matches Tab */}
                    {activeTab === 'matches' ? (
                        <div className="space-y-6">
                            {recentMatches && recentMatches.length > 0 ? (
                                <>
                                    <div className="bg-black/20 bg-opacity-60 border-1 border-[#f79631]/20 rounded p-6">
                                        <h3 className="font-['FACERG'] text-[#f79631] text-2xl font-bold uppercase tracking-wider">RECENT MATCHES</h3>
                                        <div
                                            className="w-[50%] h-0.5 my-4 rounded-full"
                                            style={{
                                                background: "linear-gradient(to right,rgba(247, 151, 49, 0.45) 0%, rgba(247, 151, 49, 0.25) 50%, rgba(247,151,49,0) 100%)"
                                            }}
                                        ></div>

                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                            {recentMatches.slice(0, 10).map((match, index) => {
                                                const playerStats = match.stats[0]; // Assuming first stat is the player
                                                const result = getMatchResult(match, playerStats);
                                                const score = getMatchScore(match, playerStats);
                                                const mapImageName = getMapImageName(match.map_name);

                                                return (
                                                    <div key={match.id} className="bg-black/20 rounded p-6 border border-[#f79631]/20 hover:bg-black/30 transition-colors">
                                                        {/* Match Header */}
                                                        <div className="flex items-center justify-between mb-6">
                                                            <div className="flex items-center space-x-4">
                                                                <img
                                                                    src={`/maps/${mapImageName}`}
                                                                    alt={match.map_name}
                                                                    className="w-16 h-16 rounded object-cover"
                                                                    onError={(e) => {
                                                                        e.currentTarget.style.display = 'none';
                                                                    }}
                                                                />
                                                                <div>
                                                                    <h4 className="text-white font-bold text-xl capitalize">
                                                                        {match.map_name.replace('de_', '').replace('cs_', '')}
                                                                    </h4>
                                                                    <p className="text-gray-400 text-sm">
                                                                        {formatMatchDate(match.finished_at)} at {formatMatchTime(match.finished_at)}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className={`text-4xl font-bold ${result === 'W' ? 'text-green-400' : result === 'L' ? 'text-red-400' : 'text-gray-400'}`}>
                                                                    {result}
                                                                </div>
                                                                <div className="text-white text-lg font-semibold">{score}</div>
                                                            </div>
                                                        </div>

                                                        {/* Main Stats Grid */}
                                                        <div className="grid grid-cols-3 gap-4 mb-6">
                                                            {/* K/D/A */}
                                                            <div className="text-center  rounded-lg p-3">
                                                                <div className="text-xs text-gray-400 mb-2 uppercase tracking-wider">K/D/A</div>
                                                                <div className="text-white font-bold text-lg">
                                                                    {playerStats.total_kills}/{playerStats.total_deaths}/{playerStats.total_assists}
                                                                </div>
                                                                <div className="text-xs text-gray-400 mt-1">
                                                                    {playerStats.kd_ratio.toFixed(2)} K/D
                                                                </div>
                                                            </div>

                                                            {/* Score */}
                                                            <div className="text-center rounded-lg p-3">
                                                                <div className="text-xs text-gray-400 mb-2 uppercase tracking-wider">SCORE</div>
                                                                <div className="text-white font-bold text-xl">{playerStats.score}</div>
                                                                <div className="text-xs text-gray-400 mt-1">
                                                                    {playerStats.mvps} MVP{playerStats.mvps !== 1 ? 's' : ''}
                                                                </div>
                                                            </div>

                                                            {/* Accuracy */}
                                                            <div className="text-center  rounded-lg p-3">
                                                                <div className="text-xs text-gray-400 mb-2 uppercase tracking-wider">ACCURACY</div>
                                                                <div className="text-white font-bold text-lg">
                                                                    {formatPercentage(playerStats.accuracy)}
                                                                </div>
                                                                <div className="text-xs text-gray-400 mt-1">
                                                                    {formatPercentage(playerStats.accuracy_head)} HS
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Secondary Stats Grid */}
                                                        <div className="grid grid-cols-3 gap-4 mb-6">
                                                            {/* Leetify Rating */}
                                                            <div className="text-center  rounded-lg p-4">
                                                                <div className="text-xs text-gray-400 mb-3 uppercase tracking-wider">RATING</div>
                                                                <div className="flex items-center justify-center">
                                                                    <div className="relative w-16 h-16">
                                                                        <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 100 100">
                                                                            <circle
                                                                                cx="50"
                                                                                cy="50"
                                                                                r="40"
                                                                                stroke="#374151"
                                                                                strokeWidth="8"
                                                                                fill="none"
                                                                            />
                                                                            <circle
                                                                                cx="50"
                                                                                cy="50"
                                                                                r="40"
                                                                                stroke={playerStats.leetify_rating > 0 ? "#10B981" : "#EF4444"}
                                                                                strokeWidth="8"
                                                                                fill="none"
                                                                                strokeLinecap="round"
                                                                                strokeDasharray={`${2 * Math.PI * 40}`}
                                                                                strokeDashoffset={`${2 * Math.PI * 40 * (1 - Math.abs(playerStats.leetify_rating) * 10)}`}
                                                                                className="transition-all duration-1000 ease-out"
                                                                            />
                                                                        </svg>
                                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                                            <span className="text-white text-xs text-base font-bold">
                                                                                {playerStats.leetify_rating > 0 ? '+' : ''}{playerStats.leetify_rating.toFixed(2)}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Damage */}
                                                            <div className="text-center  rounded-lg p-3">
                                                                <div className="text-xs text-gray-400 mb-2 uppercase tracking-wider">DAMAGE</div>
                                                                <div className="text-white font-bold text-lg">
                                                                    {playerStats.total_damage}
                                                                </div>
                                                                <div className="text-xs text-gray-400 mt-1">
                                                                    {playerStats.dpr.toFixed(1)} DPR
                                                                </div>
                                                            </div>

                                                            {/* Rounds */}
                                                            <div className="text-center  rounded-lg p-3">
                                                                <div className="text-xs text-gray-400 mb-2 uppercase tracking-wider">ROUNDS</div>
                                                                <div className="text-white font-bold text-lg">
                                                                    {playerStats.rounds_won}/{playerStats.rounds_lost}
                                                                </div>
                                                                <div className="text-xs text-gray-400 mt-1">
                                                                    {formatPercentage(playerStats.rounds_survived_percentage)} survived
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Additional Stats */}
                                                        <div className="pt-4 ">
                                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-gray-400">Reaction Time:</span>
                                                                    <span className="text-white font-semibold">{(playerStats.reaction_time * 1000).toFixed(0)}ms</span>
                                                                </div>
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-gray-400">Preaim:</span>
                                                                    <span className="text-white font-semibold">{playerStats.preaim.toFixed(1)}</span>
                                                                </div>
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-gray-400">Spray Accuracy:</span>
                                                                    <span className="text-white font-semibold">{formatPercentage(playerStats.spray_accuracy)}</span>
                                                                </div>
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-gray-400">Counter Strafing:</span>
                                                                    <span className="text-white font-semibold">{formatPercentage(playerStats.counter_strafing_shots_good_ratio)}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="bg-black/20 bg-opacity-60 border-1 border-[#f79631]/20 rounded p-8">
                                    <h3 className="font-['FACERG'] text-[#f79631] text-2xl font-bold uppercase tracking-wider mb-4">RECENT MATCHES</h3>
                                    <div className="text-center">
                                        <p className="text-gray-400 font-['Trebuchet'] text-lg">No recent matches found</p>
                                        <p className="text-gray-500 font-['Trebuchet'] text-sm mt-2">Make sure you have played recent matches and your Steam profile is linked to Leetify</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : null}

                    {/* Leetify Tab */}
                    


                    {/* Steam Friends Tab */}
                    {activeTab === 'friends' ? (
                        <div className="bg-black/20 bg-opacity-60 border-1 border-[#f79631]/20 rounded">
                            <div className="flex items-center justify-between px-4 pt-6">
                                <h3 className="font-['FACERG'] text-[#f79631] text-2xl font-bold uppercase tracking-wider">STEAM FRIENDS</h3>
                                <div className="w-80">
                                    <FriendsFilter 
                                        onFilterChange={setFriendsFilter}
                                        placeholder="Search friends by username, Steam ID, or real name..."
                                    />
                                </div>
                            </div>
                            <div
                                className="w-[50%] h-0.5 my-4 rounded-full"
                                style={{
                                    background: "linear-gradient(to right,rgba(247, 151, 49, 0.45) 0%, rgba(247, 151, 49, 0.25) 50%, rgba(247,151,49,0) 100%)"
                                }}
                            ></div>
                            
                            {steamFriends && steamFriends.length > 0 ? (
                                <>
                                    {/* Results count */}
                                    <div className="px-4 mb-4">
                                        <div className="text-sm text-gray-400 font-['Trebuchet']">
                                            Showing {filteredFriends.length} of {steamFriends.length} friends
                                            {friendsFilter && (
                                                <span className="text-[#f79631] ml-2">
                                                    (filtered by "{friendsFilter}")
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm font-['Trebuchet']">
                                            <thead>
                                                <tr className="">
                                                    <th className="text-left py-3 px-4 text-[#f79631] font-bold uppercase tracking-wider">#</th>
                                                    <th className="text-left py-3 px-4 text-[#f79631] font-bold uppercase tracking-wider">Username</th>
                                                    <th className="text-left py-3 px-4 text-[#f79631] font-bold uppercase tracking-wider">Profile</th>
                                                    <th className="text-left py-3 px-4 text-[#f79631] font-bold uppercase tracking-wider">Friend Since</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredFriends.map((friend: any, index: number) => (
                                                <tr key={index} className="border-b border-[#f79631]/5 hover:bg-opacity-30 transition-colors">
                                                    <td className="py-3 px-4 text-white font-medium">{index + 1}</td>
                                                    <td className="py-3 px-4 text-white font-medium">{friend.personaname || 'Unknown'}</td>
                                                    <td className="py-3 px-4">
                                                        <a
                                                            href={friend.profileurl || `https://steamcommunity.com/profiles/${friend.steamid}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-400 hover:text-blue-300 text-sm font-['Trebuchet']"
                                                        >
                                                            View Profile →
                                                        </a>
                                                    </td>
                                                    <td className="py-3 px-4 text-white">
                                                        {friend.friend_since ? formatDate(friend.friend_since) : '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                
                                {/* No results message */}
                                {filteredFriends.length === 0 && friendsFilter && (
                                    <div className="px-4 py-8 text-center">
                                        <p className="text-gray-400 font-['Trebuchet'] text-lg">No friends found</p>
                                        <p className="text-gray-500 font-['Trebuchet'] text-sm mt-2">
                                            No friends match "{friendsFilter}"
                                        </p>
                                        <button
                                            onClick={() => setFriendsFilter('')}
                                            className="mt-4 px-4 py-2 text-[#f79631] hover:text-yellow-300 text-sm font-['Trebuchet'] transition-colors"
                                        >
                                            Clear filter
                                        </button>
                                    </div>
                                )}
                                </>
                            ) : (
                                <div className="p-8 text-center">
                                    {!user?.steam_id ? (
                                        <>
                                            <p className="text-gray-400 font-['Trebuchet'] text-lg">Steam not connected</p>
                                            <p className="text-gray-500 font-['Trebuchet'] text-sm mt-2">Please connect your Steam account to view friends</p>
                                            <a
                                                href="/auth/steam"
                                                className="inline-block mt-4 px-6 py-2 bg-[#f79631] text-white font-bold uppercase tracking-wider hover:bg-yellow-600 transition-colors rounded"
                                            >
                                                Connect Steam
                                            </a>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-gray-400 font-['Trebuchet'] text-lg">No Steam friends found</p>
                                            <p className="text-gray-500 font-['Trebuchet'] text-sm mt-2">Make sure your Steam profile is public and friends list is visible</p>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>

                <audio ref={audioRef} preload="auto">
                    <source src="/cs2-sound.mp3" type="audio/mpeg" />
                </audio>
                <div className="absolute bottom-2 right-2 md:bottom-8 md:right-8 flex gap-4 text-gray-400 text-xs md:text-sm font-['Trebuchet']">
                    <a href="https://hosting.karasu.live/privacy-policy" target="_blank" rel="noopener noreferrer" className="hover:text-[#f79631] transition-colors">
                        Privacy Policy
                    </a>
                    <a href="https://hosting.karasu.live/terms-of-services" target="_blank" rel="noopener noreferrer" className="hover:text-[#f79631] transition-colors">
                        Terms of Service
                    </a>
                </div>
            </div>
        </>
    );
}
