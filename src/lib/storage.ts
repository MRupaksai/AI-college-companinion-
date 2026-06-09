import { v4 as uuid } from "uuid";
import type { QuizQuestion } from "./types";

const STORAGE_KEY = "ai-college-companion-data";

export interface StoredTopic {
  id: string;
  title: string;
}

export interface StoredUnit {
  id: string;
  number: number;
  title: string;
  topics: StoredTopic[];
}

export interface StoredDate {
  id: string;
  title: string;
  date: string;
  type: string;
  description?: string;
}

export interface StoredSubject {
  id: string;
  name: string;
  code?: string;
  difficulty: number;
  units: StoredUnit[];
  importantDates: StoredDate[];
}

export interface StoredSettings {
  dailyStudyMinutes: number;
  attendanceTarget: number;
  gradeTarget: number;
  openaiApiKey?: string;
}

export interface StoredAttendance {
  id: string;
  subjectId: string;
  date: string;
  present: boolean;
}

export interface StoredMarkComponent {
  id: string;
  subjectId: string;
  name: string;
  maxMarks: number;
  obtainedMarks: number | null;
  weight: number;
}

export interface StoredNote {
  id: string;
  subjectId: string;
  topicTitle: string;
  content: string;
  createdAt: string;
}

export interface StoredQuiz {
  id: string;
  subjectId: string;
  topicTitle: string;
  questions: QuizQuestion[];
  createdAt: string;
}

export interface StoredStudyPlan {
  id: string;
  subjectId: string;
  subjectName: string;
  dailyMinutes: number;
  plan: unknown[];
}

export interface AppData {
  subjects: StoredSubject[];
  settings: StoredSettings;
  syllabusText: string;
  attendance: StoredAttendance[];
  markComponents: StoredMarkComponent[];
  notes: StoredNote[];
  quizzes: StoredQuiz[];
  studyPlans: StoredStudyPlan[];
}

const defaultData = (): AppData => ({
  subjects: [],
  settings: {
    dailyStudyMinutes: 120,
    attendanceTarget: 75,
    gradeTarget: 75,
  },
  syllabusText: "",
  attendance: [],
  markComponents: [],
  notes: [],
  quizzes: [],
  studyPlans: [],
});

function load(): AppData {
  if (typeof window === "undefined") return defaultData();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData();
    return { ...defaultData(), ...JSON.parse(raw) };
  } catch {
    return defaultData();
  }
}

function save(data: AppData): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getData(): AppData {
  return load();
}

export function getSettings(): StoredSettings {
  return load().settings;
}

export function updateSettings(partial: Partial<StoredSettings>): StoredSettings {
  const data = load();
  data.settings = { ...data.settings, ...partial };
  save(data);
  return data.settings;
}

export function getSubjects(): StoredSubject[] {
  return load().subjects;
}

export function addSubjectsFromExtraction(
  subjects: {
    name: string;
    code?: string;
    difficulty?: number;
    units: { number: number; title: string; topics: { title: string }[] }[];
    importantDates?: { title: string; date: string; type: string; description?: string }[];
  }[],
  rawText: string
): StoredSubject[] {
  const data = load();
  data.syllabusText = rawText;

  const created = subjects.map((subj) => ({
    id: uuid(),
    name: subj.name,
    code: subj.code,
    difficulty: subj.difficulty ?? 3,
    units: subj.units.map((u) => ({
      id: uuid(),
      number: u.number,
      title: u.title,
      topics: u.topics.map((t) => ({ id: uuid(), title: t.title })),
    })),
    importantDates: (subj.importantDates ?? []).map((d) => ({
      id: uuid(),
      title: d.title,
      date: d.date,
      type: d.type,
      description: d.description,
    })),
  }));

  data.subjects.push(...created);
  save(data);
  return created;
}

export function getAttendanceRecords(subjectId?: string): StoredAttendance[] {
  const records = load().attendance;
  return subjectId ? records.filter((r) => r.subjectId === subjectId) : records;
}

export function upsertAttendance(
  subjectId: string,
  date: string,
  present: boolean
): StoredAttendance {
  const data = load();
  const existing = data.attendance.find(
    (r) => r.subjectId === subjectId && r.date === date
  );
  if (existing) {
    existing.present = present;
  } else {
    data.attendance.push({ id: uuid(), subjectId, date, present });
  }
  save(data);
  return existing ?? data.attendance[data.attendance.length - 1];
}

export function getMarkComponents(subjectId?: string): StoredMarkComponent[] {
  const items = load().markComponents;
  return subjectId ? items.filter((c) => c.subjectId === subjectId) : items;
}

export function addMarkComponent(component: Omit<StoredMarkComponent, "id">): StoredMarkComponent {
  const data = load();
  const item = { ...component, id: uuid() };
  data.markComponents.push(item);
  save(data);
  return item;
}

export function updateMarkComponent(
  id: string,
  partial: Partial<StoredMarkComponent>
): StoredMarkComponent | null {
  const data = load();
  const item = data.markComponents.find((c) => c.id === id);
  if (!item) return null;
  Object.assign(item, partial);
  save(data);
  return item;
}

export function deleteMarkComponent(id: string): void {
  const data = load();
  data.markComponents = data.markComponents.filter((c) => c.id !== id);
  save(data);
}

export function getNotes(subjectId?: string): StoredNote[] {
  const items = load().notes;
  const filtered = subjectId ? items.filter((n) => n.subjectId === subjectId) : items;
  return filtered.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function addNote(note: Omit<StoredNote, "id" | "createdAt">): StoredNote {
  const data = load();
  const item = { ...note, id: uuid(), createdAt: new Date().toISOString() };
  data.notes.push(item);
  save(data);
  return item;
}

export function getQuizzes(subjectId?: string): StoredQuiz[] {
  const items = load().quizzes;
  const filtered = subjectId ? items.filter((q) => q.subjectId === subjectId) : items;
  return filtered.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function addQuiz(quiz: Omit<StoredQuiz, "id" | "createdAt">): StoredQuiz {
  const data = load();
  const item = { ...quiz, id: uuid(), createdAt: new Date().toISOString() };
  data.quizzes.push(item);
  save(data);
  return item;
}

export function getSyllabusText(): string {
  return load().syllabusText;
}

export function saveStudyPlans(
  plans: StoredStudyPlan[],
  dailyMinutes: number
): void {
  const data = load();
  data.studyPlans = plans;
  data.settings.dailyStudyMinutes = dailyMinutes;
  save(data);
}

export function getStudyPlans(): StoredStudyPlan[] {
  return load().studyPlans;
}
