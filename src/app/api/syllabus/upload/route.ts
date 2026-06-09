import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { extractSyllabusWithAI } from "@/lib/ai";
import { extractTextFromFile, getMimeType } from "@/lib/file-parser";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const textInput = formData.get("text") as string | null;

    let rawText = textInput?.trim() ?? "";

    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const mimeType = file.type || getMimeType(file.name);
      rawText = await extractTextFromFile(buffer, mimeType, file.name);
    }

    if (!rawText || rawText.length < 10) {
      return NextResponse.json(
        { error: "Please provide syllabus text or upload a valid file." },
        { status: 400 }
      );
    }

    await prisma.syllabusUpload.create({
      data: { fileName: file?.name ?? "pasted-text", rawText },
    });

    const extraction = await extractSyllabusWithAI(rawText);

    const createdSubjects = [];

    for (const subj of extraction.subjects) {
      const subject = await prisma.subject.create({
        data: {
          name: subj.name,
          code: subj.code,
          difficulty: subj.difficulty ?? 3,
          units: {
            create: subj.units.map((u) => ({
              number: u.number,
              title: u.title,
              topics: {
                create: u.topics.map((t) => ({ title: t.title })),
              },
            })),
          },
          importantDates: {
            create: (subj.importantDates ?? []).map((d) => ({
              title: d.title,
              date: new Date(d.date),
              type: d.type,
              description: d.description,
            })),
          },
        },
        include: {
          units: { include: { topics: true } },
          importantDates: true,
        },
      });
      createdSubjects.push(subject);
    }

    if (extraction.globalDates?.length) {
      for (const d of extraction.globalDates) {
        await prisma.importantDate.create({
          data: {
            title: d.title,
            date: new Date(d.date),
            type: d.type,
            description: d.description,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      subjects: createdSubjects,
      extractedCount: extraction.subjects.length,
    });
  } catch (error) {
    console.error("Syllabus upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}
