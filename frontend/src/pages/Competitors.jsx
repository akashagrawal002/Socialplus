import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useWorkspaceStore } from '../hooks/useStore';
import PageHeader from '../components/PageHeader';
import ResultBox from '../components/ResultBox';
import toast from 'react-hot-toast';

export default function Competitors() {
  const ws = useWorkspaceStore((s) => s.activeWorkspace);

  // Auto-detect state
  const [detect, setDetect]   = useState({ biz_name: ws?.business_name || '', industry: ws?.industry || '', location: ws?.location || '', size: '' });
  const [detectRes, setDetectRes] = useState('');
  const [detectLoading, setDetectLoading] = useState(false);

  // Deep analyze state
  const [analyze, setAnalyze] = useState({ handle: '', platform: 'Instagram', focus: 'Full Analysis' });
  const [analyzeRes, setAnalyzeRes] = useState('');
  const [analyzeLoading, setAnalyzeLoading] = useState(false);

  // Gap finder state
  const [gapInput, setGapInput] = useState('');
  const [gapRes, setGapRes]     = useState('');
  const [gapLoading, setGapLoading] = useState(false);

  // Saved competitors
  const [saved, setSaved] = useState([]);

  useEffect(() => {
    if (ws?.id) {
      api.get(`/competitors?workspace_id=${ws.id}`)
        .then((r) => setSaved(r.data.competitors || []))
        .catch(() => {});
    }
    if (ws) {
      setDetect((d) => ({
        ...d,
        biz_name: ws.business_name || d.biz_name,
        industry: ws.industry     || d.industry,
        location: ws.location     || d.location,
      }));
    }
  }, [ws?.id]);

  async function handleDetect() {
    if (!ws?.id) return toast.error('Please select a workspace first.');
    if (!detect.biz_name || !detect.industry) return toast.error('Business name and industry are required.');
    setDetectLoading(true); setDetectRes('');
    try {
      const r = await api.post('/competitors/detect', { workspace_id: ws.id, ...detect });
      setDetectRes(r.data.result);
    } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
    finally { setDetectLoading(false); }
  }

  async function handleAnalyze() {
    if (!ws?.id) return toast.error('Please select a workspace first.');
    if (!analyze.handle) return toast.error('Enter a competitor name or handle.');
    setAnalyzeLoading(true); setAnalyzeRes('');
    try {
      const r = await api.post('/competitors/analyze', { workspace_id: ws.id, ...analyze });
      setAnalyzeRes(r.data.result);
      // Refresh saved list
      api.get(`/competitors?workspace_id=${ws.id}`).then((r) => setSaved(r.data.competitors || []));
    } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
    finally { setAnalyzeLoading(false); }
  }

  async function handleGaps() {
    if (!ws?.id) return toast.error('Please select a workspace first.');
    if (!gapInput) return toast.error('Enter niche + competitor names.');
    setGapLoading(true); setGapRes('');
    try {
      const r = await api.post('/competitors/gaps', { workspace_id: ws.id, input: gapInput });
      setGapRes(r.data.result);
    } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
    finally { setGapLoading(false); }
  }

  async function handleDelete(id) {
    await api.delete(`/competitors/${id}`).catch(() => {});
    setSaved((s) => s.filter((c) => c.id !== id));
    toast.success('Removed');
  }

  return (
    <div>
      <PageHeader title="Competitor" highlight="Analysis" subtitle="Research, monitor & outsmart your competition with AI" />

      {/* Auto-detect */}
      <div className="card">
        <div className="card-title">🤖 Auto-Detect Competitors</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="input-group">
            <label className="label">Business / Brand Name</label>
            <input className="input" placeholder="e.g. FreshGlow Skincare"
              value={detect.biz_name} onChange={(e) => setDetect({ ...detect, biz_name: e.target.value })} />
          </div>
          <div className="input-group">
            <label className="label">Industry</label>
            <input className="input" placeholder="e.g. Natural Skincare, D2C"
              value={detect.industry} onChange={(e) => setDetect({ ...detect, industry: e.target.value })} />
          </div>
          <div className="input-group">
            <label className="label">Location / Market</label>
            <input className="input" placeholder="e.g. India, Mumbai, Global"
              value={detect.location} onChange={(e) => setDetect({ ...detect, location: e.target.value })} />
          </div>
          <div className="input-group">
            <label className="label">Business Size</label>
            <select className="input" value={detect.size} onChange={(e) => setDetect({ ...detect, size: e.target.value })}>
              <option value="">Select size</option>
              {['Startup / Solo creator', 'Small (1–50)', 'Medium (50–500)', 'Large enterprise'].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleDetect} disabled={detectLoading}>
          🔍 Find My Competitors
        </button>
        <ResultBox result={detectRes} loading={detectLoading} loadingText="Scanning social media landscape..." />
      </div>

      {/* Deep analyze */}
      <div className="card">
        <div className="card-title">🔬 Deep Competitor Research</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="input-group sm:col-span-1">
            <label className="label">Competitor Name / Handle</label>
            <input className="input" placeholder="e.g. @mamaearth"
              value={analyze.handle} onChange={(e) => setAnalyze({ ...analyze, handle: e.target.value })} />
          </div>
          <div className="input-group">
            <label className="label">Platform</label>
            <select className="input" value={analyze.platform} onChange={(e) => setAnalyze({ ...analyze, platform: e.target.value })}>
              {['Instagram', 'YouTube', 'LinkedIn', 'Twitter/X', 'All'].map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label className="label">Analysis Focus</label>
            <select className="input" value={analyze.focus} onChange={(e) => setAnalyze({ ...analyze, focus: e.target.value })}>
              {['Full Analysis', 'Content Strategy', 'Posting Frequency', 'Engagement Patterns', 'Content Gaps', 'Strengths & Weaknesses'].map((f) => <option key={f}>{f}</option>)}
            </select>
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleAnalyze} disabled={analyzeLoading}>
          🧬 Deep Analysis
        </button>
        <ResultBox result={analyzeRes} loading={analyzeLoading} loadingText="Analyzing competitor profile..." />
      </div>

      {/* Content Gap */}
      <div className="card">
        <div className="card-title">💡 Content Gap Finder</div>
        <div className="input-group">
          <label className="label">Your niche + 2–3 competitor names (comma separated)</label>
          <input className="input" placeholder="e.g. Organic skincare — MamaEarth, WOW Skin, The Derma Co"
            value={gapInput} onChange={(e) => setGapInput(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={handleGaps} disabled={gapLoading}>
          🎯 Find Content Gaps
        </button>
        <ResultBox result={gapRes} loading={gapLoading} loadingText="Finding untapped opportunities..." />
      </div>

      {/* Saved Competitors */}
      {saved.length > 0 && (
        <div className="card">
          <div className="card-title">📌 Tracked Competitors ({saved.length})</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {saved.map((c) => (
              <div key={c.id} className="bg-surface2 border border-border rounded-xl p-4
                                          flex items-start justify-between gap-3 hover:border-accent/30 transition-colors">
                <div>
                  <div className="font-syne font-bold text-sm text-text1 mb-0.5">{c.name}</div>
                  <div className="text-xs text-text2">{c.platform} · Added {new Date(c.created_at).toLocaleDateString()}</div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => { setAnalyze({ handle: c.handle || c.name, platform: c.platform || 'Instagram', focus: 'Full Analysis' }); window.scrollTo(0, 0); }}
                    className="text-xs text-accent hover:underline"
                  >Re-analyze</button>
                  <button onClick={() => handleDelete(c.id)} className="text-xs text-accent2 hover:underline">Remove</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
