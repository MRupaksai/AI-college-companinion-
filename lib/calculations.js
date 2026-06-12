export function calculateAttendanceProjection(totalClasses, attended, targetPercentage) {
  const missed = totalClasses - attended;
  const currentPercentage =
    totalClasses === 0 ? 0 : Math.round((attended / totalClasses) * 1000) / 10;

  if (totalClasses === 0) {
    return {
      currentPercentage: 0,
      totalClasses: 0,
      attended: 0,
      missed: 0,
      targetPercentage,
      classesNeededIfAttendAll: null,
      canReachTarget: true,
      message: "No classes recorded yet. Attend your classes to build attendance.",
    };
  }

  if (currentPercentage >= targetPercentage) {
    const maxMissable = Math.floor(
      (attended - (targetPercentage / 100) * totalClasses) / (targetPercentage / 100)
    );
    return {
      currentPercentage,
      totalClasses,
      attended,
      missed,
      targetPercentage,
      classesNeededIfAttendAll: 0,
      canReachTarget: true,
      message:
        maxMissable > 0
          ? `You're above ${targetPercentage}%. You can miss up to ${maxMissable} more class(es) and still stay at target.`
          : `You're at or above ${targetPercentage}%. Keep attending to maintain it.`,
    };
  }

  const numerator = targetPercentage * totalClasses - 100 * attended;
  const denominator = 100 - targetPercentage;

  if (denominator <= 0) {
    return {
      currentPercentage,
      totalClasses,
      attended,
      missed,
      targetPercentage,
      classesNeededIfAttendAll: null,
      canReachTarget: false,
      message: "Target percentage is 100%. You must attend all remaining classes.",
    };
  }

  const classesNeeded = Math.ceil(numerator / denominator);

  if (classesNeeded <= 0) {
    return {
      currentPercentage,
      totalClasses,
      attended,
      missed,
      targetPercentage,
      classesNeededIfAttendAll: 0,
      canReachTarget: true,
      message: `You've reached the ${targetPercentage}% target.`,
    };
  }

  return {
    currentPercentage,
    totalClasses,
    attended,
    missed,
    targetPercentage,
    classesNeededIfAttendAll: classesNeeded,
    canReachTarget: true,
    message: `Attend the next ${classesNeeded} class(es) without missing any to reach ${targetPercentage}%.`,
  };
}

export function calculateMarksSummary(components) {
  let currentPercentage = 0;
  let completedWeight = 0;
  let remainingWeight = 0;

  const enriched = components.map((c) => {
    const contribution =
      c.obtainedMarks !== null && c.maxMarks > 0
        ? (c.obtainedMarks / c.maxMarks) * c.weight
        : null;

    if (contribution !== null) {
      currentPercentage += contribution;
      completedWeight += c.weight;
    } else {
      remainingWeight += c.weight;
    }

    return { ...c, contribution };
  });

  return {
    currentPercentage: Math.round(currentPercentage * 100) / 100,
    completedWeight,
    remainingWeight,
    components: enriched,
  };
}

export function calculateWhatIf(components, targetGrade) {
  const summary = calculateMarksSummary(
    components.map((c, i) => ({
      id: String(i),
      name: "",
      ...c,
    }))
  );

  const neededContribution = targetGrade - summary.currentPercentage;

  if (summary.remainingWeight === 0) {
    const achievable = summary.currentPercentage >= targetGrade;
    return {
      targetGrade,
      currentGrade: summary.currentPercentage,
      neededOnRemaining: null,
      achievable,
      message: achievable
        ? `You've already reached your target of ${targetGrade}%.`
        : `All components are graded. Current: ${summary.currentPercentage}% — below target ${targetGrade}%.`,
    };
  }

  const neededOnRemaining = (neededContribution / summary.remainingWeight) * 100;
  const achievable = neededOnRemaining <= 100;

  return {
    targetGrade,
    currentGrade: summary.currentPercentage,
    neededOnRemaining: Math.round(neededOnRemaining * 100) / 100,
    achievable,
    message: achievable
      ? `Score ${Math.round(neededOnRemaining * 100) / 100}% average on remaining components (${summary.remainingWeight}% weight) to reach ${targetGrade}%.`
      : `Target ${targetGrade}% is not achievable. You'd need ${Math.round(neededOnRemaining * 100) / 100}% on remaining work (max 100%).`,
  };
}
