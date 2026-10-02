import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Topic } from '../../types';

interface TableOfContentsProps {
  topic: Topic;
  onAddSection?: () => void;
}

interface SectionItem {
  id: string;
  label: string;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({ topic, onAddSection }) => {
  const [activeId, setActiveId] = useState<string>('sec-definition');

  const items: SectionItem[] = [
    { id: 'sec-definition', label: 'Quick Definition' },
    { id: 'sec-quick-revision', label: '30-Sec Revision' },
    ...(topic.articleSections && topic.articleSections.length > 0
      ? topic.articleSections.map((sec, i) => ({
          id: `art-sec-${sec.id || i}`,
          label: `§ ${i + 1} ${sec.title}`,
        }))
      : [{ id: 'sec-core-concept', label: 'Article Details' }]),
    ...(topic.codeExamples && topic.codeExamples.length > 0
      ? [{ id: 'sec-code-examples', label: 'Code Examples' }]
      : []),
    ...(topic.accordions && topic.accordions.length > 0
      ? [{ id: 'sec-deep-dives', label: 'Deep Dives' }]
      : []),
    ...(topic.interviewQuestions && topic.interviewQuestions.length > 0
      ? [{ id: 'sec-interview-questions', label: 'Interview Q&A' }]
      : []),
    ...(topic.checklist && topic.checklist.length > 0
      ? [{ id: 'sec-checklist', label: 'Checklist' }]
      : []),
    ...(topic.references && topic.references.length > 0
      ? [{ id: 'sec-references', label: 'References' }]
      : []),
    ...(topic.relatedTopicIds && topic.relatedTopicIds.length > 0
      ? [{ id: 'sec-related-topics', label: 'Related Topics' }]
      : []),
  ];

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;
      for (const item of items) {
        const el = document.getElementById(item.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveId(item.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [items]);

  const scrollTo = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveId(id);
    }
  };

  return (
    <aside className="hidden xl:block w-60 shrink-0 sticky top-20 self-start p-4 text-xs">
      <div className="font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[11px] mb-3">
        On This Page
      </div>
      <nav className="space-y-1 border-l border-slate-200 dark:border-slate-800">
        {items.map((item) => {
          const isActive = activeId === item.id;
          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => scrollTo(item.id, e)}
              className={`block pl-3 py-1 transition-colors border-l-2 -ml-[2px] ${
                isActive
                  ? 'border-indigo-600 font-semibold text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              {item.label}
            </a>
          );
        })}
      </nav>
      {onAddSection && (
        <button
          onClick={onAddSection}
          className="mt-4 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors cursor-pointer shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Section</span>
        </button>
      )}
    </aside>
  );
};
