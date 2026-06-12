import { v4 as uuid } from "uuid";
import { loadFromSupabase, saveToSupabase, isSupabaseEnabled } from "./supabase";

const STORAGE_KEY = "ai-college-companion-data";
let supabaseHydrated = false;

const defaultData = () => ({
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

function load() {
  if (typeof window === "undefined") return defaultData();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData();
    return { ...defaultData(), ...JSON.parse(raw) };
  } catch {
    return defaultData();
  }
}

function save(data) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  if (isSupabaseEnabled()) {
    saveToSupabase(data).catch(() => {});
  }
}

/** Load cloud backup from Supabase into localStorage (once per session) */
export async function hydrateFromSupabase() {
  if (typeof window === "undefined" || supabaseHydrated || !isSupabaseEnabled()) return false;
  supabaseHydrated = true;

  const cloud = await loadFromSupabase();
  if (!cloud || !cloud.subjects) return false;

  const local = load();
  if (local.subjects.length === 0 && cloud.subjects?.length > 0) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...defaultData(), ...cloud }));
    return true;
  }
  return false;
}

export function getData() {
  return load();
}

export function getSettings() {
  return load().settings;
}

export function updateSettings(partial) {
  const data = load();
  data.settings = { ...data.settings, ...partial };
  save(data);
  return data.settings;
}

export function getSubjects() {
  return load().subjects;
}

export function addSubjectsFromExtraction(subjects, rawText) {
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

export function getAttendanceRecords(subjectId) {
  const records = load().attendance;
  return subjectId ? records.filter((r) => r.subjectId === subjectId) : records;
}

export function upsertAttendance(subjectId, date, present) {
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

export function getMarkComponents(subjectId) {
  const items = load().markComponents;
  return subjectId ? items.filter((c) => c.subjectId === subjectId) : items;
}

export function addMarkComponent(component) {
  const data = load();
  const item = { ...component, id: uuid() };
  data.markComponents.push(item);
  save(data);
  return item;
}

export function updateMarkComponent(id, partial) {
  const data = load();
  const item = data.markComponents.find((c) => c.id === id);
  if (!item) return null;
  Object.assign(item, partial);
  save(data);
  return item;
}

export function deleteMarkComponent(id) {
  const data = load();
  data.markComponents = data.markComponents.filter((c) => c.id !== id);
  save(data);
}

export function getNotes(subjectId) {
  const items = load().notes;
  const filtered = subjectId ? items.filter((n) => n.subjectId === subjectId) : items;
  return filtered.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function addNote(note) {
  const data = load();
  const item = { ...note, id: uuid(), createdAt: new Date().toISOString() };
  data.notes.push(item);
  save(data);
  return item;
}

export function getQuizzes(subjectId) {
  const items = load().quizzes;
  const filtered = subjectId ? items.filter((q) => q.subjectId === subjectId) : items;
  return filtered.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function addQuiz(quiz) {
  const data = load();
  const item = { ...quiz, id: uuid(), createdAt: new Date().toISOString() };
  data.quizzes.push(item);
  save(data);
  return item;
}

export function getSyllabusText() {
  return load().syllabusText;
}

export function saveStudyPlans(plans, dailyMinutes) {
  const data = load();
  data.studyPlans = plans;
  data.settings.dailyStudyMinutes = dailyMinutes;
  save(data);
}

export function getStudyPlans() {
  return load().studyPlans;
}
