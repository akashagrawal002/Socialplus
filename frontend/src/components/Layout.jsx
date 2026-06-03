import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore, useWorkspaceStore } from '../hooks/useStore';
import WorkspaceSwitcher from './WorkspaceSwitcher';

const NAV = [
  { group: 'Overview',      items: [{ to: '/dashboard',  icon: '⚡', label: 'Dashboard' }] },
  { group: 'Intelligence',  items: [
    { to: '/competitors', icon: '🎯', label: 'Competitor Analysis' },
    { to: '/trends',      icon: '📈', label: 'Trend Radar' },
    { to: '/news',        icon: '📰', label: 'Social Media News' },
  ]},
  { group: 'Content Studio', items: [
    { to: '/reels',   icon: '🎬', label: 'Reel Ideas' },
    { to: '/posts',   icon: '✍️',  label: 'Post Generator' },
    { to: '/videos',  icon: '📹', label: 'Video Ideas' },
    { to: '/content', icon: '🚀', label: 'Content Creator' },
  ]},
  { group: 'Engagement', items: [
    { to: '/engagement', icon: '💬', label: 'Engagement Hub' },
  ]},
  { group: 'Account', items: [
    { to: '/history',  icon: '🕐', label: 'History' },
    { to: '/settings', icon: '⚙️',  label: 'Settings' },
  ]},
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const logout   = useAuthStore((s) => s.logout);
  const user     = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="flex min-h-screen">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ---- SIDEBAR ---- */}
      <aside className={`
        fixed top-0 left-0 h-full w-[220px] bg-surface border-r border-border z-30
        flex flex-col transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Logo */}
        <div className="px-5 py-5 border-b border-border flex-shrink-0">
          <div className="font-syne font-extrabold text-xl bg-gradient-to-r from-accent to-accent3 bg-clip-text text-transparent">
            Social<span className="text-accent2">Pulse</span>
          </div>
          <div className="text-[10px] text-text3 mt-0.5 tracking-widest uppercase">AI Manager</div>
        </div>

        {/* Workspace switcher */}
        <div className="px-3 py-3 border-b border-border flex-shrink-0">
          <WorkspaceSwitcher />
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {NAV.map((section) => (
            <div key={section.group} className="mb-5">
              <div className="text-[9px] font-bold tracking-[2px] uppercase text-text3 px-2 mb-1.5">
                {section.group}
              </div>
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `nav-item mb-0.5 ${isActive ? 'active' : ''}`
                  }
                >
                  <span className="w-5 text-center text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-border flex-shrink-0">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent to-accent3 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {user?.full_name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-text1 truncate">{user?.full_name}</div>
              <div className="text-[10px] text-text3 capitalize">{user?.plan} plan</div>
            </div>
            <button
              onClick={handleLogout}
              className="text-text3 hover:text-accent2 text-sm transition-colors"
              title="Logout"
            >↗</button>
          </div>
        </div>
      </aside>

      {/* ---- MAIN ---- */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-10 flex items-center justify-between px-5 py-3.5
                           bg-surface/80 backdrop-blur-xl border-b border-border">
          <button
            className="lg:hidden text-text2 hover:text-text1 mr-3"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <span className="hidden sm:block text-[11px] px-2.5 py-1 rounded-full
                             bg-accent/10 border border-accent/20 text-accent3 font-medium">
              ✦ AI-Powered
            </span>
            {user?.plan === 'free' && (
              <span className="text-[11px] px-2.5 py-1 rounded-full
                               bg-accent4/10 border border-accent4/20 text-accent4 font-medium">
                {user.ai_credits} credits left
              </span>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-5 lg:p-8 relative z-[1]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
