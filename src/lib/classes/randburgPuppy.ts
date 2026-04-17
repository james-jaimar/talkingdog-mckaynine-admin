/**
 * Randburg Puppy is a session-count class (6 sessions) rather than a date-locked
 * series. Handlers may attend any 6 of the scheduled dates; progression is tracked
 * via class_attendance.performance_grade (1-6) and auto-completes at session 6.
 *
 * Use this helper everywhere we need to branch UI/comms away from the standard
 * "list every scheduled date" treatment.
 */
export const RANDBURG_PUPPY_SESSION_COUNT = 6;

export const RANDBURG_PUPPY_SESSION_COPY =
  "6 sessions — attend any 6 of the available class dates";

export function isRandburgPuppyClass(
  branchName?: string | null,
  classType?: string | null
): boolean {
  if (!branchName || !classType) return false;
  return (
    branchName.toLowerCase().includes("randburg") &&
    classType.toLowerCase() === "puppy"
  );
}
