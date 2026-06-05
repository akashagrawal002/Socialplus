import React, { useState, useEffect } from 'react';
import { useAuthStore, useWorkspaceStore } from '../hooks/useStore';
import PageHeader from '../components/PageHeader';
import toast from 'react-hot-toast';
import api from '../utils/api';

const AI_PROVIDERS_INFO = [
  { id: 'claude',  name: 'Claude (Anthropic)',  icon: '🤖', color: 'purple', keyName: 'ANTHROPIC_API_KEY', url: 'https://console.anthropic.com', badge: 'Best for creativity & nuanced writing' },
  { id: 'chatgpt', name: 'ChatGPT (OpenAI)',    icon: '💬', color: 'emerald', keyName: 'OPENAI_API_KEY',    url: 'https://platform.openai.com/api-keys', badge: 'Best for structured writing' },
  { id: 'gemini',  name: 'Gemini (Google)',     icon: '✨', color: 'blue',   keyName: 'GEMINI_API_KEY',    url: 'https://aistudio.google.com/app/apikey', badge: 'Best for research & analysis' },
];

export default function Settings() {
  const user = useAuthStore((s) => s.user);
  const { activeWorkspace, workspaces, updateWorkspace, createWorkspace, deleteWorkspace } = useWorkspaceStore();

  const [wsForm, setWsForm] = useState({
    name:'', business_name:'', industry:'', niche:'',
    target_audience:'', primary_platform:'', location:'', brand_voice:'',
  });
  const [wsSaving, setWsSaving] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (activeWorkspace) {
      setWsForm({
        name:             activeWorkspace.name             || '',
        business_name:    activeWorkspace.business_name    || '',
        industry:         activeWorkspace.industry         || '',
        niche:            activeWorkspace.niche            || '',
        target_audience:  activeWorkspace.target_audience  || '',
        primary_platform: activeWorkspace.primary_platform || '',
        location:         activeWorkspace.location         || '',
        brand_voice:      activeWorkspace.brand_voice      || '',
      });
    }
  }, [activeWorkspace?.id]);

  async function saveWorkspace() {
    if (!activeWorkspace?.id) return;
    setWsSaving(true);
    try { await updateWorkspace(activeWorkspace.id, wsForm); toast.success('Workspace saved!'); }
    catch (_) { toast.error('Save failed.'); }
    finally { setWsSaving(false); }
  }

  async function handleCreate() {
    if (!newWsName.trim()) return toast.error('Enter a workspace name.');
    setCreating(true);
    try { await createWorkspace({ name: newWsName }); setNewWsName(''); toast.success('Workspace created!'); }
    catch (_) { toast.error('Create failed.'); }
    finally { setCreating(false); }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this workspace and all its data?')) return;
    try { await deleteWorkspace(id); toast.success('Deleted.'); }
    catch (_) { toast.error('Delete failed.'); }
  }

  return (
    <div>
      <PageHeader title="⚙️" highlight="Settings" subtitle="Manage workspaces, account & AI providers" />

      {/* ---- ACCOUNT ---- */}
      <div className="card">
        <div className="card-title">👤 Account</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          {[
            { label: 'Name',     value: user?.full_name },
            { label: 'Email',    value: user?.email },
            { label: 'Plan',     value: <span className="capitalize">{user?.plan}</span> },
            { label: 'AI Credits', value: user?.plan === 'free' ? `${user?.ai_credits} remaining` : '∞ Unlimited' },
          ].map((f) => (
            <div key={f.label}>
              <div className="label">{f.label}</div>
              <div className="text-text1 font-medium">{f.value}</div>
            </div>
          ))}
        </div>
        {user?.plan === 'free' && (
          <div className="mt-4 p-3 rounded-xl bg-accent4/10 border border-accent4/20 text-sm text-accent4">
            ✦ Upgrade to Pro for unlimited AI generations across Claude, ChatGPT & Gemini.
          </div>
        )}
      </div>

      {/* ---- AI PROVIDERS STATUS ---- */}
      <div className="card">
        <div className="card-title">🤖 AI Providers</div>
        <p className="text-xs text-text2 mb-4">
          Configure your AI API keys in the backend <code className="bg-surface2 px-1.5 py-0.5 rounded text-accent">.env</code> file.
          All three enabled = Compare Mode available everywhere.
        </p>
        <div className="space-y-3">
          {AI_PROVIDERS_INFO.map((ai) => (
            <div key={ai.id}
              className={`flex items-center gap-4 p-4 bg-surface2 border border-border rounded-xl
                         hover:border-${ai.color}-500/30 transition-colors`}>
              <div className="text-2xl">{ai.icon}</div>
              <div className="flex-1">
                <div className="font-syne font-bold text-sm text-text1 mb-0.5">{ai.name}</div>
                <div className="text-xs text-text2">{ai.badge}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-[10px] font-mono text-text3 mb-1">{ai.keyName}</div>
                <a href={ai.url} target="_blank" rel="noopener noreferrer"
                   className="text-xs text-accent hover:underline">
                  Get API Key →
                </a>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-surface2 border border-border rounded-xl text-xs text-text2 leading-relaxed">
          <div className="font-semibold text-text1 mb-1">📝 How to add API keys:</div>
          <div>1. Open <code className="bg-bg px-1 rounded">backend/.env</code> file</div>
          <div>2. Add your keys: <code className="bg-bg px-1 rounded">ANTHROPIC_API_KEY=sk-ant-...</code></div>
          <div>3. Restart the backend server</div>
          <div className="mt-1 text-accent3">✦ At least one key required. All three = full Compare Mode</div>
        </div>
      </div>

      {/* ---- WORKSPACE SETTINGS ---- */}
      {activeWorkspace && (
        <div className="card">
          <div className="card-title">🏢 Workspace: {activeWorkspace.name}</div>
          <p className="text-xs text-text2 mb-4">
            These details power competitor detection, trend analysis & personalized content generation.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: 'Workspace Name',    key: 'name',             placeholder: 'My Brand' },
              { label: 'Business Name',     key: 'business_name',    placeholder: 'e.g. FreshGlow Skincare' },
              { label: 'Industry',          key: 'industry',         placeholder: 'e.g. Natural Skincare, D2C' },
              { label: 'Niche / Sub-niche', key: 'niche',            placeholder: 'e.g. Clean beauty for Gen-Z' },
              { label: 'Target Audience',   key: 'target_audience',  placeholder: 'e.g. Women 18-35, entrepreneurs' },
              { label: 'Location / Market', key: 'location',         placeholder: 'e.g. India, Mumbai, Global' },
            ].map((f) => (
              <div key={f.key} className="input-group">
                <label className="label">{f.label}</label>
                <input className="input" placeholder={f.placeholder}
                  value={wsForm[f.key]}
                  onChange={(e) => setWsForm({ ...wsForm, [f.key]: e.target.value })} />
              </div>
            ))}
            <div className="input-group">
              <label className="label">Primary Platform</label>
              <select className="input" value={wsForm.primary_platform}
                onChange={(e) => setWsForm({ ...wsForm, primary_platform: e.target.value })}>
                {['', 'Instagram', 'YouTube', 'LinkedIn', 'Twitter/X', 'All Platforms'].map((p) => (
                  <option key={p} value={p}>{p || 'Select platform'}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="input-group mt-2">
            <label className="label">Brand Voice / Tone Notes</label>
            <textarea className="input" rows={3}
              placeholder="e.g. Friendly and approachable, avoids jargon, speaks to young Indian professionals..."
              value={wsForm.brand_voice}
              onChange={(e) => setWsForm({ ...wsForm, brand_voice: e.target.value })} />
          </div>
          <button className="btn btn-primary mt-2" onClick={saveWorkspace} disabled={wsSaving}>
            {wsSaving ? 'Saving...' : '💾 Save Workspace'}
          </button>
        </div>
      )}

      {/* ---- ALL WORKSPACES ---- */}
      <div className="card">
        <div className="card-title">📁 All Workspaces</div>
        <div className="space-y-2 mb-5">
          {workspaces.map((ws) => (
            <div key={ws.id}
              className="flex items-center gap-3 p-3 bg-surface2 border border-border rounded-xl">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-accent3
                              flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                {ws.name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-text1 truncate">{ws.name}</div>
                {ws.industry && <div className="text-xs text-text3 truncate">{ws.industry}</div>}
              </div>
              {workspaces.length > 1 && (
                <button onClick={() => handleDelete(ws.id)}
                  className="text-xs text-accent2/60 hover:text-accent2 transition-colors px-2">
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input className="input flex-1" placeholder="New workspace name..."
            value={newWsName} onChange={(e) => setNewWsName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()} />
          <button className="btn btn-primary flex-shrink-0" onClick={handleCreate} disabled={creating}>
            {creating ? '...' : '+ Create'}
          </button>
        </div>
      </div>
    </div>
  );
}
