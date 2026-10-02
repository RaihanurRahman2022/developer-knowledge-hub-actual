import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Circle,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Info,
  AlertTriangle,
  Lightbulb,
  CheckSquare,
  HelpCircle,
  ArrowRight,
  Hash,
  Share2,
  Check,
  Edit3,
  Plus,
  Trash2,
  Code,
  Image as ImageIcon,
  Network,
  Link as LinkIcon,
  X,
  FileText,
  AlignLeft,
  FolderPlus,
  ArrowUp,
  ArrowDown,
  Globe,
  FileEdit,
  FileUp,
} from 'lucide-react';
import {
  Topic,
  StudyStatus,
  ArticleContentSection,
  ArticleBlock,
  ArticleBlockType,
} from '../../types';
import { storageService } from '../../services/storageService';
import { CodeBlock } from './CodeBlock';
import { ConfirmModal } from '../common/ConfirmModal';
import { MarkdownRenderer } from '../common/MarkdownRenderer';
import { ReplaceArticleMarkdownModal } from '../modals/ReplaceArticleMarkdownModal';
import { parseMarkdownToArticleSections } from '../../utils/markdownArticleParser';

interface TopicViewProps {
  topic: Topic;
  onNavigateToTopic: (topicId: string) => void;
  onNavigateToTag?: (tag: string) => void;
  onNavigateToSubject?: (subjectId: string) => void;
  isUnlocked?: boolean;
  onDeleteTopic?: (topicId: string) => void;
}

export const TopicView: React.FC<TopicViewProps> = ({
  topic,
  onNavigateToTopic,
  onNavigateToTag,
  onNavigateToSubject,
  isUnlocked = false,
  onDeleteTopic,
}) => {
  const [editedTopic, setEditedTopic] = useState<Topic>(topic);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Confirm Modal state
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

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Derived state: publish status & edit mode permissions
  const isPublished = editedTopic.isPublished !== false;
  // User can ONLY edit / add options when unlocked AND in unpublished mode!
  const isUnpublishedEditMode = isUnlocked && !isPublished;

  // Add Section Modal State
  const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false);
  const [isReplaceMarkdownModalOpen, setIsReplaceMarkdownModalOpen] = useState(false);
  const [insertAfterSectionIndex, setInsertAfterSectionIndex] = useState<number | null>(null);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionInitialText, setNewSectionInitialText] = useState('');

  // Renaming Section state
  const [renamingSectionId, setRenamingSectionId] = useState<string | null>(null);
  const [renamingTitle, setRenamingTitle] = useState('');

  // Medium-style Add Block State (inside a specific section)
  const [activeAddBlockSectionId, setActiveAddBlockSectionId] = useState<string | null>(null);
  const [activeAddBlockType, setActiveAddBlockType] = useState<ArticleBlockType | null>(null);

  // Form states for creating a new block in a section
  const [draftText, setDraftText] = useState('');
  const [draftCodeTitle, setDraftCodeTitle] = useState('');
  const [draftCodeLanguage, setDraftCodeLanguage] = useState('csharp');
  const [draftCode, setDraftCode] = useState('');
  const [draftCodeDesc, setDraftCodeDesc] = useState('');
  const [draftImageTitle, setDraftImageTitle] = useState('');
  const [draftImageUrl, setDraftImageUrl] = useState('');
  const [draftImageCaption, setDraftImageCaption] = useState('');
  const [draftDiagramTitle, setDraftDiagramTitle] = useState('');
  const [draftDiagramContent, setDraftDiagramContent] = useState('');
  const [draftDiagramCaption, setDraftDiagramCaption] = useState('');
  const [draftLinkTitle, setDraftLinkTitle] = useState('');
  const [draftLinkUrl, setDraftLinkUrl] = useState('');
  const [draftLinkSource, setDraftLinkSource] = useState('Official Documentation');
  const [draftCalloutType, setDraftCalloutType] = useState<'info' | 'warning' | 'tip' | 'danger'>('tip');
  const [draftCalloutTitle, setDraftCalloutTitle] = useState('');
  const [draftCalloutContent, setDraftCalloutContent] = useState('');
  const [draftQuestion, setDraftQuestion] = useState('');
  const [draftShortAns, setDraftShortAns] = useState('');
  const [draftDetailedAns, setDraftDetailedAns] = useState('');
  const [draftTips, setDraftTips] = useState('');
  const [draftAccordionTitle, setDraftAccordionTitle] = useState('');
  const [draftAccordionContent, setDraftAccordionContent] = useState('');
  const [draftChecklistText, setDraftChecklistText] = useState('');

  // Editing existing block state
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [editingBlockData, setEditingBlockData] = useState<Partial<ArticleBlock>>({});

  // Accordions & questions expansion states
  const [expandedAccordions, setExpandedAccordions] = useState<Record<string, boolean>>({});
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});
  const [copiedLink, setCopiedLink] = useState(false);

  // Scroll position & Reading progress auto-save
  const [readingProgress, setReadingProgress] = useState(0);
  const [resumeNotification, setResumeNotification] = useState<number | null>(null);
  const isRestoringScroll = useRef(false);

  const subject = storageService.getSubject(topic.subjectId);
  const section = storageService.getSection(topic.sectionId);
  const progress = storageService.getTopicProgress(topic.id);

  // Helper to ensure articleSections is initialized with blocks
  const getResolvedSections = useCallback((t: Topic): ArticleContentSection[] => {
    // 1. If the topic already has explicitly defined articleSections (e.g. from template or markdown replacement),
    // use them directly as the single source of truth without appending legacy duplicates!
    if (t.articleSections && t.articleSections.length > 0) {
      return t.articleSections;
    }

    // 2. Otherwise (for unmigrated seed topics without articleSections), generate from markdown / legacy fields
    let sections: ArticleContentSection[] = [];
    if (t.coreConceptMarkdown && t.coreConceptMarkdown.trim()) {
      sections = parseMarkdownToArticleSections(t.coreConceptMarkdown, 'auto');
    }

    if (sections.length === 0) {
      sections = [
        {
          id: 'sec-overview',
          title: 'Overview',
          content: '',
          blocks: [
            {
              id: 'blk-init-overview',
              type: 'text',
              text: `Key concepts, architectural mechanics, and implementation notes for ${t.title}.`,
            },
          ],
        },
      ];
    }

    // Include legacy structured diagrams, interview Q&A, checklist, and references ONLY when not already present in sections
    if (
      t.diagrams &&
      t.diagrams.length > 0 &&
      !sections.some((s) => s.id === 'sec-diagrams' || s.title.toLowerCase().includes('diagram'))
    ) {
      sections.push({
        id: 'sec-diagrams',
        title: 'Architectural Diagrams & Topology',
        content: '',
        blocks: t.diagrams.map((d, dIdx) => ({
          id: `blk-diag-${dIdx}`,
          type: 'diagram',
          diagramTitle: d.title,
          diagramContent: d.content,
          diagramCaption: d.caption,
        })),
      });
    }

    if (
      t.interviewQuestions &&
      t.interviewQuestions.length > 0 &&
      !sections.some((s) => s.id === 'sec-interview-qa' || s.title.toLowerCase().includes('interview'))
    ) {
      sections.push({
        id: 'sec-interview-qa',
        title: 'Technical Interview Questions & Answers',
        content: '',
        blocks: t.interviewQuestions.map((q, qIdx) => ({
          id: `blk-iq-${qIdx}`,
          type: 'question',
          question: q.question,
          shortAnswer: q.shortAnswer,
          detailedAnswer: q.detailedAnswer,
          tips: q.interviewerTips,
        })),
      });
    }

    if (
      t.checklist &&
      t.checklist.length > 0 &&
      !sections.some((s) => s.id === 'sec-checklist' || s.title.toLowerCase().includes('checklist'))
    ) {
      sections.push({
        id: 'sec-checklist',
        title: 'Key Takeaways & Mastery Checklist',
        content: '',
        blocks: t.checklist.map((c, cIdx) => ({
          id: `blk-cl-${cIdx}`,
          type: 'checklist',
          checklistText: c.text,
          checked: c.checked,
        })),
      });
    }

    if (
      t.references &&
      t.references.length > 0 &&
      !sections.some((s) => s.id === 'sec-references' || s.title.toLowerCase().includes('reference'))
    ) {
      sections.push({
        id: 'sec-references',
        title: 'References & Official Documentation',
        content: '',
        blocks: t.references.map((r, rIdx) => ({
          id: `blk-ref-${rIdx}`,
          type: 'link',
          linkTitle: r.title,
          linkUrl: r.url,
          linkSource: r.source,
          linkType: r.type,
        })),
      });
    }

    return sections;
  }, []);

  const articleSections = getResolvedSections(editedTopic);

  // Sync editedTopic when prop changes
  useEffect(() => {
    setEditedTopic(topic);
    setIsAddSectionModalOpen(false);
    setActiveAddBlockSectionId(null);
    setEditingBlockId(null);
    setRenamingSectionId(null);
  }, [topic.id]);

  // 1. Scroll Position Restoration on Topic Mount
  useEffect(() => {
    isRestoringScroll.current = true;
    const saved = storageService.getTopicScrollProgress(topic.id);

    if (saved && saved.scrollY > 80) {
      setTimeout(() => {
        window.scrollTo({ top: saved.scrollY, behavior: 'smooth' });
        setResumeNotification(saved.progressPercentage);
        isRestoringScroll.current = false;
        setTimeout(() => setResumeNotification(null), 5000);
      }, 100);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      isRestoringScroll.current = false;
    }
  }, [topic.id]);

  // 2. Reading Progress & Scroll Position Auto-Save Listener
  useEffect(() => {
    let timeoutId: any = null;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;

      const pct = Math.min(100, Math.max(0, Math.round((scrollY / docHeight) * 100)));
      setReadingProgress(pct);

      if (!isRestoringScroll.current) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          storageService.saveTopicScrollProgress(topic.id, scrollY, pct);
        }, 300);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, [topic.id]);

  // Save changes to storage
  const handleSaveChanges = useCallback(
    (updated: Topic) => {
      setEditedTopic(updated);
      storageService.updateTopic(updated);
      setLastSavedTime(new Date().toLocaleTimeString());
    },
    []
  );

  const toggleAccordion = (id: string) => {
    setExpandedAccordions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleQuestion = (id: string) => {
    setExpandedQuestions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleStatusChange = (newStatus: StudyStatus) => {
    storageService.setTopicStatus(topic.id, newStatus);
  };

  const handleFavoriteToggle = () => {
    storageService.toggleFavorite(topic.id);
  };

  const handleTogglePublish = () => {
    const newPublished = storageService.toggleTopicPublished(editedTopic.id);
    setEditedTopic({ ...editedTopic, isPublished: newPublished });
  };

  const handleShare = async () => {
    try {
      const url = `${window.location.origin}#${topic.slug}`;
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  // --- SECTION MANAGEMENT ---

  const handleOpenAddSectionModal = (insertIndex: number | null = null) => {
    setInsertAfterSectionIndex(insertIndex);
    setNewSectionTitle('');
    setNewSectionInitialText('');
    setIsAddSectionModalOpen(true);
  };

  const handleConfirmCreateSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionTitle.trim()) return;

    const newSec: ArticleContentSection = {
      id: `art-sec-${Date.now()}`,
      title: newSectionTitle.trim(),
      content: newSectionInitialText.trim() || '',
      blocks: [
        {
          id: `blk-${Date.now()}`,
          type: 'text',
          text:
            newSectionInitialText.trim() ||
            `Notes and technical explanations for ${newSectionTitle.trim()}.`,
        },
      ],
    };

    const currentSections = [...articleSections];
    if (insertAfterSectionIndex !== null && insertAfterSectionIndex >= 0 && insertAfterSectionIndex < currentSections.length) {
      currentSections.splice(insertAfterSectionIndex + 1, 0, newSec);
    } else {
      currentSections.push(newSec);
    }

    const updated: Topic = {
      ...editedTopic,
      articleSections: currentSections,
    };

    handleSaveChanges(updated);
    setIsAddSectionModalOpen(false);
    setNewSectionTitle('');
    setNewSectionInitialText('');

    setTimeout(() => {
      const el = document.getElementById(`art-sec-${newSec.id}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
  };

  const handleRenameSection = (secId: string) => {
    if (!renamingTitle.trim()) return;
    const updated = articleSections.map((s) =>
      s.id === secId ? { ...s, title: renamingTitle.trim() } : s
    );
    handleSaveChanges({ ...editedTopic, articleSections: updated });
    setRenamingSectionId(null);
  };

  const handleDeleteSection = (secId: string) => {
    if (articleSections.length <= 1) {
      showToast('An article must have at least one section.');
      return;
    }
    const sec = articleSections.find((s) => s.id === secId);
    const secTitle = sec?.title || 'this section';

    setConfirmModal({
      isOpen: true,
      title: 'Delete Section',
      message: `Are you sure you want to delete "${secTitle}" and all of its content blocks? This cannot be undone.`,
      onConfirm: () => {
        const updated = articleSections.filter((s) => s.id !== secId);
        handleSaveChanges({ ...editedTopic, articleSections: updated });
        showToast(`Section "${secTitle}" deleted.`);
      },
    });
  };

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= articleSections.length) return;
    const copy = [...articleSections];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);
    handleSaveChanges({ ...editedTopic, articleSections: copy });
  };

  // --- BLOCK MANAGEMENT INSIDE A SECTION ---

  const handleOpenAddBlock = (secId: string, type: ArticleBlockType) => {
    setActiveAddBlockSectionId(secId);
    setActiveAddBlockType(type);
    setDraftText('');
    setDraftCodeTitle('');
    setDraftCodeLanguage('csharp');
    setDraftCode('');
    setDraftCodeDesc('');
    setDraftImageTitle('');
    setDraftImageUrl('');
    setDraftImageCaption('');
    setDraftDiagramTitle('');
    setDraftDiagramContent('');
    setDraftDiagramCaption('');
    setDraftLinkTitle('');
    setDraftLinkUrl('');
    setDraftLinkSource('Official Documentation');
    setDraftCalloutType('tip');
    setDraftCalloutTitle('');
    setDraftCalloutContent('');
    setDraftQuestion('');
    setDraftShortAns('');
    setDraftDetailedAns('');
    setDraftTips('');
    setDraftAccordionTitle('');
    setDraftAccordionContent('');
    setDraftChecklistText('');
  };

  const handleCloseAddBlock = () => {
    setActiveAddBlockSectionId(null);
    setActiveAddBlockType(null);
  };

  const handleSaveNewBlock = (secId: string) => {
    if (!activeAddBlockType) return;

    let newBlock: ArticleBlock | null = null;
    const blockId = `blk-${Date.now()}`;

    switch (activeAddBlockType) {
      case 'text':
        if (!draftText.trim()) return;
        newBlock = { id: blockId, type: 'text', text: draftText.trim() };
        break;

      case 'code':
        if (!draftCode.trim()) return;
        newBlock = {
          id: blockId,
          type: 'code',
          codeTitle: draftCodeTitle.trim() || undefined,
          language: draftCodeLanguage || 'csharp',
          code: draftCode.trim(),
          codeDescription: draftCodeDesc.trim() || undefined,
        };
        break;

      case 'image':
        if (!draftImageUrl.trim()) return;
        newBlock = {
          id: blockId,
          type: 'image',
          imageTitle: draftImageTitle.trim() || undefined,
          imageUrl: draftImageUrl.trim(),
          imageCaption: draftImageCaption.trim() || undefined,
        };
        break;

      case 'diagram':
        if (!draftDiagramContent.trim()) return;
        newBlock = {
          id: blockId,
          type: 'diagram',
          diagramTitle: draftDiagramTitle.trim() || 'Architecture Flowchart',
          diagramContent: draftDiagramContent.trim(),
          diagramCaption: draftDiagramCaption.trim() || undefined,
        };
        break;

      case 'link':
        if (!draftLinkUrl.trim()) return;
        newBlock = {
          id: blockId,
          type: 'link',
          linkTitle: draftLinkTitle.trim() || draftLinkUrl.trim(),
          linkUrl: draftLinkUrl.trim(),
          linkSource: draftLinkSource.trim() || 'Resource',
        };
        break;

      case 'callout':
        if (!draftCalloutContent.trim()) return;
        newBlock = {
          id: blockId,
          type: 'callout',
          calloutType: draftCalloutType,
          calloutTitle: draftCalloutTitle.trim() || undefined,
          calloutContent: draftCalloutContent.trim(),
        };
        break;

      case 'question':
        if (!draftQuestion.trim()) return;
        newBlock = {
          id: blockId,
          type: 'question',
          question: draftQuestion.trim(),
          shortAnswer: draftShortAns.trim(),
          detailedAnswer: draftDetailedAns.trim(),
          tips: draftTips.trim() || undefined,
        };
        break;

      case 'accordion':
        if (!draftAccordionTitle.trim()) return;
        newBlock = {
          id: blockId,
          type: 'accordion',
          accordionTitle: draftAccordionTitle.trim(),
          accordionContent: draftAccordionContent.trim(),
        };
        break;

      case 'checklist':
        if (!draftChecklistText.trim()) return;
        newBlock = {
          id: blockId,
          type: 'checklist',
          checklistText: draftChecklistText.trim(),
          checked: false,
        };
        break;
    }

    if (!newBlock) return;

    const updatedSections = articleSections.map((s) => {
      if (s.id === secId) {
        return {
          ...s,
          blocks: [...(s.blocks || []), newBlock!],
        };
      }
      return s;
    });

    handleSaveChanges({ ...editedTopic, articleSections: updatedSections });
    handleCloseAddBlock();
  };

  const handleDeleteBlock = (secId: string, blockId: string) => {
    const updatedSections = articleSections.map((s) => {
      if (s.id === secId) {
        return {
          ...s,
          blocks: (s.blocks || []).filter((b) => b.id !== blockId),
        };
      }
      return s;
    });
    handleSaveChanges({ ...editedTopic, articleSections: updatedSections });
  };

  const handleMoveBlock = (secId: string, blockIndex: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? blockIndex - 1 : blockIndex + 1;
    const targetSection = articleSections.find((s) => s.id === secId);
    if (!targetSection || !targetSection.blocks) return;
    if (targetIndex < 0 || targetIndex >= targetSection.blocks.length) return;

    const updatedSections = articleSections.map((s) => {
      if (s.id === secId) {
        const blocksCopy = [...(s.blocks || [])];
        const [moved] = blocksCopy.splice(blockIndex, 1);
        blocksCopy.splice(targetIndex, 0, moved);
        return { ...s, blocks: blocksCopy };
      }
      return s;
    });

    handleSaveChanges({ ...editedTopic, articleSections: updatedSections });
  };

  const handleStartEditBlock = (block: ArticleBlock) => {
    setEditingBlockId(block.id);
    setEditingBlockData({ ...block });
  };

  const handleSaveEditedBlock = (secId: string) => {
    if (!editingBlockId) return;

    const updatedSections = articleSections.map((s) => {
      if (s.id === secId) {
        const updatedBlocks = (s.blocks || []).map((b) =>
          b.id === editingBlockId ? ({ ...b, ...editingBlockData } as ArticleBlock) : b
        );
        return { ...s, blocks: updatedBlocks };
      }
      return s;
    });

    handleSaveChanges({ ...editedTopic, articleSections: updatedSections });
    setEditingBlockId(null);
    setEditingBlockData({});
  };

  const handleApplyMarkdown = (
    newSections: ArticleContentSection[],
    rawMarkdown: string,
    mode: 'replace' | 'append'
  ) => {
    let finalSections: ArticleContentSection[] = [];
    if (mode === 'replace') {
      finalSections = newSections;
    } else {
      finalSections = [...articleSections, ...newSections];
    }

    const updated: Topic = {
      ...editedTopic,
      articleSections: finalSections,
      coreConceptMarkdown: rawMarkdown,
      // Clear legacy top-level duplicate arrays on replace so they never append duplicates
      interviewQuestions: mode === 'replace' ? [] : editedTopic.interviewQuestions,
      diagrams: mode === 'replace' ? [] : editedTopic.diagrams,
      checklist: mode === 'replace' ? [] : editedTopic.checklist,
      references: mode === 'replace' ? [] : editedTopic.references,
      isPublished: false,
    };

    handleSaveChanges(updated);
    showToast(
      mode === 'replace'
        ? `Article replaced with ${newSections.length} sections from Markdown!`
        : `Appended ${newSections.length} sections to article!`
    );
  };

  // Resolve related topics
  const relatedTopics = (editedTopic.relatedTopicIds || [])
    .map((refIdOrSlug) => storageService.getTopic(refIdOrSlug))
    .filter((t): t is Topic => Boolean(t));

  return (
    <article className="max-w-3xl mx-auto px-3 sm:px-6 md:px-8 py-5 sm:py-6 relative pb-28">
      {/* 1. Thin Reading Progress Indicator Bar at Top */}
      <div className="fixed top-14 left-0 right-0 z-30 h-1 bg-slate-200/50 dark:bg-slate-800/50 pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-teal-400 transition-all duration-150"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* 2. Resume Study Toast Notification */}
      {resumeNotification !== null && (
        <div className="mb-4 p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200 flex items-center justify-between shadow-xs animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>
              Resumed study session from <strong>{resumeNotification}%</strong> reading progress
            </span>
          </div>
          <button
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              setResumeNotification(null);
            }}
            className="text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:underline cursor-pointer"
          >
            Start from top ↑
          </button>
        </div>
      )}

      {/* 3. Breadcrumbs & Reading Progress Badge */}
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <nav className="flex items-center flex-wrap gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
          <button
            onClick={() => subject && onNavigateToSubject && onNavigateToSubject(subject.id)}
            className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
          >
            {subject?.name || 'Subject'}
          </button>
          <span>→</span>
          <span className="text-slate-600 dark:text-slate-300">{section?.title || 'Section'}</span>
          <span>→</span>
          <span className="text-indigo-600 dark:text-indigo-400 font-semibold truncate max-w-[200px]">
            {editedTopic.title}
          </span>
        </nav>

        <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
          Reading: {readingProgress}%
        </span>
      </div>

      {/* 4. Topic Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 pb-5 mb-6">
        {/* Title Area - Full Width */}
        <div className="w-full">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight break-words leading-tight">
            {editedTopic.title}
          </h1>

          <div className="flex items-center gap-2.5 flex-wrap mt-2">
            {/* Status pill: Published vs Draft */}
            {isPublished ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                Published
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block animate-pulse" />
                Draft / Unpublished
              </span>
            )}

            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
              Updated: {editedTopic.lastUpdated}
              {lastSavedTime && (
                <span className="ml-1.5 text-emerald-500 font-medium">
                  • Saved at {lastSavedTime}
                </span>
              )}
            </span>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
            {editedTopic.tags.map((tag, idx) => (
              <span
                key={idx}
                onClick={() => onNavigateToTag && onNavigateToTag(tag)}
                className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
              >
                <Hash className="w-3 h-3 text-slate-400" />
                <span>{tag}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Action Toolbar - Separated Row, Fully Responsive */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3.5 mt-4 border-t border-slate-100 dark:border-slate-800/80">
          {/* Left: Authoring Controls (when unlocked) */}
          <div className="flex items-center gap-2 flex-wrap">
            {isUnlocked && (
              <button
                onClick={handleTogglePublish}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                  isPublished
                    ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
                title={
                  isPublished
                    ? 'Switch to Unpublished (Draft) mode to edit sections and blocks'
                    : 'Publish article and return to clean read-only mode'
                }
              >
                {isPublished ? (
                  <>
                    <FileEdit className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Edit Article (Unpublish)</span>
                  </>
                ) : (
                  <>
                    <Globe className="w-3.5 h-3.5" />
                    <span>Publish Article</span>
                  </>
                )}
              </button>
            )}

            {/* REPLACE WITH MARKDOWN BUTTON - WHEN UNLOCKED */}
            {isUnlocked && (
              <button
                onClick={() => setIsReplaceMarkdownModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                title="Replace article content or import multiple sections from a Markdown file (.md)"
              >
                <FileUp className="w-3.5 h-3.5 text-indigo-500" />
                <span>Replace with Markdown</span>
              </button>
            )}

            {/* ADD SECTION BUTTON - ONLY WHEN UNLOCKED AND IN UNPUBLISHED MODE */}
            {isUnpublishedEditMode && (
              <button
                onClick={() => handleOpenAddSectionModal(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
                title="Add a new section to this article"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Section</span>
              </button>
            )}

            {/* DELETE TOPIC BUTTON - ONLY WHEN UNLOCKED AND IN UNPUBLISHED MODE */}
            {isUnpublishedEditMode && onDeleteTopic && (
              <button
                onClick={() => {
                  setConfirmModal({
                    isOpen: true,
                    title: 'Delete Topic',
                    message: `Are you sure you want to permanently delete the topic "${editedTopic.title}"? This action cannot be undone.`,
                    onConfirm: () => {
                      onDeleteTopic(editedTopic.id);
                    },
                  });
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 cursor-pointer"
                title="Delete this topic"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Topic</span>
              </button>
            )}
          </div>

          {/* Right: Study Status, Favorite, Share */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative">
              <select
                value={progress.status}
                onChange={(e) => handleStatusChange(e.target.value as StudyStatus)}
                className="text-xs font-semibold py-1.5 pl-3 pr-7 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none"
              >
                <option value="not_started">○ Not Started</option>
                <option value="learning">◐ Learning</option>
                <option value="learned">✓ Learned</option>
                <option value="important">⭐ Important</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
            </div>

            <button
              onClick={handleShare}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              title="Copy shareable link"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* 5. Quick Definition */}
      <section id="sec-definition" className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs uppercase font-mono font-bold tracking-wider text-slate-500 dark:text-slate-400">
            Quick Definition
          </h2>

          {isUnpublishedEditMode && (
            <button
              onClick={() => {
                const def = prompt('Edit Quick Definition:', editedTopic.quickDefinition);
                if (def !== null) {
                  handleSaveChanges({ ...editedTopic, quickDefinition: def.trim() });
                }
              }}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1 font-semibold"
            >
              <Edit3 className="w-3 h-3" />
              <span>Edit</span>
            </button>
          )}
        </div>
        <div className="p-4 rounded-xl border border-indigo-100 dark:border-indigo-950/80 bg-indigo-50/50 dark:bg-indigo-950/20 text-slate-800 dark:text-slate-200 leading-relaxed font-sans text-sm sm:text-base font-normal">
          <MarkdownRenderer content={editedTopic.quickDefinition} />
        </div>
      </section>

      {/* 6. Quick Revision (30-60 sec) */}
      <section id="sec-quick-revision" className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h2 className="text-xs uppercase font-mono font-bold tracking-wider text-amber-800 dark:text-amber-400">
              30–60 Second Rapid Revision
            </h2>
          </div>

          {isUnpublishedEditMode && (
            <button
              onClick={() => {
                const bullet = prompt('Add quick revision bullet point:');
                if (bullet && bullet.trim()) {
                  handleSaveChanges({
                    ...editedTopic,
                    quickRevisionBulletPoints: [
                      ...(editedTopic.quickRevisionBulletPoints || []),
                      bullet.trim(),
                    ],
                  });
                }
              }}
              className="text-xs text-amber-600 dark:text-amber-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Bullet Point</span>
            </button>
          )}
        </div>

        <div className="rounded-xl border border-amber-200/80 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 p-4">
          <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
            {(editedTopic.quickRevisionBulletPoints || []).map((point, idx) => (
              <li key={idx} className="flex items-start justify-between gap-2.5 group">
                <div className="flex items-start gap-2.5 flex-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                  <div className="text-slate-700 dark:text-slate-300 text-sm flex-1">
                    <MarkdownRenderer content={point} inline />
                  </div>
                </div>
                {isUnpublishedEditMode && (
                  <button
                    onClick={() => {
                      const copy = editedTopic.quickRevisionBulletPoints.filter((_, i) => i !== idx);
                      handleSaveChanges({ ...editedTopic, quickRevisionBulletPoints: copy });
                    }}
                    className="text-rose-400 hover:text-rose-600 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Remove bullet point"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 7. ARTICLE DETAILS SECTION */}
      <section id="sec-core-concept" className="mb-12 space-y-6">
        {/* Header Banner */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-indigo-500/30 dark:border-indigo-500/20 pt-2">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
              §
            </div>
            <div>
              <h2 className="text-sm sm:text-base uppercase font-mono font-bold tracking-wider text-slate-900 dark:text-white">
                Article Details & Notes ({articleSections.length} Sections)
              </h2>
              {isUnpublishedEditMode && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Unpublished mode active: insert code, images, links, callouts & questions directly below.
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* REPLACE ARTICLE WITH MARKDOWN BUTTON */}
            <button
              onClick={() => {
                if (!isUnlocked) {
                  showToast('Please unlock editing mode from the top bar to replace article content.');
                  return;
                }
                setIsReplaceMarkdownModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-indigo-500 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-2xs transition-all cursor-pointer"
              title="Replace the entire article or import multiple sections from a Markdown file (.md) or text"
            >
              <FileUp className="w-3.5 h-3.5 text-indigo-500" />
              <span>Replace with Markdown</span>
            </button>

            {/* ADD SECTION BUTTON (ONLY VISIBLE IN UNPUBLISHED EDIT MODE) */}
            {isUnpublishedEditMode && (
              <button
                onClick={() => handleOpenAddSectionModal(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer shadow-xs hover:shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Section</span>
              </button>
            )}
          </div>
        </div>

        {/* LIST OF ARTICLE SECTIONS */}
        <div className="space-y-6 sm:space-y-8">
          {articleSections.map((sec, secIdx) => {
            const isRenaming = renamingSectionId === sec.id;
            const isAddingBlockToThis = activeAddBlockSectionId === sec.id;

            return (
              <div
                key={sec.id || secIdx}
                id={`art-sec-${sec.id || secIdx}`}
                className="p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs group relative transition-all"
              >
                {/* Section Header */}
                <div className="flex items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 shrink-0">
                      § {secIdx + 1}
                    </span>

                    {isRenaming && isUnpublishedEditMode ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={renamingTitle}
                          onChange={(e) => setRenamingTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameSection(sec.id);
                            if (e.key === 'Escape') setRenamingSectionId(null);
                          }}
                          className="px-2.5 py-1 text-sm font-bold rounded-lg border border-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white w-full max-w-sm"
                          autoFocus
                        />
                        <button
                          onClick={() => handleRenameSection(sec.id)}
                          className="px-2.5 py-1 text-xs font-bold rounded bg-indigo-600 text-white cursor-pointer"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setRenamingSectionId(null)}
                          className="px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 text-slate-500 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                        {sec.title}
                      </h3>
                    )}
                  </div>

                  {/* Section Controls (Rename, Move up/down, Delete) - ONLY WHEN UNLOCKED & UNPUBLISHED */}
                  {isUnpublishedEditMode && (
                    <div className="flex items-center gap-1 shrink-0">
                      {!isRenaming && (
                        <button
                          onClick={() => {
                            setRenamingSectionId(sec.id);
                            setRenamingTitle(sec.title);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Rename section"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        disabled={secIdx === 0}
                        onClick={() => handleMoveSection(secIdx, 'up')}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          secIdx === 0
                            ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                            : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                        title="Move section up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      <button
                        disabled={secIdx === articleSections.length - 1}
                        onClick={() => handleMoveSection(secIdx, 'down')}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          secIdx === articleSections.length - 1
                            ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                            : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                        title="Move section down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteSection(sec.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                        title="Delete this section"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* BLOCKS INSIDE THIS SECTION */}
                <div className="space-y-4">
                  {(sec.blocks || []).map((block, bIdx) => {
                    const isEditing = editingBlockId === block.id && isUnpublishedEditMode;

                    return (
                      <div
                        key={block.id || bIdx}
                        className="relative group/block rounded-xl transition-all"
                      >
                        {/* 1. TEXT BLOCK */}
                        {block.type === 'text' && (
                          <div>
                            {isEditing ? (
                              <div className="p-3 rounded-xl border border-indigo-400 bg-slate-50 dark:bg-slate-800/80 space-y-2">
                                <label className="block text-[11px] font-bold text-slate-500 uppercase">
                                  Edit Text / Markdown
                                </label>
                                <textarea
                                  value={editingBlockData.text ?? block.text ?? ''}
                                  onChange={(e) =>
                                    setEditingBlockData({
                                      ...editingBlockData,
                                      text: e.target.value,
                                    })
                                  }
                                  rows={6}
                                  className="w-full p-2.5 text-xs sm:text-sm font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                                />
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => setEditingBlockId(null)}
                                    className="px-2.5 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handleSaveEditedBlock(sec.id)}
                                    className="px-3 py-1 text-xs font-bold rounded bg-indigo-600 text-white"
                                  >
                                    Save Text
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="relative">
                                <div className="text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300">
                                  <MarkdownRenderer content={block.text || ''} />
                                </div>

                                {/* Floating Block Action Bar - ONLY WHEN UNLOCKED & UNPUBLISHED */}
                                {isUnpublishedEditMode && (
                                  <div className="absolute right-0 -top-3 opacity-0 group-hover/block:opacity-100 transition-opacity flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 shadow-2xs">
                                    <button
                                      onClick={() => handleStartEditBlock(block)}
                                      className="p-1 text-slate-400 hover:text-indigo-600 cursor-pointer"
                                      title="Edit text"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleMoveBlock(sec.id, bIdx, 'up')}
                                      disabled={bIdx === 0}
                                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                                      title="Move block up"
                                    >
                                      <ArrowUp className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleMoveBlock(sec.id, bIdx, 'down')}
                                      disabled={bIdx === (sec.blocks?.length || 1) - 1}
                                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                                      title="Move block down"
                                    >
                                      <ArrowDown className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteBlock(sec.id, block.id)}
                                      className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                                      title="Delete block"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* 2. CODE BLOCK */}
                        {block.type === 'code' && (
                          <div>
                            {isEditing ? (
                              <div className="p-3 rounded-xl border border-indigo-400 bg-slate-50 dark:bg-slate-800/80 space-y-3">
                                <label className="block text-[11px] font-bold text-slate-500 uppercase">
                                  Edit Code Block
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <input
                                    type="text"
                                    value={editingBlockData.codeTitle ?? block.codeTitle ?? ''}
                                    onChange={(e) =>
                                      setEditingBlockData({
                                        ...editingBlockData,
                                        codeTitle: e.target.value,
                                      })
                                    }
                                    placeholder="Snippet title (e.g. Program.cs)"
                                    className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                                  />
                                  <select
                                    value={editingBlockData.language ?? block.language ?? 'csharp'}
                                    onChange={(e) =>
                                      setEditingBlockData({
                                        ...editingBlockData,
                                        language: e.target.value,
                                      })
                                    }
                                    className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                                  >
                                    <option value="csharp">C# (.NET)</option>
                                    <option value="go">Go</option>
                                    <option value="sql">SQL</option>
                                    <option value="typescript">TypeScript</option>
                                    <option value="bash">Bash / Shell</option>
                                    <option value="docker">Docker</option>
                                    <option value="yaml">YAML</option>
                                    <option value="json">JSON</option>
                                  </select>
                                </div>
                                <textarea
                                  value={editingBlockData.code ?? block.code ?? ''}
                                  onChange={(e) =>
                                    setEditingBlockData({
                                      ...editingBlockData,
                                      code: e.target.value,
                                    })
                                  }
                                  rows={7}
                                  className="w-full p-2.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-950 text-emerald-400 overflow-x-auto"
                                />
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => setEditingBlockId(null)}
                                    className="px-2.5 py-1 text-xs rounded border border-slate-300 dark:border-slate-700"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handleSaveEditedBlock(sec.id)}
                                    className="px-3 py-1 text-xs font-bold rounded bg-indigo-600 text-white"
                                  >
                                    Save Code
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="relative">
                                <CodeBlock
                                  code={block.code || ''}
                                  language={block.language || 'csharp'}
                                  title={block.codeTitle}
                                />
                                {block.codeDescription && (
                                  <p className="text-xs text-slate-500 italic mt-1 px-1">
                                    {block.codeDescription}
                                  </p>
                                )}

                                {isUnpublishedEditMode && (
                                  <div className="absolute right-2 top-2 opacity-0 group-hover/block:opacity-100 transition-opacity flex items-center gap-1 bg-slate-800/90 border border-slate-700 rounded-lg p-0.5 shadow-2xs z-10">
                                    <button
                                      onClick={() => handleStartEditBlock(block)}
                                      className="p-1 text-slate-300 hover:text-white"
                                      title="Edit code snippet"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleMoveBlock(sec.id, bIdx, 'up')}
                                      disabled={bIdx === 0}
                                      className="p-1 text-slate-300 hover:text-white disabled:opacity-30"
                                    >
                                      <ArrowUp className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleMoveBlock(sec.id, bIdx, 'down')}
                                      disabled={bIdx === (sec.blocks?.length || 1) - 1}
                                      className="p-1 text-slate-300 hover:text-white disabled:opacity-30"
                                    >
                                      <ArrowDown className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteBlock(sec.id, block.id)}
                                      className="p-1 text-rose-400 hover:text-rose-300"
                                      title="Delete code snippet"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* 3. IMAGE BLOCK */}
                        {block.type === 'image' && (
                          <div className="relative my-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
                            {block.imageTitle && (
                              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                                {block.imageTitle}
                              </div>
                            )}
                            <div className="text-center">
                              <img
                                src={block.imageUrl}
                                alt={block.imageTitle || 'Article diagram'}
                                className="max-h-96 rounded-lg mx-auto object-contain shadow-xs border border-slate-200 dark:border-slate-800 w-full"
                                loading="lazy"
                              />
                            </div>
                            {block.imageCaption && (
                              <p className="text-center text-xs text-slate-500 italic mt-2">
                                {block.imageCaption}
                              </p>
                            )}

                            {isUnpublishedEditMode && (
                              <div className="absolute right-2 top-2 opacity-0 group-hover/block:opacity-100 transition-opacity flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 shadow-2xs">
                                <button
                                  onClick={() => handleDeleteBlock(sec.id, block.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 4. DIAGRAM / FLOW BLOCK */}
                        {block.type === 'diagram' && (
                          <div className="relative my-3 rounded-xl border border-slate-700 bg-slate-950 text-emerald-400 overflow-hidden shadow-2xs">
                            <div className="px-4 py-2 border-b border-slate-800 bg-slate-900/90 text-xs font-mono text-slate-300 flex items-center justify-between">
                              <span className="font-bold flex items-center gap-1.5">
                                <Network className="w-3.5 h-3.5 text-blue-400" />
                                {block.diagramTitle || 'System Flowchart'}
                              </span>
                            </div>
                            <pre className="p-4 text-xs font-mono overflow-x-auto leading-relaxed whitespace-pre">
                              {block.diagramContent}
                            </pre>
                            {block.diagramCaption && (
                              <div className="px-4 py-1.5 text-[11px] text-slate-400 italic bg-slate-900/60 border-t border-slate-800">
                                {block.diagramCaption}
                              </div>
                            )}

                            {isUnpublishedEditMode && (
                              <div className="absolute right-2 top-2 opacity-0 group-hover/block:opacity-100 transition-opacity flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-lg p-0.5 shadow-2xs">
                                <button
                                  onClick={() => handleDeleteBlock(sec.id, block.id)}
                                  className="p-1 text-slate-400 hover:text-rose-400"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 5. REFERENCE LINK BLOCK */}
                        {block.type === 'link' && (
                          <div className="relative my-2 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors">
                            <a
                              href={block.linkUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <LinkIcon className="w-4 h-4 text-cyan-500 shrink-0" />
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-900 dark:text-white truncate">
                                    {block.linkTitle}
                                  </div>
                                  <div className="text-[11px] text-slate-400 font-mono truncate">
                                    {block.linkUrl}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 text-[10px] font-mono text-slate-500 border border-slate-200 dark:border-slate-700">
                                  {block.linkSource}
                                </span>
                                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                              </div>
                            </a>

                            {isUnpublishedEditMode && (
                              <div className="absolute right-2 top-2 opacity-0 group-hover/block:opacity-100 transition-opacity flex items-center gap-1">
                                <button
                                  onClick={() => handleDeleteBlock(sec.id, block.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 6. CALLOUT BLOCK */}
                        {block.type === 'callout' && (
                          <div
                            className={`relative my-3 p-4 rounded-xl border flex items-start gap-3 text-sm ${
                              block.calloutType === 'danger'
                                ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 text-rose-950 dark:text-rose-200'
                                : block.calloutType === 'warning'
                                ? 'border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 text-amber-950 dark:text-amber-200'
                                : block.calloutType === 'tip'
                                ? 'border-teal-200 dark:border-teal-900/60 bg-teal-50/50 dark:bg-teal-950/20 text-teal-950 dark:text-teal-200'
                                : 'border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 text-blue-950 dark:text-blue-200'
                            }`}
                          >
                            <div className="shrink-0 mt-0.5">
                              {block.calloutType === 'danger' ? (
                                <AlertTriangle className="w-5 h-5 text-rose-500" />
                              ) : block.calloutType === 'warning' ? (
                                <AlertCircle className="w-5 h-5 text-amber-500" />
                              ) : block.calloutType === 'tip' ? (
                                <Lightbulb className="w-5 h-5 text-teal-500" />
                              ) : (
                                <Info className="w-5 h-5 text-blue-500" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              {block.calloutTitle && (
                                <div className="font-bold text-sm mb-1">{block.calloutTitle}</div>
                              )}
                              <div className="leading-relaxed opacity-95 break-words">
                                <MarkdownRenderer content={block.calloutContent || ''} />
                              </div>
                            </div>

                            {isUnpublishedEditMode && (
                              <button
                                onClick={() => handleDeleteBlock(sec.id, block.id)}
                                className="opacity-0 group-hover/block:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition-opacity"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}

                        {/* 7. INTERVIEW QUESTION BLOCK */}
                        {block.type === 'question' && (
                          <div className="relative my-3 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
                            <button
                              onClick={() => toggleQuestion(block.id)}
                              className="w-full flex items-center justify-between p-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <HelpCircle className="w-4 h-4 text-rose-500 shrink-0" />
                                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                                  {block.question}
                                </span>
                              </div>
                              {expandedQuestions[block.id] ? (
                                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                              )}
                            </button>

                            {expandedQuestions[block.id] && (
                              <div className="p-4 border-t border-rose-100 dark:border-rose-950 bg-rose-50/30 dark:bg-rose-950/10 text-xs sm:text-sm space-y-3">
                                <div>
                                  <span className="font-bold text-rose-800 dark:text-rose-400 uppercase text-[10px] tracking-wider block mb-1">
                                    30-Second Interview Answer
                                  </span>
                                  <div className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                                    <MarkdownRenderer content={block.shortAnswer || ''} />
                                  </div>
                                </div>
                                {block.detailedAnswer && (
                                  <div>
                                    <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider block mb-1">
                                      Detailed Nuances
                                    </span>
                                    <div className="text-slate-700 dark:text-slate-300 leading-relaxed">
                                      <MarkdownRenderer content={block.detailedAnswer} />
                                    </div>
                                  </div>
                                )}
                                {block.tips && (
                                  <div className="p-2 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs">
                                    💡 <strong>Interviewer tip:</strong> {block.tips}
                                  </div>
                                )}
                              </div>
                            )}

                            {isUnpublishedEditMode && (
                              <div className="absolute right-8 top-3 opacity-0 group-hover/block:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleDeleteBlock(sec.id, block.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 8. ACCORDION BLOCK */}
                        {block.type === 'accordion' && (
                          <div className="relative my-2 rounded-xl border border-teal-200 dark:border-teal-900/60 overflow-hidden">
                            <button
                              onClick={() => toggleAccordion(block.id)}
                              className="w-full flex items-center justify-between p-3 bg-teal-50/50 dark:bg-teal-950/20 text-left text-xs font-bold text-teal-900 dark:text-teal-200"
                            >
                              <span>{block.accordionTitle}</span>
                              {expandedAccordions[block.id] ? (
                                <ChevronDown className="w-4 h-4 text-teal-600" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-teal-600" />
                              )}
                            </button>
                            {expandedAccordions[block.id] && (
                              <div className="p-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border-t border-teal-100 dark:border-teal-900">
                                <MarkdownRenderer content={block.accordionContent || ''} />
                              </div>
                            )}
                          </div>
                        )}

                        {/* 9. CHECKLIST BLOCK */}
                        {block.type === 'checklist' && (
                          <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 text-xs text-slate-800 dark:text-slate-200">
                            <input
                              type="checkbox"
                              defaultChecked={block.checked}
                              className="rounded text-indigo-600 cursor-pointer"
                            />
                            <span>{block.checklistText}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* MEDIUM-STYLE INLINE BLOCK ADDER TOOLBAR (ONLY IN UNPUBLISHED EDIT MODE) */}
                {isUnpublishedEditMode && (
                  <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-bold text-slate-400 uppercase font-mono mr-1">
                        Insert block:
                      </span>

                      <button
                        onClick={() => handleOpenAddBlock(sec.id, 'text')}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-600 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Text</span>
                      </button>

                      <button
                        onClick={() => handleOpenAddBlock(sec.id, 'code')}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-600 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Code className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Code</span>
                      </button>

                      <button
                        onClick={() => handleOpenAddBlock(sec.id, 'image')}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-600 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-purple-500" />
                        <span>Image</span>
                      </button>

                      <button
                        onClick={() => handleOpenAddBlock(sec.id, 'diagram')}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-600 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Network className="w-3.5 h-3.5 text-blue-500" />
                        <span>Diagram</span>
                      </button>

                      <button
                        onClick={() => handleOpenAddBlock(sec.id, 'link')}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-600 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <LinkIcon className="w-3.5 h-3.5 text-cyan-500" />
                        <span>Link</span>
                      </button>

                      <button
                        onClick={() => handleOpenAddBlock(sec.id, 'callout')}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-600 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                        <span>Callout</span>
                      </button>

                      <button
                        onClick={() => handleOpenAddBlock(sec.id, 'question')}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-600 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <HelpCircle className="w-3.5 h-3.5 text-rose-500" />
                        <span>Interview Q&A</span>
                      </button>

                      <button
                        onClick={() => handleOpenAddBlock(sec.id, 'accordion')}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-600 text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <ChevronDown className="w-3.5 h-3.5 text-teal-500" />
                        <span>Accordion</span>
                      </button>
                    </div>

                    {/* INLINE BUILDER FORM EXPANDED IN THIS SECTION */}
                    {isAddingBlockToThis && activeAddBlockType && (
                      <div className="mt-3 p-4 rounded-xl border-2 border-indigo-400 bg-white dark:bg-slate-950 shadow-md space-y-3 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                          <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase">
                            Insert {activeAddBlockType} into § {secIdx + 1} ({sec.title})
                          </span>
                          <button
                            onClick={handleCloseAddBlock}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {/* TEXT FORM */}
                        {activeAddBlockType === 'text' && (
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                              Paragraph / Markdown Notes *
                            </label>
                            <textarea
                              value={draftText}
                              onChange={(e) => setDraftText(e.target.value)}
                              rows={5}
                              placeholder="Type explanation, bullet points, or markdown notes..."
                              className="w-full p-2.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                              autoFocus
                            />
                          </div>
                        )}

                        {/* CODE FORM */}
                        {activeAddBlockType === 'code' && (
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                  Snippet Title
                                </label>
                                <input
                                  type="text"
                                  value={draftCodeTitle}
                                  onChange={(e) => setDraftCodeTitle(e.target.value)}
                                  placeholder="e.g. Program.cs or db.go"
                                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                  Language
                                </label>
                                <select
                                  value={draftCodeLanguage}
                                  onChange={(e) => setDraftCodeLanguage(e.target.value)}
                                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                                >
                                  <option value="csharp">C# (.NET)</option>
                                  <option value="go">Go</option>
                                  <option value="sql">SQL</option>
                                  <option value="typescript">TypeScript</option>
                                  <option value="bash">Bash / Shell</option>
                                  <option value="docker">Docker</option>
                                  <option value="yaml">YAML</option>
                                  <option value="json">JSON</option>
                                </select>
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Code *
                              </label>
                              <textarea
                                value={draftCode}
                                onChange={(e) => setDraftCode(e.target.value)}
                                rows={6}
                                placeholder="// Paste or write code here..."
                                className="w-full p-2.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-950 text-emerald-400 overflow-x-auto"
                                autoFocus
                              />
                            </div>
                          </div>
                        )}

                        {/* IMAGE FORM */}
                        {activeAddBlockType === 'image' && (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Image URL *
                              </label>
                              <input
                                type="url"
                                value={draftImageUrl}
                                onChange={(e) => setDraftImageUrl(e.target.value)}
                                placeholder="https://images.unsplash.com/... or hosted URL"
                                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                                autoFocus
                              />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <input
                                type="text"
                                value={draftImageTitle}
                                onChange={(e) => setDraftImageTitle(e.target.value)}
                                placeholder="Image Title / Label"
                                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                              />
                              <input
                                type="text"
                                value={draftImageCaption}
                                onChange={(e) => setDraftImageCaption(e.target.value)}
                                placeholder="Caption"
                                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                              />
                            </div>
                          </div>
                        )}

                        {/* DIAGRAM FORM */}
                        {activeAddBlockType === 'diagram' && (
                          <div className="space-y-3">
                            <input
                              type="text"
                              value={draftDiagramTitle}
                              onChange={(e) => setDraftDiagramTitle(e.target.value)}
                              placeholder="Diagram Title (e.g. Distributed Lock Flow)"
                              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                            />
                            <textarea
                              value={draftDiagramContent}
                              onChange={(e) => setDraftDiagramContent(e.target.value)}
                              rows={6}
                              placeholder="Client ---> API Gateway ---> Microservice ---> Redis"
                              className="w-full p-2.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-950 text-emerald-400 overflow-x-auto"
                              autoFocus
                            />
                          </div>
                        )}

                        {/* LINK FORM */}
                        {activeAddBlockType === 'link' && (
                          <div className="space-y-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <input
                                type="text"
                                value={draftLinkTitle}
                                onChange={(e) => setDraftLinkTitle(e.target.value)}
                                placeholder="Title (e.g. Microsoft Learn)"
                                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                                autoFocus
                              />
                              <input
                                type="text"
                                value={draftLinkSource}
                                onChange={(e) => setDraftLinkSource(e.target.value)}
                                placeholder="Source (e.g. Documentation, RFC, GitHub)"
                                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                              />
                            </div>
                            <input
                              type="url"
                              value={draftLinkUrl}
                              onChange={(e) => setDraftLinkUrl(e.target.value)}
                              placeholder="https://..."
                              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                            />
                          </div>
                        )}

                        {/* CALLOUT FORM */}
                        {activeAddBlockType === 'callout' && (
                          <div className="space-y-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <select
                                value={draftCalloutType}
                                onChange={(e) => setDraftCalloutType(e.target.value as any)}
                                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                              >
                                <option value="tip">💡 Tip / Best Practice</option>
                                <option value="warning">⚠️ Warning / Gotcha</option>
                                <option value="danger">🚨 Danger / Anti-Pattern</option>
                                <option value="info">ℹ️ Info / Key Rule</option>
                              </select>
                              <input
                                type="text"
                                value={draftCalloutTitle}
                                onChange={(e) => setDraftCalloutTitle(e.target.value)}
                                placeholder="Callout Title"
                                className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                              />
                            </div>
                            <textarea
                              value={draftCalloutContent}
                              onChange={(e) => setDraftCalloutContent(e.target.value)}
                              rows={3}
                              placeholder="Explanation..."
                              className="w-full p-2.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                              autoFocus
                            />
                          </div>
                        )}

                        {/* INTERVIEW QUESTION FORM */}
                        {activeAddBlockType === 'question' && (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={draftQuestion}
                              onChange={(e) => setDraftQuestion(e.target.value)}
                              placeholder="Technical Interview Question..."
                              className="w-full px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                              autoFocus
                            />
                            <textarea
                              value={draftShortAns}
                              onChange={(e) => setDraftShortAns(e.target.value)}
                              rows={2}
                              placeholder="30-Second Rapid Answer..."
                              className="w-full p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                            />
                            <textarea
                              value={draftDetailedAns}
                              onChange={(e) => setDraftDetailedAns(e.target.value)}
                              rows={3}
                              placeholder="Detailed explanation, nuances & trade-offs..."
                              className="w-full p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                            />
                            <input
                              type="text"
                              value={draftTips}
                              onChange={(e) => setDraftTips(e.target.value)}
                              placeholder="Interviewer Tips (Optional)"
                              className="w-full px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                            />
                          </div>
                        )}

                        {/* ACCORDION FORM */}
                        {activeAddBlockType === 'accordion' && (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={draftAccordionTitle}
                              onChange={(e) => setDraftAccordionTitle(e.target.value)}
                              placeholder="Accordion Title (e.g. Memory Layout)"
                              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                              autoFocus
                            />
                            <textarea
                              value={draftAccordionContent}
                              onChange={(e) => setDraftAccordionContent(e.target.value)}
                              rows={4}
                              placeholder="Deep-dive content..."
                              className="w-full p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                            />
                          </div>
                        )}

                        {/* SUBMIT BUTTONS FOR INLINE BLOCK */}
                        <div className="flex justify-end gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={handleCloseAddBlock}
                            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveNewBlock(sec.id)}
                            className="px-4 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer shadow-xs"
                          >
                            Save to Section
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Sub-divider to add a new section directly below this section - ONLY IN UNPUBLISHED EDIT MODE */}
                {isUnpublishedEditMode && (
                  <div className="mt-4 pt-2 flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenAddSectionModal(secIdx)}
                      className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-full border border-indigo-200 dark:border-indigo-900/60 cursor-pointer transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Section Below § {secIdx + 1}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* PROMINENT CARDS AT BOTTOM TO ADD OR REPLACE ARTICLE CONTENT */}
        {isUnpublishedEditMode && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => handleOpenAddSectionModal(null)}
              className="py-3.5 px-4 border-2 border-dashed border-indigo-200 dark:border-indigo-900/60 hover:border-indigo-500 rounded-2xl bg-indigo-50/30 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 flex items-center justify-center gap-2 font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-2xs hover:shadow-xs group"
            >
              <Plus className="w-4 h-4 group-hover:scale-110 transition-transform text-indigo-500" />
              <span>Add New Section</span>
            </button>

            <button
              onClick={() => setIsReplaceMarkdownModalOpen(true)}
              className="py-3.5 px-4 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-2xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center justify-center gap-2 font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-2xs hover:shadow-xs group"
            >
              <FileUp className="w-4 h-4 group-hover:scale-110 transition-transform text-indigo-500" />
              <span>Replace Article with Markdown (.md)</span>
            </button>
          </div>
        )}
      </section>

      {/* 8. Related Topics */}
      {relatedTopics.length > 0 && (
        <section id="sec-related-topics" className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800">
          <h2 className="text-xs uppercase font-mono font-bold tracking-wider text-slate-400 dark:text-slate-400 mb-3 flex items-center gap-1.5">
            <ArrowRight className="w-3.5 h-3.5 text-indigo-500" />
            <span>Related Topics</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {relatedTopics.map((relTopic) => (
              <button
                key={relTopic.id}
                onClick={() => onNavigateToTopic(relTopic.id)}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-400 dark:hover:border-indigo-600 text-left transition-colors cursor-pointer group shadow-2xs"
              >
                <div className="min-w-0 pr-2">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                    {relTopic.title}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {relTopic.quickDefinition}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* MODAL: ADD NEW SECTION TO ARTICLE (ONLY IN UNPUBLISHED EDIT MODE) */}
      {isAddSectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-2xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 shrink-0">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Add New Section to Article
                </h3>
              </div>
              <button
                onClick={() => setIsAddSectionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmCreateSection} className="p-4 sm:p-5 space-y-4 text-xs sm:text-sm overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Section Title / Heading *
                </label>
                <input
                  type="text"
                  required
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                  placeholder="e.g. Architectural Mechanics, Internal Flow, Garbage Collection Nuance"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-bold"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Initial Section Notes / Explanation (Markdown supported)
                </label>
                <textarea
                  value={newSectionInitialText}
                  onChange={(e) => setNewSectionInitialText(e.target.value)}
                  rows={5}
                  placeholder="Write initial notes, explanations, or leave blank to add code, images, links, or callouts from the section toolbar..."
                  className="w-full p-3 font-mono text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="p-3 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 text-indigo-900 dark:text-indigo-200 text-xs">
                💡 Once created, you can immediately add code snippets, images, diagrams, links, callout notes, and interview Q&As into this section.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddSectionModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer shadow-xs"
                >
                  Create Section & Add to Article
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />

      {/* Replace Article Markdown Modal */}
      <ReplaceArticleMarkdownModal
        isOpen={isReplaceMarkdownModalOpen}
        onClose={() => setIsReplaceMarkdownModalOpen(false)}
        topicTitle={editedTopic.title}
        currentSections={articleSections}
        onApply={handleApplyMarkdown}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-xl border border-slate-800 flex items-center gap-2 animate-in slide-in-from-bottom-3 duration-200">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </article>
  );
};
