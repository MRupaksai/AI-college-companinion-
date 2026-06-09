import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateNotes, generateQuiz } from "@/lib/ai";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const subjectId = searchParams.get("subjectId");

  const notes = await prisma.note.findMany({
    where: subjectId ? { subjectId } : undefined,
    include: { subject: true },
    orderBy: { createdAt: "desc" },
  });

  const quizzes = await prisma.quiz.findMany({
    where: subjectId ? { subjectId } : undefined,
    include: { subject: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    notes,
    quizzes: quizzes.map((q) => ({
      ...q,
      questions: JSON.parse(q.questionsJson),
    })),
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { subjectId, topicTitle, sourceText, type } = body;

  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    include: { units: { include: { topics: true } } },
  });

  if (!subject) {
    return NextResponse.json({ error: "Subject not found" }, { status: 404 });
  }

  const latestUpload = await prisma.syllabusUpload.findFirst({
    orderBy: { createdAt: "desc" },
  });

  const context =
    sourceText ||
    latestUpload?.rawText ||
    subject.units
      .flatMap((u) => u.topics.map((t) => `${u.title}: ${t.title}`))
      .join("\n");

  if (type === "quiz") {
    const questions = await generateQuiz(subject.name, topicTitle, context);
    const quiz = await prisma.quiz.create({
      data: {
        subjectId,
        topicTitle,
        questionsJson: JSON.stringify(questions),
      },
    });
    return NextResponse.json({ ...quiz, questions });
  }

  const content = await generateNotes(subject.name, topicTitle, context);
  const note = await prisma.note.create({
    data: { subjectId, topicTitle, content },
  });

  return NextResponse.json(note);
}
