import React, { useState } from 'react';
import api from '../utils/api';
import { useWorkspaceStore } from '../hooks/useStore';
import PageHeader from '../components/PageHeader';
import ResultBox from '../components/ResultBox';
import AISelector from '../components/AISelector';
import CompareView from '../components/CompareView';
import toast from 'react-hot-toast';

const CONTENT_TYPES = [
  'Instagram Reel Script','YouTube Short Script','YouTube Long-form Script',
  'Instagram Caption','LinkedIn Post','Twitter/X Thread',
  'Story Sequence','Content Calendar (1 Week)','Content Calendar (1 Month)',
];

export default function ContentStudio() {
  const ws = useWorkspaceStore((s) => s.activeWorkspace);
  const [form, setForm] = useState({
    content_type: 'Instagram Reel Script', topic: '',
    audience: ws?.target_audience || '', context: '',
    tone: 'Conversational', language: 'English',
  });
  const [aiModel, setAiModel]   = useState('claude');
  const [result, setResult]     = useState('');
  const [compareResults, setCompareResults] = useState(null);
  const [loading, setLoading]   = useState(false);

  function update(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function generate(withCompetitor = false) {
    if (!ws?.id) return toast.error('Select a workspace first.');
    if (!form.topic) return toast.error('Enter a topic.');
    setLoading(true); setResult(''); setCompareResults(null);
    try {
      const isCompare = aiModel === 'compare';
      const payload = {
        workspace_id: ws.id, ...form,
        provider: isCompare ? 'claude' : aiModel,
        compare: isCompare,
      };
      if (withCompetitor) payload.context = (form.context ? form.context + '\n' : '') +
        'Analyse what competitors do with this topic and create differentiated content that stands out.';
      const r = await api.post('/content/generate', payload);
      if (isCompare) setCompareResults(r.data.results);
      else setResult(r.data.result);
    } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  }

  return (
    <div>
      <PageHeader title="Content" highlight="Creator" subtitle="Full scripts, captions & calendars — ready to publish" />
      <div className="card">
        <div className="card-title">✍️ Full Content Generator</div>
        <AISelector value={aiModel} onChange={setAiModel} />
        <div className="input-group">
          <label className="label">What do you want to create?</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {CONTENT_TYPES.map((ct) => (
              <button key={ct} onClick={() => update('content_type', ct)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all
                  ${form.content_type === ct ? 'bg-accent/20 border-accent/40 text-accent' : 'bg-surface2 border-border text-text2 hover:border-accent/30'}`}>
                {ct}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div className="input-group">
            <label className="label">Topic / Title</label>
            <input className="input" placeholder="e.g. 5 signs your metabolism is slowing down"
              value={form.topic} onChange={(e) => update('topic', e.target.value)} />
          </div>
          <div className="input-group">
            <label className="label">Niche & Audience</label>
            <input className="input" placeholder="e.g. Fitness brand targeting women 25-40"
              value={form.audience} onChange={(e) => update('audience', e.target.value)} />
          </div>
        </div>
        <div className="input-group">
          <label className="label">Additional Context (optional)</label>
          <textarea className="input" rows={3}
            placeholder="Key points, USP, brand voice, competitor insights..."
            value={form.context} onChange={(e) => update('context', e.target.value)} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          <div className="input-group">
            <label className="label">Tone</label>
            <select className="input" value={form.tone} onChange={(e) => update('tone', e.target.value)}>
              {['Professional','Conversational','Humorous','Inspirational','Educational','Bold & Provocative'].map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label className="label">Language</label>
            <select className="input" value={form.language} onChange={(e) => update('language', e.target.value)}>
              {['English','Hinglish (Hindi + English)','Hindi'].map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="btn btn-primary" onClick={() => generate(false)} disabled={loading}>✨ Generate Content</button>
          <button className="btn btn-secondary" onClick={() => generate(true)} disabled={loading}>🎯 With Competitor Insight</button>
        </div>
        {compareResults
          ? <CompareView results={compareResults} loading={loading} />
          : <ResultBox result={result} loading={loading} loadingText="Crafting your content..." />}
      </div>
    </div>
  );
}
