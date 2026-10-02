# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install
npm run dev          # Vite dev server on http://localhost:3000 (host 0.0.0.0)
npm run build        # production bundle -> dist/
npm run preview      # serve the built bundle
npm run lint         # type-check only (tsc --noEmit); there is no ESLint
```

There is no test framework or test suite. `npm run lint` is the only automated check, so run it after changes.

Supabase credentials come from `.env.local` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`; see `.env.example`). Without them `supabase` is `null` and the app runs on localStorage only. Table and RLS policies are in `supabase/setup.sql` and are applied by hand in the Supabase SQL editor. Setting `DISABLE_HMR=true` turns off HMR and file watching.

## Architecture

A client-only React 19 + Vite + Tailwind v4 SPA. It is a personal study and interview-prep knowledge base organized as **Subject → Section → Topic** (types are in `src/types/index.ts`).

### State: `StorageService` singleton (`src/services/storageService.ts`)
- All data reads and writes go through the exported `storageService` singleton. It holds one `KnowledgeStore` object (subjects, sections, topics, per-topic progress, recently visited, sidebar expanded state).
- **Supabase is the source of truth**; `localStorage` (`eng_knowledge_hub_store_v3`) is a cache. Table `knowledge_hub_store` has two rows: `primary_hub` holds content (subjects, sections, topics, `seededIds`) and `primary_progress` holds study state (progress, recentlyVisited, lastStudiedTopicId, sectionExpandedState). Older clients kept progress inside `primary_hub`, and that is still read as a fallback.
- `saveToStorage` detects which part changed by comparing references (mutations spread `...this.store` and replace only the arrays they touch, so keep it that way). It sets per-part pending flags (persisted in `eng_hub_pending_sync`) and schedules a debounced push. Pushes run only while signed in, and a pending flag is cleared only if no newer change arrived during the request.
- On startup and on sign-in, `pullFromCloud()` loads both rows. A part with pending local changes keeps the local copy, but only for the signed-in owner; visitors always take cloud content. The seed merge then runs on the result.
- Reactivity is a manual pub/sub. `App.tsx` calls `storageService.subscribe(...)` and bumps a counter to re-render. Components call getters such as `getTopic(idOrSlug)` directly during render. There is no React context or state library.
- Mutations replace the store object and call `saveToStorage`. Follow the existing method pattern so that listeners fire and the Supabase sync runs.
- Persistence is compact. In localStorage and in the `primary_hub` row, an unmodified seed topic is stored as `{ id, _seed: true }` and rehydrated from the bundle by `hydrateTopics()`. "Unmodified" is decided by `topicFingerprint()`, which ignores key order (Postgres jsonb reorders keys) and generated section/block ids. Storing full seed topics pushes the store past localStorage's ~5 MB quota, so keep this in place.
- `mergeSeedContent()` (`STORE_VERSION` = 9) adds any seed subject, section or topic whose id is not in `store.seededIds`, then records every seed id there. New seed content therefore reaches existing data, while seed items the user deleted stay deleted. Existing items are never overwritten, so a change to an *existing* seed topic will not propagate on its own.

### Seed content (`src/data/`)
- Go and NoSQL/MongoDB come from `src/data/outlines/goMongoOutline.md` (imported with `?raw`), parsed by `outlineCurriculum.ts`. Ids derive from subject, position and title, so add new sections or topics at the end to keep existing ids and progress stable.
- `seedData.ts` defines `initialSubjects` and builds `initialSections` / `initialTopics` by concatenating the arrays from each curriculum file (`dotnetHistoryData`, `dotnetCurriculumData`, `efCurriculumData`, `sqlCurriculumData`).
- The curriculum files are very large, generated-style modules (EF ~7k lines, SQL ~9k lines). Each topic's article is stored as one long markdown string (`md_...`) and then `push`ed into the exported array. `articleSections: parseMarkdownToArticleSections(md)` is computed when the module loads. Use targeted Grep/sed rather than reading these files whole.
- Use the ID conventions `subj-<name>`, `sec-<subject>-<NN>`, `top-<subject>-<NN>-<n>-<slug>`. Routes and lookups accept either the id or the slug.

### Article format (`src/utils/`)
- `markdownArticleParser.ts` turns markdown into `ArticleContentSection[]`. It splits on `###` (auto-detects `###` → `##` → `#`) and recognizes code blocks, accordions and interview Q&A blocks. Q&A is detected only in the form `**Q1: ...**` followed by `* **30-Second Summary Answer:**`, `* **Detailed Technical Answer:**` and an optional `* **Interviewer Tip:**`. `exportArticleSectionsToMarkdown` is the inverse.
- `articleTemplate.ts` holds `ARTICLE_MARKDOWN_TEMPLATE` and `getAgentPrompt()`, the canonical numbered-section structure for new articles. New article content should follow it so the parser renders it correctly.

### Routing and views (`src/App.tsx`)
- Hash routing is parsed by hand in `App.tsx`. The routes are `#/` (dashboard), `#/interview[/:subjectId]`, `#/tags/:tag`, `#/subjects/:subjectSlug`, `#/subjects/:subject/:section/:topicSlug`, and a bare `#/:topicSlugOrId`. `#/manage` (sync status, export/import) is only routed and linked in the navbar when signed in. Any route that is not recognized falls back to the dashboard.
- `components/topic/TopicView.tsx` (~2.1k lines) renders and edits topics. `topic/ArticleListener.tsx` is the "Listen" player, built on the browser Web Speech API with no backend. The current sentence is tinted with the CSS Custom Highlight API, and the current word gets a gliding absolutely-positioned marker (`.tts-word-marker`) driven only by `onboundary` events; voices without those events get sentence-only highlighting. It turns the resolved `articleSections` into sentence chunks (code blocks are skipped), and pause is implemented as cancel-and-resume-at-chunk because native `pause()` is unreliable. For read-along, each chunk's words are matched to text nodes inside `#art-sec-<id>`, so the article DOM is never mutated. The floating player is portaled to `body`. Markdown is rendered with `marked` + DOMPurify (`common/MarkdownRenderer.tsx`) and Prism (`topic/CodeBlock.tsx`).

### Edit lock
- "Unlocked" means signed in with Supabase Auth (email/password, `hooks/useAuthLock.ts`). This gates all authoring UI (create, edit, delete, reorder, publish toggle) and is passed down as an `isUnlocked` prop from `App.tsx`. The real enforcement is server-side: RLS allows anyone to read but only the owner's email to write. Topics with `isPublished === false` are visible only when unlocked.
