import { KnowledgeStore, Subject, Section, Topic, StudyStatus, TopicProgress } from '../types';
import { initialSubjects, initialSections, initialTopics, initialProgress, initialRecentlyVisited } from '../data/seedData';
import { supabase } from './supabaseClient';

const STORAGE_KEY = 'eng_knowledge_hub_store_v3';

export class StorageService {
  private static instance: StorageService;
  private store: KnowledgeStore;
  private listeners: Set<() => void> = new Set();
  private supabaseSyncInProgress = false;

  private constructor() {
    this.store = this.loadFromStorage();
    this.tryInitialSupabasePull();
  }

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  private async tryInitialSupabasePull(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('knowledge_hub_store')
        .select('data')
        .eq('id', 'primary_hub')
        .maybeSingle();

      if (data && data.data && Array.isArray(data.data.subjects)) {
        this.store = data.data;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.store));
        this.notifyListeners();
      }
    } catch (err) {
      // Supabase table may not be created yet, fallback to localStorage gracefully
    }
  }

  private loadFromStorage(): KnowledgeStore {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const serialized = localStorage.getItem(STORAGE_KEY);
        if (serialized) {
          const parsed = JSON.parse(serialized);
          if (parsed && parsed.subjects && parsed.topics) {
            let modified = false;

            if (!Array.isArray(parsed.sections)) {
              parsed.sections = [];
              modified = true;
            }

            // Remove obsolete old sec-dotnet-history if present and replace with sec-dotnet-01-history
            const oldHistoryIdx = parsed.sections.findIndex((s: Section) => s.id === 'sec-dotnet-history');
            if (oldHistoryIdx !== -1) {
              parsed.sections.splice(oldHistoryIdx, 1);
              modified = true;
            }

            // Sync all seed sections (e.g. 18 .NET curriculum sections)
            for (const sSec of initialSections) {
              const existingSecIdx = parsed.sections.findIndex((s: Section) => s.id === sSec.id);
              if (existingSecIdx === -1) {
                parsed.sections.push({ ...sSec });
                modified = true;
              } else if (parsed.version < 7) {
                parsed.sections[existingSecIdx] = { ...sSec };
                modified = true;
              }
            }

            // Sync all seed topics
            for (const sTop of initialTopics) {
              const existingTopIdx = parsed.topics.findIndex((t: Topic) => t.id === sTop.id);
              if (existingTopIdx === -1) {
                parsed.topics.push({ ...sTop });
                modified = true;
              } else if (parsed.version < 7) {
                parsed.topics[existingTopIdx] = { ...sTop };
                modified = true;
              }
            }

            parsed.sections.sort((a: Section, b: Section) => a.order - b.order);

            if (parsed.version < 7 || modified) {
              parsed.version = 7;
              if (parsed.sectionExpandedState) {
                parsed.sectionExpandedState['sec-dotnet-01-history'] = true;
                parsed.sectionExpandedState['sec-ef-01'] = true;
                parsed.sectionExpandedState['sec-sql-01'] = true;
              }
              // Also sync subjects so SQL is pinned and in position 3
              parsed.subjects = initialSubjects;
              this.saveToStorage(parsed);
            }

            return parsed;
          }
        }
      }
    } catch (e) {
      console.error('Failed to load knowledge store from localStorage:', e);
    }

    // Default initialized store with requested subjects in exact order
    const defaultStore: KnowledgeStore = {
      version: 7,
      subjects: initialSubjects,
      sections: initialSections,
      topics: initialTopics,
      progress: initialProgress,
      recentlyVisited: initialRecentlyVisited,
      lastStudiedTopicId: undefined,
      sectionExpandedState: { 'sec-dotnet-01-history': true, 'sec-ef-01': true, 'sec-sql-01': true },
    };

    this.saveToStorage(defaultStore);
    return defaultStore;
  }

  private saveToStorage(store: KnowledgeStore): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
      }
      this.store = store;
      this.notifyListeners();

      // Async cloud sync to Supabase in background
      this.asyncPushToSupabase(store);
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  private async asyncPushToSupabase(store: KnowledgeStore): Promise<void> {
    if (this.supabaseSyncInProgress) return;
    this.supabaseSyncInProgress = true;
    try {
      await supabase.from('knowledge_hub_store').upsert({
        id: 'primary_hub',
        data: store,
        updated_at: new Date().toISOString(),
      });
    } catch {
      // Ignored for offline or unconfigured table
    } finally {
      this.supabaseSyncInProgress = false;
    }
  }

  public async pushToSupabase(): Promise<{ success: boolean; message: string }> {
    try {
      const { error } = await supabase.from('knowledge_hub_store').upsert({
        id: 'primary_hub',
        data: this.store,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        return { success: false, message: `Supabase Error: ${error.message}` };
      }

      return { success: true, message: 'Successfully synced all subjects & topics to Supabase!' };
    } catch (e: any) {
      return { success: false, message: `Sync error: ${e.message}` };
    }
  }

  public async pullFromSupabase(): Promise<{ success: boolean; message: string }> {
    try {
      const { data, error } = await supabase
        .from('knowledge_hub_store')
        .select('data')
        .eq('id', 'primary_hub')
        .maybeSingle();

      if (error) {
        return { success: false, message: `Supabase Error: ${error.message}` };
      }

      if (!data || !data.data) {
        return { success: false, message: 'No knowledge store found on Supabase yet. Try Push first.' };
      }

      this.saveToStorage(data.data);
      return { success: true, message: 'Successfully pulled and restored data from Supabase!' };
    } catch (e: any) {
      return { success: false, message: `Fetch error: ${e.message}` };
    }
  }

  public async checkSupabaseStatus(): Promise<{ connected: boolean; tableExists: boolean; message?: string }> {
    try {
      const { data, error } = await supabase
        .from('knowledge_hub_store')
        .select('id')
        .limit(1);

      if (error) {
        if (error.code === '42P01') {
          // Table does not exist
          return { connected: true, tableExists: false, message: 'Table knowledge_hub_store does not exist in Supabase yet.' };
        }
        return { connected: false, tableExists: false, message: error.message };
      }

      return { connected: true, tableExists: true, message: 'Connected and synchronized with Supabase.' };
    } catch (err: any) {
      return { connected: false, tableExists: false, message: err.message };
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error(err);
      }
    });
  }

  // Getters
  public getStore(): KnowledgeStore {
    return this.store;
  }

  public getSubjects(): Subject[] {
    return [...this.store.subjects].sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  public getSubject(idOrSlug: string): Subject | undefined {
    return this.store.subjects.find((s) => s.id === idOrSlug || s.slug === idOrSlug);
  }

  public getSections(subjectId: string): Section[] {
    return this.store.sections
      .filter((sec) => sec.subjectId === subjectId)
      .sort((a, b) => a.order - b.order);
  }

  public getSection(idOrSlug: string): Section | undefined {
    return this.store.sections.find((s) => s.id === idOrSlug || s.slug === idOrSlug);
  }

  public getTopics(): Topic[] {
    return this.store.topics;
  }

  public getTopic(idOrSlug: string): Topic | undefined {
    return this.store.topics.find((t) => t.id === idOrSlug || t.slug === idOrSlug);
  }

  public getTopicsBySection(sectionId: string): Topic[] {
    return this.store.topics.filter((t) => t.sectionId === sectionId);
  }

  public getTopicsBySubject(subjectId: string): Topic[] {
    return this.store.topics.filter((t) => t.subjectId === subjectId);
  }

  public getTopicProgress(topicId: string): TopicProgress {
    return this.store.progress[topicId] || { status: 'not_started', isFavorite: false };
  }

  public getFavorites(): Topic[] {
    return this.store.topics.filter((t) => this.store.progress[t.id]?.isFavorite);
  }

  public getRecentlyVisited(): Topic[] {
    const topicMap = new Map(this.store.topics.map((t) => [t.id, t]));
    return this.store.recentlyVisited
      .map((id) => topicMap.get(id))
      .filter((t): t is Topic => Boolean(t));
  }

  public getLastStudiedTopic(): Topic | undefined {
    if (this.store.lastStudiedTopicId) {
      const topic = this.getTopic(this.store.lastStudiedTopicId);
      if (topic) return topic;
    }
    const recent = this.getRecentlyVisited();
    return recent.length > 0 ? recent[0] : this.store.topics[0];
  }

  public calculateSubjectProgress(subjectId: string): { total: number; completed: number; percentage: number } {
    const topics = this.getTopicsBySubject(subjectId);
    if (topics.length === 0) return { total: 0, completed: 0, percentage: 0 };

    const completed = topics.filter((t) => {
      const p = this.store.progress[t.id];
      return p?.status === 'learned';
    }).length;

    const percentage = Math.round((completed / topics.length) * 100);
    return { total: topics.length, completed, percentage };
  }

  // State Updates
  public recordVisit(topicId: string): void {
    const updatedRecent = [topicId, ...this.store.recentlyVisited.filter((id) => id !== topicId)].slice(0, 10);
    const progress = this.store.progress[topicId] || { status: 'not_started', isFavorite: false };
    
    this.saveToStorage({
      ...this.store,
      recentlyVisited: updatedRecent,
      lastStudiedTopicId: topicId,
      progress: {
        ...this.store.progress,
        [topicId]: {
          ...progress,
          lastVisited: new Date().toISOString(),
          revisionCount: (progress.revisionCount || 0) + 1,
        },
      },
    });
  }

  public setTopicStatus(topicId: string, status: StudyStatus): void {
    const current = this.store.progress[topicId] || { status: 'not_started', isFavorite: false };
    this.saveToStorage({
      ...this.store,
      progress: {
        ...this.store.progress,
        [topicId]: {
          ...current,
          status,
        },
      },
    });
  }

  // Auto-save scroll position & reading progress
  public saveTopicScrollProgress(topicId: string, scrollY: number, progressPercentage: number): void {
    try {
      const key = `eng_hub_scroll_${topicId}`;
      const payload = {
        scrollY: Math.round(scrollY),
        progressPercentage: Math.round(progressPercentage),
        lastUpdated: Date.now(),
      };
      localStorage.setItem(key, JSON.stringify(payload));
    } catch (e) {
      console.error('Failed to save scroll position', e);
    }
  }

  public getTopicScrollProgress(topicId: string): { scrollY: number; progressPercentage: number; lastUpdated: number } | null {
    try {
      const key = `eng_hub_scroll_${topicId}`;
      const item = localStorage.getItem(key);
      if (item) {
        return JSON.parse(item);
      }
    } catch (e) {
      console.error('Failed to get scroll position', e);
    }
    return null;
  }

  public toggleFavorite(topicId: string): void {
    const current = this.store.progress[topicId] || { status: 'not_started', isFavorite: false };
    this.saveToStorage({
      ...this.store,
      progress: {
        ...this.store.progress,
        [topicId]: {
          ...current,
          isFavorite: !current.isFavorite,
        },
      },
    });
  }

  public toggleSectionExpanded(sectionId: string): void {
    const currentState = this.store.sectionExpandedState[sectionId] ?? false;
    this.saveToStorage({
      ...this.store,
      sectionExpandedState: {
        ...this.store.sectionExpandedState,
        [sectionId]: !currentState,
      },
    });
  }

  public isSectionExpanded(sectionId: string): boolean {
    return this.store.sectionExpandedState[sectionId] ?? true;
  }

  public toggleQuestionLearned(topicId: string, questionId: string): void {
    const topic = this.getTopic(topicId);
    if (!topic) return;

    const updatedQuestions = topic.interviewQuestions.map((q) =>
      q.id === questionId ? { ...q, learned: !q.learned } : q
    );

    this.updateTopic({
      ...topic,
      interviewQuestions: updatedQuestions,
    });
  }

  public toggleChecklistItem(topicId: string, checklistId: string): void {
    const topic = this.getTopic(topicId);
    if (!topic || !topic.checklist) return;

    const updatedChecklist = topic.checklist.map((item) =>
      item.id === checklistId ? { ...item, checked: !item.checked } : item
    );

    this.updateTopic({
      ...topic,
      checklist: updatedChecklist,
    });
  }

  // Mutations
  public addSubject(subject: Omit<Subject, 'id' | 'order'>): Subject {
    const newSubject: Subject = {
      ...subject,
      id: `subj-${Date.now()}`,
      order: this.store.subjects.length + 1,
    };

    this.saveToStorage({
      ...this.store,
      subjects: [...this.store.subjects, newSubject],
    });

    return newSubject;
  }

  public addSection(section: Omit<Section, 'id' | 'order' | 'topicIds'>): Section {
    const newSection: Section = {
      ...section,
      id: `sec-${Date.now()}`,
      order: this.getSections(section.subjectId).length + 1,
      topicIds: [],
    };

    this.saveToStorage({
      ...this.store,
      sections: [...this.store.sections, newSection],
    });

    return newSection;
  }

  public addTopic(topic: Omit<Topic, 'id'>): Topic {
    const newTopic: Topic = {
      ...topic,
      id: `topic-${Date.now()}`,
      lastUpdated: new Date().toISOString().split('T')[0],
    };

    // Update section topicIds
    const updatedSections = this.store.sections.map((sec) => {
      if (sec.id === topic.sectionId) {
        return {
          ...sec,
          topicIds: [...sec.topicIds, newTopic.id],
        };
      }
      return sec;
    });

    this.saveToStorage({
      ...this.store,
      sections: updatedSections,
      topics: [...this.store.topics, newTopic],
      progress: {
        ...this.store.progress,
        [newTopic.id]: { status: 'not_started', isFavorite: false },
      },
    });

    return newTopic;
  }

  public updateTopic(updatedTopic: Topic): void {
    const topics = this.store.topics.map((t) => (t.id === updatedTopic.id ? updatedTopic : t));
    this.saveToStorage({
      ...this.store,
      topics,
    });
  }

  public deleteTopic(topicId: string): void {
    const topics = this.store.topics.filter((t) => t.id !== topicId);
    const updatedSections = this.store.sections.map((sec) => ({
      ...sec,
      topicIds: sec.topicIds.filter((id) => id !== topicId),
    }));

    const progress = { ...this.store.progress };
    delete progress[topicId];

    this.saveToStorage({
      ...this.store,
      topics,
      sections: updatedSections,
      progress,
      recentlyVisited: this.store.recentlyVisited.filter((id) => id !== topicId),
    });
  }

  public deleteSection(sectionId: string): void {
    // Delete section and all its topics
    const section = this.store.sections.find((s) => s.id === sectionId);
    if (!section) return;

    const topicIdsToDelete = new Set(section.topicIds);
    const updatedTopics = this.store.topics.filter(
      (t) => t.sectionId !== sectionId && !topicIdsToDelete.has(t.id)
    );
    const updatedSections = this.store.sections.filter((s) => s.id !== sectionId);

    const progress = { ...this.store.progress };
    topicIdsToDelete.forEach((id) => {
      delete progress[id];
    });

    this.saveToStorage({
      ...this.store,
      sections: updatedSections,
      topics: updatedTopics,
      progress,
      recentlyVisited: this.store.recentlyVisited.filter((id) => !topicIdsToDelete.has(id)),
    });
  }

  public deleteSubject(subjectId: string): void {
    const sectionsToDelete = this.store.sections.filter((s) => s.subjectId === subjectId);
    const sectionIds = new Set(sectionsToDelete.map((s) => s.id));

    const topicsToDelete = this.store.topics.filter(
      (t) => t.subjectId === subjectId || sectionIds.has(t.sectionId)
    );
    const topicIds = new Set(topicsToDelete.map((t) => t.id));

    const updatedSubjects = this.store.subjects.filter((s) => s.id !== subjectId);
    const updatedSections = this.store.sections.filter((s) => s.subjectId !== subjectId);
    const updatedTopics = this.store.topics.filter(
      (t) => t.subjectId !== subjectId && !sectionIds.has(t.sectionId)
    );

    const progress = { ...this.store.progress };
    topicIds.forEach((id) => {
      delete progress[id];
    });

    this.saveToStorage({
      ...this.store,
      subjects: updatedSubjects,
      sections: updatedSections,
      topics: updatedTopics,
      progress,
      recentlyVisited: this.store.recentlyVisited.filter((id) => !topicIds.has(id)),
    });
  }

  public reorderSubject(subjectId: string, direction: 'up' | 'down'): void {
    const subjects = [...this.store.subjects].sort((a, b) => a.order - b.order);
    const index = subjects.findIndex((s) => s.id === subjectId);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= subjects.length) return;

    const [moved] = subjects.splice(index, 1);
    subjects.splice(targetIndex, 0, moved);

    const updatedSubjects = subjects.map((s, idx) => ({
      ...s,
      order: idx + 1,
    }));

    this.saveToStorage({
      ...this.store,
      subjects: updatedSubjects,
    });
  }

  public reorderSection(subjectId: string, sectionId: string, direction: 'up' | 'down'): void {
    const subjectSections = this.store.sections.filter((s) => s.subjectId === subjectId);
    const index = subjectSections.findIndex((s) => s.id === sectionId);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= subjectSections.length) return;

    // Swap positions
    const [moved] = subjectSections.splice(index, 1);
    subjectSections.splice(targetIndex, 0, moved);

    // Update order property
    const orderMap = new Map(subjectSections.map((s, idx) => [s.id, idx + 1]));

    const updatedSections = this.store.sections.map((sec) => {
      if (orderMap.has(sec.id)) {
        return { ...sec, order: orderMap.get(sec.id)! };
      }
      return sec;
    });

    this.saveToStorage({
      ...this.store,
      sections: updatedSections,
    });
  }

  public reorderTopic(sectionId: string, topicId: string, direction: 'up' | 'down'): void {
    const sectionTopics = this.store.topics.filter((t) => t.sectionId === sectionId);
    const index = sectionTopics.findIndex((t) => t.id === topicId);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sectionTopics.length) return;

    const [moved] = sectionTopics.splice(index, 1);
    sectionTopics.splice(targetIndex, 0, moved);

    // Rebuild topics array preserving order for this section
    const otherTopics = this.store.topics.filter((t) => t.sectionId !== sectionId);
    const updatedTopics = [...otherTopics, ...sectionTopics];

    // Also update section's topicIds array
    const updatedSections = this.store.sections.map((sec) => {
      if (sec.id === sectionId) {
        return {
          ...sec,
          topicIds: sectionTopics.map((t) => t.id),
        };
      }
      return sec;
    });

    this.saveToStorage({
      ...this.store,
      sections: updatedSections,
      topics: updatedTopics,
    });
  }

  public toggleTopicPublished(topicId: string): boolean {
    const topic = this.getTopic(topicId);
    if (!topic) return true;

    // Default is true (published). Toggle to false, or if false toggle to true
    const currentPublished = topic.isPublished !== false;
    const newPublished = !currentPublished;

    this.updateTopic({
      ...topic,
      isPublished: newPublished,
    });

    return newPublished;
  }

  // Backup and Export/Import
  public exportDataAsJSON(): string {
    return JSON.stringify(this.store, null, 2);
  }

  public exportQuestionsAsCSV(): string {
    const rows = [['Subject', 'Section', 'Topic', 'Question', 'Short Answer', 'Detailed Answer']];

    this.store.topics.forEach((topic) => {
      const subject = this.getSubject(topic.subjectId);
      const section = this.getSection(topic.sectionId);

      topic.interviewQuestions.forEach((q) => {
        const clean = (str: string) => `"${str.replace(/"/g, '""').replace(/\n/g, ' ')}"`;
        rows.push([
          clean(subject?.name || ''),
          clean(section?.title || ''),
          clean(topic.title),
          clean(q.question),
          clean(q.shortAnswer),
          clean(q.detailedAnswer),
        ]);
      });
    });

    return rows.map((r) => r.join(',')).join('\n');
  }

  public exportAsMarkdownBundle(): string {
    let md = `# Engineering Knowledge Hub — Notes Export\nGenerated: ${new Date().toISOString()}\n\n`;

    this.store.subjects.forEach((subject) => {
      md += `## Subject: ${subject.name}\n${subject.shortDescription}\n\n`;
      const sections = this.getSections(subject.id);

      sections.forEach((sec) => {
        md += `### Section: ${sec.title}\n\n`;
        const topics = this.getTopicsBySection(sec.id);

        topics.forEach((topic) => {
          md += `#### ${topic.title}\n`;
          md += `**Tags:** ${topic.tags.join(', ')}\n\n`;
          md += `**Definition:** ${topic.quickDefinition}\n\n`;
          md += `**Quick Revision:**\n`;
          topic.quickRevisionBulletPoints.forEach((bp) => {
            md += `- ${bp}\n`;
          });
          md += `\n**Core Notes:**\n${topic.coreConceptMarkdown}\n\n`;

          if (topic.codeExamples && topic.codeExamples.length > 0) {
            topic.codeExamples.forEach((ex) => {
              md += `**Example: ${ex.title}**\n\`\`\`${ex.language}\n${ex.code}\n\`\`\`\n\n`;
            });
          }

          if (topic.interviewQuestions && topic.interviewQuestions.length > 0) {
            md += `**Interview Questions:**\n`;
            topic.interviewQuestions.forEach((iq) => {
              md += `Q: ${iq.question}\n`;
              md += `A: ${iq.shortAnswer}\n\n`;
            });
          }

          md += `---\n\n`;
        });
      });
    });

    return md;
  }

  public importDataFromJSON(jsonString: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(jsonString) as KnowledgeStore;
      if (!parsed.subjects || !parsed.topics || !Array.isArray(parsed.subjects)) {
        return { success: false, message: 'Invalid format: missing subjects or topics array.' };
      }

      this.saveToStorage({
        ...parsed,
        version: 1,
      });

      return { success: true, message: `Successfully imported ${parsed.topics.length} topics and ${parsed.subjects.length} subjects!` };
    } catch (e: any) {
      return { success: false, message: `JSON Parse error: ${e.message}` };
    }
  }

  public resetToDefaultSeed(): void {
    const defaultStore: KnowledgeStore = {
      version: 5,
      subjects: initialSubjects,
      sections: initialSections,
      topics: initialTopics,
      progress: initialProgress,
      recentlyVisited: initialRecentlyVisited,
      lastStudiedTopicId: undefined,
      sectionExpandedState: { 'sec-dotnet-01-history': true },
    };
    this.saveToStorage(defaultStore);
  }

  public async clearAllSectionsAndTopics(): Promise<{ success: boolean; message: string }> {
    const updatedStore: KnowledgeStore = {
      ...this.store,
      sections: [],
      topics: [],
      progress: {},
      recentlyVisited: [],
      lastStudiedTopicId: undefined,
      sectionExpandedState: {},
    };
    this.saveToStorage(updatedStore);
    return await this.pushToSupabase();
  }
}

export const storageService = StorageService.getInstance();
