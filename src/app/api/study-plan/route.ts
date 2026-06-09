import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateStudyPlan } from "@/lib/study-plan";

export async function GET() {
  const plans = await prisma.studyPlan.findMany({
    include: { subject: true },
    orderBy: { createdAt: "desc" },
  });

  const parsed = plans.map((p) => ({
    ...p,
    plan: JSON.parse(p.planJson),
  }));

  return NextResponse.json(parsed);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const dailyMinutes = body.dailyMinutes ?? 120;

  await prisma.settings.upsert({
    where: { id: "default" },
    create: { id: "default", dailyStudyMinutes: dailyMinutes },
    update: { dailyStudyMinutes: dailyMinutes },
  });

  const subjects = await prisma.subject.findMany({
    include: {
      units: { include: { topics: true }, orderBy: { number: "asc" } },
      importantDates: true,
    },
  });

  if (subjects.length === 0) {
    return NextResponse.json({ error: "No subjects found. Upload a syllabus first." }, { status: 400 });
  }

  const subjectData = subjects.map((s) => {
    const examDate = s.importantDates.find((d) => d.type === "exam");
    return {
      id: s.id,
      name: s.name,
      difficulty: s.difficulty,
      units: s.units,
      examDate: examDate ? new Date(examDate.date) : undefined,
    };
  });

  const fullPlan = generateStudyPlan(subjectData, dailyMinutes);

  await prisma.studyPlan.deleteMany({});

  const savedPlans = [];
  for (const subject of subjects) {
    const subjectDays = fullPlan.filter((d) => d.subjectId === subject.id);
    if (subjectDays.length === 0) continue;

    const plan = await prisma.studyPlan.create({
      data: {
        subjectId: subject.id,
        dailyMinutes,
        startDate: new Date(subjectDays[0].date),
        endDate: new Date(subjectDays[subjectDays.length - 1].date),
        planJson: JSON.stringify(subjectDays),
      },
      include: { subject: true },
    });
    savedPlans.push({ ...plan, plan: subjectDays });
  }

  return NextResponse.json({
    success: true,
    plans: savedPlans,
    fullPlan,
  });
}
