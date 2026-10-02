import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import Prism from 'prismjs';

// Import syntax modes
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-docker';

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = 'csharp', title }) => {
  const [copied, setCopied] = useState(false);

  const cleanLang = (language || 'text').toLowerCase().replace('cs', 'csharp').replace('golang', 'go');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  // Safe Prism highlighting
  let highlightedHtml = '';
  try {
    const grammar = Prism.languages[cleanLang] || Prism.languages.javascript || Prism.languages.clike;
    if (grammar) {
      highlightedHtml = Prism.highlight(code.trim(), grammar, cleanLang);
    } else {
      highlightedHtml = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }
  } catch {
    highlightedHtml = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  return (
    <div className="my-5 rounded-lg border border-slate-700/80 bg-slate-900 overflow-hidden shadow-sm font-mono text-sm text-slate-100">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-950/70 text-xs text-slate-400 select-none">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-600 inline-block"></span>
          <span className="font-semibold uppercase tracking-wider text-slate-300">
            {language}
          </span>
          {title && <span className="text-slate-400">• {title}</span>}
        </div>
        <button
          onClick={handleCopy}
          aria-label="Copy code snippet"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="p-4 overflow-x-auto text-[13px] leading-relaxed">
        <pre className="m-0 font-mono">
          <code
            className={`language-${cleanLang}`}
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          />
        </pre>
      </div>
    </div>
  );
};
