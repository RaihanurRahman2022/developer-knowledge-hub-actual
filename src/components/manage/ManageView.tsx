import React, { useRef, useState } from 'react';
import {
  HardDrive,
  Cloud,
  CloudOff,
  CloudUpload,
  CloudDownload,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { storageService, SyncState } from '../../services/storageService';
import { ConfirmModal } from '../common/ConfirmModal';

interface ManageViewProps {
  isUnlocked: boolean;
  userEmail?: string;
  onOpenUnlockModal: () => void;
}

const STATE_LABELS: Record<SyncState, string> = {
  unconfigured: 'Supabase not configured',
  loading: 'Loading from Supabase…',
  synced: 'Saved to Supabase',
  pending: 'Changes waiting to sync',
  syncing: 'Saving to Supabase…',
  'read-only': 'Read-only (not signed in)',
  error: 'Sync error',
};

function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const ManageView: React.FC<ManageViewProps> = ({ isUnlocked, userEmail, onOpenUnlockModal }) => {
  const status = storageService.getSyncStatus();
  const store = storageService.getStore();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [importText, setImportText] = useState('');
  const [confirm, setConfirm] = useState<null | { title: string; message: string; label: string; action: () => void }>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stamp = new Date().toISOString().slice(0, 10);

  const run = async (action: () => Promise<{ success: boolean; message: string }> | { success: boolean; message: string }) => {
    setBusy(true);
    setResult(null);
    try {
      setResult(await action());
    } finally {
      setBusy(false);
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setImportText(await file.text());
    e.target.value = '';
  };

  const cardClass = 'p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3';
  const buttonClass =
    'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 cursor-pointer';

  const StatusIcon =
    status.state === 'synced'
      ? CheckCircle2
      : status.state === 'error'
        ? AlertCircle
        : status.state === 'loading' || status.state === 'syncing'
          ? Loader2
          : status.state === 'unconfigured'
            ? CloudOff
            : Cloud;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-8 space-y-6">
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
        <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
          <HardDrive className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Data Management</h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            {store.subjects.length} subjects · {store.sections.length} sections · {store.topics.length} topics
          </p>
        </div>
      </div>

      {/* Cloud sync */}
      <div className={cardClass}>
        <h2 className="font-bold text-slate-900 dark:text-white">Supabase Cloud Storage</h2>
        <div className="flex items-start gap-2 text-sm">
          <StatusIcon
            className={`w-4 h-4 mt-0.5 shrink-0 ${
              status.state === 'synced'
                ? 'text-emerald-500'
                : status.state === 'error'
                  ? 'text-rose-500'
                  : status.state === 'loading' || status.state === 'syncing'
                    ? 'text-indigo-500 animate-spin'
                    : 'text-amber-500'
            }`}
          />
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-100">{STATE_LABELS[status.state]}</p>
            {status.message && <p className="text-xs text-slate-500 dark:text-slate-400">{status.message}</p>}
            {status.lastSyncedAt && (
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Last synced {new Date(status.lastSyncedAt).toLocaleString()}
              </p>
            )}
            {isUnlocked && userEmail && <p className="text-[11px] text-slate-400 mt-0.5">Signed in as {userEmail}</p>}
          </div>
        </div>

        {status.state !== 'unconfigured' && (
          <div className="flex flex-wrap gap-2">
            {isUnlocked ? (
              <button disabled={busy} onClick={() => run(() => storageService.pushToSupabase())} className={buttonClass}>
                <CloudUpload className="w-3.5 h-3.5" />
                <span>Save everything to Supabase now</span>
              </button>
            ) : (
              <button onClick={onOpenUnlockModal} className={buttonClass}>
                <Cloud className="w-3.5 h-3.5" />
                <span>Sign in to save changes</span>
              </button>
            )}
            <button
              disabled={busy}
              onClick={() =>
                setConfirm({
                  title: 'Reload from Supabase',
                  message: 'Discard any changes in this browser that have not been saved to Supabase and reload the cloud copy?',
                  label: 'Reload',
                  action: () => run(() => storageService.pullFromSupabase()),
                })
              }
              className={buttonClass}
            >
              <CloudDownload className="w-3.5 h-3.5" />
              <span>Reload from Supabase</span>
            </button>
          </div>
        )}
      </div>

      {/* Export */}
      <div className={cardClass}>
        <h2 className="font-bold text-slate-900 dark:text-white">Export Backup</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => downloadFile(`knowledge-hub-${stamp}.json`, storageService.exportDataAsJSON(), 'application/json')}
            className={buttonClass}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .JSON</span>
          </button>
          <button
            onClick={() => downloadFile(`knowledge-hub-${stamp}.md`, storageService.exportAsMarkdownBundle(), 'text/markdown')}
            className={buttonClass}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .MD</span>
          </button>
          <button
            onClick={() => downloadFile(`interview-questions-${stamp}.csv`, storageService.exportQuestionsAsCSV(), 'text/csv')}
            className={buttonClass}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .CSV</span>
          </button>
        </div>
      </div>

      {/* Import / reset: owner only */}
      {isUnlocked && (
        <div className={cardClass}>
          <h2 className="font-bold text-slate-900 dark:text-white">Import Knowledge Backup</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Restoring replaces all subjects, sections, topics and progress, then saves the result to Supabase.
          </p>
          <input ref={fileInputRef} type="file" accept=".json,application/json" onChange={handleFile} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className={buttonClass}>
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Backup File</span>
          </button>
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="…or paste backup JSON here"
            rows={5}
            className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex flex-wrap gap-2">
            <button
              disabled={!importText.trim() || busy}
              onClick={() =>
                setConfirm({
                  title: 'Restore Backup',
                  message: 'Replace all current data with this backup? This is saved to Supabase.',
                  label: 'Restore',
                  action: () =>
                    run(() => {
                      const res = storageService.importDataFromJSON(importText);
                      if (res.success) setImportText('');
                      return res;
                    }),
                })
              }
              className={buttonClass}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Parse & Restore JSON</span>
            </button>
            <button
              onClick={() =>
                setConfirm({
                  title: 'Reset to Default Content',
                  message:
                    'Replace everything (including your own topics and progress) with the built-in curriculum? Download a JSON backup first.',
                  label: 'Reset',
                  action: () =>
                    run(() => {
                      storageService.resetToDefaultSeed();
                      return { success: true, message: 'Reset to the built-in curriculum.' };
                    }),
                })
              }
              className={`${buttonClass} text-rose-600 dark:text-rose-400`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Default Content</span>
            </button>
          </div>
        </div>
      )}

      {result && (
        <div
          className={`p-3 rounded-lg text-xs border ${
            result.success
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300'
          }`}
        >
          {result.message}
        </div>
      )}

      <ConfirmModal
        isOpen={confirm !== null}
        title={confirm?.title || ''}
        message={confirm?.message || ''}
        confirmLabel={confirm?.label}
        onConfirm={() => {
          confirm?.action();
          setConfirm(null);
        }}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
};
