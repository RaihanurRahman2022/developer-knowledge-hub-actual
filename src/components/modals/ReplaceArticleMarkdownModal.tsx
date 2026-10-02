import React, { useState, useMemo, useRef } from 'react';
import {
  FileText,
  Upload,
  X,
  Check,
  AlertCircle,
  Copy,
  Layers,
  Sparkles,
  Eye,
  Edit3,
} from 'lucide-react';
import { ArticleContentSection } from '../../types';
import {
  parseMarkdownToArticleSections,
  HeadingSplitLevel,
  exportArticleSectionsToMarkdown,
} from '../../utils/markdownArticleParser';
import { ARTICLE_MARKDOWN_TEMPLATE, getAgentPrompt } from '../../utils/articleTemplate';
import { MarkdownRenderer } from '../common/MarkdownRenderer';

interface ReplaceArticleMarkdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  topicTitle: string;
  currentSections: ArticleContentSection[];
  onApply: (newSections: ArticleContentSection[], rawMarkdown: string, mode: 'replace' | 'append') => void;
}

export const ReplaceArticleMarkdownModal: React.FC<ReplaceArticleMarkdownModalProps> = ({
  isOpen,
  onClose,
  topicTitle,
  currentSections,
  onApply,
}) => {
  const [markdownText, setMarkdownText] = useState<string>('');
  const [splitLevel, setSplitLevel] = useState<HeadingSplitLevel>('auto');
  const [mode, setMode] = useState<'replace' | 'append'>('replace');
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [templateCopied, setTemplateCopied] = useState<boolean>(false);
  const [agentPromptCopied, setAgentPromptCopied] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse sections dynamically based on markdownText and splitLevel
  const parsedSections = useMemo(() => {
    return parseMarkdownToArticleSections(markdownText, splitLevel);
  }, [markdownText, splitLevel]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setMarkdownText(text);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setMarkdownText(text);
      }
    };
    reader.readAsText(file);
  };

  const handleLoadCurrentArticle = () => {
    const exported = exportArticleSectionsToMarkdown(currentSections, '###');
    setMarkdownText(exported);
    setFileName('current-article.md');
  };

  const handleCopyCurrent = () => {
    const exported = exportArticleSectionsToMarkdown(currentSections, '###');
    navigator.clipboard.writeText(exported);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleCopyAgentPrompt = () => {
    const prompt = getAgentPrompt(topicTitle);
    navigator.clipboard.writeText(prompt);
    setAgentPromptCopied(true);
    setTimeout(() => setAgentPromptCopied(false), 2500);
  };

  const handleCopyTemplate = () => {
    const template = ARTICLE_MARKDOWN_TEMPLATE.replace(/\[Topic Title\]/g, topicTitle);
    navigator.clipboard.writeText(template);
    setTemplateCopied(true);
    setTimeout(() => setTemplateCopied(false), 2500);
  };

  const handleInsertTemplate = () => {
    const template = ARTICLE_MARKDOWN_TEMPLATE.replace(/\[Topic Title\]/g, topicTitle);
    setMarkdownText(template);
    setFileName('article-template.md');
  };

  const handleConfirm = () => {
    if (parsedSections.length === 0) return;
    onApply(parsedSections, markdownText, mode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-slate-950/75 backdrop-blur-2xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl h-[90vh] max-h-[92vh] flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-950/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Replace Article with Markdown
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Target: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{topicTitle}</span> (Article Details & Notes)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* COPY AGENT PROMPT BUTTON */}
            <button
              onClick={handleCopyAgentPrompt}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-300/40 dark:border-amber-700/50 cursor-pointer shadow-2xs transition-all"
              title="Copy an AI agent prompt configured for this topic"
            >
              {agentPromptCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Sparkles className="w-3.5 h-3.5 text-amber-500" />}
              <span>{agentPromptCopied ? 'Prompt Copied! ✓' : 'Copy Agent Prompt'}</span>
            </button>

            {/* COPY TEMPLATE BUTTON */}
            <button
              onClick={handleCopyTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 cursor-pointer shadow-2xs transition-all"
              title="Copy the Markdown template with ### section headings"
            >
              {templateCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-indigo-500" />}
              <span>{templateCopied ? 'Template Copied! ✓' : 'Copy Template'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="px-4 py-2.5 bg-slate-100/60 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap text-xs shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-indigo-500 hover:text-indigo-600 cursor-pointer shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-500" />
              <span>{fileName ? `File: ${fileName}` : 'Upload .md / .txt File'}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.txt,.markdown"
              onChange={handleFileUpload}
              className="hidden"
            />

            <button
              onClick={handleInsertTemplate}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-indigo-500 hover:text-indigo-600 cursor-pointer shadow-2xs"
              title="Populates the editor with the 10-section standard template"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Insert Template</span>
            </button>

            <button
              onClick={handleLoadCurrentArticle}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-indigo-500 hover:text-indigo-600 cursor-pointer shadow-2xs"
              title="Loads existing article sections into the editor for editing"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-500" />
              <span>Load Current</span>
            </button>

            <button
              onClick={handleCopyCurrent}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              title="Copy current article as Markdown to clipboard"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? 'Copied!' : 'Copy Current'}</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Split level selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Split sections by:</span>
              <select
                value={splitLevel}
                onChange={(e) => setSplitLevel(e.target.value as HeadingSplitLevel)}
                className="px-2 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:outline-hidden"
              >
                <option value="auto">Auto-detect (### or ##)</option>
                <option value="h3">### Level 3 Headings</option>
                <option value="h2">## Level 2 Headings</option>
                <option value="h1"># Level 1 Headings</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-200/80 dark:bg-slate-900 rounded-lg p-0.5">
              <button
                onClick={() => setActiveTab('editor')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'editor'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Editor
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  activeTab === 'preview'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Eye className="w-3 h-3" />
                <span>Section Preview ({parsedSections.length})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5">
          {activeTab === 'editor' ? (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="flex flex-col h-full min-h-[340px] space-y-2"
            >
              <div className="flex items-center justify-between text-xs text-slate-400 shrink-0">
                <span>Paste your Markdown below or drag & drop a .md file into this area:</span>
                <span>
                  {markdownText.length} characters • {markdownText.split('\n').length} lines
                </span>
              </div>
              <textarea
                value={markdownText}
                onChange={(e) => setMarkdownText(e.target.value)}
                placeholder={`### 1. The Architectural Foundation\nWrite your section explanation here...\n\n\`\`\`csharp\npublic class Engine {\n    public void Run() => Console.WriteLine("Running");\n}\n\`\`\`\n\n### 2. Runtime Execution Mechanics\nExplain the second section here...\n\n| Feature | Status |\n| :--- | :--- |\n| JIT | Active |\n`}
                className="w-full flex-1 min-h-[300px] p-3.5 font-mono text-xs sm:text-sm leading-relaxed rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/60 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Detected Sections ({parsedSections.length})
                </span>
                <span className="text-xs text-slate-400">
                  Each heading will become a discrete, editable section block in the article.
                </span>
              </div>

              {parsedSections.length === 0 ? (
                <div className="py-12 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  <AlertCircle className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                  <p className="text-sm font-semibold">No sections detected yet.</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Paste markdown or upload a file containing headings like <code>### Section Title</code>.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {parsedSections.map((sec, idx) => (
                    <div
                      key={sec.id}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                          § {idx + 1}
                        </span>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          {sec.title}
                        </h4>
                        <span className="text-[11px] text-slate-400 ml-auto font-mono">
                          {sec.blocks?.length || 0} block(s)
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3">
                        <MarkdownRenderer content={sec.content} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section Detection Summary Bar */}
        {markdownText.trim() && (
          <div className="px-4 sm:px-5 py-2.5 bg-indigo-50/50 dark:bg-indigo-950/20 border-t border-indigo-100/80 dark:border-indigo-900/40 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-300">
              <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>
                <strong>{parsedSections.length} section(s)</strong> detected from markdown headings.
              </span>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300 font-medium">
                <input
                  type="radio"
                  name="importMode"
                  checked={mode === 'replace'}
                  onChange={() => setMode('replace')}
                  className="text-indigo-600"
                />
                <span>Replace all {currentSections.length} existing sections</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300 font-medium">
                <input
                  type="radio"
                  name="importMode"
                  checked={mode === 'append'}
                  onChange={() => setMode('append')}
                  className="text-indigo-600"
                />
                <span>Append to end</span>
              </label>
            </div>
          </div>
        )}

        {/* Footer Actions - ALWAYS Pinned at Bottom */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3 shrink-0 z-20 shadow-md">
          <div className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
            💡 Generating with an AI Agent? Click <strong className="text-indigo-600 dark:text-indigo-400">'Copy Agent Prompt'</strong> above, paste it to your model, and drop the Markdown output here!
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={parsedSections.length === 0}
              className="flex items-center gap-1.5 px-6 py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Layers className="w-4 h-4" />
              <span>
                {mode === 'replace'
                  ? `Replace Article (${parsedSections.length} Sections)`
                  : `Append ${parsedSections.length} Sections`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
