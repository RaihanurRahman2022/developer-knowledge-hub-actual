import React, { useState } from 'react';
import { X, Layers } from 'lucide-react';
import { storageService } from '../../services/storageService';

interface NewSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubjectCreated: (subjectId: string) => void;
}

export const NewSubjectModal: React.FC<NewSubjectModalProps> = ({
  isOpen,
  onClose,
  onSubjectCreated,
}) => {
  const [name, setName] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [icon, setIcon] = useState('Layers');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newSub = storageService.addSubject({
      name: name.trim(),
      slug,
      shortDescription: shortDescription.trim() || `Technical knowledge and notes on ${name.trim()}.`,
      icon,
      color: 'from-indigo-600 to-blue-700',
      lastUpdated: new Date().toISOString().split('T')[0],
      isPinned: false,
    });

    // Create a default initial section for the subject
    storageService.addSection({
      title: 'Fundamentals & Core Concepts',
      slug: 'fundamentals',
      subjectId: newSub.id,
      description: `Core topics for ${newSub.name}`,
    });

    onSubjectCreated(newSub.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Add New Subject</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Subject Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rust, Kafka, AWS, TypeScript"
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Short Description
            </label>
            <textarea
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Brief summary of what this subject covers..."
              rows={2}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer"
            >
              Create Subject
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
