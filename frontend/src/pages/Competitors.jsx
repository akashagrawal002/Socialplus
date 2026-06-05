import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useWorkspaceStore } from '../hooks/useStore';
import PageHeader from '../components/PageHeader';
import ResultBox from '../components/ResultBox';
import AISelector from '../components/AISelector';
import CompareView from '../components/CompareView';
import toast from 'react-hot-toast';

export default function Competitors() {
  const ws = useWorkspaceStore((s) => s.activeWorkspace);
  const [detect, setDetect]   = useState({ biz_name: ws?.business_name||'', industry: ws?.industry||'', location: ws?.location||'', size:'' });
  const [detectRes, setDetectRes] = useState(''); const [detectCompare, setDetectCompare] = useState(null); const [detectLoading, setDetectLoading] = useState(false);
  const [analyze, setAnalyze] = useState({ handle:'', platform:'Instagram', focus:'Full Analysis' });
  const [analyzeRes, setAnalyzeRes] = useState(''); const [analyzeCompare, setAnalyzeCompare] = useState(null); const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [gapInput, setGapInput] = useState('');
  const [gapRes, setGapRes]   = useState(''); const [gapCompare, setGapCompare] = useState(null); const [gapLoading, setGapLoading] = useState(false);
  const [saved, setSaved]     = useState([]);
  const [detectAI, setDetectAI] = useState('claude');
  const [analyzeAI, setAnalyzeAI] = useState('claude');
  const [gapAI, setGapAI]     = useState('claude');

  useEffect(() => {
    if (ws?.id) api.get(`/competitors?workspace_id=${ws.id}`).then((r) => setSaved(r.data.competitors||[])).catch(()=>{});
    if (ws) setDetect((d) => ({ ...d, biz_name: ws.business_name||d.biz_name, industry: ws.industry||d.industry, location: ws.location||d.location }));
  }, [ws?.id]);

  async function handleDetect() {
    if (!ws?.id) return toast.error('Select a workspace first.');
    if (!detect.biz_name||!detect.industry) return toast.error('Business name and industry required.');
    setDetectLoading(true); setDetectRes(''); setDetectCompare(null);
    try {
      const isCompare = detectAI === 'compare';
      const r = await api.post('/competitors/detect', { workspace_id: ws.id, ...detect, provider: isCompare ? 'claude' : detectAI, compare: isCompare });
      if (isCompare) setDetectCompare(r.data.results); else setDetectRes(r.data.result);
    } catch (e) { toast.error(e.response?.data?.error||'Failed'); }
    finally { setDetectLoading(false); }
  }

  async function handleAnalyze() {
    if (!ws?.id) return toast.error('Select a workspace first.');
    if (!analyze.handle) return toast.error('Enter a competitor name or handle.');
    setAnalyzeLoading(true); setAnalyzeRes(''); setAnalyzeCompare(null);
    try {
      const isCompare = analyzeAI === 'compare';
      const r = await api.post('/competitors/analyze', { workspace_id: ws.id, ...analyze, provider: isCompare ? 'claude' : analyzeAI, compare: isCompare });
      if (isCompare) setAnalyzeCompare(r.data.results); else setAnalyzeRes(r.data.result);
      api.get(`/competitors?workspace_id=${ws.id}`).then((r) => setSaved(r.data.competitors||[]));
    } catch (e) { toast.error(e.response?.data?.error||'Failed'); }
    finally { setAnalyzeLoading(false); }
  }

  async function handleGaps() {
    if (!ws?.id) return toast.error('Select a workspace first.');
    if (!gapInput) return toast.error('Enter niche + competitor names.');
    setGapLoading(true); setGapRes(''); setGapCompare(null);
    try {
      const isCompare = gapAI === 'compare';
      const r = await api.post('/competitors/gaps', { workspace_id: ws.id, input: gapInput, provider: isCompare ? 'claude' : gapAI, compare: isCompare });
      if (isCompare) setGapCompare(r.data.results); else setGapRes(r.data.result);
    } catch (e) { toast.error(e.response?.data?.error||'Failed'); }
    finally { setGapLoading(false); }
  }

  async function handleDelete(id) {
    await api.delete(`/competitors/${id}`).catch(()=>{});
    setSaved((s) => s.filter((c) => c.id !== id));
    toast.success('Removed');
  }

  return (
    <div>
      <PageHeader title="Competitor" highlight="Analysis" subtitle="Research, monitor & outsmart your competition with AI" />
      <div className="card">
        <div className="card-title">🤖 Auto-Detect Competitors</div>
        <AISelector value={detectAI} onChange={setDetectAI} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="input-group"><label className="label">Business Name</label><input className="input" placeholder="e.g. FreshGlow Skincare" value={detect.biz_name} onChange={(e) => setDetect({...detect,biz_name:e.target.value})} /></div>
          <div className="input-group"><label className="label">Industry</label><input className="input" placeholder="e.g. Natural Skincare, D2C" value={detect.industry} onChange={(e) => setDetect({...detect,industry:e.target.value})} /></div>
          <div className="input-group"><label className="label">Location</label><input className="input" placeholder="e.g. India, Mumbai" value={detect.location} onChange={(e) => setDetect({...detect,location:e.target.value})} /></div>
          <div className="input-group"><label className="label">Business Size</label><select className="input" value={detect.size} onChange={(e) => setDetect({...detect,size:e.target.value})}><option value="">Select size</option>{['Startup / Solo creator','Small (1–50)','Medium (50–500)','Large enterprise'].map((o)=><option key={o}>{o}</option>)}</select></div>
        </div>
        <button className="btn btn-primary" onClick={handleDetect} disabled={detectLoading}>🔍 Find My Competitors</button>
        {detectCompare ? <CompareView results={detectCompare} loading={detectLoading} /> : <ResultBox result={detectRes} loading={detectLoading} loadingText="Scanning social media landscape..." />}
      </div>
      <div className="card">
        <div className="card-title">🔬 Deep Competitor Research</div>
        <AISelector value={analyzeAI} onChange={setAnalyzeAI} />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="input-group"><label className="label">Competitor Name / Handle</label><input className="input" placeholder="e.g. @mamaearth" value={analyze.handle} onChange={(e) => setAnalyze({...analyze,handle:e.target.value})} /></div>
          <div className="input-group"><label className="label">Platform</label><select className="input" value={analyze.platform} onChange={(e) => setAnalyze({...analyze,platform:e.target.value})}>{['Instagram','YouTube','LinkedIn','Twitter/X','All'].map((p)=><option key={p}>{p}</option>)}</select></div>
          <div className="input-group"><label className="label">Focus</label><select className="input" value={analyze.focus} onChange={(e) => setAnalyze({...analyze,focus:e.target.value})}>{['Full Analysis','Content Strategy','Posting Frequency','Engagement Patterns','Content Gaps','Strengths & Weaknesses'].map((f)=><option key={f}>{f}</option>)}</select></div>
        </div>
        <button className="btn btn-primary" onClick={handleAnalyze} disabled={analyzeLoading}>🧬 Deep Analysis</button>
        {analyzeCompare ? <CompareView results={analyzeCompare} loading={analyzeLoading} /> : <ResultBox result={analyzeRes} loading={analyzeLoading} loadingText="Analyzing competitor profile..." />}
      </div>
      <div className="card">
        <div className="card-title">💡 Content Gap Finder</div>
        <AISelector value={gapAI} onChange={setGapAI} />
        <div className="input-group"><label className="label">Your niche + 2–3 competitor names</label><input className="input" placeholder="e.g. Organic skincare — MamaEarth, WOW Skin, The Derma Co" value={gapInput} onChange={(e) => setGapInput(e.target.value)} /></div>
        <button className="btn btn-primary" onClick={handleGaps} disabled={gapLoading}>🎯 Find Content Gaps</button>
        {gapCompare ? <CompareView results={gapCompare} loading={gapLoading} /> : <ResultBox result={gapRes} loading={gapLoading} loadingText="Finding untapped opportunities..." />}
      </div>
      {saved.length > 0 && (
        <div className="card">
          <div className="card-title">📌 Tracked Competitors ({saved.length})</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {saved.map((c) => (
              <div key={c.id} className="bg-surface2 border border-border rounded-xl p-4 flex items-start justify-between gap-3 hover:border-accent/30 transition-colors">
                <div><div className="font-syne font-bold text-sm text-text1 mb-0.5">{c.name}</div><div className="text-xs text-text2">{c.platform} · Added {new Date(c.created_at).toLocaleDateString()}</div></div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => { setAnalyze({handle:c.handle||c.name,platform:c.platform||'Instagram',focus:'Full Analysis'}); window.scrollTo(0,0); }} className="text-xs text-accent hover:underline">Re-analyze</button>
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
