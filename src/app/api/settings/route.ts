import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAIEnabled } from "@/lib/ai";

export async function GET() {
  const settings = await prisma.settings.upsert({
    where: { id: "default" },
    create: { id: "default" },
    update: {},
  });

  return NextResponse.json({
    ...settings,
    aiEnabled: isAIEnabled(),
  });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();

  const settings = await prisma.settings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      dailyStudyMinutes: body.dailyStudyMinutes ?? 120,
      attendanceTarget: body.attendanceTarget ?? 75,
      gradeTarget: body.gradeTarget ?? 75,
    },
    update: {
      dailyStudyMinutes: body.dailyStudyMinutes,
      attendanceTarget: body.attendanceTarget,
      gradeTarget: body.gradeTarget,
    },
  });

  return NextResponse.json(settings);
}
