import OpenAI from "openai";
import type { QuizQuestion, SyllabusExtraction } from "./types";
import { parseSyllabusStructure } from "./study-plan";

function getOpenAI(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY;
  if (!key || key === "your-openai-api-key-here") return null;
  return new OpenAI({ apiKey: key });
}

export async function extractSyllabusWithAI(text: string): Promise<SyllabusExtraction> {
  const openai = getOpenAI();

  if (!openai) {
    const subjects = parseSyllabusStructure(text);
    return { subjects };
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You extract structured syllabus data from college syllabi. Return JSON with this shape:
{
  "subjects": [{
    "name": "string",
    "code": "optional string",
    "difficulty": 1-5,
    "units": [{ "number": 1, "title": "string", "topics": [{ "title": "string" }] }],
    "importantDates": [{ "title": "string", "date": "YYYY-MM-DD", "type": "exam|assignment|holiday|other", "description": "optional" }]
  }],
  "globalDates": [{ "title": "string", "date": "YYYY-MM-DD", "type": "exam|assignment|holiday|other" }]
}
Extract all subjects, units, topics, and dates you can find. Use difficulty 3 as default.`,
        },
        {
          role: "user",
          content: text.slice(0, 12000),
        },
      ],
      temperature: 0.2,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty AI response");
    return JSON.parse(content) as SyllabusExtraction;
  } catch {
    const subjects = parseSyllabusStructure(text);
    return { subjects };
  }
}

export async function generateNotes(
  subjectName: string,
  topicTitle: string,
  sourceText: string
): Promise<string> {
  const openai = getOpenAI();

  if (!openai) {
    return generateMockNotes(subjectName, topicTitle, sourceText);
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Create concise revision notes for college students. Use bullet points, key definitions, formulas, and exam tips. Keep under 400 words.",
        },
        {
          role: "user",
          content: `Subject: ${subjectName}\nTopic: ${topicTitle}\n\nSource material:\n${sourceText.slice(0, 6000)}`,
        },
      ],
      temperature: 0.4,
    });

    return response.choices[0]?.message?.content ?? generateMockNotes(subjectName, topicTitle, sourceText);
  } catch {
    return generateMockNotes(subjectName, topicTitle, sourceText);
  }
}

export async function generateQuiz(
  subjectName: string,
  topicTitle: string,
  sourceText: string
): Promise<QuizQuestion[]> {
  const openai = getOpenAI();

  if (!openai) {
    return generateMockQuiz(subjectName, topicTitle);
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `Generate 5 practice questions as JSON: { "questions": [{ "id": "q1", "type": "mcq|short|numerical", "question": "string", "options": ["A","B","C","D"] (mcq only), "correctAnswer": "string", "explanation": "string" }] }
Mix MCQs, short answers, and numericals based on the topic.`,
        },
        {
          role: "user",
          content: `Subject: ${subjectName}\nTopic: ${topicTitle}\n\n${sourceText.slice(0, 6000)}`,
        },
      ],
      temperature: 0.5,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response");
    const parsed = JSON.parse(content) as { questions: QuizQuestion[] };
    return parsed.questions;
  } catch {
    return generateMockQuiz(subjectName, topicTitle);
  }
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
  const key = process.env.OPENAI_API_KEY;
  return Boolean(key && key !== "your-openai-api-key-here");
}
