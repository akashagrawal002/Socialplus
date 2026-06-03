import React, { useState } from 'react';
import api from '../utils/api';
import { useWorkspaceStore } from '../hooks/useStore';
import PageHeader from '../components/PageHeader';
import ResultBox from '../components/ResultBox';
import toast from 'react-hot-toast';

const TREND_TYPES = [
  { label: '📡 All Trends',       value: 'all trends' },
  { label: '🎵 Trending Audios',  value: 'trending audio tracks' },
  { label: '🏷️ Trending Hashtags', value: 'trending hashtags' },
  { label: '🎞️ Trending Formats', value: 'trending content formats' },
];

export default function Trends() {
  const ws = useWorkspaceStore((s) => s.activeWorkspace);
  const [niche, setNiche]       = useState(ws?.niche || '');
  const [platform, setPlatform] = useState('All Platforms');
  const [trendType, setTrendType] = useState('all trends');
  const [result, setResult]     = useState('');
  const [loading, setLoading]   = useState(false);

  // Trend → Content
  const [trend, setTrend]     = useState('');
  const [tNiche, setTNiche]   = useState(ws?.niche || '');
  const [t2cRes, setT2cRes]   = useState('');
  const [t2cLoad, setT2cLoad] = useState(false);

  async function fetchTrends(type) {
    if (!ws?.id) return toast.error('Select a workspace first.');
    const tt = type || trendType;
    setTrendType(tt); setLoading(true); setResult('');
    try {
      const r = await api.post('/trends', { workspace_id: ws.id, niche, platform, trend_type: tt });
      setResult(r.data.result);
    } catch (e) { toast.error(e.response?.data?.error || 'Failed to fetch trends'); }
    finally { setLoading(false); }
  }

  async function handleTrendToContent() {
    if (!ws?.id) return toast.error('Select a workspace first.');
    if (!trend) return toast.error('Enter a trend first.');
    setT2cLoad(true); setT2cRes('');
    try {
      const r = await api.post('/trends/to-content', { workspace_id: ws.id, trend, niche: tNiche });
      setT2cRes(r.data.result);
    } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
    finally { setT2cLoad(false); }
  }

  return (
    <div>
      <PageHeader title="Trend" highlight="Radar" subtitle="Real-time social media trends with AI-curated insights" />

      <div className="card">
        <div className="card-title">🔍 Trend Explorer</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="input-group">
            <label className="label">Your Industry / Niche</label>
            <input className="input" placeholder="e.g. Fitness, Food, Finance, Fashion"
              value={niche} onChange={(e) => setNiche(e.target.value)} />
          </div>
          <div className="input-group">
            <label className="label">Platform</label>
            <select className="input" value={platform} onChange={(e) => setPlatform(e.target.value)}>
              {['All Platforms', 'Instagram', 'YouTube', 'TikTok', 'LinkedIn', 'Twitter/X'].map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {TREND_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => fetchTrends(t.value)}
              disabled={loading}
              className={`btn ${trendType === t.value ? 'btn-primary' : 'btn-secondary'} text-xs py-2`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <ResultBox result={result} loading={loading} loadingText="Scanning live trends from the web..." />
      </div>

      <div className="card">
        <div className="card-title">🎯 Turn a Trend Into Content</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="input-group">
            <label className="label">Trend (paste one from above)</label>
            <input className="input" placeholder="e.g. POV Storytelling, Day-in-life format"
              value={trend} onChange={(e) => setTrend(e.target.value)} />
          </div>
          <div className="input-group">
            <label className="label">Your Niche</label>
            <input className="input" placeholder="e.g. Personal finance for millennials"
              value={tNiche} onChange={(e) => setTNiche(e.target.value)} />
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleTrendToContent} disabled={t2cLoad}>
          ✨ Generate Trend Content
        </button>
        <ResultBox result={t2cRes} loading={t2cLoad} loadingText="Crafting trend-based content..." />
      </div>
    </div>
  );
}
