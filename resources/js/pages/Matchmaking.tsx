import React, { useState, useEffect } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { Search, Users, Shield, Globe, Crown, UserPlus, X, Check, XCircle, UserMinus, Copy, CheckCheck } from 'lucide-react';
import CustomDropdown from '@/components/CustomDropdown';
import TeamPartyCard from '@/components/TeamPartyCard';

interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    steam_id?: string;
    steam_username?: string;
    steam_avatar_medium?: string;
    steam_avatar_full?: string;
    steam_profile_url?: string;
    steam_real_name?: string;
    elo?: number;
    country?: string;
    country_flag?: string;
    role?: string;
    [key: string]: unknown;
}

interface Team {
    id: number;
    team_id: string;
    name?: string;
    is_private: boolean;
    status: string;
    region: string;
    max_players: number;
    user_ids: number[];
    leader_id: number;
    created_at: string;
    updated_at: string;
    leader: User;
    members: User[];
    is_in_active_match?: boolean;
    can_be_challenged?: boolean;
}

interface MatchmakingInvitation {
    id: number;
    team_id: number;
    inviter_id: number;
    invited_user_id: number;
    status: string;
    expires_at: string;
    created_at: string;
    updated_at: string;
    team: Team;
    inviter: User;
}

interface TeamChallengeRequest {
    id: number;
    challenger_team_id: number;
    challenged_team_id: number;
    status: string;
    expires_at: string;
    message?: string;
    created_at: string;
    updated_at: string;
    challenger_team: Team;
    challenged_team: Team;
    challenger_ready: boolean;
    challenged_ready: boolean;
    match_started_at?: string;
    match_id?: string;
    server_info?: {
        ip: string;
        port: number;
        name: string;
        password?: string;
    };
}

interface MatchmakingProps {
    teams: Team[];
    userTeam: Team | null;
    pendingInvitations: MatchmakingInvitation[];
    pendingChallenges: TeamChallengeRequest[];
    acceptedChallenges: TeamChallengeRequest[];
}

const Matchmaking: React.FC<MatchmakingProps> = ({
    teams: initialTeams,
    userTeam: initialUserTeam,
    pendingInvitations: initialInvitations,
    pendingChallenges: initialPendingChallenges,
    acceptedChallenges: initialAcceptedChallenges
}) => {
    // Get current user from Inertia shared props
    const page = usePage<{ auth?: { user?: User | null } }>();
    const currentUser = (page?.props as any)?.auth?.user ?? null as User | null;
    const authUserId = currentUser ? Number((currentUser as User).id) : null;

    const [teams, setTeams] = useState<Team[]>(initialTeams || []);
    const [userTeam, setUserTeam] = useState<Team | null>(initialUserTeam);
    const [pendingInvitations, setPendingInvitations] = useState<MatchmakingInvitation[]>(initialInvitations || []);
    const [pendingChallenges, setPendingChallenges] = useState<TeamChallengeRequest[]>(initialPendingChallenges || []);
    const [acceptedChallenges, setAcceptedChallenges] = useState<TeamChallengeRequest[]>(initialAcceptedChallenges || []);
    const [isLoading, setIsLoading] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [friends, setFriends] = useState<User[]>([]);
    const [selectedFriends, setSelectedFriends] = useState<number[]>([]);
    const [teamFilter, setTeamFilter] = useState('');
    const [regionFilter, setRegionFilter] = useState('all');
    const [showChallengeModal, setShowChallengeModal] = useState(false);
    const [challengeMessage, setChallengeMessage] = useState('');
    const [editingTeamName, setEditingTeamName] = useState(false);
    const [newTeamName, setNewTeamName] = useState('');
    const [serverInfo, setServerInfo] = useState<{ ip: string, port: number, name: string, password?: string } | null>(null);
    const [matchResults, setMatchResults] = useState<any[]>([]);
    const [startingMatch, setStartingMatch] = useState<number | null>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [connectingToServer, setConnectingToServer] = useState(false);
    const [inQueue, setInQueue] = useState(false);
    const [queueJoinedAt, setQueueJoinedAt] = useState<number | null>(null);
    const [queueElapsed, setQueueElapsed] = useState<string>('00:00');
    const [queueCount, setQueueCount] = useState<{ players: number, teams: number, solos: number }>({ players: 0, teams: 0, solos: 0 });
    const [vetoStatus, setVetoStatus] = useState<any>(null);
    const [selectedMapToBan, setSelectedMapToBan] = useState<string | null>(null);
    const [turnTimeRemaining, setTurnTimeRemaining] = useState<number>(120); // 2 minutes per turn

    const availableMaps = [
        { name: 'de_ancient', displayName: 'Ancient' },
        { name: 'de_anubis', displayName: 'Anubis' },
        { name: 'de_dust2', displayName: 'Dust2' },
        { name: 'de_inferno', displayName: 'Inferno' },
        { name: 'de_mirage', displayName: 'Mirage' },
        { name: 'de_nuke', displayName: 'Nuke' },
        { name: 'de_vertigo', displayName: 'Vertigo' },
    ];

    const regions = [
        { value: 'all', label: 'All Regions' },
        { value: 'US', label: 'US' },
        { value: 'EU', label: 'EU' },
        { value: 'AS', label: 'Asia' },
        { value: 'OC', label: 'Oceania' }
    ];

    // Polling for updates every 5 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            fetchTeams();
            fetchUserTeam();
            fetchInvitations();
            fetchChallenges();
            checkMatchResults();
            checkConnectionTimeouts();

            // Poll veto status for active challenges
            acceptedChallenges.forEach(challenge => {
                if (challenge.challenger_ready && challenge.challenged_ready && !challenge.match_started_at) {
                    fetchVetoStatus(challenge.id);
                }
            });
        }, 5000);

        return () => clearInterval(interval);
    }, [acceptedChallenges]);

    // Also fetch immediately on mount to reflect team changes without full reload
    useEffect(() => {
        fetchTeams();
        fetchUserTeam();
        fetchInvitations();
        fetchChallenges();
    }, []);

    // Fetch veto status when both teams are ready
    useEffect(() => {
        acceptedChallenges.forEach(challenge => {
            if (challenge.challenger_ready && challenge.challenged_ready && !challenge.match_started_at) {
                fetchVetoStatus(challenge.id);
            }
        });
    }, [acceptedChallenges]);

    // Simple 2-minute countdown per turn
    useEffect(() => {
        if (!vetoStatus || vetoStatus.veto_complete) return;

        // Reset timer to 2 minutes when turn changes
        if (vetoStatus.turn_started_at) {
            const turnStart = new Date(vetoStatus.turn_started_at).getTime();
            const now = Date.now();
            const elapsed = Math.floor((now - turnStart) / 1000);
            const remaining = Math.max(0, 120 - elapsed);
            setTurnTimeRemaining(remaining);
        }

        const interval = setInterval(() => {
            setTurnTimeRemaining(prev => Math.max(0, prev - 1));
        }, 1000);

        return () => clearInterval(interval);
    }, [vetoStatus]);

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Queue status polling and elapsed timer
    useEffect(() => {
        const poll = async () => {
            try {
                const res = await fetch('/matchmaking/queue/status');
                const data = await res.json();
                if (data.success) {
                    setInQueue(!!data.in_queue);
                    setQueueJoinedAt(data.joined_at || null);
                    setQueueCount(data.queue_count || { players: 0, teams: 0, solos: 0 });
                }
            } catch (e) {
                // noop
            }
        };
        poll();
        const id = setInterval(poll, 2000);
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        let timer: any;
        if (inQueue && queueJoinedAt) {
            const update = () => {
                const diff = Math.max(0, Math.floor(Date.now() / 1000) - Number(queueJoinedAt));
                const mm = String(Math.floor(diff / 60)).padStart(2, '0');
                const ss = String(diff % 60).padStart(2, '0');
                setQueueElapsed(`${mm}:${ss}`);
            };
            update();
            timer = setInterval(update, 1000);
        } else {
            setQueueElapsed('00:00');
        }
        return () => timer && clearInterval(timer);
    }, [inQueue, queueJoinedAt]);

    const handleJoinQueue = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/matchmaking/queue/join', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });
            const data = await response.json();
            if (data.success) {
                setInQueue(true);
                setQueueJoinedAt(data.joined_at || Math.floor(Date.now() / 1000));
                setQueueCount(data.queue_count || queueCount);
            } else {
                alert(data.error || 'Failed to join matchmaking');
            }
        } catch (e) {
            console.error('Error joining queue', e);
            alert('Failed to join matchmaking');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLeaveQueue = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/matchmaking/queue/leave', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });
            const data = await response.json();
            if (data.success) {
                setInQueue(false);
                setQueueJoinedAt(null);
                setQueueCount(data.queue_count || { players: 0, teams: 0, solos: 0 });
            } else {
                alert(data.error || 'Failed to leave matchmaking');
            }
        } catch (e) {
            console.error('Error leaving queue', e);
            alert('Failed to leave matchmaking');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchTeams = async () => {
        try {
            const response = await fetch('/matchmaking/teams');
            const data = await response.json();
            setTeams(data.teams);
        } catch (error) {
            console.error('Error fetching teams:', error);
        }
    };

    const fetchInvitations = async () => {
        try {
            const response = await fetch('/matchmaking/invitations');
            const data = await response.json();
            setPendingInvitations(data.invitations);
        } catch (error) {
            console.error('Error fetching invitations:', error);
        }
    };

    const fetchUserTeam = async () => {
        try {
            const response = await fetch('/matchmaking/user-team');
            const data = await response.json();
            setUserTeam(data.team || null);
        } catch (error) {
            console.error('Error fetching user team:', error);
        }
    };

    const fetchChallenges = async () => {
        try {
            const response = await fetch('/matchmaking/challenges');
            const data = await response.json();

            console.log('Fetched challenges:', {
                pending: data.pendingChallenges?.length || 0,
                accepted: data.acceptedChallenges?.length || 0,
                acceptedChallenges: data.acceptedChallenges
            });

            // Ensure we always set arrays, even if the API returns an error or unexpected data
            setPendingChallenges(Array.isArray(data.pendingChallenges) ? data.pendingChallenges : []);
            setAcceptedChallenges(Array.isArray(data.acceptedChallenges) ? data.acceptedChallenges : []);
        } catch (error) {
            console.error('Error fetching challenges:', error);
            // On error, reset to empty arrays
            setPendingChallenges([]);
            setAcceptedChallenges([]);
        }
    };

    const checkMatchResults = async () => {
        try {
            const response = await fetch('/matchmaking/check-results');
            const data = await response.json();

            if (data.success && data.matches) {
                // Filter out cancelled matches - only show matches with actual winners
                const completedMatches = data.matches.filter((match: any) => !match.is_cancelled && match.winner_team_id);
                setMatchResults(completedMatches);
            }
        } catch (error) {
            console.error('Error checking match results:', error);
        }
    };

    const checkConnectionTimeouts = async () => {
        try {
            const response = await fetch('/matchmaking/check-connection-timeouts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });
            const data = await response.json();

            if (data.success && data.cancelled_matches > 0) {
                console.log(`Cancelled ${data.cancelled_matches} matches due to connection timeout`);
                // Refresh challenges to update UI
                await fetchChallenges();
            }
        } catch (error) {
            console.error('Error checking connection timeouts:', error);
        }
    };

    const fetchVetoStatus = async (challengeId: number) => {
        try {
            const response = await fetch(`/matchmaking/veto/status/${challengeId}`);
            const data = await response.json();
            if (data.success) {
                setVetoStatus(data);
            } else if (data.veto_cancelled) {
                // Veto timed out - refresh challenges
                alert('Map veto timed out! Challenge has been cancelled.');
                await fetchChallenges();
                setVetoStatus(null);
            }
        } catch (error) {
            console.error('Error fetching veto status:', error);
        }
    };

    const handleBanMap = async (challengeId: number, mapName: string) => {
        setIsLoading(true);
        try {
            const response = await fetch('/matchmaking/veto/ban', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    challenge_id: challengeId,
                    map_name: mapName,
                }),
            });
            const data = await response.json();
            if (data.success) {
                if (data.veto_complete) {
                    // Veto is complete, match is starting
                    alert(`Map vetoing complete! Final map: ${data.final_map}`);

                    // Store server information with password
                    if (data.server_ip && data.server_port) {
                        setServerInfo({
                            ip: data.server_ip,
                            port: data.server_port,
                            name: data.server_display_name || 'Match Server',
                            password: data.server_password
                        });
                    }

                    await fetchChallenges();
                } else {
                    // Continue vetoing
                    await fetchVetoStatus(challengeId);
                }
            } else {
                alert(data.error || 'Failed to ban map');
            }
        } catch (error) {
            console.error('Error banning map:', error);
            alert('Failed to ban map');
        } finally {
            setIsLoading(false);
            setSelectedMapToBan(null);
        }
    };

    const playHoverSound = () => {
        // Add sound effect here if needed
    };

    const handleCopyToClipboard = async (text: string, fieldName: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(fieldName);
            setTimeout(() => setCopiedField(null), 2000);
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
        }
    };

    const handleLogout = () => {
        router.post('/logout');
    };

    const handleCreateTeam = async (isPrivate: boolean) => {
        setIsLoading(true);
        try {
            const response = await fetch('/matchmaking/teams/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    is_private: isPrivate,
                    region: regionFilter === 'all' ? 'US' : regionFilter,
                }),
            });

            const data = await response.json();
            if (data.success) {
                setUserTeam(data.team);
                await fetchTeams();

                // Show different message based on whether user was already in a team
                if (data.already_in_team) {
                    alert(data.message || 'You are already in a team!');
                } else {
                    alert(data.message || 'Team created successfully!');
                }
            } else {
                alert(data.error || 'Failed to create team');
            }
        } catch (error) {
            console.error('Error creating team:', error);
            alert('Failed to create team');
        } finally {
            setIsLoading(false);
        }
    };

    const handleJoinRandomTeam = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/matchmaking/join-random', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            const data = await response.json();
            if (data.success) {
                setUserTeam(data.team);
                await fetchTeams();
                await fetchUserTeam();

                // Show different message based on whether user was already in a team
                if (data.already_in_team) {
                    alert(data.message || 'You are already in a team!');
                } else {
                    alert(data.message || 'Successfully joined a team!');
                }
            } else {
                alert(data.error || 'Failed to join team');
            }
        } catch (error) {
            console.error('Error joining team:', error);
            alert('Failed to join team');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLeaveTeam = async () => {
        if (!userTeam) return;

        setIsLoading(true);
        try {
            const response = await fetch('/matchmaking/leave-team', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            const data = await response.json();
            if (data.success) {
                setUserTeam(null);
                await fetchTeams();
                await fetchUserTeam();
            } else {
                alert(data.error || 'Failed to leave team');
            }
        } catch (error) {
            console.error('Error leaving team:', error);
            alert('Failed to leave team');
        } finally {
            setIsLoading(false);
        }
    };

    const openInviteModal = async (team: Team) => {
        setSelectedTeam(team);
        setShowInviteModal(true);
        setSelectedFriends([]);

        try {
            const response = await fetch('/friends/matchmaking');
            const data = await response.json();
            setFriends(data.friends);
        } catch (error) {
            console.error('Error fetching friends:', error);
        }
    };

    const closeInviteModal = () => {
        setShowInviteModal(false);
        setSelectedTeam(null);
        setSelectedFriends([]);
        setFriends([]);
    };

    const handleInviteFriends = async () => {
        if (!selectedTeam || selectedFriends.length === 0) return;

        setIsLoading(true);
        try {
            const response = await fetch('/matchmaking/teams/invite', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    team_id: selectedTeam.id,
                    friend_ids: selectedFriends,
                }),
            });

            const data = await response.json();
            if (data.success) {
                closeInviteModal();
                alert('Invitations sent successfully!');
            } else {
                alert(data.error || 'Failed to send invitations');
            }
        } catch (error) {
            console.error('Error inviting friends:', error);
            alert('Failed to send invitations');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAcceptInvitation = async (invitationId: number) => {
        setIsLoading(true);
        try {
            const response = await fetch('/matchmaking/invitations/accept', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    invitation_id: invitationId,
                }),
            });

            const data = await response.json();
            if (data.success) {
                setUserTeam(data.team);
                await fetchInvitations();
                await fetchTeams();
                await fetchUserTeam();
            } else {
                alert(data.error || 'Failed to accept invitation');
            }
        } catch (error) {
            console.error('Error accepting invitation:', error);
            alert('Failed to accept invitation');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeclineInvitation = async (invitationId: number) => {
        setIsLoading(true);
        try {
            const response = await fetch('/matchmaking/invitations/decline', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    invitation_id: invitationId,
                }),
            });

            const data = await response.json();
            if (data.success) {
                await fetchInvitations();
            } else {
                alert(data.error || 'Failed to decline invitation');
            }
        } catch (error) {
            console.error('Error declining invitation:', error);
            alert('Failed to decline invitation');
        } finally {
            setIsLoading(false);
        }
    };

    const handleKickMember = async (memberId: number) => {
        if (!confirm('Are you sure you want to kick this member? They will not be able to join this team for 120 seconds.')) {
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('/matchmaking/kick-member', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    member_id: memberId,
                }),
            });

            const data = await response.json();
            if (data.success) {
                setUserTeam(data.team);
                await fetchTeams();
                await fetchUserTeam();
                alert('Member has been kicked from the team');
            } else {
                alert(data.error || 'Failed to kick member');
            }
        } catch (error) {
            console.error('Error kicking member:', error);
            alert('Failed to kick member');
        } finally {
            setIsLoading(false);
        }
    };

    const handleMakeLeader = async (memberId: number) => {
        setIsLoading(true);
        try {
            const response = await fetch('/matchmaking/make-leader', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ member_id: memberId })
            });
            const data = await response.json();
            if (data.success) {
                setUserTeam(data.team);
                await fetchTeams();
                await fetchUserTeam();
            } else {
                alert(data.error || 'Failed to assign leader');
            }
        } catch (error) {
            console.error('Error assigning leader:', error);
            alert('Failed to assign leader');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBlockAndKick = async (memberId: number) => {
        if (!confirm('Block and kick this user from your team? They will be prevented from rejoining for 24 hours.')) {
            return;
        }
        setIsLoading(true);
        try {
            const response = await fetch('/matchmaking/block-kick-member', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ member_id: memberId })
            });
            const data = await response.json();
            if (data.success) {
                setUserTeam(data.team);
                await fetchTeams();
                await fetchUserTeam();
                alert('User blocked and kicked.');
            } else {
                alert(data.error || 'Failed to block and kick');
            }
        } catch (error) {
            console.error('Error blocking and kicking member:', error);
            alert('Failed to block and kick');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChallengeTeam = async (teamId: number) => {
        setSelectedTeam(Array.isArray(teams) ? teams.find(t => t.id === teamId) || null : null);
        setShowChallengeModal(true);
        setChallengeMessage('');
    };

    const handleSendChallenge = async () => {
        if (!selectedTeam) return;

        setIsLoading(true);
        try {
            const response = await fetch('/matchmaking/challenge', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    challenged_team_id: selectedTeam.id,
                    message: challengeMessage,
                }),
            });

            const data = await response.json();
            if (data.success) {
                setShowChallengeModal(false);
                setSelectedTeam(null);
                setChallengeMessage('');
                alert('Challenge sent successfully!');
                await fetchChallenges();
            } else {
                alert(data.error || 'Failed to send challenge');
            }
        } catch (error) {
            console.error('Error sending challenge:', error);
            alert('Failed to send challenge');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAcceptChallenge = async (challengeId: number) => {
        setIsLoading(true);
        try {
            const response = await fetch('/matchmaking/challenge/accept', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    challenge_id: challengeId,
                }),
            });

            const data = await response.json();
            if (data.success) {
                await fetchChallenges();
                await fetchTeams();
                alert('Challenge accepted!');
            } else {
                alert(data.error || 'Failed to accept challenge');
            }
        } catch (error) {
            console.error('Error accepting challenge:', error);
            alert('Failed to accept challenge');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeclineChallenge = async (challengeId: number) => {
        setIsLoading(true);
        try {
            const response = await fetch('/matchmaking/challenge/decline', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    challenge_id: challengeId,
                }),
            });

            const data = await response.json();
            if (data.success) {
                await fetchChallenges();
            } else {
                alert(data.error || 'Failed to decline challenge');
            }
        } catch (error) {
            console.error('Error declining challenge:', error);
            alert('Failed to decline challenge');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateTeamName = async () => {
        if (!userTeam || !newTeamName.trim()) return;

        setIsLoading(true);
        try {
            const response = await fetch('/matchmaking/team/update-name', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    team_id: userTeam.id,
                    name: newTeamName.trim(),
                }),
            });

            const data = await response.json();
            if (data.success) {
                setUserTeam(data.team);
                setEditingTeamName(false);
                setNewTeamName('');
                alert('Team name updated successfully!');
            } else {
                alert(data.error || 'Failed to update team name');
            }
        } catch (error) {
            console.error('Error updating team name:', error);
            alert('Failed to update team name');
        } finally {
            setIsLoading(false);
        }
    };

    const handleMarkTeamReady = async (challengeId: number) => {
        setIsLoading(true);

        // Set a timeout to clear loading state after 30 seconds
        const timeoutId = setTimeout(() => {
            setStartingMatch(null);
            setIsLoading(false);
        }, 30000);

        // Optimistically update the challenge state - only mark the user's team as ready
        setAcceptedChallenges(prevChallenges =>
            Array.isArray(prevChallenges) ? prevChallenges.map(challenge => {
                if (challenge.id === challengeId) {
                    const isUserChallenger = userTeam && challenge.challenger_team_id === userTeam.id;
                    return {
                        ...challenge,
                        challenger_ready: isUserChallenger ? true : challenge.challenger_ready,
                        challenged_ready: isUserChallenger ? challenge.challenged_ready : true,
                    };
                }
                return challenge;
            }) : []
        );

        try {
            const response = await fetch('/matchmaking/challenge/ready', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    challenge_id: challengeId,
                }),
            });

            const data = await response.json();
            if (data.success) {
                // Update the challenge with the response data from the backend
                if (data.challenge) {
                    setAcceptedChallenges(prevChallenges =>
                        Array.isArray(prevChallenges) ? prevChallenges.map(challenge =>
                            challenge.id === challengeId ? data.challenge : challenge
                        ) : []
                    );
                }

                if (data.match_id) {
                    // Both teams are ready and match is starting - show "STARTING MATCH"
                    setStartingMatch(challengeId);

                    // Store server information for connection
                    if (data.server_ip && data.server_port) {
                        setServerInfo({
                            ip: data.server_ip,
                            port: data.server_port,
                            name: data.server_display_name || 'Match Server'
                        });
                        console.log('Server info set:', {
                            ip: data.server_ip,
                            port: data.server_port,
                            name: data.server_display_name || 'Match Server'
                        });

                        // Also update the challenge with server info
                        setAcceptedChallenges(prevChallenges =>
                            Array.isArray(prevChallenges) ? prevChallenges.map(challenge =>
                                challenge.id === challengeId
                                    ? {
                                        ...challenge,
                                        server_info: {
                                            ip: data.server_ip,
                                            port: data.server_port,
                                            name: data.server_display_name || 'Match Server',
                                            password: data.server_password
                                        }
                                    }
                                    : challenge
                            ) : []
                        );
                    }
                    console.log('Match started with ID:', data.match_id);
                    // Fetch all challenges to update other UI elements
                    await fetchChallenges();
                } else {
                    // Team marked as ready, but match hasn't started yet
                    alert('Team marked as ready! Waiting for other team...');
                }
            } else {
                // Revert optimistic update on error
                await fetchChallenges();
                alert(data.error || 'Failed to mark team ready');
            }
        } catch (error) {
            console.error('Error marking team ready:', error);
            alert('Failed to mark team ready');
        } finally {
            clearTimeout(timeoutId);
            setIsLoading(false);
            setStartingMatch(null);
        }
    };

    const handleLeaveChallenge = async (challengeId: number) => {
        if (!confirm('Are you sure you want to leave this challenge?')) {
            return;
        }

        try {
            setIsLoading(true);
            const response = await fetch('/matchmaking/challenge/leave', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    challenge_id: challengeId,
                }),
            });

            const data = await response.json();
            if (data.success) {
                await fetchChallenges();
                alert('Successfully left the challenge');
            } else {
                alert(data.error || 'Failed to leave challenge');
            }
        } catch (error) {
            console.error('Error leaving challenge:', error);
            alert('Error leaving challenge');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredTeams = Array.isArray(teams) ? teams.filter(team => {
        const matchesFilter = teamFilter === '' ||
            (team.name && team.name.toLowerCase().includes(teamFilter.toLowerCase())) ||
            team.team_id.toLowerCase().includes(teamFilter.toLowerCase());

        const matchesRegion = regionFilter === 'all' || team.region === regionFilter;

        // Don't show teams that are in accepted challenges
        const isInChallenge = Array.isArray(acceptedChallenges) ? acceptedChallenges.some(challenge =>
            challenge.challenger_team_id === team.id || challenge.challenged_team_id === team.id
        ) : false;

        // Don't show teams that are in active matches
        const isInActiveMatch = team.is_in_active_match || false;

        // Don't show the user's own team
        const isUserTeam = userTeam && team.id === userTeam.id;

        return matchesFilter && matchesRegion && !isInChallenge && !isInActiveMatch && !isUserTeam;
    }) : [];

    const TeamCard = ({ team }: { team: Team }) => {
        const currentUser = (window as any).Laravel?.user;
        const isLeader = currentUser && team.leader_id === currentUser.id;

        return (
            <div className="bg-black/60 bg-opacity-60 border-1 border-[#f79631]/20 p-6 hover:bg-black/30 transition-colors">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                        <h3 className="font-['FACERG'] text-[#f79631] text-xl font-bold uppercase tracking-wider">
                            Team {team.name || team.team_id.slice(0, 8)}
                        </h3>
                        {/* Professional privacy status badge */}
                        <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-['Trebuchet'] font-medium uppercase tracking-wide ${team.is_private
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : 'bg-green-500/20 text-green-400 border border-green-500/30'
                            }`}>
                            {team.is_private ? 'Private' : 'Public'}
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <div className="text-right">
                            <div className="text-sm text-gray-400 font-['Trebuchet']">
                                {team.members.length}/{team.max_players} players
                            </div>
                            <div className="text-xs text-gray-500 uppercase font-['Trebuchet'] tracking-wide">
                                {team.region}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    {/* Display existing members */}
                    {(team.members || []).map((member, index) => (
                        <div key={member.id || index} className="flex items-center space-x-3 p-3 bg-black border border-[#f79631]/10">
                            <img
                                src={member.steam_avatar_medium || '/default-avatar.png'}
                                alt="Avatar"
                                className="w-8 h-8 bg-black"
                            />
                            <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                    <span className="text-white font-medium font-['Trebuchet']">
                                        {member.steam_username || 'Unknown User'}
                                    </span>
                                    {member.country_flag && (
                                        <span className="text-lg" title={member.country}>
                                            {member.country_flag}
                                        </span>
                                    )}
                                    {member.id === team.leader_id && <Crown className="w-4 h-4 text-yellow-500" />}
                                </div>
                                <div className="text-sm text-gray-400 font-['Trebuchet']">
                                    ELO: {member.elo || 0}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Display empty slots for remaining positions */}
                    {Array.from({ length: team.max_players - team.members.length }, (_, index) => (
                        <div key={`empty-${index}`} className="flex items-center space-x-3 p-3 bg-black/70 border border-[#f79631]/10">
                            <div className="flex items-center space-x-3 text-gray-500">
                                <img
                                    src="/default-avatar.png"
                                    alt="Empty slot"
                                    className="w-8 h-8 bg-black "
                                />
                                <span className="font-['Trebuchet']">Empty slot</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-4 flex justify-end">
                    <button
                        onClick={() => handleChallengeTeam(team.id)}
                        disabled={isLoading || team.is_in_active_match || !team.can_be_challenged}
                        className={`group  text-sm font-bold uppercase tracking-wider transition-all duration-200 px-4 py-2 border ${team.is_in_active_match || !team.can_be_challenged
                                ? 'text-gray-500 border-gray-500/30 cursor-not-allowed'
                                : 'text-orange-400 hover:text-orange-300 border-orange-400/30 hover:border-orange-400/60 hover:bg-orange-500/10'
                            } disabled:opacity-50`}
                        onMouseEnter={playHoverSound}
                        title={team.is_in_active_match ? 'Team is currently in a match' : !team.can_be_challenged ? 'Team cannot be challenged' : ''}
                    >
                        {team.is_in_active_match ? 'In Match' : 'Challenge Team'}
                    </button>
                </div>
            </div>
        );
    };

    return (
        <>
            <Head title="Matchmaking" />

            <div className="bg-black/80 backdrop-blur-lg min-h-screen">
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
                    <div className="text-center mb-8">
                        <h1 className="secondary-cs-title font-['FACERG']  text-4xl md:text-6xl font-bold uppercase tracking-wider mb-4">
                            Matchmaking
                        </h1>
                    </div>

                    {/* Pending Invitations */}
                    {(pendingInvitations || []).length > 0 && (
                        <div className="mb-8">
                            <h2 className="font-['FACERG'] text-[#f79631] text-2xl font-bold uppercase tracking-wider mb-4">
                                Pending Invitations
                            </h2>
                            <div className="space-y-4">
                                {(pendingInvitations || []).map((invitation) => (
                                    <div key={invitation.id} className="bg-black/30 border border-[#f79631]/30 p-4 rounded">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-4">
                                                <img
                                                    src={invitation.inviter?.steam_avatar_medium || '/default-avatar.png'}
                                                    alt="Inviter"
                                                    className="w-10 h-10 rounded border border-[#f79631]/20"
                                                />
                                                <div>
                                                    <p className="text-white font-medium font-['Trebuchet']">
                                                        {invitation.inviter?.steam_username || 'Unknown User'} invited you to join their team
                                                    </p>
                                                    <p className="text-gray-400 text-sm font-['Trebuchet']">
                                                        Team: {invitation.team.name || invitation.team.team_id.slice(0, 8)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleAcceptInvitation(invitation.id)}
                                                    disabled={isLoading}
                                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-['Trebuchet'] font-medium disabled:opacity-50"
                                                >
                                                    <Check className="w-4 h-4 inline mr-1" />
                                                    Accept
                                                </button>
                                                <button
                                                    onClick={() => handleDeclineInvitation(invitation.id)}
                                                    disabled={isLoading}
                                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-['Trebuchet'] font-medium disabled:opacity-50"
                                                >
                                                    <XCircle className="w-4 h-4 inline mr-1" />
                                                    Decline
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Pending Challenges */}
                    {(pendingChallenges || []).length > 0 && (
                        <div className="mb-8">
                            <h2 className="font-['FACERG'] text-orange-400 text-2xl font-bold uppercase tracking-wider mb-4">
                                ⚔️ Team Challenges Received
                            </h2>
                            <div className="space-y-4">
                                {(pendingChallenges || []).map((challenge) => (
                                    <div key={challenge.id} className="bg-orange-500/10 border border-orange-400/30 p-4 ">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-4">
                                                <img
                                                    src={challenge.challenger_team?.leader?.steam_avatar_medium || '/default-avatar.png'}
                                                    alt="Challenger"
                                                    className="w-10 h-10 rounded border border-orange-400/20"
                                                />
                                                <div>
                                                    <p className="text-white font-medium font-['Trebuchet']">
                                                        <span className="text-orange-400 font-bold">{challenge.challenger_team?.leader?.steam_username || 'Unknown User'}</span> has challenged your team!
                                                    </p>
                                                    {challenge.message && (
                                                        <p className="text-orange-300 text-sm font-['Trebuchet'] italic">
                                                            "{challenge.message}"
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleAcceptChallenge(challenge.id)}
                                                    disabled={isLoading}
                                                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white  font-['FACERG'] font-medium disabled:opacity-50"
                                                >
                                                    <Check className="w-4 h-4 inline mr-1" />
                                                    Accept Challenge
                                                </button>
                                                <button
                                                    onClick={() => handleDeclineChallenge(challenge.id)}
                                                    disabled={isLoading}
                                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white  font-['FACERG'] font-medium disabled:opacity-50"
                                                >
                                                    <XCircle className="w-4 h-4 inline mr-1" />
                                                    Decline
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}


                    {/* Show different layouts based on whether there are accepted challenges */}
                    {(acceptedChallenges || []).length > 0 ? (
                        /* Match Layout - Side by Side Teams */
                        <div className="mb-8">
                            {(acceptedChallenges || []).map((challenge) => {
                                const isUserChallenger = userTeam && challenge.challenger_team_id === userTeam.id;
                                const isUserChallenged = userTeam && challenge.challenged_team_id === userTeam.id;
                                const isUserInMatch = isUserChallenger || isUserChallenged;
                                const isUserTeamReady = isUserChallenger ? challenge.challenger_ready : challenge.challenged_ready;
                                const otherTeamReady = isUserChallenger ? challenge.challenged_ready : challenge.challenger_ready;
                                const bothTeamsReady = challenge.challenger_ready && challenge.challenged_ready;
                                const matchStarted = challenge.match_started_at || challenge.status === 'started';

                                return (
                                    <div key={challenge.id} className="space-y-6">
                                        {/* Match Status */}
                                        <div className="text-center">
                                            {matchStarted ? (
                                                <div className="bg-black/20 border border-orange-400/20 p-6">
                                                    <h3 className="font-['FACERG'] text-orange-400 text-xl font-bold uppercase tracking-wider mb-4">
                                                        MATCH STARTED!
                                                    </h3>
                                                    {challenge.server_info && (
                                                        <div className="flex gap-3 max-w-2xl mx-auto">
                                                            {/* Server IP:Port */}
                                                            <div className="group flex items-center justify-between bg-black/30 border border-orange-400/30 px-4 py-2 rounded flex-1">
                                                                <div className="text-left flex-1">
                                                                    <div className="text-xs text-gray-400 font-['Trebuchet']">Server IP</div>
                                                                    <div className="text-orange-300 font-['Trebuchet'] font-semibold blur-sm group-hover:blur-none transition-all duration-200">{challenge.server_info.ip}:{challenge.server_info.port}</div>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleCopyToClipboard(`${challenge.server_info?.ip}:${challenge.server_info?.port}`, `server-${challenge.id}`)}
                                                                    className="ml-2 p-2 hover:bg-orange-400/20 rounded transition-colors"
                                                                >
                                                                    {copiedField === `server-${challenge.id}` ? (
                                                                        <CheckCheck className="w-4 h-4 text-green-400" />
                                                                    ) : (
                                                                        <Copy className="w-4 h-4 text-orange-400" />
                                                                    )}
                                                                </button>
                                                            </div>

                                                            {/* Server Password */}
                                                            {challenge.server_info.password && (
                                                                <div className="group flex items-center justify-between bg-black/30 border border-orange-400/30 px-4 py-2 rounded flex-1">
                                                                    <div className="text-left flex-1">
                                                                        <div className="text-xs text-gray-400 font-['Trebuchet']">Server Password</div>
                                                                        <div className="text-orange-300 font-['Trebuchet'] font-semibold blur-sm group-hover:blur-none transition-all duration-200">{challenge.server_info.password}</div>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => handleCopyToClipboard(challenge.server_info?.password || '', `password-${challenge.id}`)}
                                                                        className="ml-2 p-2 hover:bg-orange-400/20 rounded transition-colors"
                                                                    >
                                                                        {copiedField === `password-${challenge.id}` ? (
                                                                            <CheckCheck className="w-4 h-4 text-green-400" />
                                                                        ) : (
                                                                            <Copy className="w-4 h-4 text-orange-400" />
                                                                        )}
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : startingMatch === challenge.id ? (
                                                <div className="bg-black/20 border border-yellow-400/20 p-4 ">
                                                    <div className="flex items-center justify-center space-x-3">
                                                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-orange-400 border-t-transparent"></div>
                                                        <h3 className="font-['FACERG'] text-orange-400 text-xl font-bold uppercase tracking-wider">
                                                            STARTING MATCH...
                                                        </h3>
                                                    </div>
                                                    <p className="text-orange-300 text-sm font-['Trebuchet'] mt-2">
                                                        Please wait while we create your match
                                                    </p>
                                                </div>
                                            ) : bothTeamsReady ? (
                                                /* Map Vetoing UI */
                                                <div className="bg-gradient-to-br from-black/60 via-orange-900/10 to-black/80 border border-orange-400/40 shadow-lg p-6">
                                                    <div className="text-center mb-6">
                                                        <h3 className="font-['FACERG'] text-orange-400 text-3xl font-bold uppercase tracking-wider drop-shadow mb-2">
                                                            MAP VETOING
                                                        </h3>
                                                        <p className="text-orange-300 text-sm font-['Trebuchet']">
                                                            Teams take turns banning maps - 2 minutes per turn
                                                        </p>
                                                        {/* Simple Timer Display */}
                                                        {!vetoStatus?.veto_complete && (
                                                            <div className="mt-4">
                                                                <p className={`font-['FACERG'] text-3xl font-bold ${turnTimeRemaining <= 30 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                                                                    {formatTime(turnTimeRemaining)}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {vetoStatus && vetoStatus.veto_complete ? (
                                                        <div className="text-center py-8">
                                                            <h4 className="font-['FACERG'] text-green-400 text-2xl font-bold uppercase tracking-wider mb-4">
                                                                MAP SELECTED!
                                                            </h4>
                                                            <div className="relative inline-block">
                                                                <img
                                                                    src={`/maps/${vetoStatus.final_map.replace('de_', '').charAt(0).toUpperCase() + vetoStatus.final_map.replace('de_', '').slice(1)}.png`}
                                                                    alt={vetoStatus.final_map}
                                                                    className="w-96 h-auto border-4 border-green-400/50 shadow-2xl"
                                                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                                />
                                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center pb-4">
                                                                    <span className="font-['FACERG'] text-white text-2xl font-bold uppercase tracking-wider">
                                                                        {vetoStatus.final_map.replace('de_', '').toUpperCase()}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <p className="text-orange-300 text-sm font-['Trebuchet'] mt-4">
                                                                Match starting soon...
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {/* Turn Status Message */}
                                                            {vetoStatus && vetoStatus.is_current_turn && (
                                                                userTeam && userTeam.leader_id === authUserId ? (
                                                                    <div className=" p-4 rounded mb-4 text-center">
                                                                       
                                                                    </div>
                                                                ) : (
                                                                    <div className="bg-yellow-500/10 border border-yellow-400/30 p-4 rounded mb-4 text-center">
                                                                        <p className="text-yellow-300 font-['Trebuchet']">
                                                                            Waiting for your team leader to ban a map...
                                                                        </p>
                                                                    </div>
                                                                )
                                                            )}
                                                            {vetoStatus && !vetoStatus.is_current_turn && (
                                                                turnTimeRemaining > 0 ? (
                                                                    <div className="bg-orange-500/10 border border-orange-400/30 p-4 rounded mb-4 text-center">
                                                                        <p className="text-orange-300 font-['Trebuchet']">
                                                                            Waiting for the other team to ban a map...
                                                                        </p>
                                                                    </div>
                                                                ) : (
                                                                    userTeam && userTeam.leader_id === authUserId && (
                                                                        <div className="bg-red-500/10 border border-red-400/30 p-4 rounded mb-4 text-center">
                                                                            <p className="text-red-300 font-['Trebuchet'] font-bold text-lg">
                                                                                TIME'S UP! You can now ban for the other team
                                                                            </p>
                                                                        </div>
                                                                    )
                                                                )
                                                            )}

                                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                                                {availableMaps.map((map) => {
                                                                    const isBanned = vetoStatus?.banned_maps?.some((ban: any) => ban.map_name === map.name);
                                                                    const isRemaining = vetoStatus?.remaining_maps?.includes(map.name);
                                                                    const isLeader = userTeam?.leader_id === authUserId;
                                                                    const isYourTurn = vetoStatus?.is_current_turn;
                                                                    const timeExpired = turnTimeRemaining <= 0;

                                                                    // Can ban if: it's your turn OR time expired and you're leader
                                                                    const canBan = isLeader && !isBanned && (isYourTurn || (!isYourTurn && timeExpired));

                                                                    return (
                                                                        <div
                                                                            key={map.name}
                                                                            className={`relative group transition-all duration-200 ${
                                                                                isBanned
                                                                                    ? 'opacity-30 grayscale'
                                                                                    : ''
                                                                            }`}
                                                                        >
                                                                            <div className="relative border-2 border-orange-400/30 overflow-hidden">
                                                                                <img
                                                                                    src={`/maps/${map.displayName}.png`}
                                                                                    alt={map.displayName}
                                                                                    className="w-full h-32 object-cover"
                                                                                    onError={(e) => {
                                                                                        e.currentTarget.src = '/maps/placeholder.txt';
                                                                                    }}
                                                                                />
                                                                                {isBanned && (
                                                                                    <div className="absolute inset-0 bg-red-900/70 flex items-center justify-center">
                                                                                        <X className="w-16 h-16 text-red-400" />
                                                                                    </div>
                                                                                )}
                                                                                <div className="absolute bottom-0 inset-x-0 bg-black/80 p-2">
                                                                                    <p className="text-center text-white font-['FACERG'] text-sm uppercase tracking-wider">
                                                                                        {map.displayName}
                                                                                    </p>
                                                                                    {isBanned && (
                                                                                        <p className="text-center text-red-400 font-['Trebuchet'] text-xs mt-1">
                                                                                            BANNED
                                                                                        </p>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                            {/* Ban Button */}
                                                                            {!isBanned && (
                                                                                <button
                                                                                    onClick={() => handleBanMap(challenge.id, map.name)}
                                                                                    disabled={!canBan || isLoading}
                                                                                    className={`w-full mt-2 py-2 font-['FACERG'] text-sm uppercase tracking-wider transition-all duration-200 ${
                                                                                        canBan
                                                                                            ? 'bg-red-600 hover:bg-red-700 text-white cursor-pointer'
                                                                                            : 'bg-black/50 text-gray-500 cursor-not-allowed'
                                                                                    } disabled:opacity-50`}
                                                                                >
                                                                                    {canBan ? 'BAN MAP' : 'LOCKED'}
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="bg-gradient-to-br from-black/60 via-black/10 to-black/80 border border-orange-400/40 shadow-lg p-6 flex flex-col items-center">
                                                    <div className="flex items-center space-x-3 mb-2">
                                                        <h3 className="font-['FACERG'] text-orange-400 text-2xl font-bold uppercase tracking-wider drop-shadow">
                                                            Waiting for Teams
                                                        </h3>
                                                    </div>
                                                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-2 w-full">
                                                        <div className={`flex items-center gap-2 px-4 py-2 bg-black/40 border border-orange-400/20 shadow-inner transition-all duration-200 ${challenge.challenger_ready ? 'ring-2 ring-green-400/40' : ''}`}>
                                                            <span className="font-['Trebuchet'] text-base text-white/80 font-semibold">Team 1</span>
                                                            <span className={`ml-2 text-base font-bold ${challenge.challenger_ready ? 'text-green-400' : 'text-gray-400'}`}>
                                                                {challenge.challenger_ready ? (
                                                                    <>
                                                                        <span className="inline-block animate-pulse"></span> Ready
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <span className="inline-block animate-pulse"></span> Not Ready
                                                                    </>
                                                                )}
                                                            </span>
                                                        </div>
                                                        <span className="hidden sm:inline text-orange-400/40 font-['FACERG'] text-lg font-bold">VS</span>
                                                        <div className={`flex items-center gap-2 px-4 py-2 bg-black/40 border border-orange-400/20 shadow-inner transition-all duration-200 ${challenge.challenged_ready ? 'ring-2 ring-green-400/40' : ''}`}>
                                                            <span className="font-['Trebuchet'] text-base text-white/80 font-semibold">Team 2</span>
                                                            <span className={`ml-2 text-base font-bold ${challenge.challenged_ready ? 'text-green-400' : 'text-gray-400'}`}>
                                                                {challenge.challenged_ready ? (
                                                                    <>
                                                                        <span className="inline-block animate-pulse"></span> Ready
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <span className="inline-block animate-pulse"></span> Not Ready
                                                                    </>
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="mt-5 text-center">
                                                        <span className="text-orange-300/80 font-['Trebuchet'] text-sm italic">
                                                            Waiting for both teams to mark as ready to start the match...
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Teams Side by Side */}
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                                            {/* Team 1 (Challenger) - Left Side */}
                                            <div className="bg-black/40 border border-[#f79631]/30 p-6 ">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className="font-['FACERG'] text-[#f79631] text-xl font-bold uppercase tracking-wider">
                                                        Team 1
                                                    </h3>
                                                    {challenge.challenger_ready && (
                                                        <span className="text-green-400 text-sm font-['Trebuchet']"> Ready</span>
                                                    )}
                                                </div>

                                                {challenge.challenger_team?.members && challenge.challenger_team.members.length > 0 ? (
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full">
                                                            <thead>
                                                                <tr className="border-b border-[#f79631]/20">
                                                                    <th className="text-left py-2 px-3 text-[#f79631] font-['Trebuchet'] text-sm font-medium uppercase tracking-wide">Player</th>
                                                                    <th className="text-left py-2 px-3 text-[#f79631] font-['Trebuchet'] text-sm font-medium uppercase tracking-wide">ELO</th>
                                                                    <th className="text-left py-2 px-3 text-[#f79631] font-['Trebuchet'] text-sm font-medium uppercase tracking-wide">Country</th>
                                                                    <th className="text-left py-2 px-3 text-[#f79631] font-['Trebuchet'] text-sm font-medium uppercase tracking-wide">Role</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {challenge.challenger_team.members.map((member, index) => (
                                                                    <tr key={member.id || index} className="border-b border-[#f79631]/10 hover:bg-black/20">
                                                                        <td className="py-3 px-3">
                                                                            <div className="flex items-center space-x-3">
                                                                                <img
                                                                                    src={member.steam_avatar_medium || '/default-avatar.png'}
                                                                                    alt="Avatar"
                                                                                    className="w-8 h-8 rounded"
                                                                                />
                                                                                <span className="text-white font-medium text-sm font-['Trebuchet']">
                                                                                    {member.steam_username || 'Unknown User'}
                                                                                </span>
                                                                            </div>
                                                                        </td>
                                                                        <td className="py-3 px-3 text-gray-300 text-sm font-['Trebuchet']">
                                                                            {member.elo || 0}
                                                                        </td>
                                                                        <td className="py-3 px-3">
                                                                            {member.country_flag && (
                                                                                <span className="text-lg" title={member.country}>
                                                                                    {member.country_flag}
                                                                                </span>
                                                                            )}
                                                                        </td>
                                                                        <td className="py-3 px-3">
                                                                            {member.id === challenge.challenger_team?.leader_id && (
                                                                                <div className="flex items-center space-x-1">
                                                                                    <Crown className="w-4 h-4 text-orange-500" />
                                                                                    <span className="text-orange-400 text-xs font-['Trebuchet'] uppercase">Leader</span>
                                                                                </div>
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-8">
                                                        <div className="text-gray-400 text-lg font-['Trebuchet']">
                                                            No members available
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Team 2 (Challenged) - Right Side */}
                                            <div className="bg-black/40 border border-orange-600/40 p-6 ">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className="font-['FACERG'] text-orange-400 text-xl font-bold uppercase tracking-wider">
                                                        Team 2
                                                    </h3>
                                                    {challenge.challenged_ready && (
                                                        <span className="text-green-400 text-sm font-['Trebuchet']"> Ready</span>
                                                    )}
                                                </div>

                                                {challenge.challenged_team?.members && challenge.challenged_team.members.length > 0 ? (
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full">
                                                            <thead>
                                                                <tr className="border-b border-orange-600/20">
                                                                    <th className="text-left py-2 px-3 text-orange-400 font-['Trebuchet'] text-sm font-medium uppercase tracking-wide">Player</th>
                                                                    <th className="text-left py-2 px-3 text-orange-400 font-['Trebuchet'] text-sm font-medium uppercase tracking-wide">ELO</th>
                                                                    <th className="text-left py-2 px-3 text-orange-400 font-['Trebuchet'] text-sm font-medium uppercase tracking-wide">Country</th>
                                                                    <th className="text-left py-2 px-3 text-orange-400 font-['Trebuchet'] text-sm font-medium uppercase tracking-wide">Role</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {challenge.challenged_team.members.map((member, index) => (
                                                                    <tr key={member.id || index} className="border-b border-orange-600/10 hover:bg-black/20">
                                                                        <td className="py-3 px-3">
                                                                            <div className="flex items-center space-x-3">
                                                                                <img
                                                                                    src={member.steam_avatar_medium || '/default-avatar.png'}
                                                                                    alt="Avatar"
                                                                                    className="w-8 h-8 rounded"
                                                                                />
                                                                                <span className="text-white font-medium text-sm font-['Trebuchet']">
                                                                                    {member.steam_username || 'Unknown User'}
                                                                                </span>
                                                                            </div>
                                                                        </td>
                                                                        <td className="py-3 px-3 text-gray-300 text-sm font-['Trebuchet']">
                                                                            {member.elo || 0}
                                                                        </td>
                                                                        <td className="py-3 px-3">
                                                                            {member.country_flag && (
                                                                                <span className="text-lg" title={member.country}>
                                                                                    {member.country_flag}
                                                                                </span>
                                                                            )}
                                                                        </td>
                                                                        <td className="py-3 px-3">
                                                                            {member.id === challenge.challenged_team?.leader_id && (
                                                                                <div className="flex items-center space-x-1">
                                                                                    <Crown className="w-4 h-4 text-orange-500" />
                                                                                    <span className="text-orange-400 text-xs font-['Trebuchet'] uppercase">Leader</span>
                                                                                </div>
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-8">
                                                        <div className="text-gray-400 text-lg font-['Trebuchet']">
                                                            No members available
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Server Connection Info */}
                                        {matchStarted && (serverInfo || challenge.server_info) && (
                                            <div className="p-4 rounded mb-4">

                                                <div className="flex items-center justify-center space-x-4">
                                                    <button
                                                        onClick={() => {
                                                            const serverData = serverInfo || challenge.server_info;
                                                            if (serverData?.ip && serverData?.port) {
                                                                const passwordPart = serverData?.password ? `;password ${serverData.password}` : '';
                                                                const serverInfoText = `${serverData.ip}:${serverData.port}${passwordPart}`;
                                                                handleCopyToClipboard(serverInfoText, `connect-${challenge.id}`);
                                                            }
                                                        }}
                                                        className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded font-['FACERG'] font-bold uppercase tracking-wider transition-colors flex items-center justify-center space-x-2"
                                                    >
                                                        {copiedField === `connect-${challenge.id}` ? (
                                                            <>
                                                                <CheckCheck className="w-5 h-5" />
                                                                <span>COPIED!</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Copy className="w-5 h-5" />
                                                                <span>COPY SERVER INFO</span>
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Match Results */}
                                        {matchResults.length > 0 && (
                                            <div className="space-y-4 mb-4">
                                                {matchResults.map((result, index) => (
                                                    <div key={index} className="bg-black/10 border border-orange-400/30 p-4 rounded">
                                                        <h4 className="font-['FACERG'] text-orange-400 text-lg font-bold uppercase tracking-wider mb-2">
                                                            MATCH COMPLETED
                                                        </h4>
                                                        <div className="text-white font-['Trebuchet']">
                                                            <div className="flex justify-between items-center">
                                                                <span>Winner: Team {result.winner_team_id === result.team1_id ? '1' : '2'}</span>
                                                                <span className="text-orange-400">+25 ELO</span>
                                                            </div>
                                                            <div className="flex justify-between items-center">
                                                                <span>Loser: Team {result.winner_team_id === result.team1_id ? '2' : '1'}</span>
                                                                <span className="text-red-400">-25 ELO</span>
                                                            </div>
                                                            <div className="text-sm text-gray-400 mt-2">
                                                                Final Score: {result.team1_score} - {result.team2_score}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="text-center space-y-4 px-2">
                                            {/* Ready Up Button */}
                                            {isUserInMatch && !matchStarted && !isUserTeamReady && (
                                                <button
                                                    onClick={() => handleMarkTeamReady(challenge.id)}
                                                    disabled={isLoading}
                                                    className="mr-2 group font-['FACERG'] text-green-400 text-lg font-bold uppercase tracking-wider hover:text-green-300 transition-all duration-200 px-8 py-4 border-t border-r border-l border-b border-green-400/30 hover:border-green-400/60 disabled:opacity-50 hover:bg-green-500/10 bg-green-500/5 flex items-center justify-center space-x-2"
                                                    onMouseEnter={playHoverSound}
                                                >
                                                    <span>READY UP</span>
                                                </button>
                                            )}

                                            {/* Leave Challenge Button */}
                                            {isUserInMatch && !matchStarted && (
                                                <button
                                                    onClick={() => handleLeaveChallenge(challenge.id)}
                                                    disabled={isLoading}
                                                    className="group font-['FACERG'] text-red-400 text-lg font-bold uppercase tracking-wider hover:text-red-300 transition-all duration-200 px-8 py-4 border-l border-t border-r border-b border-red-400/30 hover:border-red-400/60 disabled:opacity-50 hover:bg-red-500/10 bg-red-500/5"
                                                    onMouseEnter={playHoverSound}
                                                >
                                                    LEAVE DUEL
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        /* Normal Layout - User Team and Available Teams */
                        <>
                            {/* User's Team */}
                            {userTeam ? (
                                <div className="mb-8">
                                    <div className=" mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-black/40 border border-[#f79631]/30 px-4 py-3">
                                        <div className="flex items-center gap-4">
                                            {!inQueue ? (
                                                <button
                                                    onClick={handleJoinQueue}
                                                    disabled={isLoading}
                                                    className="group relative font-['FACERG'] text-[#f79631] text-sm font-bold bg-black/40 uppercase tracking-wider hover:text-yellow-300 transition-all duration-200 px-6 py-3 border border-[#f79631]/30 hover:border-[#f79631]/60 disabled:opacity-50 hover:bg-black/60"
                                                >
                                                    {isLoading ? 'Finding...' : 'Find Match'}
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={handleLeaveQueue}
                                                    disabled={isLoading}
                                                    className="group relative font-['FACERG']  text-red-400 text-sm font-bold bg-black/40 uppercase tracking-wider hover:text-red-300 transition-all duration-200 px-6 py-3 border border-red-400/30 hover:border-red-400/60 disabled:opacity-50 hover:bg-black/60"
                                                >
                                                    {isLoading ? 'Leaving...' : 'Cancel Search'}
                                                </button>
                                            )}
                                            {inQueue && (
                                                <div className="text-gray-300 font-['Trebuchet']">Time elapsed: <span className="text-[#f79631]">{queueElapsed}</span></div>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-gray-400 font-['Trebuchet'] uppercase text-xs tracking-wide">Queue</span>
                                            <span className="px-2 py-1 text-xs font-['Trebuchet'] bg-black/50 border border-[#f79631]/30 text-[#f79631]">
                                                {queueCount.players} {queueCount.players === 1 ? 'Player' : 'Players'}
                                            </span>
                                            <span className="px-2 py-1 text-xs font-['Trebuchet'] bg-black/50 border border-[#f79631]/30 text-[#f79631]">
                                                {queueCount.teams} {queueCount.teams === 1 ? 'Team' : 'Teams'}
                                            </span>
                                            <span className="px-2 py-1 text-xs font-['Trebuchet'] bg-black/50 border border-[#f79631]/30 text-[#f79631]">
                                                {queueCount.solos} {queueCount.solos === 1 ? 'Solo' : 'Solos'}
                                            </span>
                                        </div>
                                    </div>
                                    <TeamPartyCard
                                        team={userTeam}
                                        currentUser={currentUser}
                                        authUserId={authUserId}
                                        onInviteFriends={() => openInviteModal(userTeam)}
                                        onLeaveTeam={handleLeaveTeam}
                                        onKickMember={handleKickMember}
                                        onMakeLeader={handleMakeLeader}
                                        onBlockAndKick={handleBlockAndKick}
                                        isLoading={isLoading}
                                    />
                                    {/* Matchmaking queue controls */}

                                </div>
                            ) : (
                                <div className="mb-8 text-center">
                                    <div className="flex flex-wrap justify-center gap-4">
                                        <button
                                            onClick={() => handleCreateTeam(false)}
                                            disabled={isLoading}
                                            className="group relative  text-[#f79631] text-sm font-bold bg-black/40 uppercase tracking-wider hover:text-yellow-300 transition-all duration-200 px-6 py-3 border border-[#f79631]/30 hover:border-[#f79631]/60 disabled:opacity-50 hover:bg-black/60"
                                            onMouseEnter={playHoverSound}
                                        >
                                            <span>Create Public Team</span>
                                        </button>
                                        <button
                                            onClick={() => handleCreateTeam(true)}
                                            disabled={isLoading}
                                            className="group relative  text-[#f79631] text-sm font-bold bg-black/40 uppercase tracking-wider hover:text-yellow-300 transition-all duration-200 px-6 py-3 border border-[#f79631]/30 hover:border-[#f79631]/60 disabled:opacity-50 hover:bg-black/60"
                                            onMouseEnter={playHoverSound}
                                        >
                                            <span>Creat Private Team</span>
                                        </button>
                                        <button
                                            onClick={handleJoinRandomTeam}
                                            disabled={isLoading}
                                            className="group relative  text-[#f79631] text-sm font-bold bg-black/40 uppercase tracking-wider hover:text-yellow-300 transition-all duration-200 px-6 py-3 border border-[#f79631]/30 hover:border-[#f79631]/60 disabled:opacity-50 hover:bg-black/60"
                                            onMouseEnter={playHoverSound}
                                        >
                                            <span>Join Random Team</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Available Teams (hidden while matchmaking) */}
                            {!inQueue && (
                                <div>
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                                        <h2 className=" text-[#f79631] text-2xl font-bold uppercase tracking-wider mb-4 md:mb-0">
                                            Available Teams
                                        </h2>
                                        <div className="flex flex-col md:flex-row gap-4">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                                <input
                                                    type="text"
                                                    value={teamFilter}
                                                    onChange={(e) => setTeamFilter(e.target.value)}
                                                    placeholder="Search teams..."
                                                    className="w-full pl-10 pr-4 py-3 bg-black/50 border border-[#f79631]/30 text-white placeholder-gray-400 focus:border-[#f79631]/60 focus:outline-none font-['Trebuchet']"
                                                />
                                            </div>
                                            <CustomDropdown
                                                options={regions}
                                                value={regionFilter}
                                                onChange={setRegionFilter}
                                                placeholder="Select Region"
                                            />
                                        </div>
                                    </div>

                                    <div className="">
                                        {filteredTeams.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {filteredTeams.map((team) => (
                                                    <TeamCard key={team.id} team={team} />
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12">
                                                <p className="text-gray-400 text-lg font-['Trebuchet']">
                                                    No teams found matching your criteria
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Invite Friends Modal */}
            {showInviteModal && selectedTeam && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-black/50 border border-[#f79631]/30 p-6 w-full max-w-md mx-4">
                        <div className="relative">
                            <h3 className="font-['FACERG'] text-[#f79631] text-2xl font-bold uppercase tracking-wider mb-6">INVITE FRIENDS</h3>
                            <div
                                className="w-[30%] h-0.5 mb-6 rounded-full"
                                style={{
                                    background: "linear-gradient(to right,rgba(247, 151, 49, 0.45) 0%, rgba(247, 151, 49, 0.25) 50%, rgba(247,151,49,0) 100%)"
                                }}
                            ></div>

                            <div className="space-y-6">
                                <div className="flex items-center space-x-4 p-4 bg-black/30 border border-[#f79631]/20">
                                    <div className="flex-1">
                                        <div className="text-white font-semibold text-lg">
                                            {selectedTeam.name || `Team ${selectedTeam.team_id.slice(0, 8)}`}
                                        </div>
                                        <div className="text-gray-400 text-sm">
                                            {selectedTeam.members.length}/{selectedTeam.max_players} players • {selectedTeam.region}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-gray-300 text-sm font-['Trebuchet'] mb-3">
                                        Select friends to invite:
                                    </label>
                                    <div className="max-h-60 overflow-y-auto space-y-2">
                                        {(friends || []).map((friend) => (
                                            <label key={friend.id} className="flex items-center space-x-3 p-3 bg-black/30 border border-[#f79631]/20 rounded cursor-pointer hover:bg-black/40 transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedFriends.includes(friend.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedFriends([...selectedFriends, friend.id]);
                                                        } else {
                                                            setSelectedFriends(selectedFriends.filter(id => id !== friend.id));
                                                        }
                                                    }}
                                                    className="w-4 h-4 text-[#f79631] bg-gray-700 border-gray-600 rounded focus:ring-[#f79631] focus:ring-2"
                                                />
                                                <img
                                                    src={friend.steam_avatar_medium || '/default-avatar.png'}
                                                    alt="Friend Avatar"
                                                    className="w-8 h-8 rounded border border-[#f79631]/20"
                                                />
                                                <div className="flex-1">
                                                    <div className="text-white font-medium text-sm">
                                                        {friend.steam_username || friend.name}
                                                    </div>
                                                    <div className="text-gray-400 text-xs">
                                                        ELO: {friend.elo || 0}
                                                    </div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-4 mt-8">
                                <button
                                    onClick={closeInviteModal}
                                    className="px-6 py-2 text-gray-400 hover:text-white font-['Trebuchet'] transition-colors border border-[#f79631]/20"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleInviteFriends}
                                    disabled={isLoading || selectedFriends.length === 0}
                                    className="px-6 py-2 bg-[#f79631]/20 text-[#f79631] hover:bg-[#f79631]/30 hover:text-yellow-300 font-['Trebuchet'] border border-[#f79631]/30 hover:border-[#f79631]/50 transition-all duration-200 disabled:opacity-50"
                                >
                                    {isLoading ? 'Sending...' : `Invite ${selectedFriends.length} Friend${selectedFriends.length !== 1 ? 's' : ''}`}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Challenge Team Modal */}
            {showChallengeModal && selectedTeam && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-black/50 border border-orange-400/30 p-6 w-full max-w-md mx-4">
                        <div className="relative">
                            <h3 className="font-['FACERG'] text-orange-400 text-2xl font-bold uppercase tracking-wider mb-6">⚔️ CHALLENGE TEAM</h3>
                            <div
                                className="w-[30%] h-0.5 mb-6 rounded-full"
                                style={{
                                    background: "linear-gradient(to right,rgba(251, 146, 60, 0.45) 0%, rgba(251, 146, 60, 0.25) 50%, rgba(251, 146, 60, 0) 100%)"
                                }}
                            ></div>

                            <div className="space-y-6">
                                <div className="flex items-center space-x-4 p-4 bg-black/30 border border-orange-400/20">
                                    <div className="flex-1">
                                        <div className="text-white font-semibold text-lg">
                                            {selectedTeam.name || `Team ${selectedTeam.team_id.slice(0, 8)}`}
                                        </div>
                                        <div className="text-gray-400 text-sm">
                                            {selectedTeam.members.length}/{selectedTeam.max_players} players • {selectedTeam.region}
                                        </div>
                                        <div className="text-orange-300 text-sm font-['Trebuchet']">
                                            Leader: {selectedTeam.leader?.steam_username || 'Unknown User'}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-gray-300 text-sm font-['Trebuchet'] mb-3">
                                        Challenge message (optional):
                                    </label>
                                    <textarea
                                        value={challengeMessage}
                                        onChange={(e) => setChallengeMessage(e.target.value)}
                                        placeholder="Enter a message for your challenge..."
                                        className="w-full px-3 py-2 bg-black/50 border border-orange-400/30 text-white placeholder-gray-400 focus:border-orange-400/60 focus:outline-none font-['Trebuchet'] text-sm rounded"
                                        rows={3}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end space-x-4 mt-8">
                                <button
                                    onClick={() => {
                                        setShowChallengeModal(false);
                                        setSelectedTeam(null);
                                        setChallengeMessage('');
                                    }}
                                    className="px-6 py-2 text-gray-400 hover:text-white font-['Trebuchet'] transition-colors border border-orange-400/20"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSendChallenge}
                                    disabled={isLoading}
                                    className="px-6 py-2 bg-orange-600/20 text-orange-400 hover:bg-orange-600/30 hover:text-orange-300 font-['Trebuchet'] border border-orange-400/30 hover:border-orange-400/50 transition-all duration-200 disabled:opacity-50"
                                >
                                    {isLoading ? 'Sending...' : 'Send Challenge'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <div className="absolute bottom-2 right-2 md:bottom-8 md:right-8 flex gap-4 items-center text-gray-400 text-xs md:text-sm font-['Trebuchet']">
                <a href="https://hosting.karasu.live/privacy-policy" target="_blank" rel="noopener noreferrer" className="hover:text-[#f79631] transition-colors">
                    Privacy Policy
                </a>
                <a href="https://hosting.karasu.live/terms-of-services" target="_blank" rel="noopener noreferrer" className="hover:text-[#f79631] transition-colors">
                    Terms of Service
                </a>
                <a href="https://etourfrag.com/" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
                    <img src="/etf.png" alt="eTourFrag" className="h-6 md:h-8 w-auto" />
                </a>
            </div>
        </>
    );
};

export default Matchmaking;