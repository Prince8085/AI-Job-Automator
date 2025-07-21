
import React from 'react';
import { NavLink } from 'react-router-dom';
import { HomeIcon, SearchIcon, BriefcaseIcon, UserIcon } from './icons';

const BottomNav: React.FC = () => {
  const navItems = [
    { path: '/dashboard', icon: HomeIcon, label: 'Dashboard' },
    { path: '/search', icon: SearchIcon, label: 'Search' },
    { path: '/tracker', icon: BriefcaseIcon, label: 'Tracker' },
    { path: '/profile', icon: UserIcon, label: 'Profile' },
  ];

  const activeLinkClass = 'text-primary';
  const inactiveLinkClass = 'text-text-secondary hover:text-primary';

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm border-t border-slate-200 z-10">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => 
              `flex flex-col items-center justify-center space-y-1 transition-colors duration-200 ${isActive ? activeLinkClass : inactiveLinkClass}`
            }
          >
            <item.icon className="w-6 h-6" />
            <span className="text-xs font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
