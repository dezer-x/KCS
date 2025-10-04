import React from 'react';
import { Link } from '@inertiajs/react';
import {
  FaTachometerAlt,
  FaGamepad,
  FaUsers,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaCrosshairs,
  FaTrophy,
  FaHome
} from 'react-icons/fa';

interface AdminNavbarProps {
  currentPage: 'dashboard' | 'practice' | 'matchmaking' | 'matches';
  onLogout: () => void;
  onHoverSound: () => void;
}

const AdminNavbar: React.FC<AdminNavbarProps> = ({ 
  currentPage, 
  onLogout, 
  onHoverSound 
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navItems = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      icon: FaTachometerAlt,
      href: '/admin/dashboard'
    },
    {
      key: 'practice',
      label: 'Practice Servers',
      icon: FaGamepad,
      href: '/admin/practice'
    },
    {
      key: 'matchmaking',
      label: 'Matchmaking',
      icon: FaCrosshairs,
      href: '/admin/matchmaking'
    },
    {
      key: 'matches',
      label: 'Matches',
      icon: FaTrophy,
      href: '/admin/matches'
    }
  ];

  return (
    <nav className="">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <Link 
            href="/admin/dashboard" 
            className="font-['FACERG'] text-[#f79631] text-2xl font-bold uppercase tracking-wider hover:text-yellow-300 transition-colors"
            onMouseEnter={onHoverSound}
          >
            ADMIN PANEL
          </Link>

          {/* Desktop Navigation & Mobile Menu Button */}
          <div className="flex items-center space-x-4">
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.key;

                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={`flex items-center space-x-2 px-6 py-3 transition-all duration-200 relative ${
                      isActive
                        ? 'text-[#f79631]'
                        : 'text-gray-300 hover:text-[#f79631]'
                    }`}
                    onMouseEnter={onHoverSound}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-['Trebuchet'] font-medium text-lg">{item.label}</span>
                    {isActive && (
                      <div className="absolute left-1/2 bottom-0 w-2 rounded-full h-1 bg-[#f79631] transform -translate-x-1/2" />
                    )}
                  </Link>
                );
              })}

              {/* Back to Home Button */}
              <Link
                href="/"
                className="flex items-center space-x-2 px-6 py-3 text-gray-300 hover:text-[#f79631] transition-all duration-200"
                onMouseEnter={onHoverSound}
              >
                <FaHome className="w-5 h-5" />
                <span className="font-['Trebuchet'] font-medium text-lg">Back to Home</span>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-[#f79631] hover:text-yellow-300 transition-colors"
              onMouseEnter={onHoverSound}
            >
              {isMobileMenuOpen ? (
                <FaTimes className="w-6 h-6" />
              ) : (
                <FaBars className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-[#f79631]/20">
            <div className="flex flex-col space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.key;

                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={`flex items-center space-x-3 px-4 py-3 transition-all duration-200 ${
                      isActive
                        ? 'text-[#f79631]'
                        : 'text-gray-300 hover:text-[#f79631]'
                    }`}
                    onMouseEnter={onHoverSound}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-['Trebuchet'] font-medium text-lg">{item.label}</span>
                  </Link>
                );
              })}

              {/* Back to Home Button - Mobile */}
              <Link
                href="/"
                className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-[#f79631] transition-all duration-200"
                onMouseEnter={onHoverSound}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <FaHome className="w-5 h-5" />
                <span className="font-['Trebuchet'] font-medium text-lg">Back to Home</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default AdminNavbar;
