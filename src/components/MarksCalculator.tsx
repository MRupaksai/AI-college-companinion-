"use client";

import { useEffect, useState } from "react";
import { Calculator, Plus, Trash2, TrendingUp } from "lucide-react";
import { Card, Button, Input, Select, Badge, ProgressBar, EmptyState } from "./ui";
import type { MarksSummary, WhatIfResult } from "@/lib/types";
import * as api from "@/lib/api";

interface Subject {
  id: string;
  name: string;
}

interface MarkComponent {
  id: string;
  name: string;
  maxMarks: number;
  obtainedMarks: number | null;
  weight: number;
}

export function MarksCalculator({ subjects }: { subjects: Subject[] }) {
  const [selectedSubject, setSelectedSubject] = useState("");
  const [components, setComponents] = useState<MarkComponent[]>([]);
  const [summary, setSummary] = useState<MarksSummary | null>(null);
  const [whatIf, setWhatIf] = useState<WhatIfResult | null>(null);
  const [targetGrade, setTargetGrade] = useState(75);
  const [newComponent, setNewComponent] = useState({
    name: "",
    maxMarks: "100",
    obtainedMarks: "",
    weight: "20",
  });

  useEffect(() => {
    if (subjects.length > 0 && !selectedSubject) {
      setSelectedSubject(subjects[0].id);
    }
  }, [subjects, selectedSubject]);

  useEffect(() => {
    if (selectedSubject) loadMarks();
  }, [selectedSubject, targetGrade]);

  async function loadMarks() {
    const data = await api.fetchMarks(selectedSubject, targetGrade);
    setComponents(data.components);
    setSummary(data.summary);
    setWhatIf(data.whatIf);
    if (data.gradeTarget) setTargetGrade(data.gradeTarget);
  }

  async function addComponent() {
    if (!newComponent.name) return;
    await api.createMarkComponent({
      subjectId: selectedSubject,
      ...newComponent,
      obtainedMarks: newComponent.obtainedMarks || null,
    });
    setNewComponent({ name: "", maxMarks: "100", obtainedMarks: "", weight: "20" });
    loadMarks();
  }

  async function updateComponent(id: string, obtainedMarks: string) {
    await api.patchMarkComponent(id, obtainedMarks === "" ? null : obtainedMarks);
    loadMarks();
  }

  async function deleteComponent(id: string) {
    await api.removeMarkComponent(id);
    loadMarks();
  }

  if (subjects.length === 0) {
    return (
      <EmptyState
        title="No subjects"
        description="Upload a syllabus to start tracking internal marks."
      />
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <Card>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600/20">
            <Calculator className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Internal Marks Calculator</h2>
            <p className="text-sm text-slate-400">
              Track assignments, internals, labs & simulate what-if scenarios
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Select
            label="Subject"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Select>
          <Input
            label="Target grade %"
            type="number"
            min={0}
            max={100}
            value={targetGrade}
            onChange={(e) => setTargetGrade(parseFloat(e.target.value) || 75)}
          />
        </div>
      </Card>

      {summary && (
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-medium text-slate-200">Current Internal Score</h3>
            <Badge color={summary.currentPercentage >= targetGrade ? "green" : "amber"}>
              {summary.currentPercentage}%
            </Badge>
          </div>
          <ProgressBar value={summary.currentPercentage} />
          <p className="mt-2 text-sm text-slate-400">
            {summary.completedWeight}% of total weight graded · {summary.remainingWeight}% remaining
          </p>
        </Card>
      )}

      {whatIf && (
        <Card className="border-brand-500/30">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-brand-400" />
            <div>
              <h3 className="font-medium text-brand-300">What-If Analysis</h3>
              <p className="mt-1 text-sm text-slate-300">{whatIf.message}</p>
              {whatIf.neededOnRemaining !== null && whatIf.achievable && (
                <p className="mt-2 text-lg font-semibold text-slate-100">
                  Need {whatIf.neededOnRemaining}% on remaining work
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      <Card>
        <h3 className="mb-4 font-medium text-slate-200">Mark Components</h3>

        {components.length === 0 ? (
          <p className="text-sm text-slate-400">No components added yet.</p>
        ) : (
          <div className="space-y-3">
            {components.map((c) => (
              <div
                key={c.id}
                className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-900/50 p-3"
              >
                <div className="min-w-[120px] flex-1">
                  <p className="font-medium text-slate-200">{c.name}</p>
                  <p className="text-xs text-slate-500">
                    Max: {c.maxMarks} · Weight: {c.weight}%
                  </p>
                </div>
                <Input
                  type="number"
                  placeholder="Obtained"
                  value={c.obtainedMarks ?? ""}
                  onChange={(e) => updateComponent(c.id, e.target.value)}
                  className="w-24"
                />
                <Button variant="ghost" onClick={() => deleteComponent(c.id)}>
                  <Trash2 className="h-4 w-4 text-red-400" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 border-t border-slate-700 pt-4">
          <h4 className="mb-3 text-sm font-medium text-slate-400">Add Component</h4>
          <div className="grid gap-3 md:grid-cols-4">
            <Input
              placeholder="Name (e.g. Assignment 1)"
              value={newComponent.name}
              onChange={(e) => setNewComponent({ ...newComponent, name: e.target.value })}
            />
            <Input
              type="number"
              placeholder="Max marks"
              value={newComponent.maxMarks}
              onChange={(e) => setNewComponent({ ...newComponent, maxMarks: e.target.value })}
            />
            <Input
              type="number"
              placeholder="Obtained (optional)"
              value={newComponent.obtainedMarks}
              onChange={(e) => setNewComponent({ ...newComponent, obtainedMarks: e.target.value })}
            />
            <Input
              type="number"
              placeholder="Weight %"
              value={newComponent.weight}
              onChange={(e) => setNewComponent({ ...newComponent, weight: e.target.value })}
            />
          </div>
          <Button className="mt-3" onClick={addComponent}>
            <Plus className="h-4 w-4" /> Add Component
          </Button>
        </div>
      </Card>
    </div>
  );
}
