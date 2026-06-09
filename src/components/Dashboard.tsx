"use client";

import { useCallback, useEffect, useState } from "react";
import {
  GraduationCap,
  Upload,
  Calendar,
  UserCheck,
  Calculator,
  Brain,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { SyllabusUpload } from "./SyllabusUpload";
import { StudyPlanView } from "./StudyPlan";
import { AttendanceTracker } from "./AttendanceTracker";
import { MarksCalculator } from "./MarksCalculator";
import { NotesQuiz } from "./NotesQuiz";
import { Badge } from "./ui";
import * as api from "@/lib/api";

type Tab = "syllabus" | "study" | "attendance" | "marks" | "revision";

interface Subject {
  id: string;
  name: string;
  code?: string | null;
  difficulty: number;
  units: { number: number; title: string; topics: { title: string }[] }[];
  importantDates: { title: string; date: string; type: string }[];
}

const tabs: { id: Tab; label: string; icon: typeof Upload }[] = [
  { id: "syllabus", label: "Syllabus", icon: Upload },
  { id: "study", label: "Study Plan", icon: Calendar },
  { id: "attendance", label: "Attendance", icon: UserCheck },
  { id: "marks", label: "Marks", icon: Calculator },
  { id: "revision", label: "Notes & Quiz", icon: Brain },
];

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("syllabus");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [dailyMinutes, setDailyMinutes] = useState(120);
  const [aiEnabled, setAiEnabled] = useState(false);

  const loadData = useCallback(async () => {
    const [subjectsData, settingsData] = await Promise.all([
      api.fetchSubjects(),
      api.fetchSettings(),
    ]);
    setSubjects(subjectsData);
    setDailyMinutes(settingsData.dailyStudyMinutes);
    setAiEnabled(settingsData.aiEnabled);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const upcomingDates = subjects
    .flatMap((s) =>
      s.importantDates.map((d) => ({
        ...d,
        subjectName: s.name,
      }))
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 shadow-lg shadow-brand-600/30">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">AI College Companion</h1>
              <p className="text-xs text-slate-500">Your all-in-one academic assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge color={aiEnabled ? "green" : "amber"}>
              <Sparkles className="mr-1 inline h-3 w-3" />
              {aiEnabled ? "AI Enabled" : "Smart Mode"}
            </Badge>
            {subjects.length > 0 && (
              <Badge color="indigo">
                <BookOpen className="mr-1 inline h-3 w-3" />
                {subjects.length} subject{subjects.length !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6">
        {subjects.length > 0 && (
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Subjects" value={String(subjects.length)} />
            <StatCard
              label="Topics"
              value={String(
                subjects.reduce(
                  (acc, s) => acc + s.units.reduce((a, u) => a + u.topics.length, 0),
                  0
                )
              )}
            />
            <StatCard label="Daily Study" value={`${dailyMinutes} min`} />
            <StatCard
              label="Upcoming"
              value={
                upcomingDates.length > 0
                  ? new Date(upcomingDates[0].date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  : "—"
              }
              sub={
                upcomingDates.length > 0 ? upcomingDates[0].title.slice(0, 30) : undefined
              }
            />
          </div>
        )}

        <nav className="mb-6 flex gap-1 overflow-x-auto rounded-2xl bg-slate-900/60 p-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? "bg-brand-600 text-white shadow-lg shadow-brand-600/25"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <main>
          {activeTab === "syllabus" && <SyllabusUpload onSuccess={loadData} />}
          {activeTab === "study" && (
            <StudyPlanView subjects={subjects} dailyMinutes={dailyMinutes} />
          )}
          {activeTab === "attendance" && <AttendanceTracker subjects={subjects} />}
          {activeTab === "marks" && <MarksCalculator subjects={subjects} />}
          {activeTab === "revision" && <NotesQuiz subjects={subjects} />}
        </main>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="glass rounded-2xl p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-100">{value}</p>
      {sub && <p className="truncate text-xs text-slate-400">{sub}</p>}
    </div>
  );
}
