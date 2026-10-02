import React from 'react';
import { Hash, ArrowRight, Layers, ArrowLeft } from 'lucide-react';
import { storageService } from '../../services/storageService';

interface TagViewProps {
  tag: string;
  onOpenTopic: (topicId: string) => void;
  onBack: () => void;
}

export const TagView: React.FC<TagViewProps> = ({ tag, onOpenTopic, onBack }) => {
  const store = storageService.getStore();
  const matchedTopics = store.topics.filter((t) =>
    t.tags.some((item) => item.toLowerCase() === tag.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-8 space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back</span>
      </button>

      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Hash className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              Topics Tagged #{tag}
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              {matchedTopics.length} {matchedTopics.length === 1 ? 'topic' : 'topics'} found
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        {matchedTopics.map((topic) => {
          const subject = storageService.getSubject(topic.subjectId);
          const section = storageService.getSection(topic.sectionId);

          return (
            <div
              key={topic.id}
              onClick={() => onOpenTopic(topic.id)}
              className="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-400 dark:hover:border-indigo-500/70 transition-all cursor-pointer flex items-center justify-between gap-4 group shadow-2xs"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 mb-1">
                  <span>{subject?.name}</span>
                  <span>→</span>
                  <span>{section?.title}</span>
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {topic.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                  {topic.quickDefinition}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {topic.tags.map((t) => (
                    <span
                      key={t}
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        t.toLowerCase() === tag.toLowerCase()
                          ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0" />
            </div>
          );
        })}
      </div>
    </div>
  );
};
