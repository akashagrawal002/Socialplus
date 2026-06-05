import React, { useState } from 'react';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'claude',  label: '🤖 Claude',  color: 'text-purple-300 border-purple-400' },
  { id: 'chatgpt', label: '💬 ChatGPT', color: 'text-emerald-300 border-emerald-400' },
  { id: 'gemini',  label: '✨ Gemini',  color: 'text-blue-300 border-blue-400' },
];

export default function CompareView({ results, loading }) {
  const [active, setActive] = useState('claude');

  if (loading) {
    return (
      <div className="flex items-center gap-2.5 mt-4 text-text2 text-sm py-4">
        <div className="loader-dot" /><div className="loader-dot" /><div className="loader-dot" />
        <span>Calling Claude + ChatGPT + Gemini simultaneously...</span>
      </div>
    );
  }
  if (!results) return null;

  function copy(text) {
    navigator.clipboard.writeText(text);
    toast.success('Copied!');
  }

  function copyAll() {
    const all = TABS.map((t) => `${'═'.repeat(60)}\n${t.label}\n${'═'.repeat(60)}\n${results[t.id]}`).join('\n\n');
    navigator.clipboard.writeText(all);
    toast.success('All 3 responses copied!');
  }

  return (
    <div className="mt-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-1 bg-surface2 p-1 rounded-xl border border-border">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setActive(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                ${active === t.id
                  ? `bg-surface border ${t.color} shadow-sm`
                  : 'text-text2 hover:text-text1'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <button onClick={copyAll}
          className="text-xs px-3 py-1.5 rounded-lg bg-accent4/10 border border-accent4/20
                     text-accent4 hover:bg-accent4/20 transition-all">
          ⧉ Copy All 3
        </button>
      </div>

      {/* Content */}
      {TABS.map((t) => active === t.id && (
        <div key={t.id} className="relative">
          <div className={`result-box border-2 ${t.color.split(' ')[1]}`}>
            {results[t.id]}
          </div>
          <button onClick={() => copy(results[t.id])}
            className="absolute top-3 right-3 text-[11px] px-2.5 py-1 rounded-md
                       bg-surface border border-border text-text2 hover:text-accent transition-all">
            ⧉ Copy
          </button>
        </div>
      ))}

      {/* Side-by-side hint */}
      <div className="mt-2 text-[11px] text-text3 text-center">
        ⚡ Compare Mode used Claude + ChatGPT + Gemini — Switch tabs to compare responses
      </div>
    </div>
  );
}
