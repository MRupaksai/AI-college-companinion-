"use client";

import { useEffect, useState } from "react";
import { UserCheck, UserX, Target } from "lucide-react";
import { Card, Button, Input, Select, Badge, ProgressBar, EmptyState } from "./ui";
import type { AttendanceProjection } from "@/lib/types";

interface Subject {
  id: string;
  name: string;
}

interface AttendanceSummary {
  subjectId: string;
  subjectName: string;
  projection: AttendanceProjection;
}

export function AttendanceTracker({ subjects }: { subjects: Subject[] }) {
  const [summary, setSummary] = useState<AttendanceSummary[]>([]);
  const [target, setTarget] = useState(75);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);

  async function load() {
    const res = await fetch("/api/attendance");
    const data = await res.json();
    setSummary(data.summary);
    setTarget(data.target);
    if (!selectedSubject && data.summary.length > 0) {
      setSelectedSubject(data.summary[0].subjectId);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function markAttendance(present: boolean) {
    if (!selectedSubject) return;
    setLoading(true);
    await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subjectId: selectedSubject, date, present }),
    });
    await load();
    setLoading(false);
  }

  async function updateTarget(newTarget: number) {
    setTarget(newTarget);
    await fetch("/api/attendance", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attendanceTarget: newTarget }),
    });
    await load();
  }

  if (subjects.length === 0) {
    return (
      <EmptyState
        title="No subjects"
        description="Upload a syllabus to start tracking attendance."
      />
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <Card>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600/20">
            <UserCheck className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Attendance Tracker</h2>
            <p className="text-sm text-slate-400">
              Track classes and see how many you need to reach your target
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
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
            label="Class date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <Input
            label="Target attendance %"
            type="number"
            min={50}
            max={100}
            value={target}
            onChange={(e) => updateTarget(parseFloat(e.target.value) || 75)}
          />
        </div>

        <div className="mt-4 flex gap-3">
          <Button onClick={() => markAttendance(true)} disabled={loading}>
            <UserCheck className="h-4 w-4" /> Present
          </Button>
          <Button variant="danger" onClick={() => markAttendance(false)} disabled={loading}>
            <UserX className="h-4 w-4" /> Absent
          </Button>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {summary.map((s) => (
          <Card key={s.subjectId}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-medium text-slate-100">{s.subjectName}</h3>
              <Badge
                color={
                  s.projection.currentPercentage >= target
                    ? "green"
                    : s.projection.currentPercentage >= 60
                      ? "amber"
                      : "red"
                }
              >
                {s.projection.currentPercentage}%
              </Badge>
            </div>

            <ProgressBar value={s.projection.currentPercentage} />

            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
              <div>
                <p className="text-slate-500">Total</p>
                <p className="font-medium text-slate-200">{s.projection.totalClasses}</p>
              </div>
              <div>
                <p className="text-slate-500">Present</p>
                <p className="font-medium text-emerald-400">{s.projection.attended}</p>
              </div>
              <div>
                <p className="text-slate-500">Absent</p>
                <p className="font-medium text-red-400">{s.projection.missed}</p>
              </div>
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-lg bg-slate-900/50 p-3">
              <Target className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
              <p className="text-sm text-slate-300">{s.projection.message}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
