import React from 'react';

const AI_PROVIDERS = [
  {
    id: 'claude',
    name: 'Claude',
    company: 'Anthropic',
    icon: '🤖',
    color: 'from-purple-500/20 to-purple-600/10 border-purple-500/40 text-purple-300',
    activeColor: 'from-purple-500/30 to-purple-600/20 border-purple-400/60',
    badge: 'Best for creativity',
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    company: 'OpenAI',
    icon: '💬',
    color: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/40 text-emerald-300',
    activeColor: 'from-emerald-500/30 to-emerald-600/20 border-emerald-400/60',
    badge: 'Best for writing',
  },
  {
    id: 'gemini',
    name: 'Gemini',
    company: 'Google',
    icon: '✨',
    color: 'from-blue-500/20 to-blue-600/10 border-blue-500/40 text-blue-300',
    activeColor: 'from-blue-500/30 to-blue-600/20 border-blue-400/60',
    badge: 'Best for research',
  },
  {
    id: 'compare',
    name: 'Compare All',
    company: 'All 3 AIs',
    icon: '⚡',
    color: 'from-accent4/20 to-accent4/10 border-accent4/40 text-accent4',
    activeColor: 'from-accent4/30 to-accent4/20 border-accent4/60',
    badge: 'See all responses',
    isCompare: true,
  },
];

export default function AISelector({ value, onChange, className = '' }) {
  return (
    <div className={`mb-5 ${className}`}>
      <label className="label mb-2">🤖 Choose AI Model</label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {AI_PROVIDERS.map((ai) => {
          const isActive = value === ai.id;
          return (
            <button
              key={ai.id}
              type="button"
              onClick={() => onChange(ai.id)}
              className={`
                bg-gradient-to-br border rounded-xl p-3 text-left transition-all duration-200
                hover:-translate-y-0.5 hover:shadow-lg
                ${isActive ? ai.activeColor + ' shadow-lg scale-[1.02]' : ai.color}
              `}
            >
              <div className="text-xl mb-1">{ai.icon}</div>
              <div className="font-syne font-bold text-xs text-text1">{ai.name}</div>
              <div className="text-[10px] text-text2 mb-1">{ai.company}</div>
              <div className={`text-[9px] font-semibold uppercase tracking-wide ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                {ai.badge}
              </div>
              {isActive && (
                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-current opacity-80" />
              )}
            </button>
          );
        })}
      </div>
      {value === 'compare' && (
        <div className="mt-2 text-xs text-accent4 bg-accent4/5 border border-accent4/20 rounded-lg px-3 py-2">
          ⚡ Compare Mode — Calls Claude, ChatGPT & Gemini simultaneously. Uses 3x credits.
        </div>
      )}
    </div>
  );
}

export { AI_PROVIDERS };
