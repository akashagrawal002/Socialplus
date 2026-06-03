import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useWorkspaceStore } from '../hooks/useStore';
import api from '../utils/api';
import PageHeader from '../components/PageHeader';

const QUICK_TRENDS = [
  { label: '📱 AI Avatars', color: 'tag-purple' },
  { label: '🎭 POV Stories', color: 'tag-green' },
  { label: '💃 Dance Trends', color: 'tag-red' },
  { label: '✨ Day-in-life', color: 'tag-yellow' },
  { label: '🔥 Before/After', color: 'tag-purple' },
  { label: '📊 Info Reels', color: 'tag-green' },
  { label: '🎤 Commentary', color: 'tag-red' },
  { label: '🤖 AI Tools', color: 'tag-yellow' },
];

const QUICK_ACTIONS = [
  { icon: '🎯', label: 'Find Competitors', path: '/competitors', color: 'from-accent/20 to-accent/5 border-accent/30' },
  { icon: '📈', label: 'Fetch Trends',     path: '/trends',     color: 'from-accent3/20 to-accent3/5 border-accent3/30' },
  { icon: '🎬', label: 'Reel Ideas',       path: '/reels',      color: 'from-accent2/20 to-accent2/5 border-accent2/30' },
  { icon: '🚀', label: 'Create Content',   path: '/content',    color: 'from-accent4/20 to-accent4/5 border-accent4/30' },
  { icon: '📰', label: 'Latest News',      path: '/news',       color: 'from-purple-500/20 to-purple-500/5 border-purple-500/30' },
  { icon: '💬', label: 'Engagement',       path: '/engagement', color: 'from-pink-500/20 to-pink-500/5 border-pink-500/30' },
];

export default function Dashboard() {
  const user            = useAuthStore((s) => s.user);
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);
  const navigate        = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (activeWorkspace?.id) {
      api.get(`/dashboard/stats?workspace_id=${activeWorkspace.id}`)
        .then((r) => setStats(r.data.stats))
        .catch(() => {});
    }
  }, [activeWorkspace?.id]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div>
      {/* Hero */}
      <div className="bg-gradient-to-r from-accent/10 to-accent3/5 border border-accent/20
                      rounded-2xl p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center
                      justify-between gap-4">
        <div>
          <h2 className="font-syne font-extrabold text-xl text-text1 mb-1">
            {greeting()}, {user?.full_name?.split(' ')[0]} 👋
          </h2>
          <p className="text-sm text-text2">
            {activeWorkspace
              ? `Working on: ${activeWorkspace.name}`
              : 'Create a workspace to get started'}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button className="btn btn-primary" onClick={() => navigate('/competitors')}>
            🎯 Analyze Competitor
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/content')}>
            ✨ Create Content
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Generations', value: stats?.usage?.total_generations || '—', color: 'text-accent',  bar: 'bg-accent'  },
          { label: 'Today',             value: stats?.usage?.today_count        || '0', color: 'text-accent3', bar: 'bg-accent3' },
          { label: 'This Week',         value: stats?.usage?.week_count         || '0', color: 'text-accent2', bar: 'bg-accent2' },
          { label: 'AI Credits',
            value: user?.plan === 'free' ? (user?.ai_credits ?? '—') : '∞',
            color: 'text-accent4', bar: 'bg-accent4' },
        ].map((s) => (
          <div key={s.label} className="bg-surface border border-border rounded-xl p-4 relative overflow-hidden">
            <div className={`absolute top-0 left-0 right-0 h-0.5 ${s.bar}`} />
            <div className={`font-syne font-extrabold text-3xl ${s.color} leading-none mb-1`}>
              {s.value}
            </div>
            <div className="text-[11px] text-text2 uppercase tracking-wide font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-title">⚡ Quick Actions</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {QUICK_ACTIONS.map((a) => (
            <button
              key={a.path}
              onClick={() => navigate(a.path)}
              className={`bg-gradient-to-br ${a.color} border rounded-xl p-4 text-left
                          hover:-translate-y-0.5 transition-all duration-200 group`}
            >
              <div className="text-2xl mb-2">{a.icon}</div>
              <div className="text-sm font-medium text-text1 group-hover:text-white transition-colors">
                {a.label}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Trending Now */}
      <div className="card">
        <div className="card-title">🔥 Trending Formats Right Now</div>
        <div className="flex flex-wrap gap-2">
          {QUICK_TRENDS.map((t) => (
            <button
              key={t.label}
              onClick={() => navigate('/trends')}
              className={`tag ${t.color} hover:-translate-y-0.5`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => navigate('/trends')}
          className="mt-4 text-xs text-accent hover:underline"
        >
          View full trend report →
        </button>
      </div>

      {/* Workspace setup prompt */}
      {!activeWorkspace?.industry && (
        <div className="card border-accent4/30 bg-accent4/5">
          <div className="card-title">⚠️ Complete Your Workspace Setup</div>
          <p className="text-sm text-text2 mb-4">
            Add your business details to get personalized competitor detection and content ideas.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/settings')}>
            ⚙️ Setup Workspace
          </button>
        </div>
      )}
    </div>
  );
}
