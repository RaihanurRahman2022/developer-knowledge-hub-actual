import React, { useState } from 'react';
import { Zap, Printer } from 'lucide-react';
import { Subject } from '../../types';
import { storageService } from '../../services/storageService';

interface QuickRevisionViewProps {
  subjects: Subject[];
  onOpenTopic: (topicId: string) => void;
}

type RevisionFilter = 'all' | 'favorites' | 'important';

export const QuickRevisionView: React.FC<QuickRevisionViewProps> = ({ subjects, onOpenTopic }) => {
  const subjectsWithTopics = subjects.filter((s) => storageService.getTopicsBySubject(s.id).length > 0);
  const [subjectId, setSubjectId] = useState<string>(subjectsWithTopics[0]?.id || '');
  const [filter, setFilter] = useState<RevisionFilter>('all');

  const sections = subjectId ? storageService.getSections(subjectId) : [];

  const matchesFilter = (topicId: string) => {
    const progress = storageService.getTopicProgress(topicId);
    if (filter === 'favorites') return progress.isFavorite;
    if (filter === 'important') return progress.status === 'important';
    return true;
  };

  const selectClass =
    'px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-8 space-y-6">
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Quick Revision</h1>
            <p className="text-xs text-slate-400 mt-0.5">30–60 second summaries for every topic</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className={selectClass}>
            {subjectsWithTopics.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <select value={filter} onChange={(e) => setFilter(e.target.value as RevisionFilter)} className={selectClass}>
            <option value="all">All topics</option>
            <option value="favorites">Favorites only</option>
            <option value="important">Marked important</option>
          </select>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {sections.map((section) => {
        const topics = storageService.getTopicsBySection(section.id).filter((t) => matchesFilter(t.id));
        if (topics.length === 0) return null;

        return (
          <section key={section.id} className="space-y-3 break-inside-avoid-page">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {section.title}
            </h2>
            {topics.map((topic) => (
              <article
                key={topic.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs break-inside-avoid"
              >
                <button
                  onClick={() => onOpenTopic(topic.id)}
                  className="font-bold text-base text-left text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                >
                  {topic.title}
                </button>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{topic.quickDefinition}</p>
                {topic.quickRevisionBulletPoints.length > 0 && (
                  <ul className="mt-2 space-y-1 list-disc pl-5 text-xs text-slate-600 dark:text-slate-300">
                    {topic.quickRevisionBulletPoints.map((point, i) => (
                      <li key={i}>{point}</li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </section>
        );
      })}

      {sections.every((s) => storageService.getTopicsBySection(s.id).filter((t) => matchesFilter(t.id)).length === 0) && (
        <p className="text-sm text-slate-500 dark:text-slate-400">No topics match this filter.</p>
      )}
    </div>
  );
};
