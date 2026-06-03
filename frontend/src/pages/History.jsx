import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useWorkspaceStore } from '../hooks/useStore';
import PageHeader from '../components/PageHeader';
import toast from 'react-hot-toast';

const TYPE_LABELS = {
  reel_ideas: '🎬 Reel Ideas', post_ideas: '📝 Posts', hooks: '🪝 Hooks',
  video_ideas: '📹 Videos', competitor_analysis: '🎯 Competitor', competitor_detection: '🔍 Detection',
  content_gaps: '💡 Gaps', trends: '📈 Trends', trend_content: '🔥 Trend Content',
  news: '📰 News', engagement_customer: '👥 Engagement', engagement_employee: '👨‍💼 Employee',
  engagement_ugc: '📸 UGC', comment_reply: '💬 Reply',
  'Instagram Reel Script': '🎬 Reel Script', 'LinkedIn Post': '💼 LinkedIn',
  'Instagram Caption': '📸 Caption', 'Twitter/X Thread': '🐦 Thread',
  'Content Calendar (1 Week)': '📅 Weekly Cal', 'Content Calendar (1 Month)': '📅 Monthly Cal',
};

export default function History() {
  const ws = useWorkspaceStore((s) => s.activeWorkspace);
  const [items, setItems]     = useState([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter]   = useState('');
  const [page, setPage]       = useState(0);
  const [expanded, setExpanded] = useState(null);

  const LIMIT = 10;

  async function load(reset = false) {
    if (!ws?.id) return;
    setLoading(true);
    const offset = reset ? 0 : page * LIMIT;
    try {
      const params = new URLSearchParams({ workspace_id: ws.id, limit: LIMIT, offset });
      if (filter) params.set('type', filter);
      const r = await api.get(`/history?${params}`);
      setItems(reset ? r.data.history : [...items, ...r.data.history]);
      setTotal(r.data.total);
      if (reset) setPage(0);
    } catch (_) {}
    finally { setLoading(false); }
  }

  useEffect(() => { load(true); }, [ws?.id, filter]);

  async function toggleFav(id) {
    const r = await api.patch(`/history/${id}/favorite`).catch(() => null);
    if (r) setItems((prev) => prev.map((i) => i.id === id ? { ...i, is_favorited: r.data.is_favorited } : i));
  }

  async function deleteItem(id) {
    await api.delete(`/history/${id}`).catch(() => {});
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success('Deleted');
  }

  function copyResult(text) {
    navigator.clipboard.writeText(text);
    toast.success('Copied!');
  }

  return (
    <div>
      <PageHeader title="Generation" highlight="History" subtitle="All your AI-generated content in one place" />

      <div className="card">
        {/* Filters */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <button onClick={() => setFilter('')}
            className={`tag ${!filter ? 'tag-purple' : 'bg-surface2 border-border text-text2'}`}>
            All ({total})
          </button>
          {['reel_ideas', 'post_ideas', 'trends', 'competitor_analysis', 'news', 'comment_reply'].map((t) => (
            <button key={t} onClick={() => setFilter(t)}
              className={`tag ${filter === t ? 'tag-purple' : 'bg-surface2 border-border text-text2'}`}>
              {TYPE_LABELS[t] || t}
            </button>
          ))}
        </div>

        {/* Items */}
        {loading && !items.length ? (
          <div className="flex items-center gap-2 text-text2 text-sm py-8 justify-center">
            <span className="loader-dot" /><span className="loader-dot" /><span className="loader-dot" />
            Loading history...
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-text2">
            <div className="text-4xl mb-3">📭</div>
            <div className="text-sm">No generations yet. Start creating content!</div>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id}
                className="bg-surface2 border border-border rounded-xl overflow-hidden hover:border-accent/20 transition-colors">
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="text-sm font-medium text-text2 flex-shrink-0">
                    {TYPE_LABELS[item.type] || item.type}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-text1 truncate font-medium">
                      {item.topic || 'Untitled'}
                    </div>
                    <div className="text-[11px] text-text3">
                      {new Date(item.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => toggleFav(item.id)}
                      className={`text-sm transition-colors ${item.is_favorited ? 'text-accent4' : 'text-text3 hover:text-accent4'}`}
                      title="Favorite">
                      {item.is_favorited ? '★' : '☆'}
                    </button>
                    <button onClick={() => copyResult(item.result)}
                      className="text-xs text-text2 hover:text-accent transition-colors"
                      title="Copy">⧉</button>
                    <button onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                      className="text-xs text-text2 hover:text-text1 transition-colors px-2 py-1 rounded border border-border">
                      {expanded === item.id ? 'Hide' : 'View'}
                    </button>
                    <button onClick={() => deleteItem(item.id)}
                      className="text-xs text-accent2/60 hover:text-accent2 transition-colors"
                      title="Delete">✕</button>
                  </div>
                </div>

                {expanded === item.id && (
                  <div className="border-t border-border px-4 py-4 text-sm text-text1
                                  whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto
                                  bg-bg/50 animate-fade-in">
                    {item.result}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Load more */}
        {items.length < total && (
          <button
            onClick={() => { setPage((p) => p + 1); load(); }}
            disabled={loading}
            className="btn btn-secondary w-full justify-center mt-4"
          >
            {loading ? 'Loading...' : `Load more (${total - items.length} remaining)`}
          </button>
        )}
      </div>
    </div>
  );
}
