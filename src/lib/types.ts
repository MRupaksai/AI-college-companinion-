export interface ExtractedTopic {
  title: string;
}

export interface ExtractedUnit {
  number: number;
  title: string;
  topics: ExtractedTopic[];
}

export interface ExtractedDate {
  title: string;
  date: string;
  type: "exam" | "assignment" | "holiday" | "other";
  description?: string;
}

export interface ExtractedSubject {
  name: string;
  code?: string;
  difficulty?: number;
  units: ExtractedUnit[];
  importantDates?: ExtractedDate[];
}

export interface SyllabusExtraction {
  subjects: ExtractedSubject[];
  globalDates?: ExtractedDate[];
}

export interface StudyPlanDay {
  date: string;
  subjectId: string;
  subjectName: string;
  tasks: {
    topic: string;
    unit: string;
    minutes: number;
    activity: string;
  }[];
}

export interface QuizQuestion {
  id: string;
  type: "mcq" | "short" | "numerical";
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation?: string;
}

export interface AttendanceProjection {
  currentPercentage: number;
  totalClasses: number;
  attended: number;
  missed: number;
  targetPercentage: number;
  classesNeededIfAttendAll: number | null;
  canReachTarget: boolean;
  message: string;
}

export interface MarksSummary {
  currentPercentage: number;
  completedWeight: number;
  remainingWeight: number;
  components: {
    id: string;
    name: string;
    maxMarks: number;
    obtainedMarks: number | null;
    weight: number;
    contribution: number | null;
  }[];
}

export interface WhatIfResult {
  targetGrade: number;
  currentGrade: number;
  neededOnRemaining: number | null;
  achievable: boolean;
  message: string;
}
