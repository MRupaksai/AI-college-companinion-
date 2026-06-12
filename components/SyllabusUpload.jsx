"use client";

import { useState } from "react";
import { Upload, FileText, Sparkles } from "lucide-react";
import { Card, Button, Textarea, Badge, Spinner } from "./ui";
import * as api from "@/lib/api";

export function SyllabusUpload({ onSuccess }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  async function handleUpload(file) {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await api.uploadSyllabus(file, text.trim() || undefined);
      setResult(data.subjects);
      setText("");
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <Card>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600/20">
            <Upload className="h-5 w-5 text-brand-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Upload Syllabus</h2>
            <p className="text-sm text-slate-400">
              PDF, image, or text — AI extracts subjects, units, topics & dates
            </p>
          </div>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`mb-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors ${
            dragOver ? "border-brand-500 bg-brand-500/10" : "border-slate-600 bg-slate-900/40"
          }`}
        >
          <FileText className="mb-3 h-10 w-10 text-slate-500" />
          <p className="mb-2 text-sm text-slate-300">Drag & drop your syllabus here</p>
          <p className="mb-4 text-xs text-slate-500">PDF, PNG, JPG, or TXT</p>
          <label>
            <input
              type="file"
              accept=".pdf,.txt,.png,.jpg,.jpeg,.webp"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
            />
            <span className="cursor-pointer rounded-xl bg-slate-700 px-4 py-2 text-sm hover:bg-slate-600">
              Browse files
            </span>
          </label>
        </div>

        <Textarea
          label="Or paste syllabus text"
          rows={6}
          placeholder={`Subject: Data Structures
Unit 1: Introduction
- Arrays and Linked Lists
- Stacks and Queues
Unit 2: Trees
- Binary Trees
- BST Operations

Exam Date: 15/12/2026`}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <div className="mt-4 flex items-center gap-3">
          <Button onClick={() => handleUpload()} disabled={loading || !text.trim()}>
            {loading ? <Spinner /> : <Sparkles className="h-4 w-4" />}
            Extract with AI
          </Button>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
      </Card>

      {result && (
        <Card>
          <h3 className="mb-4 font-semibold text-emerald-400">
            Extracted {result.length} subject(s)
          </h3>
          <div className="space-y-4">
            {result.map((s) => (
              <div key={s.id} className="rounded-xl bg-slate-900/50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <h4 className="font-medium text-slate-100">{s.name}</h4>
                  {s.code && <Badge>{s.code}</Badge>}
                </div>
                <div className="space-y-2">
                  {s.units.map((u) => (
                    <div key={u.number} className="text-sm">
                      <span className="text-brand-400">Unit {u.number}:</span>{" "}
                      <span className="text-slate-300">{u.title}</span>
                      {u.topics.length > 0 && (
                        <ul className="ml-4 mt-1 list-disc text-slate-400">
                          {u.topics.slice(0, 5).map((t, i) => (
                            <li key={i}>{t.title}</li>
                          ))}
                          {u.topics.length > 5 && (
                            <li className="text-slate-500">+{u.topics.length - 5} more</li>
                          )}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
                {s.importantDates?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {s.importantDates.map((d, i) => (
                      <Badge key={i} color={d.type === "exam" ? "red" : "amber"}>
                        {d.title}: {new Date(d.date).toLocaleDateString()}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
