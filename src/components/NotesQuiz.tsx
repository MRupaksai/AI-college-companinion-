"use client";

import { useEffect, useState } from "react";
import { BookOpen, Brain, ChevronDown, ChevronUp, CheckCircle } from "lucide-react";
import { Card, Button, Select, Textarea, Badge, EmptyState, Spinner } from "./ui";
import type { QuizQuestion } from "@/lib/types";

interface Subject {
  id: string;
  name: string;
  units: { topics: { title: string }[] }[];
}

interface Note {
  id: string;
  topicTitle: string;
  content: string;
  subject: { name: string };
}

interface Quiz {
  id: string;
  topicTitle: string;
  questions: QuizQuestion[];
  subject: { name: string };
}

export function NotesQuiz({ subjects }: { subjects: Subject[] }) {
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [sourceText, setSourceText] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedQuiz, setExpandedQuiz] = useState<string | null>(null);
  const [revealedAnswers, setRevealedAnswers] = useState<Set<string>>(new Set());

  const topics =
    subjects
      .find((s) => s.id === selectedSubject)
      ?.units.flatMap((u) => u.topics.map((t) => t.title)) ?? [];

  useEffect(() => {
    if (subjects.length > 0 && !selectedSubject) {
      setSelectedSubject(subjects[0].id);
    }
  }, [subjects, selectedSubject]);

  useEffect(() => {
    if (topics.length > 0 && !selectedTopic) {
      setSelectedTopic(topics[0]);
    }
  }, [topics, selectedTopic]);

  useEffect(() => {
    loadContent();
  }, [selectedSubject]);

  async function loadContent() {
    const query = selectedSubject ? `?subjectId=${selectedSubject}` : "";
    const res = await fetch(`/api/notes${query}`);
    const data = await res.json();
    setNotes(data.notes);
    setQuizzes(data.quizzes);
  }

  async function generate(type: "notes" | "quiz") {
    if (!selectedSubject || !selectedTopic) return;
    setLoading(true);
    try {
      await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId: selectedSubject,
          topicTitle: selectedTopic,
          sourceText,
          type,
        }),
      });
      await loadContent();
    } finally {
      setLoading(false);
    }
  }

  function toggleAnswer(id: string) {
    setRevealedAnswers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (subjects.length === 0) {
    return (
      <EmptyState
        title="No subjects"
        description="Upload a syllabus to generate revision notes and practice quizzes."
      />
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <Card>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600/20">
            <Brain className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">AI Notes & Practice Quizzes</h2>
            <p className="text-sm text-slate-400">
              Concise revision notes and MCQs, short answers & numericals
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Select
            label="Subject"
            value={selectedSubject}
            onChange={(e) => {
              setSelectedSubject(e.target.value);
              setSelectedTopic("");
            }}
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Select>
          <Select
            label="Topic"
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
          >
            {topics.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
        </div>

        <Textarea
          label="Additional notes or source material (optional)"
          rows={3}
          placeholder="Paste your class notes here for better AI-generated content..."
          value={sourceText}
          onChange={(e) => setSourceText(e.target.value)}
          className="mt-4"
        />

        <div className="mt-4 flex gap-3">
          <Button onClick={() => generate("notes")} disabled={loading}>
            {loading ? <Spinner /> : <BookOpen className="h-4 w-4" />}
            Generate Notes
          </Button>
          <Button variant="secondary" onClick={() => generate("quiz")} disabled={loading}>
            {loading ? <Spinner /> : <Brain className="h-4 w-4" />}
            Generate Quiz
          </Button>
        </div>
      </Card>

      {notes.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-200">Revision Notes</h3>
          {notes.map((note) => (
            <Card key={note.id}>
              <div className="mb-3 flex items-center gap-2">
                <Badge color="indigo">{note.subject.name}</Badge>
                <span className="font-medium text-slate-200">{note.topicTitle}</span>
              </div>
              <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap text-slate-300">
                {note.content}
              </div>
            </Card>
          ))}
        </div>
      )}

      {quizzes.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-slate-200">Practice Quizzes</h3>
          {quizzes.map((quiz) => (
            <Card key={quiz.id}>
              <button
                className="flex w-full items-center justify-between text-left"
                onClick={() => setExpandedQuiz(expandedQuiz === quiz.id ? null : quiz.id)}
              >
                <div className="flex items-center gap-2">
                  <Badge color="green">{quiz.subject.name}</Badge>
                  <span className="font-medium text-slate-200">{quiz.topicTitle}</span>
                  <span className="text-sm text-slate-500">
                    ({quiz.questions.length} questions)
                  </span>
                </div>
                {expandedQuiz === quiz.id ? (
                  <ChevronUp className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                )}
              </button>

              {expandedQuiz === quiz.id && (
                <div className="mt-4 space-y-4">
                  {quiz.questions.map((q, i) => (
                    <div key={q.id} className="rounded-xl bg-slate-900/50 p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-400">Q{i + 1}</span>
                        <Badge color="slate">{q.type}</Badge>
                      </div>
                      <p className="text-slate-200">{q.question}</p>

                      {q.options && (
                        <ul className="mt-2 space-y-1">
                          {q.options.map((opt, j) => (
                            <li key={j} className="text-sm text-slate-400">
                              {String.fromCharCode(65 + j)}. {opt}
                            </li>
                          ))}
                        </ul>
                      )}

                      <Button
                        variant="ghost"
                        className="mt-2"
                        onClick={() => toggleAnswer(q.id)}
                      >
                        <CheckCircle className="h-4 w-4" />
                        {revealedAnswers.has(q.id) ? "Hide Answer" : "Show Answer"}
                      </Button>

                      {revealedAnswers.has(q.id) && (
                        <div className="mt-2 rounded-lg bg-emerald-500/10 p-3 text-sm">
                          <p className="text-emerald-300">
                            <strong>Answer:</strong> {q.correctAnswer}
                          </p>
                          {q.explanation && (
                            <p className="mt-1 text-slate-400">{q.explanation}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
