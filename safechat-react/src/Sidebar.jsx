// src/Sidebar.jsx
import { BellIcon, ChatBubbleOvalLeftEllipsisIcon, HomeIcon, UserIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

export default function Sidebar({
  onShowNotifications, onShowChat, onNavigateToHome, onNavigateToProfile, onNavigateToFriends, activePage = 'Home',
}) {
  const [active, setActive] = useState(activePage);
  const handleNav = (item, onClick) => { setActive(item); onClick?.(); };

  const navItems = [
    { name: 'Home', icon: HomeIcon, onClick: onNavigateToHome },
    { name: 'Notifications', icon: BellIcon, onClick: onShowNotifications },
    { name: 'Messages', icon: ChatBubbleOvalLeftEllipsisIcon, onClick: onShowChat },
    { name: 'Find Friends', icon: MagnifyingGlassIcon, onClick: onNavigateToFriends },
    { name: 'Profile', icon: UserIcon, onClick: onNavigateToProfile },
  ];

  return (
    <div className="relative flex h-full w-full flex-col gap-8 bg-sc-container-low border-r border-sc-outline/25">
      {/* Brand */}
      <div className="px-5 pt-7">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-gradient-primary">SafeChat</h1>
        <div className="mt-3 h-0.5 w-16 rounded-full bg-gradient-to-r from-sc-primary/40 to-transparent" />
      </div>

      {/* New Chat CTA */}
      <div className="px-4">
        <button onClick={onShowChat}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-primary px-5 py-3 text-sm font-bold text-sc-on-primary hover-scale border border-sc-primary/20 shadow-ambient transition-all duration-200">
          <span className="text-lg leading-none">+</span> New Chat
        </button>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 px-3" role="navigation">
        {navItems.map((item) => {
          const isActive = active === item.name;
          return (
            <button key={item.name} onClick={() => handleNav(item.name, item.onClick)}
              className={[
                'group flex items-center gap-4 rounded-2xl px-4 py-3 text-[15px] font-medium transition-all duration-200',
                isActive
                  ? 'bg-sc-secondary/40 text-sc-primary border border-sc-primary/15 shadow-sm'
                  : 'text-sc-text-muted hover:bg-sc-container-high/60 hover:text-sc-text border border-transparent',
                'relative overflow-hidden',
              ].filter(Boolean).join(' ')}
              title={item.name}>
              <item.icon className={['relative z-10 h-5 w-5 transition-colors duration-200', isActive ? 'text-sc-primary' : 'text-sc-text-muted group-hover:text-sc-primary'].join(' ')} />
              <span className="relative z-10">{item.name}</span>
              {isActive && <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-gradient-primary animate-pulse-glow" />}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="mt-auto px-4 pb-6 space-y-4">
        <div className="h-px w-full bg-sc-outline/20" />
        <div className="flex flex-col gap-1 px-1">
          <button className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-sc-text-muted hover:bg-sc-container-high/60 transition-all duration-200">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" /></svg>
            Help
          </button>
          <button className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-sc-text-muted hover:bg-sc-container-high/60 transition-all duration-200">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
            Archive
          </button>
        </div>
      </div>
    </div>
  );
}
