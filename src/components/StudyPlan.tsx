"use client";

import { useState } from "react";
import { Calendar, Clock, RefreshCw } from "lucide-react";
import { Card, Button, Input, Badge, EmptyState, Spinner } from "./ui";
import * as api from "@/lib/api";

interface StudyPlanDay {
  date: string;
  subjectName: string;
  tasks: { topic: string; unit: string; minutes: number; activity: string }[];
}

interface Plan {
  id: string;
  subject: { name: string };
  plan: StudyPlanDay[];
}

export function StudyPlanView({
  subjects,
  dailyMinutes: initialMinutes,
}: {
  subjects: { id: string; name: string }[];
  dailyMinutes: number;
}) {
  const [dailyMinutes, setDailyMinutes] = useState(initialMinutes);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [fullPlan, setFullPlan] = useState<StudyPlanDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      const data = await api.generateStudyPlanApi(dailyMinutes);
      setPlans(data.plans);
      setFullPlan(data.fullPlan);
      setGenerated(true);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to generate plan");
    } finally {
      setLoading(false);
    }
  }

  if (subjects.length === 0) {
    return (
      <EmptyState
        title="No subjects yet"
        description="Upload your syllabus first to generate a personalized study plan."
      />
    );
  }

  const upcoming = fullPlan.slice(0, 14);

  return (
    <div className="space-y-6 animate-slide-up">
      <Card>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600/20">
            <Calendar className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Personalized Study Plan</h2>
            <p className="text-sm text-slate-400">
              Based on syllabus, exam dates, difficulty & your daily time
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <Input
            label="Daily study time (minutes)"
            type="number"
            min={30}
            max={480}
            value={dailyMinutes}
            onChange={(e) => setDailyMinutes(parseInt(e.target.value) || 120)}
            className="w-48"
          />
          <Button onClick={generate} disabled={loading}>
            {loading ? <Spinner /> : <RefreshCw className="h-4 w-4" />}
            Generate Plan
          </Button>
        </div>
      </Card>

      {generated && upcoming.length > 0 && (
        <Card>
          <h3 className="mb-4 font-semibold text-slate-200">
            Next 2 weeks ({fullPlan.length} study days total)
          </h3>
          <div className="space-y-3">
            {upcoming.map((day) => (
              <div key={day.date} className="rounded-xl bg-slate-900/50 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge color="indigo">
                      {new Date(day.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </Badge>
                    <span className="text-sm font-medium text-slate-200">{day.subjectName}</span>
                  </div>
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <Clock className="h-3 w-3" />
                    {day.tasks.reduce((s, t) => s + t.minutes, 0)} min
                  </span>
                </div>
                <div className="space-y-1.5">
                  {day.tasks.map((task, i) => (
                    <div key={i} className="flex items-start justify-between text-sm">
                      <div>
                        <span className="text-slate-300">{task.topic}</span>
                        <span className="ml-2 text-xs text-slate-500">{task.activity}</span>
                      </div>
                      <span className="text-xs text-slate-500">{task.minutes}m</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {generated && plans.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {plans.map((p) => (
            <Card key={p.id}>
              <h4 className="mb-2 font-medium text-brand-300">{p.subject.name}</h4>
              <p className="text-sm text-slate-400">
                {p.plan.length} study days · {p.plan.reduce((s, d) => s + d.tasks.length, 0)} tasks
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
