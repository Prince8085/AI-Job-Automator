
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { HomeIcon, SearchIcon, BriefcaseIcon, UserIcon, HeartIcon } from './icons';

const BottomNav: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', icon: HomeIcon, label: 'Home', emoji: '🏠' },
    { path: '/search', icon: SearchIcon, label: 'Search', emoji: '🔍' },
    { path: '/wishlist', icon: HeartIcon, label: 'Wishlist', emoji: '❤️' },
    { path: '/tracker', icon: BriefcaseIcon, label: 'Tracker', emoji: '📋' },
    { path: '/profile', icon: UserIcon, label: 'Profile', emoji: '👤' },
  ];

  return (
    <>
      {/* Spacer to prevent content from being hidden behind nav */}
      <div className="h-24" />

      {/* Floating Navigation Container */}
      <nav className="fixed bottom-4 left-4 right-4 z-50">
        {/* Glassmorphism Background */}
        <div className="
          mx-auto max-w-md
          bg-white/90 backdrop-blur-xl
          rounded-[28px]
          shadow-[0_8px_32px_rgba(99,102,241,0.25),0_4px_12px_rgba(0,0,0,0.1)]
          border border-white/50
          px-2 py-2
        ">
          <div className="flex justify-around items-center">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className="relative group"
                >
                  {/* Active Bubble Background */}
                  <div className={`
                    flex flex-col items-center justify-center
                    px-4 py-2 rounded-2xl
                    transition-all duration-300 ease-out
                    ${isActive
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 scale-105'
                      : 'hover:bg-gray-100 hover:scale-105'
                    }
                  `}>
                    {/* Icon with animation */}
                    <div className={`
                      transition-all duration-300
                      ${isActive ? 'text-white transform -translate-y-0.5' : 'text-gray-500 group-hover:text-indigo-600'}
                    `}>
                      <item.icon className="w-6 h-6" />
                    </div>

                    {/* Label */}
                    <span className={`
                      text-[10px] font-semibold mt-1
                      transition-all duration-300
                      ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-indigo-600'}
                    `}>
                      {item.label}
                    </span>
                  </div>

                  {/* Active Indicator Dot */}
                  {isActive && (
                    <div className="
                      absolute -bottom-1 left-1/2 -translate-x-1/2
                      w-1.5 h-1.5 rounded-full
                      bg-white
                      shadow-sm
                      animate-pulse
                    " />
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Decorative Glow Effect */}
        <div className="
          absolute inset-0 -z-10
          bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20
          rounded-[32px]
          blur-xl
          opacity-60
        " />
      </nav>
    </>
  );
};

export default BottomNav;
