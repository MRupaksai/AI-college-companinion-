import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateAttendanceProjection } from "@/lib/calculations";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const subjectId = searchParams.get("subjectId");

  const settings = await prisma.settings.findUnique({ where: { id: "default" } });
  const target = settings?.attendanceTarget ?? 75;

  if (subjectId) {
    const records = await prisma.attendanceRecord.findMany({
      where: { subjectId },
      orderBy: { date: "desc" },
    });

    const total = records.length;
    const attended = records.filter((r) => r.present).length;
    const projection = calculateAttendanceProjection(total, attended, target);

    return NextResponse.json({ records, projection });
  }

  const subjects = await prisma.subject.findMany({
    include: { attendanceRecords: true },
    orderBy: { name: "asc" },
  });

  const summary = subjects.map((s) => {
    const total = s.attendanceRecords.length;
    const attended = s.attendanceRecords.filter((r) => r.present).length;
    return {
      subjectId: s.id,
      subjectName: s.name,
      records: s.attendanceRecords,
      projection: calculateAttendanceProjection(total, attended, target),
    };
  });

  return NextResponse.json({ summary, target });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { subjectId, date, present } = body;

  if (!subjectId || !date) {
    return NextResponse.json({ error: "subjectId and date required" }, { status: 400 });
  }

  const record = await prisma.attendanceRecord.upsert({
    where: {
      subjectId_date: {
        subjectId,
        date: new Date(date),
      },
    },
    create: {
      subjectId,
      date: new Date(date),
      present: present ?? true,
    },
    update: { present: present ?? true },
  });

  return NextResponse.json(record);
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { attendanceTarget } = body;

  await prisma.settings.upsert({
    where: { id: "default" },
    create: { id: "default", attendanceTarget },
    update: { attendanceTarget },
  });

  return NextResponse.json({ success: true });
}
