import React, { useState } from 'react';
import toast from 'react-hot-toast';

export default function ResultBox({ result, loading, loadingText = 'Generating...' }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    if (!result) return;
    navigator.clipboard.writeText(result).then(() => {
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2.5 mt-4 text-text2 text-sm py-4">
        <div className="loader-dot" />
        <div className="loader-dot" />
        <div className="loader-dot" />
        <span>{loadingText}</span>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="relative mt-4">
      <div className="result-box">{result}</div>
      <button
        onClick={handleCopy}
        className="absolute top-3 right-3 text-[11px] px-2.5 py-1 rounded-md
                   bg-surface border border-border text-text2
                   hover:text-accent hover:border-accent/40 transition-all"
      >
        {copied ? '✓ Copied' : '⧉ Copy'}
      </button>
    </div>
  );
}
