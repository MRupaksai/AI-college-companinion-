import { calculateAttendanceProjection, calculateMarksSummary, calculateWhatIf } from "./calculations";
import { extractSyllabusWithAI, generateNotes, generateQuiz, isAIEnabled } from "./client-ai";
import { extractTextFromFile } from "./client-file-parser";
import { generateStudyPlan } from "./study-plan";
import {
  addMarkComponent,
  addNote,
  addQuiz,
  addSubjectsFromExtraction,
  deleteMarkComponent,
  getAttendanceRecords,
  getData,
  getMarkComponents,
  getNotes,
  getQuizzes,
  getSettings,
  getSubjects,
  getSyllabusText,
  saveStudyPlans,
  updateMarkComponent,
  updateSettings,
  upsertAttendance,
} from "./storage";

export async function fetchSubjects() {
  return getSubjects();
}

export async function fetchSettings() {
  const settings = getSettings();
  return { ...settings, aiEnabled: isAIEnabled() };
}

export async function uploadSyllabus(file?: File, text?: string) {
  let rawText = text?.trim() ?? "";

  if (file && file.size > 0) {
    rawText = await extractTextFromFile(file);
  }

  if (!rawText || rawText.length < 10) {
    throw new Error("Please provide syllabus text or upload a valid file.");
  }

  const extraction = await extractSyllabusWithAI(rawText);
  const subjects = addSubjectsFromExtraction(extraction.subjects, rawText);

  return { success: true, subjects, extractedCount: extraction.subjects.length };
}

export async function generateStudyPlanApi(dailyMinutes: number) {
  const subjects = getSubjects();

  if (subjects.length === 0) {
    throw new Error("No subjects found. Upload a syllabus first.");
  }

  updateSettings({ dailyStudyMinutes: dailyMinutes });

  const subjectData = subjects.map((s) => {
    const examDate = s.importantDates.find((d) => d.type === "exam");
    return {
      id: s.id,
      name: s.name,
      difficulty: s.difficulty,
      units: s.units.map((u) => ({
        number: u.number,
        title: u.title,
        topics: u.topics.map((t) => ({ title: t.title })),
      })),
      examDate: examDate ? new Date(examDate.date) : undefined,
    };
  });

  const fullPlan = generateStudyPlan(subjectData, dailyMinutes);

  const plans = subjects
    .map((subject) => {
      const subjectDays = fullPlan.filter((d) => d.subjectId === subject.id);
      if (subjectDays.length === 0) return null;
      return {
        id: subject.id,
        subjectId: subject.id,
        subjectName: subject.name,
        dailyMinutes,
        plan: subjectDays,
        subject: { name: subject.name },
      };
    })
    .filter(Boolean) as {
      id: string;
      subjectId: string;
      subjectName: string;
      dailyMinutes: number;
      plan: typeof fullPlan;
      subject: { name: string };
    }[];

  saveStudyPlans(
    plans.map((p) => ({
      id: p.id,
      subjectId: p.subjectId,
      subjectName: p.subjectName,
      dailyMinutes: p.dailyMinutes,
      plan: p.plan,
    })),
    dailyMinutes
  );

  return { success: true, plans, fullPlan };
}

export async function fetchAttendance(): Promise<{
  summary: {
    subjectId: string;
    subjectName: string;
    records: ReturnType<typeof getAttendanceRecords>;
    projection: ReturnType<typeof calculateAttendanceProjection>;
  }[];
  target: number;
}> {
  const settings = getSettings();
  const target = settings.attendanceTarget;
  const subjects = getSubjects();

  const summary = subjects.map((s) => {
    const records = getAttendanceRecords(s.id);
    const total = records.length;
    const attended = records.filter((r) => r.present).length;
    return {
      subjectId: s.id,
      subjectName: s.name,
      records,
      projection: calculateAttendanceProjection(total, attended, target),
    };
  });

  return { summary, target };
}

export async function markAttendance(subjectId: string, date: string, present: boolean) {
  return upsertAttendance(subjectId, date, present);
}

export async function setAttendanceTarget(attendanceTarget: number) {
  updateSettings({ attendanceTarget });
  return { success: true };
}

export async function fetchMarks(subjectId: string, targetGrade: number) {
  const components = getMarkComponents(subjectId);
  const settings = getSettings();
  const summary = calculateMarksSummary(components);
  const whatIf = calculateWhatIf(components, targetGrade);

  return {
    components,
    summary,
    whatIf,
    gradeTarget: settings.gradeTarget,
  };
}

export async function createMarkComponent(data: {
  subjectId: string;
  name: string;
  maxMarks: string;
  obtainedMarks: string | null;
  weight: string;
}) {
  return addMarkComponent({
    subjectId: data.subjectId,
    name: data.name,
    maxMarks: parseFloat(data.maxMarks),
    obtainedMarks:
      data.obtainedMarks !== null && data.obtainedMarks !== ""
        ? parseFloat(data.obtainedMarks)
        : null,
    weight: parseFloat(data.weight),
  });
}

export async function patchMarkComponent(
  id: string,
  obtainedMarks: string | null
) {
  return updateMarkComponent(id, {
    obtainedMarks:
      obtainedMarks === null || obtainedMarks === ""
        ? null
        : parseFloat(obtainedMarks),
  });
}

export async function removeMarkComponent(id: string) {
  deleteMarkComponent(id);
  return { success: true };
}

export async function fetchNotes(subjectId?: string) {
  const subjects = getSubjects();
  const notes = getNotes(subjectId).map((n) => ({
    ...n,
    subject: { name: subjects.find((s) => s.id === n.subjectId)?.name ?? "" },
  }));
  const quizzes = getQuizzes(subjectId).map((q) => ({
    ...q,
    subject: { name: subjects.find((s) => s.id === q.subjectId)?.name ?? "" },
  }));

  return { notes, quizzes };
}

export async function createNotesOrQuiz(data: {
  subjectId: string;
  topicTitle: string;
  sourceText?: string;
  type: "notes" | "quiz";
}) {
  const subject = getSubjects().find((s) => s.id === data.subjectId);
  if (!subject) throw new Error("Subject not found");

  const context =
    data.sourceText ||
    getSyllabusText() ||
    subject.units
      .flatMap((u) => u.topics.map((t) => `${u.title}: ${t.title}`))
      .join("\n");

  if (data.type === "quiz") {
    const questions = await generateQuiz(subject.name, data.topicTitle, context);
    const quiz = addQuiz({
      subjectId: data.subjectId,
      topicTitle: data.topicTitle,
      questions,
    });
    return { ...quiz, questions };
  }

  const content = await generateNotes(subject.name, data.topicTitle, context);
  return addNote({
    subjectId: data.subjectId,
    topicTitle: data.topicTitle,
    content,
  });
}

export function hasLocalData(): boolean {
  return getData().subjects.length > 0;
}
