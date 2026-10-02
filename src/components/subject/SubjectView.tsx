import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Clock,
  Circle,
  AlertCircle,
  HelpCircle,
  Play,
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  Layers,
} from 'lucide-react';
import { Subject, StudyStatus, Topic } from '../../types';
import { storageService } from '../../services/storageService';
import { ConfirmModal } from '../common/ConfirmModal';
import { SubjectIcon } from '../common/SubjectIcon';

interface SubjectViewProps {
  subject: Subject;
  onSelectTopic: (topicId: string) => void;
  onStartInterviewMode: (subjectId: string) => void;
  onOpenNewTopic?: (defaultSubjectId: string, defaultSectionId?: string) => void;
  onOpenNewSection?: (defaultSubjectId: string) => void;
  isUnlocked?: boolean;
  onDeleteSubject?: (subjectId: string) => void;
}

export const SubjectView: React.FC<SubjectViewProps> = ({
  subject,
  onSelectTopic,
  onStartInterviewMode,
  onOpenNewTopic,
  onOpenNewSection,
  isUnlocked = false,
  onDeleteSubject,
}) => {
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const [, setRefreshKey] = useState(0);

  const sections = storageService.getSections(subject.id);
  const subjectProgress = storageService.calculateSubjectProgress(subject.id);
  const allTopics = storageService.getTopicsBySubject(subject.id);
  const allSubjects = storageService.getSubjects();
  const subjectIdx = allSubjects.findIndex((s) => s.id === subject.id);

  // Find next topic to study (either first unlearned, or first topic)
  const nextTopic =
    allTopics.find((t) => {
      const p = storageService.getTopicProgress(t.id);
      return p.status !== 'learned';
    }) || allTopics[0];

  const getStatusBadge = (status: StudyStatus) => {
    switch (status) {
      case 'learned':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" /> Learned
          </span>
        );
      case 'learning':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full">
            <Clock className="w-3 h-3" /> Learning
          </span>
        );
      case 'important':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
            <AlertCircle className="w-3 h-3" /> Starred
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
            <Circle className="w-3 h-3" /> Not Started
          </span>
        );
    }
  };

  const handleToggleSection = (sectionId: string) => {
    storageService.toggleSectionExpanded(sectionId);
    setRefreshKey((k) => k + 1);
  };

  const handleReorderSection = (sectionId: string, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    storageService.reorderSection(subject.id, sectionId, direction);
    setRefreshKey((k) => k + 1);
  };

  const handleDeleteSection = (sectionId: string, sectionTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmModal({
      isOpen: true,
      title: 'Delete Section',
      message: `Are you sure you want to delete section "${sectionTitle}" and all its topics? This action cannot be undone.`,
      onConfirm: () => {
        storageService.deleteSection(sectionId);
        setRefreshKey((k) => k + 1);
      },
    });
  };

  const handleReorderTopic = (sectionId: string, topicId: string, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    storageService.reorderTopic(sectionId, topicId, direction);
  };

  const handleDeleteTopic = (topicId: string, topicTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmModal({
      isOpen: true,
      title: 'Delete Topic',
      message: `Are you sure you want to delete topic "${topicTitle}"? This action cannot be undone.`,
      onConfirm: () => {
        storageService.deleteTopic(topicId);
      },
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 md:px-8 py-6 sm:py-8">
      {/* Subject Hero Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-8 shadow-xs mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4 sm:gap-5">
            <SubjectIcon name={subject.name} variant="badge" size="xl" />
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider mb-1">
                <span>Engineering Subject</span>
                <span>•</span>
                <span>{allTopics.length} Topics</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight break-words">
                {subject.name}
              </h1>
              <p className="text-xs sm:text-base text-slate-600 dark:text-slate-400 mt-2 max-w-2xl leading-relaxed">
                &ldquo;{subject.shortDescription}&rdquo;
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            {nextTopic && (
              <button
                onClick={() => onSelectTopic(nextTopic.id)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Continue Studying</span>
              </button>
            )}

            <button
              onClick={() => onStartInterviewMode(subject.id)}
              className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl font-medium text-xs sm:text-sm border border-slate-200 dark:border-slate-700 hover:border-indigo-500 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-indigo-500" />
              <span>Interview Mode</span>
            </button>

            {/* Unlocked Subject Controls: Reshuffle Subject & Delete Subject */}
            {isUnlocked && (
              <div className="flex items-center gap-1 border border-slate-200 dark:border-slate-700 rounded-xl p-1 bg-slate-50 dark:bg-slate-800/80">
                <button
                  disabled={subjectIdx <= 0}
                  onClick={() => storageService.reorderSubject(subject.id, 'up')}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                  title="Move subject up in order"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  disabled={subjectIdx >= allSubjects.length - 1}
                  onClick={() => storageService.reorderSubject(subject.id, 'down')}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                  title="Move subject down in order"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                {onDeleteSubject && (
                  <button
                    onClick={() => {
                      setConfirmModal({
                        isOpen: true,
                        title: 'Delete Subject',
                        message: `Are you sure you want to permanently delete the entire subject "${subject.name}" and all its sections and topics? This action cannot be undone.`,
                        onConfirm: () => {
                          onDeleteSubject(subject.id);
                        },
                      });
                    }}
                    className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer"
                    title="Delete entire subject"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Progress Metric */}
        <div className="mt-6 sm:mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs font-mono mb-2">
            <span className="text-slate-500 dark:text-slate-400">Mastery Progress</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {subjectProgress.completed} of {subjectProgress.total} Topics Completed (
              {subjectProgress.percentage}%)
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${subjectProgress.percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Sections & Nested Topics Accordion List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            Curriculum Sections ({sections.length})
          </h2>

          {isUnlocked && (
            <div className="flex items-center gap-2">
              {onOpenNewSection && (
                <button
                  onClick={() => onOpenNewSection(subject.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 text-slate-700 dark:text-slate-300 transition-colors shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Add Section</span>
                </button>
              )}

              {onOpenNewTopic && (
                <button
                  onClick={() => onOpenNewTopic(subject.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Topic</span>
                </button>
              )}
            </div>
          )}
        </div>

        {sections.length === 0 && (
          <div className="py-12 px-4 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
            <Layers className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              No Curriculum Sections Yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              This subject does not have any sections or topics yet.
            </p>
            {isUnlocked ? (
              <div className="mt-4 flex items-center justify-center gap-2">
                {onOpenNewSection && (
                  <button
                    onClick={() => onOpenNewSection(subject.id)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add First Section</span>
                  </button>
                )}
                {onOpenNewTopic && (
                  <button
                    onClick={() => onOpenNewTopic(subject.id)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Topic</span>
                  </button>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 font-mono">
                Click 🔒 in the navbar to unlock editing and add sections or topics.
              </p>
            )}
          </div>
        )}

        {sections.map((sec, secIdx) => {
          const isExpanded = storageService.isSectionExpanded(sec.id);
          const topics = storageService.getTopicsBySection(sec.id);

          return (
            <div
              key={sec.id}
              className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-hidden shadow-2xs transition-colors group/sec"
            >
              <div className="flex items-center justify-between p-3.5 sm:p-4 bg-slate-50/70 dark:bg-slate-900/90 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-colors">
                <button
                  onClick={() => handleToggleSection(sec.id)}
                  className="flex items-center gap-3 flex-1 text-left cursor-pointer min-w-0"
                >
                  <div className="text-slate-400 shrink-0">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                      {sec.title}
                    </h3>
                    {sec.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                        {sec.description}
                      </p>
                    )}
                  </div>
                </button>

                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-xs font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                    {topics.length} {topics.length === 1 ? 'topic' : 'topics'}
                  </span>

                  {/* Reshuffle & Delete Section Buttons - ONLY WHEN UNLOCKED */}
                  {isUnlocked && (
                    <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover/sec:opacity-100 transition-opacity ml-1">
                      <button
                        disabled={secIdx === 0}
                        onClick={(e) => handleReorderSection(sec.id, 'up', e)}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 cursor-pointer"
                        title="Move section up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        disabled={secIdx === sections.length - 1}
                        onClick={(e) => handleReorderSection(sec.id, 'down', e)}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 cursor-pointer"
                        title="Move section down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteSection(sec.id, sec.title, e)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 cursor-pointer"
                        title="Delete section"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Topics Table/List */}
              {isExpanded && (
                <div className="border-t border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/60">
                  {topics.map((topic, topicIdx) => {
                    const topicProgress = storageService.getTopicProgress(topic.id);
                    return (
                      <div
                        key={topic.id}
                        className="p-3 sm:px-5 flex items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group/topic"
                      >
                        <div
                          onClick={() => onSelectTopic(topic.id)}
                          className="min-w-0 flex-1 cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-200 group-hover/topic:text-indigo-600 dark:group-hover/topic:text-indigo-400 transition-colors">
                              {topic.title}
                            </span>
                            {topic.isPublished === false && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                                Draft
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                            {topic.quickDefinition}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                          {getStatusBadge(topicProgress.status)}

                          {/* Reshuffle & Delete Topic Buttons - ONLY WHEN UNLOCKED */}
                          {isUnlocked && (
                            <div className="flex items-center gap-0.5 opacity-80 sm:opacity-0 group-hover/topic:opacity-100 transition-opacity">
                              <button
                                disabled={topicIdx === 0}
                                onClick={(e) => handleReorderTopic(sec.id, topic.id, 'up', e)}
                                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 cursor-pointer"
                                title="Move topic up"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                disabled={topicIdx === topics.length - 1}
                                onClick={(e) => handleReorderTopic(sec.id, topic.id, 'down', e)}
                                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 cursor-pointer"
                                title="Move topic down"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => handleDeleteTopic(topic.id, topic.title, e)}
                                className="p-1 rounded text-slate-400 hover:text-rose-600 cursor-pointer"
                                title="Delete topic"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}

                          <button
                            onClick={() => onSelectTopic(topic.id)}
                            className="p-1 text-slate-300 dark:text-slate-600 group-hover/topic:text-indigo-600 cursor-pointer"
                          >
                            <ArrowRight className="w-4 h-4 group-hover/topic:translate-x-0.5 transition-transform" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />
    </div>
  );
};
