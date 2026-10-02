export type StudyStatus = 'not_started' | 'learning' | 'learned' | 'important';

export type ReferenceType =
  | 'Official Documentation'
  | 'Article'
  | 'Video'
  | 'GitHub'
  | 'Book'
  | 'Course'
  | 'Other';

export interface ReferenceItem {
  id: string;
  title: string;
  url: string;
  source: string;
  description?: string;
  type: ReferenceType;
}

export interface InterviewQuestion {
  id: string;
  question: string;
  shortAnswer: string;
  detailedAnswer: string;
  codeSnippet?: {
    language: string;
    code: string;
  };
  keyTakeaways?: string[];
  interviewerTips?: string;
  learned?: boolean;
}

export interface AccordionSection {
  id: string;
  title: string;
  content: string;
  codeSnippet?: {
    language: string;
    code: string;
  };
}

export interface ChecklistItem {
  id: string;
  text: string;
  checked?: boolean;
}

export interface NoteCallout {
  type: 'info' | 'warning' | 'tip' | 'danger';
  title?: string;
  content: string;
}

export interface DiagramBlock {
  id: string;
  title: string;
  type: 'architecture' | 'flowchart' | 'image';
  content: string; // ASCII/SVG or image URL
  caption?: string;
}

export type ArticleBlockType =
  | 'text'
  | 'code'
  | 'image'
  | 'diagram'
  | 'callout'
  | 'link'
  | 'question'
  | 'accordion'
  | 'checklist';

export interface ArticleBlock {
  id: string;
  type: ArticleBlockType;
  // text block
  text?: string;
  // code block
  codeTitle?: string;
  language?: string;
  code?: string;
  codeDescription?: string;
  // image block
  imageTitle?: string;
  imageUrl?: string;
  imageCaption?: string;
  // diagram block
  diagramTitle?: string;
  diagramContent?: string;
  diagramCaption?: string;
  // callout block
  calloutType?: 'info' | 'warning' | 'tip' | 'danger';
  calloutTitle?: string;
  calloutContent?: string;
  // link / reference block
  linkTitle?: string;
  linkUrl?: string;
  linkSource?: string;
  linkType?: ReferenceType;
  // interview question
  question?: string;
  shortAnswer?: string;
  detailedAnswer?: string;
  tips?: string;
  // accordion
  accordionTitle?: string;
  accordionContent?: string;
  // checklist
  checklistText?: string;
  checked?: boolean;
}

export interface ArticleContentSection {
  id: string;
  title: string;
  content: string;
  blocks?: ArticleBlock[];
}

export interface TopicScrollProgress {
  scrollY: number;
  progressPercentage: number;
  lastUpdated: number;
}

export interface Topic {
  id: string;
  slug: string;
  subjectId: string;
  sectionId: string;
  title: string;
  tags: string[];
  quickDefinition: string;
  quickRevisionBulletPoints: string[]; // 30-60 sec review summary
  coreConceptMarkdown: string;
  articleSections?: ArticleContentSection[];
  diagrams?: DiagramBlock[];
  codeExamples?: {
    title: string;
    language: string;
    code: string;
    description?: string;
  }[];
  callouts?: NoteCallout[];
  accordions?: AccordionSection[];
  checklist?: ChecklistItem[];
  commonMistakes?: string[];
  interviewQuestions: InterviewQuestion[];
  references: ReferenceItem[];
  relatedTopicIds: string[]; // Cross links by topic slug or id
  lastUpdated: string;
  isPublished?: boolean;
}

export interface Section {
  id: string;
  slug: string;
  subjectId: string;
  title: string;
  order: number;
  description?: string;
  topicIds: string[];
}

export interface Subject {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  icon: string; // Lucide icon name or emoji
  color: string; // accent color class or hex
  lastUpdated: string;
  isPinned?: boolean;
  order: number;
}

export interface TopicProgress {
  status: StudyStatus;
  isFavorite: boolean;
  lastVisited?: string;
  revisionCount?: number;
}

export interface KnowledgeStore {
  version: number;
  subjects: Subject[];
  sections: Section[];
  topics: Topic[];
  progress: Record<string, TopicProgress>; // topicId -> progress
  recentlyVisited: string[]; // topicIds in order of visit
  lastStudiedTopicId?: string;
  sectionExpandedState: Record<string, boolean>; // sectionId -> isExpanded
}

export interface SearchResult {
  type: 'subject' | 'section' | 'topic' | 'interview_question' | 'reference' | 'tag';
  id: string;
  title: string;
  breadcrumb: string;
  subjectId?: string;
  sectionId?: string;
  topicId?: string;
  snippet: string;
  tags: string[];
  matchedField: string;
}
