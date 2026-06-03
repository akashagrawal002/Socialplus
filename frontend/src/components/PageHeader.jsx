import React from 'react';

export default function PageHeader({ title, highlight, subtitle, children }) {
  return (
    <div className="mb-7 flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1 className="font-syne font-extrabold text-2xl text-text1 leading-tight mb-1">
          {title} {highlight && (
            <span className="bg-gradient-to-r from-accent to-accent3 bg-clip-text text-transparent">
              {highlight}
            </span>
          )}
        </h1>
        {subtitle && <p className="text-sm text-text2">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2 flex-shrink-0">{children}</div>}
    </div>
  );
}
