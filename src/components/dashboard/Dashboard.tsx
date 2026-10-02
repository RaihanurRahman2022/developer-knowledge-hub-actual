import React from 'react';
import {
  BookOpen,
  HelpCircle,
  Clock,
  ArrowRight,
  Plus,
  Play,
  Layers,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { Subject, Topic } from '../../types';
import { storageService } from '../../services/storageService';
import { SubjectIcon } from '../common/SubjectIcon';

interface DashboardProps {
  subjects: Subject[];
  onSelectSubject: (subjectId: string) => void;
  onSelectTopic: (topicId: string) => void;
  onStartInterviewMode: (subjectId?: string) => void;
  onOpenNewSubjectModal: () => void;
  onOpenNewTopicModal: () => void;
  isUnlocked?: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({
  subjects,
  onSelectSubject,
  onSelectTopic,
  onStartInterviewMode,
  onOpenNewSubjectModal,
  onOpenNewTopicModal,
  isUnlocked = false,
}) => {
  const lastStudied = storageService.getLastStudiedTopic();
  const recentlyVisited = storageService.getRecentlyVisited();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 sm:px-8 space-y-10">
      {/* 1. Header Hero / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-xs font-mono font-semibold mb-2">
            <span>⚡ Personal Knowledge Base</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Engineering Knowledge Hub
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-1 max-w-2xl">
            Modular technical encyclopedia, architectural reference, and interview rehearsal system for senior software engineering.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {isUnlocked && (
            <>
              <button
                onClick={onOpenNewTopicModal}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Topic</span>
              </button>

              <button
                onClick={onOpenNewSubjectModal}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-400 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-semibold text-sm shadow-2xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 text-indigo-500" />
                <span>Add Subject</span>
              </button>
            </>
          )}

          <button
            onClick={() => onStartInterviewMode()}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-400 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-semibold text-sm shadow-2xs transition-all cursor-pointer group"
          >
            <HelpCircle className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform" />
            <span>Interview Mode</span>
          </button>
        </div>
      </div>

      {/* 2. Continue Learning Banner (Last Studied Topic) */}
      {lastStudied && (
        <div className="rounded-2xl border border-indigo-200/80 dark:border-indigo-900/60 bg-gradient-to-r from-indigo-50/80 via-white to-slate-50 dark:from-indigo-950/40 dark:via-slate-900 dark:to-slate-900/70 p-5 sm:p-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 fill-indigo-600 dark:fill-indigo-400" />
                <span>Continue Learning</span>
              </span>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {lastStudied.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-1 max-w-2xl">
                {lastStudied.quickDefinition}
              </p>
            </div>

            <button
              onClick={() => onSelectTopic(lastStudied.id)}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 shadow-xs cursor-pointer transition-colors"
            >
              <span>Resume Study</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 3. Subjects Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Engineering Disciplines & Subjects
            </h2>
          </div>

          {isUnlocked && (
            <button
              onClick={onOpenNewSubjectModal}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-400 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Subject</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((subject) => {
            const progress = storageService.calculateSubjectProgress(subject.id);
            const topics = storageService.getTopicsBySubject(subject.id);

            return (
              <div
                key={subject.id}
                onClick={() => onSelectSubject(subject.id)}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:border-indigo-400 dark:hover:border-indigo-500/80 shadow-2xs hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3.5">
                    <SubjectIcon name={subject.name} variant="badge" size="lg" />
                  </div>

                  <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {subject.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {subject.shortDescription}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400 mb-1.5">
                    <span>{topics.length} Topics</span>
                    <span>{progress.percentage}% Mastered</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Recently Studied Section */}
      {recentlyVisited.length > 0 && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Recently Studied Topics
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {recentlyVisited.slice(0, 6).map((topic) => {
              const sub = storageService.getSubject(topic.subjectId);
              return (
                <button
                  key={topic.id}
                  onClick={() => onSelectTopic(topic.id)}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 text-left transition-all group cursor-pointer"
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                      {topic.title}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
                      {sub?.name || 'Topic'}
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
