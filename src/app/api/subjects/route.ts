import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const subjects = await prisma.subject.findMany({
    include: {
      units: { include: { topics: true }, orderBy: { number: "asc" } },
      importantDates: { orderBy: { date: "asc" } },
      markComponents: true,
      _count: { select: { attendanceRecords: true, notes: true, quizzes: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(subjects);
}

export async function PATCH(request: Request) {
  const body = await request.json();
  const { id, difficulty, name, code } = body;

  const subject = await prisma.subject.update({
    where: { id },
    data: { difficulty, name, code },
  });

  return NextResponse.json(subject);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prisma.subject.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
