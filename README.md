# Engineering Knowledge Hub

> A high-performance, personal technical knowledge base and interview-preparation encyclopedia for software engineers.

---

## ⚡ Architecture & Design Principles

The **Engineering Knowledge Hub** combines the strengths of **Notion**, **Developer Documentation** (Stripe/Tailwind style), **Personal Wikis**, and an **Interview Rehearsal Engine**.

### 1. Hierarchical Information Model
```
Subject (e.g. .NET, Go, System Design, SQL)
  └── Section (e.g. ASP.NET Core, Concurrency, Indexing)
        └── Topic (e.g. Dependency Injection, Middleware, MVCC)
              ├── Quick Definition (1-2 clear sentences)
              ├── 30–60 Second Rapid Revision (Pre-interview cheat sheet)
              ├── Core Concepts (Detailed architectural mechanics)
              ├── Syntax Highlighted Code Blocks (with 1-click copy)
              ├── Callouts (Important, Warning, Tip, Danger)
              ├── Deep-Dive Accordions (Expandable scenarios)
              ├── Common Traps & Antipatterns
              ├── Interview Q&A Flashcards (With "What Interviewers Evaluate")
              ├── Checklists (Interactive memory items)
              ├── Official References (Safe external links)
              └── Related Topics (Internal cross-linking)
```

### 2. $0 Cost & Universal Portability
- **$0 Hosting**: Static SPA built with React + Vite + Tailwind CSS.
- **$0 Database**: Supabase (free tier) is the source of truth. The browser keeps a `localStorage` cache so the app loads instantly and works offline; changes sync to Supabase in the background.
- **No Database Lock-in**: Full 1-click export to:
  - **JSON**: Full database and progress backup.
  - **Markdown**: Formatted notes bundle for Obsidian, Notion, or Git.
  - **CSV**: Interview questions and answers for Anki or spreadsheets.

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- npm or yarn

### 1. Installation
```bash
npm install
cp .env.example .env.local   # then fill in your Supabase URL and anon/publishable key
```

### 2. Development Server
Start the local Vite dev server on port 3000:
```bash
npm run dev
```
Open your browser at `http://localhost:3000`.

### 3. Production Build
```bash
npm run build
```
The optimized production bundle will be generated in the `dist/` directory.

---

## ☁️ Supabase Setup (one time)

1. **Create your login:** Supabase Dashboard → Authentication → Users → **Add user** (email + password). This is the account you use to unlock editor mode.
2. **Disable sign-ups:** Authentication → Sign In / Providers → turn off **Allow new users to sign up**.
3. **Create the table and security policies:** open `supabase/setup.sql`, replace `you@example.com` with your login email, and run it in the Supabase SQL Editor.
4. Start the app, click **Locked** in the navbar and sign in. Any pending data (including newly added built-in curriculum) is saved to Supabase automatically. The cloud icon in the navbar shows sync status; `#/manage` has details and manual push/reload.

Everyone can **read** the knowledge base; only your signed-in account can **write** to Supabase. Visitors' study progress stays in their own browser.

---

## 🌐 Free $0 Deployment Options

Because this application is a pure client-side SPA with local-first storage, it can be hosted for **$0 / month** indefinitely on any free tier:

### Option A: Vercel ($0 Free Tier)
1. Push your repository to GitHub.
2. Sign in to [Vercel](https://vercel.com/) and click **Add New Project**.
3. Import your GitHub repository.
4. Framework Preset: **Vite**. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` under Environment Variables (same for every host below).
5. Build Command: `npm run build`.
6. Output Directory: `dist`.
7. Click **Deploy**.

### Option B: Netlify ($0 Free Tier)
1. Sign in to [Netlify](https://www.netlify.com/).
2. Select **Import from Git**.
3. Set Build Command to `npm run build` and Publish Directory to `dist`.
4. Deploy!

### Option C: Firebase Hosting ($0 Spark Free Plan)
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Run `firebase init hosting`:
   - Public directory: `dist`
   - Configure as single-page app: `Yes`
3. Run `npm run build && firebase deploy --only hosting`

### Option D: GitHub Pages ($0 Free)
Use the `gh-pages` npm package or configure GitHub Actions to deploy the `dist/` folder on push to `main`.

---

## 💾 Universal Backup & Restore Instructions

### Exporting your Notes
1. Click the hard drive icon in the navbar (or visit `#/manage`).
2. Choose your format:
   - **Download .JSON**: Saves your entire database including progress marks, custom topics, and star states.
   - **Download .MD**: Saves human-readable Markdown notes.
   - **Download .CSV**: Saves all interview questions and answers.

### Restoring from Backup
1. Sign in, then navigate to `#/manage`.
2. Under **Import Knowledge Backup**, either click **Upload Backup File** to select your `.json` backup or paste raw JSON text into the textarea.
3. Click **Parse & Restore JSON**.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + K` or `Cmd + K` | Open Global Search modal |
| `↑` / `↓` | Navigate search results |
| `Enter` | Select and open topic |
| `Esc` | Close search modal |
| `Print` (`Ctrl + P`) | Print 30-sec revision sheets |
