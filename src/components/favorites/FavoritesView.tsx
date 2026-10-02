import React from 'react';
import { Star, ArrowRight } from 'lucide-react';
import { storageService } from '../../services/storageService';

interface FavoritesViewProps {
  onOpenTopic: (topicId: string) => void;
}

export const FavoritesView: React.FC<FavoritesViewProps> = ({ onOpenTopic }) => {
  const favorites = storageService.getFavorites();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-8 space-y-6">
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-500">
            <Star className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Favorite Topics</h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              {favorites.length} {favorites.length === 1 ? 'topic' : 'topics'} starred
            </p>
          </div>
        </div>
      </div>

      {favorites.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No favorites yet. Use the star button on any topic to add it here.
        </p>
      ) : (
        <div className="grid gap-3">
          {favorites.map((topic) => {
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
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
