import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { TableOfContents } from './components/layout/TableOfContents';
import { SearchModal } from './components/search/SearchModal';
import { TopicView } from './components/topic/TopicView';
import { SubjectView } from './components/subject/SubjectView';
import { Dashboard } from './components/dashboard/Dashboard';
import { InterviewMode } from './components/interview/InterviewMode';
import { TagView } from './components/tag/TagView';
import { NewSubjectModal } from './components/modals/NewSubjectModal';
import { NewTopicModal } from './components/modals/NewTopicModal';
import { NewSectionModal } from './components/modals/NewSectionModal';
import { UnlockModal } from './components/modals/UnlockModal';
import { storageService } from './services/storageService';
import { useTheme } from './hooks/useTheme';
import { useAuthLock } from './hooks/useAuthLock';
import { SearchResult, Subject, Topic } from './types';

export default function App() {
  const { theme, setTheme } = useTheme();
  const {
    isUnlocked,
    isModalOpen: isUnlockModalOpen,
    errorMsg: unlockErrorMsg,
    openUnlockModal,
    closeUnlockModal,
    unlock,
    lock,
  } = useAuthLock();
  const [, setStoreVersion] = useState(0);

  // Router state
  const [currentRoute, setCurrentRoute] = useState(() => {
    return window.location.hash.replace(/^#\/?/, '') || '';
  });

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNewSubjectModalOpen, setIsNewSubjectModalOpen] = useState(false);
  const [isNewTopicModalOpen, setIsNewTopicModalOpen] = useState(false);
  const [isNewSectionModalOpen, setIsNewSectionModalOpen] = useState(false);
  const [modalDefaultSubjectId, setModalDefaultSubjectId] = useState<string | undefined>(undefined);

  // Subscribe to storage changes
  useEffect(() => {
    const unsubscribe = storageService.subscribe(() => {
      setStoreVersion((v) => v + 1);
    });
    return unsubscribe;
  }, []);

  // Sync hash routing with window
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '');
      setCurrentRoute(hash);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Global Ctrl + K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navigateTo = useCallback((hash: string) => {
    window.location.hash = hash.startsWith('/') ? hash : `/${hash}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Parse current route
  // Examples:
  // '' or 'dashboard' -> Dashboard
  // 'quick-revision' -> Quick Revision
  // 'interview' -> Interview Mode
  // 'interview/:subjectId' -> Interview Mode for subject
  // 'favorites' -> Favorites
  // 'manage' -> Data management
  // 'tags/:tag' -> Tag view
  // 'subjects/:subjectSlug' -> Subject view
  // 'subjects/:subjectSlug/:sectionSlug/:topicSlug' -> Topic view
  // Or direct topic slug/id: ':topicSlugOrId'
  const routeParts = currentRoute.split('/').filter(Boolean);

  const subjects = storageService.getSubjects();

  // Determine active view & target items
  let activeView = 'dashboard';
  let activeTopic: Topic | undefined;
  let activeSubject: Subject | undefined = subjects[0];
  let filterTag: string | undefined;
  let interviewSubjectId: string | undefined;

  if (routeParts.length === 0 || routeParts[0] === 'dashboard') {
    activeView = 'dashboard';
  } else if (routeParts[0] === 'interview') {
    activeView = 'interview';
    interviewSubjectId = routeParts[1];
  } else if (routeParts[0] === 'tags' && routeParts[1]) {
    activeView = 'tag';
    filterTag = decodeURIComponent(routeParts[1]);
  } else if (routeParts[0] === 'subjects' && routeParts[1]) {
    const sub = storageService.getSubject(routeParts[1]);
    if (sub) {
      activeSubject = sub;
      if (routeParts.length >= 4) {
        // e.g. /subjects/dotnet/aspnet-core/middleware
        const topic = storageService.getTopic(routeParts[3]);
        if (topic) {
          activeTopic = topic;
          activeView = 'topic';
        } else {
          activeView = 'subject';
        }
      } else {
        activeView = 'subject';
      }
    } else {
      activeView = 'dashboard';
    }
  } else {
    // Check if the route is a direct topic slug or id
    const topic = storageService.getTopic(routeParts[0]);
    if (topic) {
      activeTopic = topic;
      activeSubject = storageService.getSubject(topic.subjectId) || activeSubject;
      activeView = 'topic';
    } else {
      activeView = 'dashboard';
    }
  }

  // Update document title for SEO & bookmarking
  useEffect(() => {
    if (activeTopic) {
      document.title = `${activeTopic.title} — Engineering Knowledge Hub`;
      storageService.recordVisit(activeTopic.id);
    } else if (activeSubject && activeView === 'subject') {
      document.title = `${activeSubject.name} — Engineering Knowledge Hub`;
    } else if (activeView === 'interview') {
      document.title = `Interview Rehearsal Mode — Engineering Knowledge Hub`;
    } else {
      document.title = `Engineering Knowledge Hub`;
    }
  }, [activeTopic, activeSubject, activeView]);

  const handleSelectSearchResult = (result: SearchResult) => {
    if (result.type === 'subject' && result.subjectId) {
      const sub = storageService.getSubject(result.subjectId);
      if (sub) navigateTo(`subjects/${sub.slug}`);
    } else if (result.topicId) {
      const topic = storageService.getTopic(result.topicId);
      const sub = topic ? storageService.getSubject(topic.subjectId) : null;
      const sec = topic ? storageService.getSection(topic.sectionId) : null;
      if (topic && sub && sec) {
        navigateTo(`subjects/${sub.slug}/${sec.slug}/${topic.slug}`);
      } else if (topic) {
        navigateTo(`${topic.slug}`);
      }
    }
  };

  const handleSelectTopicFromSidebar = (topicId: string) => {
    const topic = storageService.getTopic(topicId);
    if (!topic) return;
    const sub = storageService.getSubject(topic.subjectId);
    const sec = storageService.getSection(topic.sectionId);
    if (sub && sec) {
      navigateTo(`subjects/${sub.slug}/${sec.slug}/${topic.slug}`);
    } else {
      navigateTo(topic.slug);
    }
  };

  const handleSelectSubjectFromSidebar = (subjectId: string) => {
    const sub = storageService.getSubject(subjectId);
    if (sub) {
      navigateTo(`subjects/${sub.slug}`);
    }
  };

  const handleDeleteTopic = (topicId: string) => {
    const topic = storageService.getTopic(topicId);
    storageService.deleteTopic(topicId);
    if (topic) {
      const sub = storageService.getSubject(topic.subjectId);
      if (sub) {
        navigateTo(`subjects/${sub.slug}`);
        return;
      }
    }
    navigateTo('');
  };

  const handleDeleteSubject = (subjectId: string) => {
    storageService.deleteSubject(subjectId);
    navigateTo('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 selection:bg-indigo-500/20">
      {/* Top Navbar */}
      <Navbar
        onOpenSearch={() => setIsSearchOpen(true)}
        activeView={activeView}
        onNavigate={(view) => {
          if (view === 'dashboard') navigateTo('');
          else navigateTo(view);
        }}
        theme={theme}
        onThemeChange={setTheme}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        onOpenNewTopic={() => {
          setModalDefaultSubjectId(activeSubject?.id);
          setIsNewTopicModalOpen(true);
        }}
        onOpenNewSubject={() => setIsNewSubjectModalOpen(true)}
        onOpenNewSection={() => {
          setModalDefaultSubjectId(activeSubject?.id);
          setIsNewSectionModalOpen(true);
        }}
        isUnlocked={isUnlocked}
        onOpenUnlockModal={openUnlockModal}
        onLock={lock}
      />

      {/* Main Layout Container */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        {/* Left Sidebar (Topics & Sections Navigation) */}
        <Sidebar
          subjects={subjects}
          activeSubjectId={activeSubject?.id || subjects[0]?.id || ''}
          activeTopicId={activeTopic?.id}
          onSelectSubject={handleSelectSubjectFromSidebar}
          onSelectTopic={handleSelectTopicFromSidebar}
          onOpenNewTopicModal={() => {
            setModalDefaultSubjectId(activeSubject?.id);
            setIsNewTopicModalOpen(true);
          }}
          onOpenNewSectionModal={() => {
            setModalDefaultSubjectId(activeSubject?.id);
            setIsNewSectionModalOpen(true);
          }}
          onOpenNewSubjectModal={() => setIsNewSubjectModalOpen(true)}
          isOpen={isSidebarOpen}
          onCloseMobile={() => setIsSidebarOpen(false)}
          isUnlocked={isUnlocked}
        />

        {/* Center Main Content Area */}
        <main className="flex-1 min-w-0 py-2 overflow-x-hidden">
          {activeView === 'dashboard' && (
            <Dashboard
              subjects={subjects}
              onSelectSubject={(id) => {
                const sub = storageService.getSubject(id);
                if (sub) navigateTo(`subjects/${sub.slug}`);
              }}
              onSelectTopic={handleSelectTopicFromSidebar}
              onStartInterviewMode={(subId) => {
                if (subId) navigateTo(`interview/${subId}`);
                else navigateTo('interview');
              }}
              onOpenNewSubjectModal={() => setIsNewSubjectModalOpen(true)}
              onOpenNewTopicModal={() => {
                setModalDefaultSubjectId(undefined);
                setIsNewTopicModalOpen(true);
              }}
              isUnlocked={isUnlocked}
            />
          )}

          {activeView === 'subject' && activeSubject && (
            <SubjectView
              subject={activeSubject}
              onSelectTopic={handleSelectTopicFromSidebar}
              onStartInterviewMode={(id) => navigateTo(`interview/${id}`)}
              onOpenNewTopic={(subId) => {
                setModalDefaultSubjectId(subId);
                setIsNewTopicModalOpen(true);
              }}
              onOpenNewSection={(subId) => {
                setModalDefaultSubjectId(subId);
                setIsNewSectionModalOpen(true);
              }}
              isUnlocked={isUnlocked}
              onDeleteSubject={handleDeleteSubject}
            />
          )}

          {activeView === 'topic' && activeTopic && (
            <TopicView
              topic={activeTopic}
              onNavigateToTopic={handleSelectTopicFromSidebar}
              onNavigateToTag={(tag) => navigateTo(`tags/${encodeURIComponent(tag)}`)}
              onNavigateToSubject={(subId) => {
                const sub = storageService.getSubject(subId);
                if (sub) navigateTo(`subjects/${sub.slug}`);
              }}
              isUnlocked={isUnlocked}
              onDeleteTopic={handleDeleteTopic}
            />
          )}

          {activeView === 'interview' && (
            <InterviewMode
              initialSubjectId={interviewSubjectId}
              onOpenTopic={handleSelectTopicFromSidebar}
              subjects={subjects}
            />
          )}

          {activeView === 'tag' && filterTag && (
            <TagView
              tag={filterTag}
              onOpenTopic={handleSelectTopicFromSidebar}
              onBack={() => window.history.back()}
            />
          )}
        </main>

        {/* Right "On This Page" Table of Contents (Topic View only) */}
        {activeView === 'topic' && activeTopic && (
          <TableOfContents
            topic={activeTopic}
            onAddSection={
              isUnlocked && activeTopic.isPublished === false
                ? () => {
                    const el = document.getElementById('sec-core-concept');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                : undefined
            }
          />
        )}
      </div>

      {/* Global Search Modal (Ctrl + K) */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectResult={handleSelectSearchResult}
      />

      {/* Add Subject Modal */}
      <NewSubjectModal
        isOpen={isNewSubjectModalOpen}
        onClose={() => setIsNewSubjectModalOpen(false)}
        onSubjectCreated={(subjectId) => {
          const sub = storageService.getSubject(subjectId);
          if (sub) navigateTo(`subjects/${sub.slug}`);
        }}
      />

      {/* Add Section Modal */}
      <NewSectionModal
        isOpen={isNewSectionModalOpen}
        onClose={() => setIsNewSectionModalOpen(false)}
        subjects={subjects}
        defaultSubjectId={modalDefaultSubjectId || activeSubject?.id}
        onSectionCreated={(sectionId) => {
          const sec = storageService.getSection(sectionId);
          const sub = sec ? storageService.getSubject(sec.subjectId) : null;
          if (sub) navigateTo(`subjects/${sub.slug}`);
        }}
      />

      {/* Add Topic Modal */}
      <NewTopicModal
        isOpen={isNewTopicModalOpen}
        onClose={() => setIsNewTopicModalOpen(false)}
        subjects={subjects}
        defaultSubjectId={modalDefaultSubjectId || activeSubject?.id}
        onTopicCreated={handleSelectTopicFromSidebar}
      />

      {/* Unlock Master Controls Modal */}
      <UnlockModal
        isOpen={isUnlockModalOpen}
        onClose={closeUnlockModal}
        onUnlock={unlock}
        errorMessage={unlockErrorMsg}
      />
    </div>
  );
}
