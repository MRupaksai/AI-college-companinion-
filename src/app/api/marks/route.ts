import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateMarksSummary, calculateWhatIf } from "@/lib/calculations";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const subjectId = searchParams.get("subjectId");
  const targetGrade = parseFloat(searchParams.get("target") ?? "75");

  const settings = await prisma.settings.findUnique({ where: { id: "default" } });

  if (subjectId) {
    const components = await prisma.markComponent.findMany({
      where: { subjectId },
      orderBy: { name: "asc" },
    });

    const summary = calculateMarksSummary(components);
    const whatIf = calculateWhatIf(components, targetGrade);

    return NextResponse.json({
      components,
      summary,
      whatIf,
      gradeTarget: settings?.gradeTarget ?? 75,
    });
  }

  const subjects = await prisma.subject.findMany({
    include: { markComponents: true },
    orderBy: { name: "asc" },
  });

  const summary = subjects.map((s) => ({
    subjectId: s.id,
    subjectName: s.name,
    ...calculateMarksSummary(s.markComponents),
  }));

  return NextResponse.json({
    summary,
    gradeTarget: settings?.gradeTarget ?? 75,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { subjectId, name, maxMarks, obtainedMarks, weight } = body;

  const component = await prisma.markComponent.create({
    data: {
      subjectId,
      name,
      maxMarks: parseFloat(maxMarks),
      obtainedMarks: obtainedMarks !== null && obtainedMarks !== "" ? parseFloat(obtainedMarks) : null,
      weight: parseFloat(weight),
    },
  });

  return NextResponse.json(component);
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();

  if (body.gradeTarget !== undefined) {
    await prisma.settings.upsert({
      where: { id: "default" },
      create: { id: "default", gradeTarget: body.gradeTarget },
      update: { gradeTarget: body.gradeTarget },
    });
    return NextResponse.json({ success: true });
  }

  const { id, name, maxMarks, obtainedMarks, weight } = body;
  const component = await prisma.markComponent.update({
    where: { id },
    data: {
      name,
      maxMarks: maxMarks !== undefined ? parseFloat(maxMarks) : undefined,
      obtainedMarks:
        obtainedMarks !== undefined
          ? obtainedMarks === null || obtainedMarks === ""
            ? null
            : parseFloat(obtainedMarks)
          : undefined,
      weight: weight !== undefined ? parseFloat(weight) : undefined,
    },
  });

  return NextResponse.json(component);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prisma.markComponent.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
