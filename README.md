# AI College Companion

A seamless all-in-one academic assistant for college students. Upload your syllabus, get AI-powered study plans, track attendance, calculate internal marks with what-if scenarios, and generate revision notes & practice quizzes.

## Features

- **Syllabus Upload** — Upload PDF, image, or paste text. AI extracts subjects, units, topics, and important dates.
- **Study Plans** — Personalized daily schedules based on exam dates, topic difficulty, and your available study time.
- **Attendance Tracker** — Log present/absent per class, view percentage, and see how many future classes you must attend to reach your target (e.g. 75%).
- **Marks Calculator** — Add assignments, internals, labs with weights. Simulate what-if scenarios to see what you need to score for a target grade.
- **Notes & Quizzes** — AI generates concise revision notes and mixed quizzes (MCQs, short answers, numericals) per topic.

## Live Demo

**GitHub Pages:** [https://mrupaksai.github.io/AI-college-companinion-/](https://mrupaksai.github.io/AI-college-companinion-/)

### Enable GitHub Pages (one-time — required!)

1. Open **[Repository Settings → Pages](https://github.com/MRupaksai/AI-college-companinion-/settings/pages)**
2. Under **Build and deployment**, set **Source** to **Deploy from a branch**
3. Choose **either** option:
   - **Branch:** `gh-pages` → folder `/ (root)` **(recommended)**, or
   - **Branch:** `main` → folder `/docs`
4. Click **Save**, wait 1–2 minutes, then open the live URL

> If the site shows only the README, Pages is pointing at the wrong branch/folder — use one of the options above.

## Quick Start (Local)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Data is stored in your browser (localStorage) — no database setup required.

## AI Configuration (Optional)

For enhanced AI extraction and generation, set an OpenAI API key in browser localStorage:

```js
// In browser console on the app page:
JSON.parse(localStorage.getItem('ai-college-companion-data')).settings.openaiApiKey = 'sk-your-key';
// Then refresh — or extend Settings UI to add this field
```

Without an API key, the app uses intelligent local parsing and Smart Mode generation.

## Usage Flow

1. **Syllabus** — Upload or paste your syllabus. Review extracted subjects and topics.
2. **Study Plan** — Set daily study minutes and generate your personalized schedule.
3. **Attendance** — Mark each class as present/absent. Adjust target % to see projections.
4. **Marks** — Add mark components (assignments, mid-terms, labs). Enter scores and use what-if analysis.
5. **Notes & Quiz** — Pick a topic, optionally paste notes, and generate revision material.

## Deploy to GitHub Pages

Pushes to `main` automatically deploy via GitHub Actions.

Manual build:
```bash
GITHUB_PAGES=true npm run build:static
```
Output is in the `out/` folder.

## Tech Stack

- Next.js 15 (static export for GitHub Pages)
- TypeScript
- Tailwind CSS
- Browser localStorage
- OpenAI API (optional, client-side)

## Sample Syllabus Format

```
Subject: Data Structures and Algorithms
Unit 1: Introduction
- Arrays and Linked Lists
- Stacks and Queues
Unit 2: Trees
- Binary Search Trees
- AVL Trees

Mid-term Exam: 15/10/2026
Final Exam: 20/12/2026
```
