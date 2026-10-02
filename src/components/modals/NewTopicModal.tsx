import React, { useState } from 'react';
import { X, BookOpen, Plus, Tag, Layers, FolderTree } from 'lucide-react';
import { Subject, Section, Topic } from '../../types';
import { storageService } from '../../services/storageService';

interface NewTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  defaultSubjectId?: string;
  onTopicCreated: (topicId: string) => void;
}

export const NewTopicModal: React.FC<NewTopicModalProps> = ({
  isOpen,
  onClose,
  subjects,
  defaultSubjectId,
  onTopicCreated,
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState(
    defaultSubjectId || (subjects[0]?.id || '')
  );
  const sections = storageService.getSections(selectedSubjectId);
  const [selectedSectionId, setSelectedSectionId] = useState(sections[0]?.id || '');

  const [title, setTitle] = useState('');
  const [tagsStr, setTagsStr] = useState('');
  const [quickDefinition, setQuickDefinition] = useState('');

  // Handle section dropdown sync when subject changes
  const handleSubjectChange = (newSubjectId: string) => {
    setSelectedSubjectId(newSubjectId);
    const newSections = storageService.getSections(newSubjectId);
    if (newSections.length > 0) {
      setSelectedSectionId(newSections[0].id);
    } else {
      // Auto-create a section if none exists
      const created = storageService.addSection({
        title: 'Core Concepts',
        slug: 'core-concepts',
        subjectId: newSubjectId,
      });
      setSelectedSectionId(created.id);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedSubjectId) return;

    let targetSectionId = selectedSectionId;
    if (!targetSectionId) {
      const existing = storageService.getSections(selectedSubjectId);
      if (existing.length > 0) {
        targetSectionId = existing[0].id;
      } else {
        const created = storageService.addSection({
          title: 'Core Concepts',
          slug: 'core-concepts',
          subjectId: selectedSubjectId,
        });
        targetSectionId = created.id;
      }
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const tags = tagsStr
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const newTopic = storageService.addTopic({
      slug,
      subjectId: selectedSubjectId,
      sectionId: targetSectionId,
      title: title.trim(),
      tags: tags.length > 0 ? tags : ['Architecture', 'Core'],
      quickDefinition:
        quickDefinition.trim() ||
        `${title.trim()} architecture, mechanics, and interview preparation notes.`,
      quickRevisionBulletPoints: [
        `Key rule of thumb and fundamental definition for ${title.trim()}.`,
        `Core performance and architectural trade-offs.`,
      ],
      coreConceptMarkdown: '',
      articleSections: [
        {
          id: `sec-${Date.now()}`,
          title: 'Overview',
          content: '',
          blocks: [
            {
              id: `blk-${Date.now()}`,
              type: 'text',
              text: `Key concepts, architectural mechanics, and implementation notes for ${title.trim()}.`,
            },
          ],
        },
      ],
      codeExamples: [],
      diagrams: [],
      callouts: [],
      accordions: [],
      checklist: [],
      interviewQuestions: [],
      references: [],
      relatedTopicIds: [],
      lastUpdated: new Date().toISOString().split('T')[0],
    });

    onTopicCreated(newTopic.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-2xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Create New Topic
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs sm:text-sm">
          {/* Subject & Section selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-indigo-500" />
                <span>Subject *</span>
              </label>
              <select
                value={selectedSubjectId}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden cursor-pointer"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                <FolderTree className="w-3.5 h-3.5 text-emerald-500" />
                <span>Curriculum Section *</span>
              </label>
              <select
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden cursor-pointer"
              >
                {sections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Topic Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Topic Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Rate Limiting Algorithms, Memory Allocation, GIN Indexes"
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Quick Definition */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Quick Definition (1–2 sentences)
            </label>
            <input
              type="text"
              value={quickDefinition}
              onChange={(e) => setQuickDefinition(e.target.value)}
              placeholder="Concise 1-sentence definition of what this technology or concept is."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              <span>Tags (comma-separated)</span>
            </label>
            <input
              type="text"
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              placeholder="e.g. Performance, Architecture, Concurrency"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="p-3 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 text-indigo-900 dark:text-indigo-200 text-xs">
            💡 Once created, you will be taken directly to the article page where you can add sections, text paragraphs, code blocks, diagrams, images, callouts, and interview questions.
          </div>

          {/* Submit buttons */}
          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer shadow-xs"
            >
              Create Topic & Open Editor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
