const DIFFICULTY_MULTIPLIER = {
  1: 0.7,
  2: 0.85,
  3: 1.0,
  4: 1.2,
  5: 1.4,
};

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

export function generateStudyPlan(subjects, dailyMinutes, startDate = new Date()) {
  const allTasks = [];

  for (const subject of subjects) {
    const multiplier = DIFFICULTY_MULTIPLIER[subject.difficulty] ?? 1;
    for (const unit of subject.units) {
      for (const topic of unit.topics) {
        allTasks.push({
          subjectId: subject.id,
          subjectName: subject.name,
          unit: `Unit ${unit.number}: ${unit.title}`,
          topic: topic.title,
          baseMinutes: Math.round(45 * multiplier),
        });
      }
    }
  }

  if (allTasks.length === 0) return [];

  const subjectExamMap = new Map(subjects.map((s) => [s.id, s.examDate]));

  const plan = [];
  let taskIndex = 0;
  let currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0);

  const maxDays = 120;
  let dayCount = 0;

  while (taskIndex < allTasks.length && dayCount < maxDays) {
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek === 0) {
      currentDate = addDays(currentDate, 1);
      continue;
    }

    let remainingMinutes = dailyMinutes;
    const dayTasks = [];

    while (taskIndex < allTasks.length && remainingMinutes >= 20) {
      const task = allTasks[taskIndex];
      const examDate = subjectExamMap.get(task.subjectId);
      if (examDate && currentDate > examDate) {
        taskIndex++;
        continue;
      }

      const minutes = Math.min(task.baseMinutes, remainingMinutes);
      const activity =
        minutes < task.baseMinutes
          ? "Continue studying"
          : taskIndex % 3 === 0
            ? "Practice problems"
            : taskIndex % 3 === 1
              ? "Read & summarize"
              : "Revision";

      dayTasks.push({
        topic: task.topic,
        unit: task.unit,
        minutes,
        activity,
      });

      remainingMinutes -= minutes;
      if (minutes >= task.baseMinutes) taskIndex++;
    }

    if (dayTasks.length > 0) {
      const primarySubject = dayTasks[0];
      plan.push({
        date: formatDate(currentDate),
        subjectId:
          allTasks.find((t) => t.topic === primarySubject.topic)?.subjectId ??
          subjects[0].id,
        subjectName:
          allTasks.find((t) => t.topic === primarySubject.topic)?.subjectName ??
          subjects[0].name,
        tasks: dayTasks,
      });
    }

    currentDate = addDays(currentDate, 1);
    dayCount++;
  }

  return plan;
}

export function parseSyllabusStructure(text) {
  const subjects = [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  let currentSubject = null;
  let currentUnit = null;

  const subjectPattern = /^(?:subject|course|paper)[:\s]+(.+)/i;
  const unitPattern = /^(?:unit|module|chapter)\s*[-.]?\s*(\d+)[:\s.-]*(.+)/i;
  const topicPattern = /^[-•*\d.)\]]+\s*(.+)/;
  const datePattern = /(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{4}[-/]\d{1,2}[-/]\d{1,2})/;

  for (const line of lines) {
    const subjectMatch = line.match(subjectPattern);
    if (subjectMatch) {
      if (currentSubject) subjects.push(currentSubject);
      currentSubject = { name: subjectMatch[1].trim(), units: [] };
      currentUnit = null;
      continue;
    }

    const unitMatch = line.match(unitPattern);
    if (unitMatch) {
      if (!currentSubject) {
        currentSubject = { name: "General", units: [] };
      }
      currentUnit = {
        number: parseInt(unitMatch[1], 10),
        title: unitMatch[2].trim(),
        topics: [],
      };
      currentSubject.units.push(currentUnit);
      continue;
    }

    const topicMatch = line.match(topicPattern);
    if (topicMatch && currentUnit) {
      currentUnit.topics.push({ title: topicMatch[1].trim() });
      continue;
    }

    if (datePattern.test(line) && currentSubject) {
      const dateMatch = line.match(datePattern);
      if (dateMatch) {
        if (!currentSubject.importantDates) currentSubject.importantDates = [];
        currentSubject.importantDates.push({
          title: line.replace(dateMatch[0], "").trim() || "Important date",
          date: normalizeDate(dateMatch[1]),
          type: /exam|test|final/i.test(line)
            ? "exam"
            : /assignment|submit|due/i.test(line)
              ? "assignment"
              : "other",
        });
      }
    }
  }

  if (currentSubject) subjects.push(currentSubject);

  if (subjects.length === 0) {
    const chunks = text.split(/\n\n+/).filter((c) => c.length > 20);
    if (chunks.length > 0) {
      subjects.push({
        name: "Imported Syllabus",
        units: chunks.slice(0, 8).map((chunk, i) => ({
          number: i + 1,
          title: chunk.split("\n")[0].slice(0, 60),
          topics: chunk
            .split("\n")
            .slice(1)
            .filter((t) => t.trim().length > 3)
            .slice(0, 10)
            .map((t) => ({ title: t.trim().replace(/^[-•*\d.]+\s*/, "") })),
        })),
      });
    }
  }

  return subjects;
}

function normalizeDate(dateStr) {
  const parts = dateStr.includes("-") ? dateStr.split("-") : dateStr.split("/");

  if (parts[0].length === 4) {
    return `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
  }
  const [d, m, y] = parts;
  const year = y.length === 2 ? `20${y}` : y;
  return `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}
