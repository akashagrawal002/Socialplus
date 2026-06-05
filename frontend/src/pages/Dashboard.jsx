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
  { icon: '📈', label: 'Fetch Trends',     path: '/trends',      color: 'from-accent3/20 to-accent3/5 border-accent3/30' },
  { icon: '🎬', label: 'Reel Ideas',       path: '/reels',       color: 'from-accent2/20 to-accent2/5 border-accent2/30' },
  { icon: '🚀', label: 'Create Content',   path: '/content',     color: 'from-accent4/20 to-accent4/5 border-accent4/30' },
  { icon: '📰', label: 'Latest News',      path: '/news',        color: 'from-purple-500/20 to-purple-500/5 border-purple-500/30' },
  { icon: '💬', label: 'Engagement',       path: '/engagement',  color: 'from-pink-500/20 to-pink-500/5 border-pink-500/30' },
];

const AI_BADGES = [
  { icon: '🤖', name: 'Claude',  color: 'bg-purple-500/15 border-purple-500/30 text-purple-300' },
  { icon: '💬', name: 'ChatGPT', color: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' },
  { icon: '✨', name: 'Gemini',  color: 'bg-blue-500/15 border-blue-500/30 text-blue-300' },
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
                      rounded-2xl p-6 mb-5 flex flex-col sm:flex-row items-start sm:items-center
                      justify-between gap-4">
        <div>
          <h2 className="font-syne font-extrabold text-xl text-text1 mb-1">
            {greeting()}, {user?.full_name?.split(' ')[0]} 👋
          </h2>
          <p className="text-sm text-text2 mb-3">
            {activeWorkspace ? `Working on: ${activeWorkspace.name}` : 'Create a workspace to get started'}
          </p>
          {/* AI badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-text3 mr-1">Powered by:</span>
            {AI_BADGES.map((ai) => (
              <span key={ai.name} className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border font-medium ${ai.color}`}>
                {ai.icon} {ai.name}
              </span>
            ))}
            <span className="text-[11px] px-2 py-0.5 rounded-full border bg-accent4/10 border-accent4/30 text-accent4 font-medium">
              ⚡ Compare Mode
            </span>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap flex-shrink-0">
          <button className="btn btn-primary" onClick={() => navigate('/competitors')}>🎯 Analyze Competitor</button>
          <button className="btn btn-secondary" onClick={() => navigate('/content')}>✨ Create Content</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
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
            <div className={`font-syne font-extrabold text-3xl ${s.color} leading-none mb-1`}>{s.value}</div>
            <div className="text-[11px] text-text2 uppercase tracking-wide font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      {/* AI Compare Banner */}
      <div className="card border-accent4/20 bg-gradient-to-r from-accent4/5 to-transparent mb-5">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 text-xl">
            <span>🤖</span><span>💬</span><span>✨</span>
          </div>
          <div className="flex-1">
            <div className="font-syne font-bold text-sm text-text1 mb-0.5">⚡ Compare Mode — New!</div>
            <div className="text-xs text-text2">Run the same prompt on Claude + ChatGPT + Gemini simultaneously and compare results side by side.</div>
          </div>
          <button className="btn btn-primary flex-shrink-0" onClick={() => navigate('/content')}>
            Try Compare Mode →
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-title">⚡ Quick Actions</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {QUICK_ACTIONS.map((a) => (
            <button key={a.path} onClick={() => navigate(a.path)}
              className={`bg-gradient-to-br ${a.color} border rounded-xl p-4 text-left
                          hover:-translate-y-0.5 transition-all duration-200 group`}>
              <div className="text-2xl mb-2">{a.icon}</div>
              <div className="text-sm font-medium text-text1 group-hover:text-white transition-colors">{a.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Trending */}
      <div className="card">
        <div className="card-title">🔥 Trending Formats Right Now</div>
        <div className="flex flex-wrap gap-2">
          {QUICK_TRENDS.map((t) => (
            <button key={t.label} onClick={() => navigate('/trends')} className={`tag ${t.color}`}>{t.label}</button>
          ))}
        </div>
        <button onClick={() => navigate('/trends')} className="mt-4 text-xs text-accent hover:underline">
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
          <button className="btn btn-primary" onClick={() => navigate('/settings')}>⚙️ Setup Workspace</button>
        </div>
      )}
    </div>
  );
}
