import React, { useState, useEffect } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Layers,
  CheckCircle2,
  Clock,
  AlertCircle,
  Circle,
  Plus,
  Filter,
  Search,
  FilePlus2,
  FolderPlus,
  ArrowUp,
  ArrowDown,
  Trash2,
  Lock,
  X,
} from 'lucide-react';
import { Subject, Section, Topic, StudyStatus } from '../../types';
import { storageService } from '../../services/storageService';
import { ConfirmModal } from '../common/ConfirmModal';
import { SubjectIcon } from '../common/SubjectIcon';

interface SidebarProps {
  subjects: Subject[];
  activeSubjectId: string;
  activeTopicId?: string;
  onSelectSubject: (subjectId: string) => void;
  onSelectTopic: (topicId: string) => void;
  onOpenNewTopicModal?: () => void;
  onOpenNewSectionModal?: () => void;
  onOpenNewSubjectModal?: () => void;
  isOpen: boolean;
  onCloseMobile: () => void;
  isUnlocked?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  subjects,
  activeSubjectId,
  activeTopicId,
  onSelectSubject,
  onSelectTopic,
  onOpenNewTopicModal,
  onOpenNewSectionModal,
  onOpenNewSubjectModal,
  isOpen,
  onCloseMobile,
  isUnlocked = false,
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [, setExpandedVersion] = useState(0);
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

  // Lock background scroll when mobile sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('overflow-hidden', 'lg:overflow-auto');
    } else {
      document.body.classList.remove('overflow-hidden', 'lg:overflow-auto');
    }
    return () => {
      document.body.classList.remove('overflow-hidden', 'lg:overflow-auto');
    };
  }, [isOpen]);

  const currentSubject = subjects.find((s) => s.id === activeSubjectId) || subjects[0];
  const sections = currentSubject ? storageService.getSections(currentSubject.id) : [];
  const subjectProgress = currentSubject ? storageService.calculateSubjectProgress(currentSubject.id) : { total: 0, completed: 0, percentage: 0 };

  const getStatusIcon = (status: StudyStatus) => {
    switch (status) {
      case 'learned':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
      case 'learning':
        return <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />;
      case 'important':
        return <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
      case 'not_started':
      default:
        return <Circle className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />;
    }
  };

  const handleToggleSection = (sectionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    storageService.toggleSectionExpanded(sectionId);
    setExpandedVersion((v) => v + 1);
  };

  const handleReorderSection = (sectionId: string, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentSubject) return;
    storageService.reorderSection(currentSubject.id, sectionId, direction);
    setExpandedVersion((v) => v + 1);
  };

  const handleDeleteSection = (sectionId: string, sectionTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmModal({
      isOpen: true,
      title: 'Delete Section',
      message: `Are you sure you want to delete section "${sectionTitle}" and all of its topics? This cannot be undone.`,
      onConfirm: () => {
        storageService.deleteSection(sectionId);
        setExpandedVersion((v) => v + 1);
      },
    });
  };

  const handleReorderTopic = (sectionId: string, topicId: string, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation();
    storageService.reorderTopic(sectionId, topicId, direction);
    setExpandedVersion((v) => v + 1);
  };

  const handleDeleteTopic = (topicId: string, topicTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmModal({
      isOpen: true,
      title: 'Delete Topic',
      message: `Are you sure you want to delete topic "${topicTitle}"? This cannot be undone.`,
      onConfirm: () => {
        storageService.deleteTopic(topicId);
        setExpandedVersion((v) => v + 1);
      },
    });
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 top-14 z-40 bg-slate-900/50 backdrop-blur-2xs lg:hidden cursor-pointer"
        />
      )}

      <aside
        className={`fixed top-14 bottom-0 left-0 z-50 w-72 sm:w-80 max-w-[85vw] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-200 ease-in-out shrink-0 lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)] lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Subject Selector Dropdown / Switcher */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              {currentSubject && (
                <SubjectIcon name={currentSubject.name} className="w-4 h-4" />
              )}
              <label className="block text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Subject
              </label>
            </div>
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1 -mr-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <select
              value={activeSubjectId}
              onChange={(e) => onSelectSubject(e.target.value)}
              className="w-full pl-3 pr-8 py-1.5 text-sm font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* Subject Progress Mini Bar */}
          <div className="mt-2.5">
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
              <span>Progress</span>
              <span className="font-mono font-medium">
                {subjectProgress.completed}/{subjectProgress.total} ({subjectProgress.percentage}%)
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${subjectProgress.percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Filter Input */}
        <div className="px-3 pt-2 pb-1 border-b border-slate-100 dark:border-slate-800/80">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filter topics..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 placeholder-slate-400 border border-transparent focus:border-slate-300 dark:focus:border-slate-600 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Sections & Topics Navigation Tree */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sections.map((sec, secIdx) => {
            const isExpanded = storageService.isSectionExpanded(sec.id);
            const allTopics = storageService.getTopicsBySection(sec.id);
            const filteredTopics = filterQuery.trim()
              ? allTopics.filter(
                  (t) =>
                    t.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
                    t.tags.some((tag) => tag.toLowerCase().includes(filterQuery.toLowerCase()))
                )
              : allTopics;

            if (filterQuery.trim() && filteredTopics.length === 0) {
              return null;
            }

            return (
              <div key={sec.id} className="select-none group/sec">
                {/* Section Header */}
                <div className="flex items-center justify-between px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors">
                  <button
                    onClick={(e) => handleToggleSection(sec.id, e)}
                    className="flex-1 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 truncate cursor-pointer text-left py-0.5"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover/sec:text-slate-600 dark:group-hover/sec:text-slate-200 transition-colors shrink-0" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover/sec:text-slate-600 dark:group-hover/sec:text-slate-200 transition-colors shrink-0" />
                    )}
                    <span className="truncate">{sec.title}</span>
                  </button>

                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      {allTopics.length}
                    </span>

                    {/* Reshuffle & Delete Section Buttons - ONLY WHEN UNLOCKED */}
                    {isUnlocked && (
                      <div className="flex items-center gap-0.5 opacity-90 sm:opacity-0 sm:group-hover/sec:opacity-100 transition-opacity ml-1">
                        <button
                          disabled={secIdx === 0}
                          onClick={(e) => handleReorderSection(sec.id, 'up', e)}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 cursor-pointer"
                          title="Move section up"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          disabled={secIdx === sections.length - 1}
                          onClick={(e) => handleReorderSection(sec.id, 'down', e)}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 cursor-pointer"
                          title="Move section down"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteSection(sec.id, sec.title, e)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 cursor-pointer"
                          title="Delete section"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Topics in Section */}
                {isExpanded && (
                  <div className="ml-3 pl-2 border-l border-slate-200 dark:border-slate-800 space-y-0.5 mt-0.5 mb-1">
                    {filteredTopics.map((topic, topicIdx) => {
                      const isActive = topic.id === activeTopicId;
                      const progress = storageService.getTopicProgress(topic.id);

                      return (
                        <div
                          key={topic.id}
                          className={`flex items-center justify-between px-2 py-1.5 rounded text-xs transition-colors group/topic ${
                            isActive
                              ? 'bg-indigo-50 dark:bg-indigo-950/60 font-medium text-indigo-700 dark:text-indigo-300 border-l-2 border-indigo-600 -ml-[9px] pl-[7px]'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                          }`}
                        >
                          <button
                            onClick={() => {
                              onSelectTopic(topic.id);
                              onCloseMobile();
                            }}
                            className="flex-1 flex items-center gap-2 truncate text-left cursor-pointer"
                          >
                            {getStatusIcon(progress.status)}
                            <span className="truncate">{topic.title}</span>
                          </button>

                          <div className="flex items-center gap-1 shrink-0 ml-1">
                            {/* Reshuffle & Delete Topic Buttons - ONLY WHEN UNLOCKED */}
                            {isUnlocked && (
                              <div className="flex items-center gap-0.5 opacity-90 sm:opacity-0 sm:group-hover/topic:opacity-100 transition-opacity">
                                <button
                                  disabled={topicIdx === 0}
                                  onClick={(e) => handleReorderTopic(sec.id, topic.id, 'up', e)}
                                  className="p-0.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 cursor-pointer"
                                  title="Move topic up"
                                >
                                  <ArrowUp className="w-2.5 h-2.5" />
                                </button>
                                <button
                                  disabled={topicIdx === filteredTopics.length - 1}
                                  onClick={(e) => handleReorderTopic(sec.id, topic.id, 'down', e)}
                                  className="p-0.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 cursor-pointer"
                                  title="Move topic down"
                                >
                                  <ArrowDown className="w-2.5 h-2.5" />
                                </button>
                                <button
                                  onClick={(e) => handleDeleteTopic(topic.id, topic.title, e)}
                                  className="p-0.5 rounded text-slate-400 hover:text-rose-600 cursor-pointer"
                                  title="Delete topic"
                                >
                                  <Trash2 className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          {sections.length === 0 && (
            <div className="p-4 text-center text-xs text-slate-400 dark:text-slate-500">
              <p>No sections yet</p>
              {isUnlocked && onOpenNewSectionModal && (
                <button
                  onClick={() => {
                    onCloseMobile();
                    onOpenNewSectionModal();
                  }}
                  className="mt-2 text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center justify-center gap-1 mx-auto cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Section</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer: Add actions - ONLY SHOWN WHEN UNLOCKED */}
        {isUnlocked ? (
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-1.5 animate-in fade-in duration-150">
            <div className="grid grid-cols-2 gap-1.5">
              {onOpenNewTopicModal && (
                <button
                  onClick={() => {
                    onCloseMobile();
                    onOpenNewTopicModal();
                  }}
                  className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-2xs cursor-pointer"
                  title="Create New Topic"
                >
                  <Plus className="w-3.5 h-3.5 text-indigo-500" />
                  <span>New Topic</span>
                </button>
              )}
              {onOpenNewSectionModal && (
                <button
                  onClick={() => {
                    onCloseMobile();
                    onOpenNewSectionModal();
                  }}
                  className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shadow-2xs cursor-pointer"
                  title="Create New Section"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-500" />
                  <span>New Section</span>
                </button>
              )}
            </div>
            {onOpenNewSubjectModal && (
              <button
                onClick={() => {
                  onCloseMobile();
                  onOpenNewSubjectModal();
                }}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-blue-500" />
                <span>New Subject</span>
              </button>
            )}
          </div>
        ) : (
          <div className="p-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-center">
            <span className="text-[10px] text-slate-400 font-mono flex items-center justify-center gap-1">
              <Lock className="w-2.5 h-2.5 text-amber-500" /> Read-Only Mode
            </span>
          </div>
        )}
      </aside>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />
    </>
  );
};
