export const GRADE_CONFIRMATION_FEES: Record<string, number> = {
  "Pre-KG": 10000,
  "LKG": 12000,
  "UKG": 12000,
  "Grade 1": 15000,
  "Grade 2": 15000,
};

export const DEFAULT_CONFIRMATION_FEE = 15000;

export function getConfirmationFeeForGrade(gradeName: string): number {
  return GRADE_CONFIRMATION_FEES[gradeName] ?? DEFAULT_CONFIRMATION_FEE;
}
