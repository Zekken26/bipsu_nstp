export const GRADE_BANDS = Object.freeze([
  { minPercent: 95, maxPercent: 100, minNumerical: 1.0, maxNumerical: 1.0, classification: 'EXCELLENT' },
  { minPercent: 90, maxPercent: 94, minNumerical: 1.1, maxNumerical: 1.5, classification: 'OUTSTANDING' },
  { minPercent: 86, maxPercent: 89, minNumerical: 1.6, maxNumerical: 1.9, classification: 'VERY_GOOD' },
  { minPercent: 80, maxPercent: 85, minNumerical: 2.0, maxNumerical: 2.5, classification: 'GOOD' },
  { minPercent: 76, maxPercent: 79, minNumerical: 2.6, maxNumerical: 2.9, classification: 'FAIR' },
  { minPercent: 75, maxPercent: 75, minNumerical: 3.0, maxNumerical: 3.0, classification: 'POOR' },
  { minPercent: 71, maxPercent: 74, minNumerical: 3.1, maxNumerical: 4.0, classification: 'CONDITIONAL' },
  { minPercent: 0, maxPercent: 70, minNumerical: 5.0, maxNumerical: 5.0, classification: 'FAILED' },
]);

export function evaluateGrade(percentGrade, numericalGrade) {
  if (!Number.isInteger(percentGrade) || percentGrade < 0 || percentGrade > 100) {
    const error = new Error('Percent grade must be a whole number between 0 and 100.');
    error.statusCode = 400;
    throw error;
  }
  if (!Number.isFinite(numericalGrade) || Math.round(numericalGrade * 10) !== numericalGrade * 10) {
    const error = new Error('Numerical grade must use one decimal place.');
    error.statusCode = 400;
    throw error;
  }
  const band = GRADE_BANDS.find(({ minPercent, maxPercent }) => percentGrade >= minPercent && percentGrade <= maxPercent);
  if (!band || numericalGrade < band.minNumerical || numericalGrade > band.maxNumerical) {
    const expected = band && (band.minNumerical === band.maxNumerical
      ? band.minNumerical.toFixed(1)
      : `${band.minNumerical.toFixed(1)}-${band.maxNumerical.toFixed(1)}`);
    const error = new Error(`Numerical grade is incompatible with ${percentGrade}%.${expected ? ` Expected ${expected}.` : ''}`);
    error.statusCode = 400;
    throw error;
  }
  return band.classification;
}
