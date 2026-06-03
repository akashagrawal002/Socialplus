// ============================================================
// News.jsx
// ============================================================
import React, { useState } from 'react';
import api from '../utils/api';
import { useWorkspaceStore } from '../hooks/useStore';
import PageHeader from '../components/PageHeader';
import ResultBox from '../components/ResultBox';
import toast from 'react-hot-toast';

export function News() {
  const ws = useWorkspaceStore((s) => s.activeWorkspace);
  const [topic, setTopic]     = useState('');
  const [platform, setPlatform] = useState('');
  const [newsType, setNewsType] = useState('latest news');
  const [result, setResult]   = useState('');
  const [loading, setLoading] = useState(false);

  async function fetchNews(type) {
    if (!ws?.id) return toast.error('Select a workspace first.');
    const nt = type || newsType;
    setNewsType(nt); setLoading(true); setResult('');
    try {
      const r = await api.post('/news', { workspace_id: ws.id, topic, platform, news_type: nt });
      setResult(r.data.result);
    } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  }

  return (
    <div>
      <PageHeader title="Social Media" highlight="News" subtitle="Latest updates, algorithm changes & industry news" />
      <div className="card">
        <div className="card-title">🗞️ Fetch Latest Updates</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="input-group">
            <label className="label">Topic (optional)</label>
            <input className="input" placeholder="e.g. Instagram algorithm"
              value={topic} onChange={(e) => setTopic(e.target.value)} />
          </div>
          <div className="input-group">
            <label className="label">Platform Focus</label>
            <select className="input" value={platform} onChange={(e) => setPlatform(e.target.value)}>
              {['', 'Instagram', 'YouTube', 'LinkedIn', 'Twitter/X', 'TikTok', 'Meta'].map((p) => (
                <option key={p} value={p}>{p || 'All Platforms'}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { label: '📡 Latest News', value: 'latest news' },
            { label: '🔄 Algorithm Updates', value: 'algorithm updates' },
            { label: '🆕 New Features', value: 'new features' },
            { label: '💡 Strategy Tips', value: 'strategy tips' },
          ].map((n) => (
            <button key={n.value} onClick={() => fetchNews(n.value)} disabled={loading}
              className={`btn ${newsType === n.value ? 'btn-primary' : 'btn-secondary'} text-xs py-2`}>
              {n.label}
            </button>
          ))}
        </div>
        <ResultBox result={result} loading={loading} loadingText="Fetching from the web..." />
      </div>
    </div>
  );
}

// ============================================================
// Reels.jsx
// ============================================================
const REEL_FORMATS = [
  { icon: '🔄', title: 'Before vs After', desc: 'Transformation reveal' },
  { icon: '🎭', title: 'POV Storytelling', desc: 'First-person narrative' },
  { icon: '☀️', title: 'Day in My Life', desc: 'Behind-the-scenes' },
  { icon: '💥', title: 'Myth Busting', desc: '3 myths debunked fast' },
  { icon: '⚡', title: 'Quick 5 Tips', desc: 'Rapid-fire value' },
  { icon: '🎤', title: 'Reaction Video', desc: 'React to trending content' },
];

export function Reels() {
  const ws = useWorkspaceStore((s) => s.activeWorkspace);
  const [niche, setNiche]   = useState(ws?.niche || '');
  const [goal, setGoal]     = useState('Go Viral');
  const [tone, setTone]     = useState('Entertaining & Fun');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  async function generate(overrideNiche) {
    if (!ws?.id) return toast.error('Select a workspace first.');
    const n = overrideNiche || niche;
    if (!n) return toast.error('Enter your niche.');
    setLoading(true); setResult('');
    try {
      const r = await api.post('/content/reels', { workspace_id: ws.id, niche: n, goal, tone });
      setResult(r.data.result);
    } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  }

  return (
    <div>
      <PageHeader title="Reel" highlight="Ideas" subtitle="High-performing reel concepts with performance insights" />

      {/* Quick formats */}
      <div className="card">
        <div className="card-title">💡 High-Performance Formats — Click to Generate</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {REEL_FORMATS.map((f) => (
            <button key={f.title} onClick={() => generate(f.title + ' for ' + (niche || 'my niche'))}
              className="bg-surface2 border border-border rounded-xl p-4 text-left
                         hover:border-accent/40 hover:-translate-y-0.5 transition-all">
              <div className="text-2xl mb-2">{f.icon}</div>
              <div className="font-semibold text-sm text-text1 mb-0.5">{f.title}</div>
              <div className="text-xs text-text2">{f.desc}</div>
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-accent3">
                <span className="w-1.5 h-1.5 rounded-full bg-accent3 inline-block" />
                Top Performer
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* AI generator */}
      <div className="card">
        <div className="card-title">🎯 AI Reel Idea Generator</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="input-group">
            <label className="label">Your Niche</label>
            <input className="input" placeholder="e.g. Yoga, SaaS, Wedding"
              value={niche} onChange={(e) => setNiche(e.target.value)} />
          </div>
          <div className="input-group">
            <label className="label">Goal</label>
            <select className="input" value={goal} onChange={(e) => setGoal(e.target.value)}>
              {['Go Viral', 'Grow Followers', 'Build Authority', 'Drive Sales', 'Increase Saves', 'Boost Comments'].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
          <div className="input-group">
            <label className="label">Tone / Style</label>
            <select className="input" value={tone} onChange={(e) => setTone(e.target.value)}>
              {['Entertaining & Fun', 'Educational', 'Inspirational', 'Behind-the-scenes', 'Controversial / Bold', 'Emotional Storytelling'].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => generate()} disabled={loading}>
          🎬 Generate 10 Reel Ideas
        </button>
        <ResultBox result={result} loading={loading} loadingText="Generating viral reel ideas..." />
      </div>
    </div>
  );
}

// ============================================================
// Posts.jsx
// ============================================================
export function Posts() {
  const ws = useWorkspaceStore((s) => s.activeWorkspace);
  const [postForm, setPostForm] = useState({ topic: '', platform: 'Instagram', type: 'Carousel / Swipe', base: 'My niche expertise' });
  const [postRes, setPostRes]   = useState('');
  const [postLoad, setPostLoad] = useState(false);
  const [hookForm, setHookForm] = useState({ topic: '', style: 'Curiosity Gap', platform: 'Instagram Caption' });
  const [hookRes, setHookRes]   = useState('');
  const [hookLoad, setHookLoad] = useState(false);

  async function genPosts() {
    if (!ws?.id) return toast.error('Select a workspace first.');
    if (!postForm.topic) return toast.error('Enter a topic.');
    setPostLoad(true); setPostRes('');
    try {
      const r = await api.post('/content/posts', { workspace_id: ws.id, ...postForm });
      setPostRes(r.data.result);
    } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
    finally { setPostLoad(false); }
  }

  async function genHooks() {
    if (!ws?.id) return toast.error('Select a workspace first.');
    if (!hookForm.topic) return toast.error('Enter a topic.');
    setHookLoad(true); setHookRes('');
    try {
      const r = await api.post('/content/hooks', { workspace_id: ws.id, ...hookForm });
      setHookRes(r.data.result);
    } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
    finally { setHookLoad(false); }
  }

  return (
    <div>
      <PageHeader title="Post" highlight="Generator" subtitle="AI-crafted captions, hooks & post ideas for any platform" />

      <div className="card">
        <div className="card-title">📝 Post Idea Generator</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {[
            { label: 'Topic / Theme', key: 'topic', placeholder: 'e.g. Productivity hacks' },
          ].map((f) => (
            <div key={f.key} className="input-group sm:col-span-2">
              <label className="label">{f.label}</label>
              <input className="input" placeholder={f.placeholder}
                value={postForm[f.key]} onChange={(e) => setPostForm({ ...postForm, [f.key]: e.target.value })} />
            </div>
          ))}
          {[
            { label: 'Platform', key: 'platform', options: ['Instagram', 'LinkedIn', 'Twitter/X', 'Facebook', 'All'] },
            { label: 'Content Type', key: 'type', options: ['Carousel / Swipe', 'Single Image', 'Text Post', 'Poll / Question', 'Story Ideas'] },
            { label: 'Based On', key: 'base', options: ['My niche expertise', 'Competitor analysis', 'Current trends', 'Customer FAQs', 'Employee highlights'] },
          ].map((f) => (
            <div key={f.key} className="input-group">
              <label className="label">{f.label}</label>
              <select className="input" value={postForm[f.key]} onChange={(e) => setPostForm({ ...postForm, [f.key]: e.target.value })}>
                {f.options.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>
        <button className="btn btn-primary" onClick={genPosts} disabled={postLoad}>💡 Generate Post Ideas</button>
        <ResultBox result={postRes} loading={postLoad} loadingText="Crafting post ideas..." />
      </div>

      <div className="card">
        <div className="card-title">🪝 Hook Generator</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="input-group sm:col-span-1">
            <label className="label">What's your post about?</label>
            <input className="input" placeholder="e.g. Why most diets fail"
              value={hookForm.topic} onChange={(e) => setHookForm({ ...hookForm, topic: e.target.value })} />
          </div>
          {[
            { label: 'Hook Style', key: 'style', options: ['Curiosity Gap', 'Controversial Statement', 'Question', 'Statistics', 'Story Opening', 'Pain Point'] },
            { label: 'Platform', key: 'platform', options: ['Instagram Caption', 'LinkedIn', 'Twitter/X', 'Reel Hook'] },
          ].map((f) => (
            <div key={f.key} className="input-group">
              <label className="label">{f.label}</label>
              <select className="input" value={hookForm[f.key]} onChange={(e) => setHookForm({ ...hookForm, [f.key]: e.target.value })}>
                {f.options.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>
        <button className="btn btn-primary" onClick={genHooks} disabled={hookLoad}>⚡ Generate 5 Hooks</button>
        <ResultBox result={hookRes} loading={hookLoad} loadingText="Crafting scroll-stopping hooks..." />
      </div>
    </div>
  );
}

// ============================================================
// Videos.jsx
// ============================================================
export function Videos() {
  const ws = useWorkspaceStore((s) => s.activeWorkspace);
  const [form, setForm] = useState({ niche: ws?.niche || '', format: 'YouTube Long-form (8-15 min)', inspiration: 'Trending topics in my niche', count: '10 ideas' });
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  async function generate() {
    if (!ws?.id) return toast.error('Select a workspace first.');
    if (!form.niche) return toast.error('Enter your niche.');
    setLoading(true); setResult('');
    try {
      const r = await api.post('/content/videos', { workspace_id: ws.id, ...form });
      setResult(r.data.result);
    } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  }

  return (
    <div>
      <PageHeader title="Video" highlight="Ideas" subtitle="YouTube, Shorts & long-form video content strategy" />
      <div className="card">
        <div className="card-title">🎥 Video Idea Generator</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="input-group">
            <label className="label">Channel Niche</label>
            <input className="input" placeholder="e.g. Personal Finance India"
              value={form.niche} onChange={(e) => setForm({ ...form, niche: e.target.value })} />
          </div>
          <div className="input-group">
            <label className="label">Video Format</label>
            <select className="input" value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })}>
              {['YouTube Long-form (8-15 min)', 'YouTube Short (60 sec)', 'Tutorial / How-to', 'Vlog', 'Reaction / Commentary', 'Documentary Style', 'Interview'].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
          <div className="input-group">
            <label className="label">Inspiration Source</label>
            <select className="input" value={form.inspiration} onChange={(e) => setForm({ ...form, inspiration: e.target.value })}>
              {['Trending topics in my niche', 'Competitor video analysis', 'Audience questions (FAQs)', 'Current news & events', 'Evergreen content'].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
          <div className="input-group">
            <label className="label">Number of Ideas</label>
            <select className="input" value={form.count} onChange={(e) => setForm({ ...form, count: e.target.value })}>
              {['5 ideas', '10 ideas', '15 ideas', '1 Month Calendar'].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
        </div>
        <button className="btn btn-primary" onClick={generate} disabled={loading}>🎬 Generate Video Ideas</button>
        <ResultBox result={result} loading={loading} loadingText="Generating video ideas..." />
      </div>
    </div>
  );
}

export default News;
