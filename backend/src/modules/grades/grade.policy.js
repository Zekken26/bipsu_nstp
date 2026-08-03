export const GRADE_SCALE_VERSION = 'BIPSU-2026';

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

function gradeError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function isSingleDecimal(value) {
  return Number.isFinite(value) && Math.abs(Math.round(value * 10) - value * 10) < Number.EPSILON * 10;
}

function percentBand(percentGrade) {
  return GRADE_BANDS.find(({ minPercent, maxPercent }) => percentGrade >= minPercent && percentGrade <= maxPercent);
}

function numericalBand(numericalGrade) {
  return GRADE_BANDS.find(({ minNumerical, maxNumerical }) => numericalGrade >= minNumerical && numericalGrade <= maxNumerical);
}

export function resolveGradeInput(inputType, rawValue) {
  const inputValue = Number(rawValue);
  if (inputType === 'PERCENT') {
    if (!Number.isInteger(inputValue) || inputValue < 0 || inputValue > 100) {
      throw gradeError('Percent grade must be a whole number between 0 and 100.');
    }
    const band = percentBand(inputValue);
    let numericalGrade = null;
    if (inputValue >= 95) numericalGrade = 1.0;
    else if (inputValue >= 76) numericalGrade = Number(((105 - inputValue) / 10).toFixed(1));
    else if (inputValue === 75) numericalGrade = 3.0;
    else if (inputValue <= 70) numericalGrade = 5.0;

    return {
      inputType,
      inputValue,
      gradeScaleVersion: GRADE_SCALE_VERSION,
      percentGrade: inputValue,
      numericalGrade,
      classification: band.classification,
      percentEquivalent: `${inputValue}%`,
      numericalEquivalent: numericalGrade === null ? '3.1–4.0' : numericalGrade.toFixed(1),
    };
  }

  if (inputType === 'NUMERICAL') {
    if (!isSingleDecimal(inputValue) || inputValue < 1 || inputValue > 5 || (inputValue > 4 && inputValue < 5)) {
      throw gradeError('Numerical grade must be 1.0–4.0 or 5.0 using one decimal place.');
    }
    const band = numericalBand(inputValue);
    if (!band) throw gradeError('Numerical grade is not part of the approved BiPSU grading scale.');

    let percentGrade = null;
    let percentEquivalent;
    if (inputValue === 1.0) percentEquivalent = '95–100%';
    else if (inputValue >= 1.1 && inputValue <= 2.9) {
      percentGrade = Math.round(105 - inputValue * 10);
      percentEquivalent = `${percentGrade}%`;
    } else if (inputValue === 3.0) {
      percentGrade = 75;
      percentEquivalent = '75%';
    } else if (inputValue >= 3.1 && inputValue <= 4.0) percentEquivalent = '71–74%';
    else percentEquivalent = '70% or below';

    return {
      inputType,
      inputValue,
      gradeScaleVersion: GRADE_SCALE_VERSION,
      percentGrade,
      numericalGrade: inputValue,
      classification: band.classification,
      percentEquivalent,
      numericalEquivalent: inputValue.toFixed(1),
    };
  }

  throw gradeError('Grade input type must be PERCENT or NUMERICAL.');
}

// Retained for validating legacy rows created before single-input conversion.
export function evaluateGrade(percentGrade, numericalGrade) {
  if (!Number.isInteger(percentGrade) || percentGrade < 0 || percentGrade > 100) {
    throw gradeError('Percent grade must be a whole number between 0 and 100.');
  }
  if (!isSingleDecimal(numericalGrade)) throw gradeError('Numerical grade must use one decimal place.');
  const band = percentBand(percentGrade);
  if (!band || numericalGrade < band.minNumerical || numericalGrade > band.maxNumerical) {
    const expected = band && (band.minNumerical === band.maxNumerical
      ? band.minNumerical.toFixed(1)
      : `${band.minNumerical.toFixed(1)}-${band.maxNumerical.toFixed(1)}`);
    throw gradeError(`Numerical grade is incompatible with ${percentGrade}%.${expected ? ` Expected ${expected}.` : ''}`);
  }
  return band.classification;
}
