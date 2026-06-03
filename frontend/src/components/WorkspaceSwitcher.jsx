import React, { useState } from 'react';
import { useWorkspaceStore } from '../hooks/useStore';

export default function WorkspaceSwitcher() {
  const [open, setOpen] = useState(false);
  const { workspaces, activeWorkspace, setActiveWorkspace } = useWorkspaceStore();

  if (!workspaces.length) return (
    <div className="text-xs text-text3 px-2 py-1">No workspaces</div>
  );

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-surface2
                   text-left transition-colors"
      >
        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-accent to-accent3
                        flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
          {activeWorkspace?.name?.[0]?.toUpperCase() || 'W'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-text1 truncate">
            {activeWorkspace?.name || 'Select workspace'}
          </div>
          {activeWorkspace?.industry && (
            <div className="text-[10px] text-text3 truncate">{activeWorkspace.industry}</div>
          )}
        </div>
        <span className="text-text3 text-[10px]">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-surface2 border border-border
                        rounded-lg shadow-2xl z-50 overflow-hidden">
          {workspaces.map((ws) => (
            <button
              key={ws.id}
              onClick={() => { setActiveWorkspace(ws); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2.5 text-left text-xs
                          transition-colors hover:bg-accent/10
                          ${ws.id === activeWorkspace?.id ? 'text-accent' : 'text-text1'}`}
            >
              <div className="w-5 h-5 rounded-md bg-gradient-to-br from-accent to-accent3
                              flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0">
                {ws.name[0].toUpperCase()}
              </div>
              <span className="truncate">{ws.name}</span>
              {ws.id === activeWorkspace?.id && <span className="ml-auto">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
