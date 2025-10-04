import { dashboard } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { useRef } from 'react';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;
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

    return (
        <>
                <div className="bg-black/60 backdrop-blur-sm min-h-screen">

            <Head title="Welcome">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
            </Head>
            <div className="counter-strike-title text-2xl sm:text-3xl md:text-6xl lg:text-7xl xl:text-8xl">KArAsu <br />CounTer-sTRiKe</div>
            <p className="website-url font-['Trebuchet'] text-sm md:text-base lg:text-lg hidden md:block">www.hosting.karasu.live</p>
            <audio ref={audioRef} preload="auto">
                <source src="/cs2-sound.mp3" type="audio/mpeg" />
            </audio>
            <section className=" absolute bottom-2 left-2 md:bottom-8 md:left-8 z-10 px-4 md:px-8 lg:px-16 xl:px-32 pb-4 md:pb-8 lg:pb-16">
                <table className="space-y-4 md:space-y-8">
                    <tbody className="space-y-4 md:space-y-8">
                        <tr className="block md:table-row">
                            <td className="block md:table-cell align-top pr-8 pb-4 md:pb-8">
                                {user ? (
                                    <a href="/profile" className="flex items-center space-x-3 cursor-pointer">
                                        {user.steam_avatar_medium && (
                                            <img
                                                src={user.steam_avatar_medium}
                                                alt="Steam Avatar"
                                                className="w-8 h-8 md:w-10 md:h-10 rounded"
                                            />
                                        )}
                                        <span className="font-['FACERG'] text-[#f79631] text-2xl md:text-2xl font-bold uppercase tracking-wider hover:text-yellow-300 transition-colors">
                                            {user.steam_username}
                                        </span>
                                    </a>
                                ) : (
                                    <a href="/auth/steam" className="font-['FACERG'] text-[#f79631] text-2xl md:text-2xl font-bold uppercase tracking-wider hover:text-yellow-300 transition-colors cursor-pointer" onMouseEnter={playHoverSound}>Log In</a>
                                )}
                            </td>
                            <td className="block md:table-cell align-top">
                                <span className="text-gray-300 text-sm md:text-lg font-['Trebuchet']">
                                    {user ? 'Welcome back! Access all our features and matchmaking!' : 'Log in to steam to access all our features and matchmaking access!'}
                                </span>
                            </td>
                        </tr>
                        <tr className="block md:table-row">
                            <td className="block md:table-cell align-top pr-8 pb-4 md:pb-8">
                                {user ? (
                                    <a href="/matchmaking" className="font-['FACERG'] text-[#f79631] text-xl md:text-2xl font-bold uppercase tracking-wider hover:text-yellow-300 transition-colors cursor-pointer" onMouseEnter={playHoverSound}>Matchmaking</a>
                                ) : (
                                    <span className="font-['FACERG'] text-[#f79631] text-xl md:text-2xl font-bold uppercase tracking-wider">Matchmaking</span>
                                )}
                            </td>
                            <td className="block md:table-cell align-top">
                                <span className="text-gray-300 text-sm md:text-lg font-['Trebuchet']">Invite up to 4 friends to start the battle!</span>
                            </td>
                        </tr>
                        <tr className="block md:table-row">
                            <td className="block md:table-cell align-top pr-8 pb-4 md:pb-8">
                                <div className="py-4"></div>
                            </td>
                            <td className="block md:table-cell align-top">
                                <div className="py-4"></div>
                            </td>
                        </tr>
                        <tr className="block md:table-row">
                            <td className="block md:table-cell align-top pr-8 pb-4 md:pb-8">
                                {user ? (
                                    <a href="/practice" className="font-['FACERG'] text-[#f79631] text-2xl md:text-2xl font-bold uppercase tracking-wider hover:text-yellow-300 transition-colors cursor-pointer" onMouseEnter={playHoverSound}>PRactice</a>
                                ) : (
                                    <span className="font-['FACERG'] text-[#f79631] text-2xl md:text-2xl font-bold uppercase tracking-wider">PRactice</span>
                                )}
                            </td>
                            <td className="block md:table-cell align-top">
                                <span className="text-gray-300 text-sm md:text-lg font-['Trebuchet']">Practice Counter strike using one of our servers.</span>
                            </td>
                        </tr>
                        <tr className="block md:table-row">
                            <td className="block md:table-cell align-top pr-8 pb-4 md:pb-8">
                                {user ? (
                                    <a href="/leaderboard" className="font-['FACERG'] text-[#f79631] text-2xl md:text-2xl font-bold uppercase tracking-wider hover:text-yellow-300 transition-colors cursor-pointer" onMouseEnter={playHoverSound}>Leaderboard</a>
                                ) : (
                                    <span className="font-['FACERG'] text-[#f79631] text-2xl md:text-2xl font-bold uppercase tracking-wider">Leaderboard</span>
                                )}
                            </td>
                            <td className="block md:table-cell align-top">
                                <span className="text-gray-300 text-sm md:text-lg font-['Trebuchet']">Check the Leaderboard globally or for your country.</span>
                            </td>
                        </tr>
                        <tr className="block md:table-row">
                            <td className="block md:table-cell align-top pr-8 pb-4 md:pb-8">
                                {user ? (
                                    <a href="/friends" className="font-['FACERG'] text-[#f79631] text-2xl md:text-2xl font-bold uppercase tracking-wider hover:text-yellow-300 transition-colors cursor-pointer" onMouseEnter={playHoverSound}>Friends</a>
                                ) : (
                                    <span className="font-['FACERG'] text-[#f79631] text-2xl md:text-2xl font-bold uppercase tracking-wider">Friends</span>
                                )}
                            </td>
                            <td className="block md:table-cell align-top">
                                <span className="text-gray-300 text-sm md:text-lg font-['Trebuchet']">Check your friend's list or make new friends.</span>
                            </td>
                        </tr>
                        {user?.role === 'admin' && (
                            <tr className="block md:table-row">
                                <td className="block md:table-cell align-top pr-8 pb-4 md:pb-8">
                                    <a href="/admin/dashboard" className="font-['FACERG'] text-[#f79631] text-2xl md:text-2xl font-bold uppercase tracking-wider hover:text-yellow-300 transition-colors cursor-pointer" onMouseEnter={playHoverSound}>Admin</a>
                                </td>
                                <td className="block md:table-cell align-top">
                                    <span className="text-gray-300 text-sm md:text-lg font-['Trebuchet']">Access admin dashboard and manage the platform.</span>
                                </td>
                            </tr>
                        )}
                        {user && (
                            <tr className="block md:table-row">
                                <td className="block md:table-cell align-top pr-8 pb-4 md:pb-8">
                                    <button
                                        onClick={handleLogout}
                                        className="font-['FACERG'] text-[#f79631] text-2xl md:text-2xl font-bold uppercase tracking-wider hover:text-yellow-300 transition-colors cursor-pointer"
                                        onMouseEnter={playHoverSound}
                                    >
                                        LOGOUT
                                    </button>
                                </td>
                                <td className="block md:table-cell align-top">
                                    <span className="text-gray-300 text-sm md:text-lg font-['Trebuchet']">
                                        Log out of your Steam account.
                                    </span>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </section>
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
