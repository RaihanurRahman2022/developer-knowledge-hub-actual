import { KnowledgeStore, Subject, Section, Topic, StudyStatus, TopicProgress } from '../types';
import { initialSubjects, initialSections, initialTopics, initialProgress, initialRecentlyVisited } from '../data/seedData';
import { supabase } from './supabaseClient';

const STORAGE_KEY = 'eng_knowledge_hub_store_v3';
const PENDING_SYNC_KEY = 'eng_hub_pending_sync';
const STORE_VERSION = 8;

// Supabase rows (table knowledge_hub_store). Content is large and changes rarely;
// progress is small and changes on every visit, so they are synced separately.
const CONTENT_ROW_ID = 'primary_hub';
const PROGRESS_ROW_ID = 'primary_progress';
const PUSH_DEBOUNCE_MS = 1500;

type SyncPart = 'content' | 'progress';

type ContentData = Pick<KnowledgeStore, 'version' | 'subjects' | 'sections' | 'topics' | 'seededIds'>;
type ProgressData = Pick<KnowledgeStore, 'progress' | 'recentlyVisited' | 'lastStudiedTopicId' | 'sectionExpandedState'>;

export type SyncState = 'unconfigured' | 'loading' | 'synced' | 'pending' | 'syncing' | 'read-only' | 'error';

export interface SyncStatus {
  state: SyncState;
  signedIn: boolean;
  lastSyncedAt?: string;
  message?: string;
}

const DEFAULT_EXPANDED_STATE = { 'sec-dotnet-01-history': true, 'sec-ef-01': true, 'sec-sql-01': true };

function contentOf(store: KnowledgeStore): ContentData {
  return {
    version: store.version,
    subjects: store.subjects,
    sections: store.sections,
    topics: store.topics,
    seededIds: store.seededIds,
  };
}

function progressOf(store: KnowledgeStore): ProgressData {
  return {
    progress: store.progress,
    recentlyVisited: store.recentlyVisited,
    lastStudiedTopicId: store.lastStudiedTopicId,
    sectionExpandedState: store.sectionExpandedState,
  };
}

function createSeedStore(): KnowledgeStore {
  return {
    version: STORE_VERSION,
    subjects: initialSubjects,
    sections: initialSections,
    topics: initialTopics,
    progress: initialProgress,
    recentlyVisited: initialRecentlyVisited,
    lastStudiedTopicId: undefined,
    sectionExpandedState: { ...DEFAULT_EXPANDED_STATE },
    seededIds: allSeedIds(),
  };
}

function allSeedIds(): string[] {
  return [...initialSubjects, ...initialSections, ...initialTopics].map((item) => item.id);
}

/**
 * Adds seed subjects/sections/topics that this store has never received.
 * `seededIds` remembers every seed id already merged, so items the user deleted
 * are not resurrected. Existing items are never overwritten (preserves edits).
 */
function mergeSeedContent(input: KnowledgeStore): { store: KnowledgeStore; changed: boolean } {
  const store: KnowledgeStore = {
    ...input,
    subjects: Array.isArray(input.subjects) ? [...input.subjects] : [],
    sections: Array.isArray(input.sections) ? [...input.sections] : [],
    topics: Array.isArray(input.topics) ? [...input.topics] : [],
    progress: input.progress || {},
    recentlyVisited: Array.isArray(input.recentlyVisited) ? input.recentlyVisited : [],
    sectionExpandedState: input.sectionExpandedState || {},
  };
  let changed = store.version !== STORE_VERSION || !Array.isArray(input.seededIds);
  const seeded = new Set(input.seededIds || []);

  // Obsolete section replaced by sec-dotnet-01-history.
  const legacyIdx = store.sections.findIndex((s) => s.id === 'sec-dotnet-history');
  if (legacyIdx !== -1) {
    store.sections.splice(legacyIdx, 1);
    changed = true;
  }

  const addMissing = <T extends { id: string }>(target: T[], seedItems: T[]) => {
    const existing = new Set(target.map((item) => item.id));
    for (const item of seedItems) {
      if (!existing.has(item.id) && !seeded.has(item.id)) {
        target.push({ ...item });
        changed = true;
      }
    }
  };

  addMissing(store.subjects, initialSubjects);
  addMissing(store.sections, initialSections);
  addMissing(store.topics, initialTopics);

  // Keep section.topicIds in step with topics that point at the section.
  store.sections = store.sections.map((sec) => {
    const missing = store.topics
      .filter((t) => t.sectionId === sec.id && !sec.topicIds.includes(t.id))
      .map((t) => t.id);
    if (missing.length === 0) return sec;
    changed = true;
    return { ...sec, topicIds: [...sec.topicIds, ...missing] };
  });

  store.sections.sort((a, b) => a.order - b.order);
  store.seededIds = Array.from(new Set([...seeded, ...allSeedIds()]));
  store.version = STORE_VERSION;
  return { store, changed };
}

export class StorageService {
  private static instance: StorageService;
  private store: KnowledgeStore;
  private listeners: Set<() => void> = new Set();

  private signedIn = false;
  private pending: Record<SyncPart, boolean>;
  private changeCounter: Record<SyncPart, number> = { content: 0, progress: 0 };
  private pushTimer: ReturnType<typeof setTimeout> | undefined;
  private pushInFlight = false;
  private pushRequestedWhileInFlight = false;
  private syncStatus: SyncStatus;

  private constructor() {
    this.pending = this.loadPendingFlags();
    this.store = this.loadFromStorage();
    this.syncStatus = supabase
      ? { state: 'loading', signedIn: false }
      : {
          state: 'unconfigured',
          signedIn: false,
          message: 'Supabase is not configured (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY). Data is saved in this browser only.',
        };
    this.initCloudSync();
  }

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  // ---------------------------------------------------------------------------
  // Local persistence
  // ---------------------------------------------------------------------------

  private loadFromStorage(): KnowledgeStore {
    try {
      const serialized = localStorage.getItem(STORAGE_KEY);
      if (serialized) {
        const parsed = JSON.parse(serialized) as KnowledgeStore;
        if (parsed && Array.isArray(parsed.subjects) && Array.isArray(parsed.topics)) {
          const { store, changed } = mergeSeedContent(parsed);
          if (changed) {
            this.markPending('content');
            this.writeLocal(store);
          }
          return store;
        }
      }
    } catch (e) {
      console.error('Failed to load knowledge store from localStorage:', e);
    }

    const seedStore = createSeedStore();
    this.writeLocal(seedStore);
    return seedStore;
  }

  private writeLocal(store: KnowledgeStore): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  private loadPendingFlags(): Record<SyncPart, boolean> {
    try {
      const raw = localStorage.getItem(PENDING_SYNC_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return { content: Boolean(parsed.content), progress: Boolean(parsed.progress) };
      }
    } catch {
      // fall through
    }
    return { content: false, progress: false };
  }

  private markPending(part: SyncPart): void {
    this.pending[part] = true;
    this.changeCounter[part]++;
    this.persistPendingFlags();
  }

  private persistPendingFlags(): void {
    try {
      localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(this.pending));
    } catch {
      // ignore
    }
  }

  /** Every mutation goes through here: persists locally, notifies, and schedules a cloud push. */
  private saveToStorage(store: KnowledgeStore): void {
    const prev = this.store;
    const contentChanged =
      prev.subjects !== store.subjects ||
      prev.sections !== store.sections ||
      prev.topics !== store.topics ||
      prev.version !== store.version;
    const progressChanged =
      prev.progress !== store.progress ||
      prev.recentlyVisited !== store.recentlyVisited ||
      prev.lastStudiedTopicId !== store.lastStudiedTopicId ||
      prev.sectionExpandedState !== store.sectionExpandedState;

    if (contentChanged) this.markPending('content');
    if (progressChanged) this.markPending('progress');

    this.store = store;
    this.writeLocal(store);
    this.notifyListeners();
    this.schedulePush();
  }

  // ---------------------------------------------------------------------------
  // Supabase sync
  // ---------------------------------------------------------------------------

  private async initCloudSync(): Promise<void> {
    if (!supabase) return;

    const { data } = await supabase.auth.getSession();
    this.signedIn = Boolean(data.session);

    supabase.auth.onAuthStateChange((event, session) => {
      const wasSignedIn = this.signedIn;
      this.signedIn = Boolean(session);
      if (event === 'SIGNED_IN' && !wasSignedIn) {
        // Owner just signed in: reconcile with the cloud and push anything pending.
        void this.pullFromCloud();
      } else if (event === 'SIGNED_OUT') {
        this.updateSyncStatus();
      }
    });

    await this.pullFromCloud();
  }

  /**
   * Loads both rows from Supabase. Parts with unpushed local changes keep the local copy;
   * everything else is replaced by the cloud copy. Seed content is merged afterwards.
   */
  private async pullFromCloud(): Promise<{ success: boolean; message: string }> {
    if (!supabase) return { success: false, message: 'Supabase is not configured.' };

    this.setSyncStatus({ state: 'loading' });
    const { data: rows, error } = await supabase
      .from('knowledge_hub_store')
      .select('id, data')
      .in('id', [CONTENT_ROW_ID, PROGRESS_ROW_ID]);

    if (error) {
      const message =
        error.code === '42P01'
          ? 'Table knowledge_hub_store does not exist. Run supabase/setup.sql in the Supabase SQL editor.'
          : `Could not load from Supabase: ${error.message}`;
      this.setSyncStatus({ state: 'error', message });
      return { success: false, message };
    }

    const contentRow = rows?.find((r) => r.id === CONTENT_ROW_ID)?.data as (KnowledgeStore & ContentData) | undefined;
    const progressRow = rows?.find((r) => r.id === PROGRESS_ROW_ID)?.data as ProgressData | undefined;

    let next: KnowledgeStore = { ...this.store };

    // Only the signed-in owner can push content, so visitors always follow the cloud copy.
    if (contentRow && Array.isArray(contentRow.subjects) && (!this.pending.content || !this.signedIn)) {
      next = { ...next, ...contentOf(contentRow as KnowledgeStore) };
      this.pending.content = false;
      this.persistPendingFlags();
    } else if (!contentRow) {
      // Empty cloud: seed it from this browser.
      this.markPending('content');
    }

    // Older clients stored progress inside the content row.
    const cloudProgress = progressRow ?? (contentRow?.progress ? progressOf(contentRow as KnowledgeStore) : undefined);
    if (cloudProgress && !this.pending.progress) {
      next = { ...next, ...cloudProgress };
    }
    if (!progressRow) {
      this.markPending('progress');
    }

    const { store, changed } = mergeSeedContent(next);
    if (changed) this.markPending('content');

    this.store = store;
    this.writeLocal(store);
    this.notifyListeners();
    this.updateSyncStatus(new Date().toISOString());
    this.schedulePush(0);
    return { success: true, message: 'Loaded the latest data from Supabase.' };
  }

  private schedulePush(delay = PUSH_DEBOUNCE_MS): void {
    this.updateSyncStatus();
    if (!supabase || !this.signedIn || (!this.pending.content && !this.pending.progress)) return;
    clearTimeout(this.pushTimer);
    this.pushTimer = setTimeout(() => void this.flushPush(), delay);
  }

  private async flushPush(): Promise<{ success: boolean; message: string }> {
    if (!supabase) return { success: false, message: 'Supabase is not configured.' };
    if (!this.signedIn) return { success: false, message: 'Sign in to save changes to Supabase.' };
    if (this.pushInFlight) {
      this.pushRequestedWhileInFlight = true;
      return { success: true, message: 'Sync already in progress.' };
    }

    this.pushInFlight = true;
    this.setSyncStatus({ state: 'syncing' });
    let result = { success: true, message: 'All changes saved to Supabase.' };

    try {
      for (const part of ['content', 'progress'] as SyncPart[]) {
        if (!this.pending[part]) continue;
        const counterAtStart = this.changeCounter[part];
        const payload = part === 'content' ? contentOf(this.store) : progressOf(this.store);
        const { error } = await supabase.from('knowledge_hub_store').upsert({
          id: part === 'content' ? CONTENT_ROW_ID : PROGRESS_ROW_ID,
          data: payload,
          updated_at: new Date().toISOString(),
        });
        if (error) {
          result = { success: false, message: `Supabase rejected the save: ${error.message}` };
          break;
        }
        // Only clear the flag if nothing changed while the request was in flight.
        if (this.changeCounter[part] === counterAtStart) {
          this.pending[part] = false;
          this.persistPendingFlags();
        }
      }
    } catch (e: any) {
      result = { success: false, message: `Sync error: ${e?.message || e}` };
    } finally {
      this.pushInFlight = false;
    }

    if (!result.success) {
      this.setSyncStatus({ state: 'error', message: result.message });
      return result;
    }

    this.updateSyncStatus(new Date().toISOString());
    if (this.pushRequestedWhileInFlight || this.pending.content || this.pending.progress) {
      this.pushRequestedWhileInFlight = false;
      this.schedulePush(0);
    }
    return result;
  }

  private updateSyncStatus(lastSyncedAt?: string): void {
    if (!supabase) return;
    const hasPending = this.pending.content || this.pending.progress;
    let state: SyncState;
    let message: string | undefined;
    if (!this.signedIn) {
      state = 'read-only';
      message = hasPending
        ? 'Not signed in: your changes are kept in this browser only.'
        : 'Viewing data from Supabase. Sign in to edit.';
    } else if (hasPending) {
      state = this.pushInFlight ? 'syncing' : 'pending';
    } else {
      state = 'synced';
      message = 'All changes saved to Supabase.';
    }
    this.setSyncStatus({ state, message, lastSyncedAt: lastSyncedAt ?? this.syncStatus.lastSyncedAt });
  }

  private setSyncStatus(update: Partial<SyncStatus>): void {
    this.syncStatus = { ...this.syncStatus, ...update, signedIn: this.signedIn };
    this.notifyListeners();
  }

  public getSyncStatus(): SyncStatus {
    return this.syncStatus;
  }

  /** Push local data to Supabase now (owner only). */
  public async pushToSupabase(): Promise<{ success: boolean; message: string }> {
    clearTimeout(this.pushTimer);
    this.markPending('content');
    this.markPending('progress');
    return this.flushPush();
  }

  /** Discard unpushed local changes and reload everything from Supabase. */
  public async pullFromSupabase(): Promise<{ success: boolean; message: string }> {
    clearTimeout(this.pushTimer);
    this.pending = { content: false, progress: false };
    this.persistPendingFlags();
    return this.pullFromCloud();
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

      const { store } = mergeSeedContent({
        ...createSeedStore(),
        ...parsed,
      });
      this.saveToStorage(store);

      return { success: true, message: `Successfully imported ${parsed.topics.length} topics and ${parsed.subjects.length} subjects!` };
    } catch (e: any) {
      return { success: false, message: `JSON Parse error: ${e.message}` };
    }
  }

  public resetToDefaultSeed(): void {
    this.saveToStorage(createSeedStore());
  }

  public clearAllSectionsAndTopics(): void {
    this.saveToStorage({
      ...this.store,
      sections: [],
      topics: [],
      progress: {},
      recentlyVisited: [],
      lastStudiedTopicId: undefined,
      sectionExpandedState: {},
    });
  }
}

export const storageService = StorageService.getInstance();
