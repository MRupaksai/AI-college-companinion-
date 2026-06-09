import type { QuizQuestion, SyllabusExtraction } from "./types";
import { parseSyllabusStructure } from "./study-plan";
import { getSettings } from "./storage";

async function callOpenAI(
  messages: { role: string; content: string }[],
  json = false
): Promise<string | null> {
  const key = getSettings().openaiApiKey;
  if (!key || key === "your-openai-api-key-here") return null;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.3,
        ...(json ? { response_format: { type: "json_object" } } : {}),
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

export async function extractSyllabusWithAI(text: string): Promise<SyllabusExtraction> {
  const content = await callOpenAI(
    [
      {
        role: "system",
        content: `Extract syllabus JSON: { "subjects": [{ "name", "code?", "difficulty": 1-5, "units": [{ "number", "title", "topics": [{ "title" }] }], "importantDates": [{ "title", "date": "YYYY-MM-DD", "type": "exam|assignment|holiday|other" }] }], "globalDates": [] }`,
      },
      { role: "user", content: text.slice(0, 12000) },
    ],
    true
  );

  if (content) {
    try {
      return JSON.parse(content) as SyllabusExtraction;
    } catch {
      /* fall through */
    }
  }

  return { subjects: parseSyllabusStructure(text) };
}

export async function generateNotes(
  subjectName: string,
  topicTitle: string,
  sourceText: string
): Promise<string> {
  const content = await callOpenAI([
    {
      role: "system",
      content:
        "Create concise revision notes for college students. Use bullet points, key definitions, formulas, and exam tips. Keep under 400 words.",
    },
    {
      role: "user",
      content: `Subject: ${subjectName}\nTopic: ${topicTitle}\n\nSource material:\n${sourceText.slice(0, 6000)}`,
    },
  ]);

  return content ?? generateMockNotes(subjectName, topicTitle, sourceText);
}

export async function generateQuiz(
  subjectName: string,
  topicTitle: string,
  sourceText: string
): Promise<QuizQuestion[]> {
  const content = await callOpenAI(
    [
      {
        role: "system",
        content: `Generate 5 practice questions as JSON: { "questions": [{ "id": "q1", "type": "mcq|short|numerical", "question": "string", "options": ["A","B","C","D"], "correctAnswer": "string", "explanation": "string" }] }`,
      },
      {
        role: "user",
        content: `Subject: ${subjectName}\nTopic: ${topicTitle}\n\n${sourceText.slice(0, 6000)}`,
      },
    ],
    true
  );

  if (content) {
    try {
      const parsed = JSON.parse(content) as { questions: QuizQuestion[] };
      return parsed.questions;
    } catch {
      /* fall through */
    }
  }

  return generateMockQuiz(subjectName, topicTitle);
}

function generateMockNotes(subject: string, topic: string, source: string): string {
  const lines = source
    .split(/\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 10)
    .slice(0, 8);

  const bullets =
    lines.length > 0
      ? lines.map((l) => `• ${l.slice(0, 120)}`).join("\n")
      : `• Core concepts of ${topic}\n• Key definitions and terminology\n• Important formulas and applications\n• Common exam question patterns`;

  return `## ${topic} — ${subject}

### Key Points
${bullets}

### Revision Tips
• Review this topic in 25-minute focused sessions
• Practice at least 3 problems from past papers
• Connect concepts to ${subject} fundamentals
• Summarize in your own words after reading`;
}

function generateMockQuiz(subject: string, topic: string): QuizQuestion[] {
  return [
    {
      id: "q1",
      type: "mcq",
      question: `Which best describes the main focus of "${topic}" in ${subject}?`,
      options: [
        "Foundational theory and core principles",
        "Unrelated historical background only",
        "Administrative procedures only",
        "None of the above",
      ],
      correctAnswer: "Foundational theory and core principles",
      explanation: "Syllabus topics typically emphasize core theory and principles.",
    },
    {
      id: "q2",
      type: "short",
      question: `Define or explain a key concept from ${topic}.`,
      correctAnswer: "A clear definition covering the essential idea and one example.",
      explanation: "Short answers should be precise with definition + example.",
    },
    {
      id: "q3",
      type: "mcq",
      question: `In ${topic}, which approach is most commonly tested in exams?`,
      options: [
        "Application of concepts to problems",
        "Memorizing dates only",
        "Ignoring prerequisites",
        "Skipping numerical practice",
      ],
      correctAnswer: "Application of concepts to problems",
    },
    {
      id: "q4",
      type: "numerical",
      question: `Solve a standard numerical problem related to ${topic}. Show your steps.`,
      correctAnswer: "Step-by-step solution with correct final answer and units.",
      explanation: "Numericals require formula identification, substitution, and clear working.",
    },
    {
      id: "q5",
      type: "short",
      question: `List two real-world applications of ${topic} in ${subject}.`,
      correctAnswer: "Two valid applications with brief explanation.",
    },
  ];
}

export function isAIEnabled(): boolean {
  const key = getSettings().openaiApiKey;
  return Boolean(key && key !== "your-openai-api-key-here");
}
