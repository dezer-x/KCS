import { type SharedData } from '@/types';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { useRef, useState, useMemo, useEffect } from 'react';
import FriendsFilter from '@/components/FriendsFilter';

interface Friend {
    id: number;
    steam_id: string;
    steam_username: string;
    steam_real_name: string;
    steam_avatar_medium: string;
    steam_avatar_full: string;
    elo: number;
    created_at: string;
    steam_authenticated_at: string;
    relationship_status?: string;
    can_add?: boolean;
}

interface PendingRequest {
    id: number;
    steam_id: string;
    steam_username: string;
    steam_real_name: string;
    steam_avatar_medium: string;
    steam_avatar_full: string;
    elo: number;
    created_at: string;
    steam_authenticated_at: string;
    pivot?: {
        created_at: string;
        updated_at: string;
    };
}

export default function Friends() {
    const { auth, friends, pendingRequests, sentRequests, blockedFriends, flash } = usePage<SharedData & {
        friends: Friend[];
        pendingRequests: PendingRequest[];
        sentRequests: PendingRequest[];
        blockedFriends: PendingRequest[];
        flash?: {
            success?: string;
            error?: string;
        };
    }>().props;
    const user = auth?.user;
    const audioRef = useRef<HTMLAudioElement>(null);

    const [activeTab, setActiveTab] = useState<'friends' | 'pending' | 'sent' | 'blocked' | 'add'>('friends');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Friend[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [blockReason, setBlockReason] = useState('');
    const [showBlockModal, setShowBlockModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<Friend | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{
        type: 'remove' | 'reject' | 'unblock' | 'cancel';
        user: Friend;
        message: string;
    } | null>(null);
    const [friendsFilter, setFriendsFilter] = useState('');
    const [pendingFilter, setPendingFilter] = useState('');
    const [sentFilter, setSentFilter] = useState('');
    const [blockedFilter, setBlockedFilter] = useState('');


    // Filter friends based on search term
    const filteredFriends = useMemo(() => {
        if (!friends || !friendsFilter.trim()) {
            return friends || [];
        }

        const searchTerm = friendsFilter.toLowerCase().trim();
        return friends.filter((friend: Friend) => {
            const username = (friend.steam_username || '').toLowerCase();
            const realName = (friend.steam_real_name || '').toLowerCase();
            const steamId = (friend.steam_id || '').toLowerCase();
            
            return username.includes(searchTerm) || 
                   realName.includes(searchTerm) || 
                   steamId.includes(searchTerm);
        });
    }, [friends, friendsFilter]);

    // Filter pending requests based on search term
    const filteredPendingRequests = useMemo(() => {
        if (!pendingRequests || !pendingFilter.trim()) {
            return pendingRequests || [];
        }

        const searchTerm = pendingFilter.toLowerCase().trim();
        return pendingRequests.filter((request: PendingRequest) => {
            const username = (request.steam_username || '').toLowerCase();
            const realName = (request.steam_real_name || '').toLowerCase();
            const steamId = (request.steam_id || '').toLowerCase();
            
            return username.includes(searchTerm) || 
                   realName.includes(searchTerm) || 
                   steamId.includes(searchTerm);
        });
    }, [pendingRequests, pendingFilter]);

    // Filter sent requests based on search term
    const filteredSentRequests = useMemo(() => {
        if (!sentRequests || !sentFilter.trim()) {
            return sentRequests || [];
        }

        const searchTerm = sentFilter.toLowerCase().trim();
        return sentRequests.filter((request: PendingRequest) => {
            const username = (request.steam_username || '').toLowerCase();
            const realName = (request.steam_real_name || '').toLowerCase();
            const steamId = (request.steam_id || '').toLowerCase();
            
            return username.includes(searchTerm) || 
                   realName.includes(searchTerm) || 
                   steamId.includes(searchTerm);
        });
    }, [sentRequests, sentFilter]);

    // Filter blocked friends based on search term
    const filteredBlockedFriends = useMemo(() => {
        if (!blockedFriends || !blockedFilter.trim()) {
            return blockedFriends || [];
        }

        const searchTerm = blockedFilter.toLowerCase().trim();
        return blockedFriends.filter((blocked: PendingRequest) => {
            const username = (blocked.steam_username || '').toLowerCase();
            const realName = (blocked.steam_real_name || '').toLowerCase();
            const steamId = (blocked.steam_id || '').toLowerCase();
            
            return username.includes(searchTerm) || 
                   realName.includes(searchTerm) || 
                   steamId.includes(searchTerm);
        });
    }, [blockedFriends, blockedFilter]);

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

    const searchUsers = async (query: string) => {
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const response = await fetch('/friends/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ query }),
            });

            if (response.ok) {
                const data = await response.json();
                setSearchResults(data.users || []);
            } else {
                setSearchResults([]);
            }
        } catch (error) {
            console.error('Search failed:', error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        searchUsers(query);
    };

    const addFriend = (friendId: number) => {
        router.post('/friends/add',
            { friend_id: friendId },
            {
                onSuccess: () => {
                    setShowAddModal(false);
                    setSearchQuery('');
                    setSearchResults([]);
                }
            }
        );
    };

    const acceptFriend = (friendId: number) => {
        router.post('/friends/accept', 
            { friend_id: friendId }
        );
    };

    const rejectFriend = (friendId: number) => {
        const user = pendingRequests.find(req => req.id === friendId);
        if (user) {
            setConfirmAction({
                type: 'reject',
                user: user,
                message: `Are you sure you want to reject the friend request from ${user.steam_real_name || user.steam_username}?`
            });
            setShowConfirmModal(true);
        }
    };

    const confirmRejectFriend = () => {
        if (!confirmAction) return;

        router.post('/friends/reject',
            { friend_id: confirmAction.user.id },
            {
                onSuccess: () => {
                    setShowConfirmModal(false);
                    setConfirmAction(null);
                }
            }
        );
    };

    const removeFriend = (friendId: number) => {
        const user = friends.find(friend => friend.id === friendId);
        if (user) {
            setConfirmAction({
                type: 'remove',
                user: user,
                message: `Are you sure you want to remove ${user.steam_real_name || user.steam_username} from your friends list?`
            });
            setShowConfirmModal(true);
        }
    };

    const confirmRemoveFriend = () => {
        if (!confirmAction) return;

        router.post('/friends/remove',
            { friend_id: confirmAction.user.id },
            {
                onSuccess: () => {
                    setShowConfirmModal(false);
                    setConfirmAction(null);
                }
            }
        );
    };

    const blockFriend = (friendId: number, reason?: string) => {
        router.post('/friends/block', 
            { friend_id: friendId, reason },
            {
                onSuccess: () => {
                    setShowBlockModal(false);
                    setBlockReason('');
                    setSelectedUser(null);
                }
            }
        );
    };

    const unblockFriend = (friendId: number) => {
        const user = blockedFriends.find(blocked => blocked.id === friendId);
        if (user) {
            setConfirmAction({
                type: 'unblock',
                user: user,
                message: `Are you sure you want to unblock ${user.steam_real_name || user.steam_username}?`
            });
            setShowConfirmModal(true);
        }
    };

    const confirmUnblockFriend = () => {
        if (!confirmAction) return;

        router.post('/friends/unblock',
            { friend_id: confirmAction.user.id },
            {
                onSuccess: () => {
                    setShowConfirmModal(false);
                    setConfirmAction(null);
                }
            }
        );
    };

    const cancelPendingRequest = (friendId: number) => {
        const user = sentRequests.find(req => req.id === friendId);
        if (user) {
            setConfirmAction({
                type: 'cancel',
                user: user,
                message: `Are you sure you want to cancel the friend request to ${user.steam_real_name || user.steam_username}?`
            });
            setShowConfirmModal(true);
        }
    };

    const confirmCancelPendingRequest = () => {
        if (!confirmAction) return;

        router.post('/friends/cancel',
            { friend_id: confirmAction.user.id },
            {
                onSuccess: () => {
                    setShowConfirmModal(false);
                    setConfirmAction(null);
                }
            }
        );
    };

    const openBlockModal = (user: Friend) => {
        setSelectedUser(user);
        setShowBlockModal(true);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
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

    return (
        <>
            <Head title="Friends">
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

                {/* Flash Messages */}
                {flash?.success && (
                    <div className="bg-green-600/20 border border-green-600/30 text-green-400 px-4 py-3 mx-4 mt-4 rounded-lg">
                        <div className="flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {flash.success}
                        </div>
                    </div>
                )}
                {flash?.error && (
                    <div className="bg-red-600/20 border border-red-600/30 text-red-400 px-4 py-3 mx-4 mt-4 rounded-lg">
                        <div className="flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            {flash.error}
                        </div>
                    </div>
                )}

                <div className="container mx-auto px-4 py-8">
                    {/* Page Header */}
                    <div className="relative bg-black/5 bg-opacity-60 border-1 border-[#f79631]/20 rounded p-6 mb-8 overflow-hidden">
                        <div
                            className="absolute inset-0 bg-right bg-center bg-no-repeat opacity-20"
                            style={{
                                backgroundImage: 'url("/images/binchilli.png")',
                            }}
                        ></div>

                        <div className="absolute inset-0 bg-black/40"></div>
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <h1 className="font-['FACERG'] text-[#f79631] text-4xl font-bold uppercase tracking-wider">
                                    FRIENDS
                                </h1>
                                <p className="text-gray-300 text-lg font-['Trebuchet']">
                                    Manage your friends list and connect with other players
                                </p>
                            </div>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="font-['FACERG'] text-[#f79631] text-xl font-bold uppercase tracking-wider hover:text-yellow-300 transition-colors px-6 py-3 border border-[#f79631]/30 rounded hover:border-[#f79631]/60"
                                onMouseEnter={playHoverSound}
                            >
                                + ADD FRIEND
                            </button>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex mb-8">
                        <button
                            onClick={() => setActiveTab('friends')}
                            className={`px-8 py-4 text-xl font-bold uppercase tracking-wider transition-colors relative ${activeTab === 'friends'
                                ? 'text-[#f79631]'
                                : 'text-gray-400 hover:text-[#f79631]'
                                }`}
                            onMouseEnter={playHoverSound}
                            style={{
                                border: 'none',
                                background: 'none',
                            }}
                        >
                            <span className="relative z-10">FRIENDS ({filteredFriends?.length || 0})</span>
                            {activeTab === 'friends' && (
                                <div className="absolute left-1/2 bottom-0 w-16 rounded-full h-1 bg-[#f79631] transform -translate-x-1/2" />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('pending')}
                            className={`px-6 py-4 text-xl font-bold uppercase tracking-wider transition-colors relative ${activeTab === 'pending'
                                ? 'text-[#f79631]'
                                : 'text-gray-400 hover:text-[#f79631]'
                                }`}
                            onMouseEnter={playHoverSound}
                            style={{
                                border: 'none',
                                background: 'none',
                            }}
                        >
                            <span className="relative z-10">PENDING ({filteredPendingRequests?.length || 0})</span>
                            {activeTab === 'pending' && (
                                <div className="absolute left-1/2 bottom-0 w-16 rounded-full h-1 bg-[#f79631] transform -translate-x-1/2" />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('sent')}
                            className={`px-6 py-4 text-xl font-bold uppercase tracking-wider transition-colors relative ${activeTab === 'sent'
                                ? 'text-[#f79631]'
                                : 'text-gray-400 hover:text-[#f79631]'
                                }`}
                            onMouseEnter={playHoverSound}
                            style={{
                                border: 'none',
                                background: 'none',
                            }}
                        >
                            <span className="relative z-10">SENT ({filteredSentRequests?.length || 0})</span>
                            {activeTab === 'sent' && (
                                <div className="absolute left-1/2 bottom-0 w-16 rounded-full h-1 bg-[#f79631] transform -translate-x-1/2" />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('blocked')}
                            className={`px-6 py-4 text-xl font-bold uppercase tracking-wider transition-colors relative ${activeTab === 'blocked'
                                ? 'text-[#f79631]'
                                : 'text-gray-400 hover:text-[#f79631]'
                                }`}
                            onMouseEnter={playHoverSound}
                            style={{
                                border: 'none',
                                background: 'none',
                            }}
                        >
                            <span className="relative z-10">BLOCKED ({filteredBlockedFriends?.length || 0})</span>
                            {activeTab === 'blocked' && (
                                <div className="absolute left-1/2 bottom-0 w-16 rounded-full h-1 bg-[#f79631] transform -translate-x-1/2" />
                            )}
                        </button>
                    </div>

                    {/* Friends Tab */}
                    {activeTab === 'friends' && (
                        <div className=" bg-opacity-60 border-1 border-[#f79631]/20 rounded">
                            <div className="flex items-center justify-between px-4 pt-6">
                                <h3 className="font-['FACERG'] text-[#f79631] text-2xl font-bold uppercase tracking-wider">YOUR FRIENDS</h3>
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

                            {/* Results count */}
                            <div className="px-4 mb-4">
                                <div className="text-sm text-gray-400 font-['Trebuchet']">
                                    Showing {filteredFriends.length} of {friends?.length || 0} friends
                                    {friendsFilter && (
                                        <span className="text-[#f79631] ml-2">
                                            (filtered by "{friendsFilter}")
                                        </span>
                                    )}
                                </div>
                            </div>

                            {filteredFriends && filteredFriends.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm font-['Trebuchet']">
                                        <thead>
                                            <tr className="">
                                                <th className="text-left py-4 px-6 text-[#f79631] font-bold uppercase tracking-wider border-b border-[#f79631]/20">#</th>
                                                <th className="text-left py-4 px-6 text-[#f79631] font-bold uppercase tracking-wider border-b border-[#f79631]/20">User</th>
                                                <th className="text-left py-4 px-6 text-[#f79631] font-bold uppercase tracking-wider border-b border-[#f79631]/20">ELO</th>
                                                <th className="text-left py-4 px-6 text-[#f79631] font-bold uppercase tracking-wider border-b border-[#f79631]/20">Joined</th>
                                                <th className="text-left py-4 px-6 text-[#f79631] font-bold uppercase tracking-wider border-b border-[#f79631]/20">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredFriends.map((friend, index) => (
                                                <tr key={friend.id} className="border-b border-[#f79631]/10 hover:bg-black/20 transition-all duration-200 group">
                                                    <td className="py-4 px-6 text-white font-medium">{index + 1}</td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center space-x-4">
                                                            {friend.steam_avatar_medium && (
                                                                <img
                                                                    src={friend.steam_avatar_medium}
                                                                    alt="Avatar"
                                                                    className="w-12 h-12 rounded-lg border border-[#f79631]/20"
                                                                />
                                                            )}
                                                            <div>
                                                                <div className="text-white font-semibold text-base">
                                                                    {friend.steam_real_name || friend.steam_username || 'Unknown'}
                                                                </div>
                                                                <div className="text-gray-400 text-sm">
                                                                    {friend.steam_id}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center">
                                                            <span className="text-[#f79631] font-bold text-lg">{friend.elo || 0}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6 text-gray-300">{formatDate(friend.created_at)}</td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex space-x-3">
                                                            <button
                                                                onClick={() => removeFriend(friend.id)}
                                                                className="px-3 py-1.5 bg-red-600/20 text-red-400 hover:bg-red-600/30 hover:text-red-300 text-xs font-['Trebuchet'] transition-all duration-200  border border-red-600/30 hover:border-red-600/50"
                                                            >
                                                                Remove
                                                            </button>
                                                            <button
                                                                onClick={() => openBlockModal(friend)}
                                                                className="px-3 py-1.5 bg-orange-600/20 text-orange-400 hover:bg-orange-600/30 hover:text-orange-300 text-xs font-['Trebuchet'] transition-all duration-200  border border-orange-600/30 hover:border-orange-600/50"
                                                            >
                                                                Block
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="p-8 text-center">
                                    {!friends || friends.length === 0 ? (
                                        <>
                                            <p className="text-gray-400 font-['Trebuchet'] text-lg">No friends yet</p>
                                            <p className="text-gray-500 font-['Trebuchet'] text-sm mt-2">Add some friends to get started!</p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-gray-400 font-['Trebuchet'] text-lg">No friends found</p>
                                            <p className="text-gray-500 font-['Trebuchet'] text-sm mt-2">
                                                No friends match "{friendsFilter}"
                                            </p>
                                            <button
                                                onClick={() => setFriendsFilter('')}
                                                className="mt-4 px-4 py-2 text-[#f79631]  text-sm font-['Trebuchet'] transition-colors border border-[#f79631]/20"
                                            >
                                                Clear filter
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Pending Requests Tab */}
                    {activeTab === 'pending' && (
                        <div className=" bg-opacity-60 border-1 border-[#f79631]/20 rounded">
                            <div className="flex items-center justify-between px-4 pt-6">
                                <h3 className="font-['FACERG'] text-[#f79631] text-2xl font-bold uppercase tracking-wider">PENDING REQUESTS</h3>
                                <div className="w-80">
                                    <FriendsFilter 
                                        onFilterChange={setPendingFilter}
                                        placeholder="Search pending requests by username, Steam ID, or real name..."
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
                                    Showing {filteredPendingRequests.length} of {pendingRequests?.length || 0} pending requests
                                    {pendingFilter && (
                                        <span className="text-[#f79631] ml-2">
                                            (filtered by "{pendingFilter}")
                                        </span>
                                    )}
                                </div>
                            </div>

                            {filteredPendingRequests && filteredPendingRequests.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm font-['Trebuchet']">
                                        <thead>
                                            <tr className="">
                                                <th className="text-left py-4 px-6 text-[#f79631] font-bold uppercase tracking-wider border-b border-[#f79631]/20">#</th>
                                                <th className="text-left py-4 px-6 text-[#f79631] font-bold uppercase tracking-wider border-b border-[#f79631]/20">User</th>
                                                <th className="text-left py-4 px-6 text-[#f79631] font-bold uppercase tracking-wider border-b border-[#f79631]/20">ELO</th>
                                                <th className="text-left py-4 px-6 text-[#f79631] font-bold uppercase tracking-wider border-b border-[#f79631]/20">Requested</th>
                                                <th className="text-left py-4 px-6 text-[#f79631] font-bold uppercase tracking-wider border-b border-[#f79631]/20">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredPendingRequests.map((request, index) => (
                                                <tr key={request.id} className="border-b border-[#f79631]/10 hover:bg-black/20 transition-all duration-200 group">
                                                    <td className="py-4 px-6 text-white font-medium">{index + 1}</td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center space-x-4">
                                                            {request.steam_avatar_medium && (
                                                                <img
                                                                    src={request.steam_avatar_medium}
                                                                    alt="Avatar"
                                                                    className="w-12 h-12 rounded-lg border border-[#f79631]/20"
                                                                />
                                                            )}
                                                            <div>
                                                                <div className="text-white font-semibold text-base">
                                                                    {request.steam_real_name || request.steam_username || 'Unknown'}
                                                                </div>
                                                                <div className="text-gray-400 text-sm">
                                                                    {request.steam_id}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center">
                                                            <span className="text-[#f79631] font-bold text-lg">{request.elo || 0}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6 text-gray-300">{formatDate(request.pivot?.created_at || request.created_at)}</td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex space-x-3">
                                                            <button
                                                                onClick={() => acceptFriend(request.id)}
                                                                className="px-3 py-1.5 bg-green-600/20 text-green-400 hover:bg-green-600/30 hover:text-green-300 text-xs font-['Trebuchet'] transition-all duration-200  border border-green-600/30 hover:border-green-600/50"
                                                            >
                                                                Accept
                                                            </button>
                                                            <button
                                                                onClick={() => rejectFriend(request.id)}
                                                                className="px-3 py-1.5 bg-red-600/20 text-red-400 hover:bg-red-600/30 hover:text-red-300 text-xs font-['Trebuchet'] transition-all duration-200  border border-red-600/30 hover:border-red-600/50"
                                                            >
                                                                Reject
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="p-8 text-center">
                                    <p className="text-gray-400 font-['Trebuchet'] text-lg">No pending requests</p>
                                    <p className="text-gray-500 font-['Trebuchet'] text-sm mt-2">You don't have any pending friend requests</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Sent Requests Tab */}
                    {activeTab === 'sent' && (
                        <div className=" bg-opacity-60 border-1 border-[#f79631]/20 rounded">
                            <div className="flex items-center justify-between px-4 pt-6">
                                <h3 className="font-['FACERG'] text-[#f79631] text-2xl font-bold uppercase tracking-wider">SENT REQUESTS</h3>
                                <div className="w-80">
                                    <FriendsFilter 
                                        onFilterChange={setSentFilter}
                                        placeholder="Search sent requests by username, Steam ID, or real name..."
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
                                    Showing {filteredSentRequests.length} of {sentRequests?.length || 0} sent requests
                                    {sentFilter && (
                                        <span className="text-[#f79631] ml-2">
                                            (filtered by "{sentFilter}")
                                        </span>
                                    )}
                                </div>
                            </div>

                            {filteredSentRequests && filteredSentRequests.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm font-['Trebuchet']">
                                        <thead>
                                            <tr className="">
                                                <th className="text-left py-4 px-6 text-[#f79631] font-bold uppercase tracking-wider border-b border-[#f79631]/20">#</th>
                                                <th className="text-left py-4 px-6 text-[#f79631] font-bold uppercase tracking-wider border-b border-[#f79631]/20">User</th>
                                                <th className="text-left py-4 px-6 text-[#f79631] font-bold uppercase tracking-wider border-b border-[#f79631]/20">ELO</th>
                                                <th className="text-left py-4 px-6 text-[#f79631] font-bold uppercase tracking-wider border-b border-[#f79631]/20">Sent</th>
                                                <th className="text-left py-4 px-6 text-[#f79631] font-bold uppercase tracking-wider border-b border-[#f79631]/20">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredSentRequests.map((request, index) => (
                                                <tr key={request.id} className="border-b border-[#f79631]/10 hover:bg-black/20 transition-all duration-200 group">
                                                    <td className="py-4 px-6 text-white font-medium">{index + 1}</td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center space-x-4">
                                                            {request.steam_avatar_medium && (
                                                                <img
                                                                    src={request.steam_avatar_medium}
                                                                    alt="Avatar"
                                                                    className="w-12 h-12 rounded-lg border border-[#f79631]/20"
                                                                />
                                                            )}
                                                            <div>
                                                                <div className="text-white font-semibold text-base">
                                                                    {request.steam_real_name || request.steam_username || 'Unknown'}
                                                                </div>
                                                                <div className="text-gray-400 text-sm">
                                                                    {request.steam_id}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center">
                                                            <span className="text-[#f79631] font-bold text-lg">{request.elo || 0}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6 text-gray-300">{formatDate(request.pivot?.created_at || request.created_at)}</td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center space-x-3">
                                                            <span className="px-3 py-1 bg-yellow-600/20 text-yellow-400 text-xs font-['Trebuchet'] border border-yellow-600/30">Pending</span>
                                                            <button
                                                                onClick={() => cancelPendingRequest(request.id)}
                                                                className="px-3 py-1 bg-red-600/20 text-red-400 text-xs font-['Trebuchet'] border border-red-600/30 hover:bg-red-600/30 hover:text-red-300 transition-colors"
                                                                onMouseEnter={playHoverSound}
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="p-8 text-center">
                                    {!sentRequests || sentRequests.length === 0 ? (
                                        <>
                                            <p className="text-gray-400 font-['Trebuchet'] text-lg">No sent requests</p>
                                            <p className="text-gray-500 font-['Trebuchet'] text-sm mt-2">You haven't sent any friend requests yet</p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-gray-400 font-['Trebuchet'] text-lg">No sent requests found</p>
                                            <p className="text-gray-500 font-['Trebuchet'] text-sm mt-2">
                                                No sent requests match "{sentFilter}"
                                            </p>
                                            <button
                                                onClick={() => setSentFilter('')}
                                                className="mt-4 px-4 py-2 text-[#f79631] hover:text-yellow-300 text-sm font-['Trebuchet'] transition-colors"
                                            >
                                                Clear filter
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Blocked Users Tab */}
                    {activeTab === 'blocked' && (
                        <div className=" bg-opacity-60 border-1 border-[#f79631]/20 rounded">
                            <div className="flex items-center justify-between px-4 pt-6">
                                <h3 className="font-['FACERG'] text-[#f79631] text-2xl font-bold uppercase tracking-wider">BLOCKED USERS</h3>
                                <div className="w-80">
                                    <FriendsFilter 
                                        onFilterChange={setBlockedFilter}
                                        placeholder="Search blocked users by username, Steam ID, or real name..."
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
                                    Showing {filteredBlockedFriends.length} of {blockedFriends?.length || 0} blocked users
                                    {blockedFilter && (
                                        <span className="text-[#f79631] ml-2">
                                            (filtered by "{blockedFilter}")
                                        </span>
                                    )}
                                </div>
                            </div>

                            {filteredBlockedFriends && filteredBlockedFriends.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm font-['Trebuchet']">
                                        <thead>
                                            <tr className="">
                                                <th className="text-left py-4 px-6 text-[#f79631] font-bold uppercase tracking-wider border-b border-[#f79631]/20">#</th>
                                                <th className="text-left py-4 px-6 text-[#f79631] font-bold uppercase tracking-wider border-b border-[#f79631]/20">User</th>
                                                <th className="text-left py-4 px-6 text-[#f79631] font-bold uppercase tracking-wider border-b border-[#f79631]/20">ELO</th>
                                                <th className="text-left py-4 px-6 text-[#f79631] font-bold uppercase tracking-wider border-b border-[#f79631]/20">Blocked</th>
                                                <th className="text-left py-4 px-6 text-[#f79631] font-bold uppercase tracking-wider border-b border-[#f79631]/20">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredBlockedFriends.map((blocked, index) => (
                                                <tr key={blocked.id} className="border-b border-[#f79631]/10 hover:bg-black/20 transition-all duration-200 group">
                                                    <td className="py-4 px-6 text-white font-medium">{index + 1}</td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center space-x-4">
                                                            {blocked.steam_avatar_medium && (
                                                                <img
                                                                    src={blocked.steam_avatar_medium}
                                                                    alt="Avatar"
                                                                    className="w-12 h-12 rounded-lg border border-[#f79631]/20"
                                                                />
                                                            )}
                                                            <div>
                                                                <div className="text-white font-semibold text-base">
                                                                    {blocked.steam_real_name || blocked.steam_username || 'Unknown'}
                                                                </div>
                                                                <div className="text-gray-400 text-sm">
                                                                    {blocked.steam_id}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center">
                                                            <span className="text-[#f79631] font-bold text-lg">{blocked.elo || 0}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6 text-gray-300">{formatDate(blocked.pivot?.created_at || blocked.created_at)}</td>
                                                    <td className="py-4 px-6">
                                                        <button
                                                            onClick={() => unblockFriend(blocked.id)}
                                                            className="px-3 py-1.5 bg-green-600/20 text-green-400 hover:bg-green-600/30 hover:text-green-300 text-xs font-['Trebuchet'] transition-all duration-200 rounded border border-green-600/30 hover:border-green-600/50"
                                                        >
                                                            Unblock
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="p-8 text-center">
                                    {!blockedFriends || blockedFriends.length === 0 ? (
                                        <>
                                            <p className="text-gray-400 font-['Trebuchet'] text-lg">No blocked users</p>
                                            <p className="text-gray-500 font-['Trebuchet'] text-sm mt-2">You haven't blocked any users</p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-gray-400 font-['Trebuchet'] text-lg">No blocked users found</p>
                                            <p className="text-gray-500 font-['Trebuchet'] text-sm mt-2">
                                                No blocked users match "{blockedFilter}"
                                            </p>
                                            <button
                                                onClick={() => setBlockedFilter('')}
                                                className="mt-4 px-4 py-2 text-[#f79631] hover:text-yellow-300 text-sm font-['Trebuchet'] transition-colors"
                                            >
                                                Clear filter
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Add Friend Modal */}
                    {showAddModal && (
                        <div className="fixed inset-0 bg-black/50  flex items-center justify-center z-50">
                            <div className="bg-black/30  backdrop-blur-xl border border-[#f79631]/30  p-6 w-full max-w-md">
                                <h3 className="font-['FACERG'] text-[#f79631] text-2xl font-bold uppercase tracking-wider mb-4">ADD FRIEND</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-gray-300 text-sm font-['Trebuchet'] mb-2">
                                            Search by Steam ID, Username, or Real Name:
                                        </label>
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={handleSearchChange}
                                            placeholder="Enter Steam ID, username, or real name..."
                                            className="w-full px-3 py-2 bg-black/50 border border-[#f79631]/30 rounded text-white placeholder-gray-400 focus:border-[#f79631]/60 focus:outline-none"
                                        />
                                    </div>

                                    {isSearching && (
                                        <div className="text-center text-gray-400 font-['Trebuchet']">
                                            Searching...
                                        </div>
                                    )}

                                    {searchResults.length > 0 && (
                                        <div className="max-h-60 overflow-y-auto">
                                            <div className="space-y-2">
                                                {searchResults.map((user) => (
                                                    <div key={user.id} className="flex items-center justify-between p-3 bg-black/30 border border-[#f79631]/20 rounded">
                                                        <div className="flex items-center space-x-3">
                                                            {user.steam_avatar_medium && (
                                                                <img
                                                                    src={user.steam_avatar_medium}
                                                                    alt="Avatar"
                                                                    className="w-8 h-8 rounded"
                                                                />
                                                            )}
                                                            <div>
                                                                <div className="text-white font-medium text-sm">
                                                                    {user.steam_real_name || user.steam_username || 'Unknown'}
                                                                </div>
                                                                <div className="text-gray-400 text-xs">
                                                                    ELO: {user.elo || 0} | Joined: {formatDate(user.created_at)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => addFriend(user.id)}
                                                            disabled={!user.can_add}
                                                            className={`px-3 py-1 text-xs font-['Trebuchet']  transition-colors ${user.can_add
                                                                    ? 'bg-[#f79631] text-black hover:bg-yellow-600'
                                                                    : 'border-[#f79631]/30 border cursor-not-allowed'
                                                                }`}
                                                        >
                                                            {user.relationship_status === 'pending' ? 'Pending' :
                                                                user.relationship_status === 'accepted' ? 'Friends' :
                                                                    user.relationship_status === 'blocked' ? 'Blocked' : 'Add'}
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
                                        <div className="text-center text-gray-400 font-['Trebuchet']">
                                            No users found
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end space-x-3 mt-6">
                                    <button
                                        onClick={() => {
                                            setShowAddModal(false);
                                            setSearchQuery('');
                                            setSearchResults([]);
                                        }}
                                        className="px-4 py-2 text-white font-['Trebuchet'] bg-black/30 backdrop-blur-xl border border-[#f79631]/30"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Block User Modal */}
                    {showBlockModal && selectedUser && (
                        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
                            <div className="bg-black/50 border border-[#f79631]/30  p-6 w-full max-w-md mx-4">
                                <div className="relative">
                                    <h3 className="font-['FACERG'] text-[#f79631] text-2xl font-bold uppercase tracking-wider mb-6">BLOCK USER</h3>
                                    <div
                                        className="w-[30%] h-0.5 mb-6 rounded-full"
                                        style={{
                                            background: "linear-gradient(to right,rgba(247, 151, 49, 0.45) 0%, rgba(247, 151, 49, 0.25) 50%, rgba(247,151,49,0) 100%)"
                                        }}
                                    ></div>
                                    
                                    <div className="space-y-6">
                                        <div className="flex items-center space-x-4 p-4 bg-black/30 border border-[#f79631]/20 ">
                                            {selectedUser.steam_avatar_medium && (
                                                <img
                                                    src={selectedUser.steam_avatar_medium}
                                                    alt="Avatar"
                                                    className="w-12 h-12 rounded-lg border border-[#f79631]/20"
                                                />
                                            )}
                                            <div>
                                                <div className="text-white font-semibold text-lg">
                                                    {selectedUser.steam_real_name || selectedUser.steam_username || 'Unknown'}
                                                </div>
                                                <div className="text-gray-400 text-sm">
                                                    {selectedUser.steam_id}
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-gray-300 text-sm font-['Trebuchet'] mb-3">
                                                Reason for blocking (optional):
                                            </label>
                                            <textarea
                                                value={blockReason}
                                                onChange={(e) => setBlockReason(e.target.value)}
                                                placeholder="Enter reason for blocking..."
                                                className="w-full px-4 py-3 bg-black/50 border border-[#f79631]/30  text-white placeholder-gray-400 focus:border-[#f79631]/60 focus:outline-none h-24 resize-none font-['Trebuchet']"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end space-x-4 mt-8">
                                        <button
                                            onClick={() => {
                                                setShowBlockModal(false);
                                                setBlockReason('');
                                                setSelectedUser(null);
                                            }}
                                            className="px-6 py-2 text-gray-400 hover:text-white font-['Trebuchet'] transition-colors border  border-[#f79631]/20"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => blockFriend(selectedUser.id, blockReason)}
                                            className="px-6 py-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 hover:text-red-300 font-['Trebuchet']  border border-red-600/30 hover:border-red-600/50 transition-all duration-200"
                                        >
                                            Block User
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}


                    {/* Confirmation Modal */}
                    {showConfirmModal && confirmAction && (
                        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
                            <div className="bg-black/90 border border-[#f79631]/30  p-6 w-full max-w-md mx-4">
                                <div className="text-center">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center">
                                        <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                        </svg>
                                    </div>
                                    <h3 className="font-['FACERG'] text-[#f79631] text-xl font-bold uppercase tracking-wider mb-4">CONFIRM ACTION</h3>
                                    <p className="text-gray-300 font-['Trebuchet'] mb-6">{confirmAction.message}</p>
                                    <div className="flex justify-center space-x-4">
                                        <button
                                            onClick={() => {
                                                setShowConfirmModal(false);
                                                setConfirmAction(null);
                                            }}
                                            className="px-6 py-2 text-gray-400 hover:text-white font-['Trebuchet'] transition-colors border border-[#f79631]/30 "
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (confirmAction.type === 'remove') {
                                                    confirmRemoveFriend();
                                                } else if (confirmAction.type === 'reject') {
                                                    confirmRejectFriend();
                                                } else if (confirmAction.type === 'unblock') {
                                                    confirmUnblockFriend();
                                                } else if (confirmAction.type === 'cancel') {
                                                    confirmCancelPendingRequest();
                                                }
                                            }}
                                            className={`px-6 py-2 font-['Trebuchet'] border transition-all duration-200 ${
                                                confirmAction.type === 'remove' 
                                                    ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30 hover:text-red-300 border-red-600/30 hover:border-red-600/50'
                                                    : confirmAction.type === 'reject'
                                                    ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30 hover:text-red-300 border-red-600/30 hover:border-red-600/50'
                                                    : confirmAction.type === 'cancel'
                                                    ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30 hover:text-red-300 border-red-600/30 hover:border-red-600/50'
                                                    : 'bg-green-600/20 text-green-400 hover:bg-green-600/30 hover:text-green-300 border-green-600/30 hover:border-green-600/50'
                                            }`}
                                        >
                                            {confirmAction.type === 'remove' ? 'Remove' : 
                                             confirmAction.type === 'reject' ? 'Reject' : 
                                             confirmAction.type === 'cancel' ? 'Cancel Request' : 'Unblock'}
                                        </button>
                                    </div>
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
