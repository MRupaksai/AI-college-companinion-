# AI College Companion

A seamless all-in-one academic assistant for college students. Upload your syllabus, get AI-powered study plans, track attendance, calculate internal marks with what-if scenarios, and generate revision notes & practice quizzes.

## Features

- **Syllabus Upload** — Upload PDF, image, or paste text. AI extracts subjects, units, topics, and important dates.
- **Study Plans** — Personalized daily schedules based on exam dates, topic difficulty, and your available study time.
- **Attendance Tracker** — Log present/absent per class, view percentage, and see how many future classes you must attend to reach your target (e.g. 75%).
- **Marks Calculator** — Add assignments, internals, labs with weights. Simulate what-if scenarios to see what you need to score for a target grade.
- **Notes & Quizzes** — AI generates concise revision notes and mixed quizzes (MCQs, short answers, numericals) per topic.

## Quick Start

```bash
# Install dependencies
npm install

# Set up database
npm run db:push

# Start development server
npm dev
```

Open [http://localhost:3000](http://localhost:3000).

## AI Configuration (Optional)

For best results, add your OpenAI API key to `.env`:

```
OPENAI_API_KEY=sk-your-key-here
```

Without an API key, the app uses intelligent local parsing and mock AI generation — fully functional for demos and testing.

## Usage Flow

1. **Syllabus** — Upload or paste your syllabus. Review extracted subjects and topics.
2. **Study Plan** — Set daily study minutes and generate your personalized schedule.
3. **Attendance** — Mark each class as present/absent. Adjust target % to see projections.
4. **Marks** — Add mark components (assignments, mid-terms, labs). Enter scores and use what-if analysis.
5. **Notes & Quiz** — Pick a topic, optionally paste notes, and generate revision material.

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Prisma + SQLite
- OpenAI API (optional)

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
