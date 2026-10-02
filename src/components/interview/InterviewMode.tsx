import React, { useState, useMemo } from 'react';
import {
  HelpCircle,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  CheckCircle2,
  ExternalLink,
  Filter,
  Lightbulb,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { Subject, Topic, InterviewQuestion } from '../../types';
import { storageService } from '../../services/storageService';
import { CodeBlock } from '../topic/CodeBlock';
import { MarkdownRenderer } from '../common/MarkdownRenderer';

interface InterviewModeProps {
  initialSubjectId?: string;
  onOpenTopic: (topicId: string) => void;
  subjects: Subject[];
}

interface FlattenedQuestion {
  question: InterviewQuestion;
  topic: Topic;
  subject: Subject | undefined;
}

export const InterviewMode: React.FC<InterviewModeProps> = ({
  initialSubjectId,
  onOpenTopic,
  subjects,
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(initialSubjectId || 'all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);

  // Gather all interview questions based on filter
  const questionsList: FlattenedQuestion[] = useMemo(() => {
    const store = storageService.getStore();
    const list: FlattenedQuestion[] = [];
    const subjectMap = new Map<string, Subject>(store.subjects.map((s) => [s.id, s]));

    store.topics.forEach((topic) => {
      if (selectedSubjectId !== 'all' && topic.subjectId !== selectedSubjectId) {
        return;
      }
      if (selectedTag !== 'all' && !topic.tags.includes(selectedTag)) {
        return;
      }

      const subject = subjectMap.get(topic.subjectId);
      topic.interviewQuestions.forEach((q) => {
        list.push({
          question: q,
          topic,
          subject,
        });
      });
    });

    return list;
  }, [selectedSubjectId, selectedTag]);

  // Extract all available tags
  const allTags = useMemo(() => {
    const store = storageService.getStore();
    const tagSet = new Set<string>();
    store.topics.forEach((t) => t.tags.forEach((tag) => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }, []);

  const currentItem = questionsList[currentIndex] || null;

  const handleNext = () => {
    setIsAnswerRevealed(false);
    setCurrentIndex((prev) => (questionsList.length > 0 ? (prev + 1) % questionsList.length : 0));
  };

  const handlePrevious = () => {
    setIsAnswerRevealed(false);
    setCurrentIndex((prev) =>
      questionsList.length > 0 ? (prev - 1 + questionsList.length) % questionsList.length : 0
    );
  };

  const handleRandom = () => {
    if (questionsList.length <= 1) return;
    setIsAnswerRevealed(false);
    let next = Math.floor(Math.random() * questionsList.length);
    if (next === currentIndex) {
      next = (next + 1) % questionsList.length;
    }
    setCurrentIndex(next);
  };

  const handleToggleLearned = () => {
    if (!currentItem) return;
    storageService.toggleQuestionLearned(currentItem.topic.id, currentItem.question.id);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6">
      {/* Header & Filter Controls */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Technical Interview Rehearsal
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Test yourself before interviews. Conceal answers, explain aloud, then verify.
          </p>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2">
          {/* Subject Filter */}
          <select
            value={selectedSubjectId}
            onChange={(e) => {
              setSelectedSubjectId(e.target.value);
              setCurrentIndex(0);
              setIsAnswerRevealed(false);
            }}
            className="text-xs font-semibold py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden"
          >
            <option value="all">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Tag Filter */}
          <select
            value={selectedTag}
            onChange={(e) => {
              setSelectedTag(e.target.value);
              setCurrentIndex(0);
              setIsAnswerRevealed(false);
            }}
            className="text-xs font-semibold py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden"
          >
            <option value="all">All Tags</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>
                #{tag}
              </option>
            ))}
          </select>
        </div>
      </div>

      {questionsList.length === 0 ? (
        <div className="py-16 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          <HelpCircle className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
          <p className="font-semibold text-slate-600 dark:text-slate-300">
            No interview questions match this filter.
          </p>
          <button
            onClick={() => {
              setSelectedSubjectId('all');
              setSelectedTag('all');
            }}
            className="mt-3 text-xs text-indigo-600 dark:text-indigo-400 font-semibold underline cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : currentItem ? (
        <div className="space-y-6">
          {/* Card Meta & Breadcrumb */}
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                {currentItem.subject?.name}
              </span>
              <span>→</span>
              <span className="truncate">{currentItem.topic.title}</span>
            </div>

            <span className="shrink-0 font-bold text-slate-600 dark:text-slate-300">
              {currentIndex + 1} of {questionsList.length}
            </span>
          </div>

          {/* Flashcard Box */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            {/* Question Section */}
            <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800">
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2">
                Interview Question
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-snug">
                {currentItem.question.question}
              </h2>

              {/* Reveal / Conceal Toggle Button */}
              <div className="mt-6 flex items-center justify-between flex-wrap gap-3">
                <button
                  onClick={() => setIsAnswerRevealed(!isAnswerRevealed)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer shadow-xs ${
                    isAnswerRevealed
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  {isAnswerRevealed ? (
                    <>
                      <EyeOff className="w-4 h-4" />
                      <span>Conceal Answer</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      <span>Show Answer</span>
                    </>
                  )}
                </button>

                {/* Mark as Mastered button */}
                <button
                  onClick={handleToggleLearned}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                    currentItem.question.learned
                      ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{currentItem.question.learned ? 'Mastered ✓' : 'Mark as Mastered'}</span>
                </button>
              </div>
            </div>

            {/* Answer Panel (Revealed) */}
            {isAnswerRevealed && (
              <div className="p-6 sm:p-8 bg-slate-50/70 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 space-y-6 animate-in fade-in duration-200">
                {/* Short Answer */}
                <div>
                  <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Concise Answer (30-Sec Summary)
                  </div>
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-900 dark:text-slate-100 leading-relaxed shadow-2xs">
                    <MarkdownRenderer content={currentItem.question.shortAnswer} />
                  </div>
                </div>

                {/* Detailed Answer */}
                <div>
                  <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Detailed Explanation & Nuance
                  </div>
                  <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    <MarkdownRenderer content={currentItem.question.detailedAnswer} />
                  </div>
                </div>

                {/* Code Snippet if present */}
                {currentItem.question.codeSnippet && (
                  <div>
                    <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Code Snippet
                    </div>
                    <CodeBlock
                      code={currentItem.question.codeSnippet.code}
                      language={currentItem.question.codeSnippet.language}
                    />
                  </div>
                )}

                {/* Interviewer Tip */}
                {currentItem.question.interviewerTips && (
                  <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/30 text-amber-950 dark:text-amber-200 text-xs sm:text-sm leading-relaxed flex items-start gap-2.5">
                    <Lightbulb className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">What interviewers evaluate: </span>
                      {currentItem.question.interviewerTips}
                    </div>
                  </div>
                )}

                {/* Jump to parent topic button */}
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => onOpenTopic(currentItem.topic.id)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    <span>Read full topic ({currentItem.topic.title})</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Controls: Previous / Shuffle / Next */}
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={handlePrevious}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-sm transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <button
              onClick={handleRandom}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-xs transition-colors cursor-pointer"
              title="Pick random question"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Random</span>
            </button>

            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-colors cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
