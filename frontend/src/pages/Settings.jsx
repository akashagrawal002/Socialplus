import React, { useState, useEffect } from 'react';
import { useAuthStore, useWorkspaceStore } from '../hooks/useStore';
import PageHeader from '../components/PageHeader';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function Settings() {
  const user            = useAuthStore((s) => s.user);
  const refreshUser     = useAuthStore((s) => s.refreshUser);
  const { activeWorkspace, workspaces, updateWorkspace, createWorkspace, deleteWorkspace, fetchWorkspaces } = useWorkspaceStore();

  const [wsForm, setWsForm] = useState({
    name: '', business_name: '', industry: '', niche: '',
    target_audience: '', primary_platform: '', location: '', brand_voice: '',
  });
  const [wsSaving, setWsSaving] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [creating, setCreating]   = useState(false);

  useEffect(() => {
    if (activeWorkspace) {
      setWsForm({
        name:             activeWorkspace.name            || '',
        business_name:    activeWorkspace.business_name   || '',
        industry:         activeWorkspace.industry        || '',
        niche:            activeWorkspace.niche           || '',
        target_audience:  activeWorkspace.target_audience || '',
        primary_platform: activeWorkspace.primary_platform|| '',
        location:         activeWorkspace.location        || '',
        brand_voice:      activeWorkspace.brand_voice     || '',
      });
    }
  }, [activeWorkspace?.id]);

  async function saveWorkspace() {
    if (!activeWorkspace?.id) return;
    setWsSaving(true);
    try {
      await updateWorkspace(activeWorkspace.id, wsForm);
      toast.success('Workspace saved!');
    } catch (_) { toast.error('Save failed.'); }
    finally { setWsSaving(false); }
  }

  async function handleCreateWorkspace() {
    if (!newWsName.trim()) return toast.error('Enter a workspace name.');
    setCreating(true);
    try {
      await createWorkspace({ name: newWsName });
      setNewWsName('');
      toast.success('Workspace created!');
    } catch (_) { toast.error('Create failed.'); }
    finally { setCreating(false); }
  }

  async function handleDeleteWorkspace(id) {
    if (!confirm('Delete this workspace and all its data?')) return;
    try {
      await deleteWorkspace(id);
      toast.success('Workspace deleted.');
    } catch (_) { toast.error('Delete failed.'); }
  }

  return (
    <div>
      <PageHeader title="⚙️" highlight="Settings" subtitle="Manage your workspaces and account preferences" />

      {/* Account info */}
      <div className="card">
        <div className="card-title">👤 Account</div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="label">Name</div>
            <div className="text-text1 font-medium">{user?.full_name}</div>
          </div>
          <div>
            <div className="label">Email</div>
            <div className="text-text1 font-medium">{user?.email}</div>
          </div>
          <div>
            <div className="label">Plan</div>
            <div className="text-text1 font-medium capitalize">{user?.plan}</div>
          </div>
          <div>
            <div className="label">AI Credits</div>
            <div className="text-text1 font-medium">
              {user?.plan === 'free' ? `${user?.ai_credits} remaining` : 'Unlimited'}
            </div>
          </div>
        </div>
        {user?.plan === 'free' && (
          <div className="mt-4 p-3 rounded-xl bg-accent4/10 border border-accent4/20 text-sm text-accent4">
            ✦ Upgrade to Pro for unlimited AI generations, priority access, and team features.
          </div>
        )}
      </div>

      {/* Active workspace settings */}
      {activeWorkspace && (
        <div className="card">
          <div className="card-title">🏢 Workspace: {activeWorkspace.name}</div>
          <p className="text-xs text-text2 mb-4">
            These details power your competitor detection, trend analysis, and content personalization.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: 'Workspace Name', key: 'name', placeholder: 'My Brand' },
              { label: 'Business Name', key: 'business_name', placeholder: 'e.g. FreshGlow Skincare' },
              { label: 'Industry', key: 'industry', placeholder: 'e.g. Natural Skincare, D2C' },
              { label: 'Niche / Sub-niche', key: 'niche', placeholder: 'e.g. Clean beauty for Gen-Z' },
              { label: 'Target Audience', key: 'target_audience', placeholder: 'e.g. Women 18-35, entrepreneurs' },
              { label: 'Location / Market', key: 'location', placeholder: 'e.g. India, Mumbai, Global' },
            ].map((f) => (
              <div key={f.key} className="input-group">
                <label className="label">{f.label}</label>
                <input className="input" placeholder={f.placeholder}
                  value={wsForm[f.key]} onChange={(e) => setWsForm({ ...wsForm, [f.key]: e.target.value })} />
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
              value={wsForm.brand_voice} onChange={(e) => setWsForm({ ...wsForm, brand_voice: e.target.value })} />
          </div>

          <button className="btn btn-primary mt-2" onClick={saveWorkspace} disabled={wsSaving}>
            {wsSaving ? 'Saving...' : '💾 Save Workspace'}
          </button>
        </div>
      )}

      {/* Manage all workspaces */}
      <div className="card">
        <div className="card-title">📁 All Workspaces</div>

        <div className="space-y-2 mb-5">
          {workspaces.map((ws) => (
            <div key={ws.id} className="flex items-center gap-3 p-3 bg-surface2 border border-border rounded-xl">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-accent3
                              flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                {ws.name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-text1 truncate">{ws.name}</div>
                {ws.industry && <div className="text-xs text-text3 truncate">{ws.industry}</div>}
              </div>
              {workspaces.length > 1 && (
                <button onClick={() => handleDeleteWorkspace(ws.id)}
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
            onKeyDown={(e) => e.key === 'Enter' && handleCreateWorkspace()} />
          <button className="btn btn-primary flex-shrink-0" onClick={handleCreateWorkspace} disabled={creating}>
            {creating ? '...' : '+ Create'}
          </button>
        </div>
      </div>
    </div>
  );
}
