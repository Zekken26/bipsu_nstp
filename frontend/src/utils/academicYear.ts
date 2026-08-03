const ACADEMIC_YEAR_START_MONTH = 5; // June (zero-based month index)

export const getAcademicYearStart = (date = new Date()) => (
  date.getMonth() >= ACADEMIC_YEAR_START_MONTH ? date.getFullYear() : date.getFullYear() - 1
);

export const formatSchoolYear = (startYear: number) => `SY ${startYear}-${startYear + 1}`;

export const getCurrentSchoolYear = (date = new Date()) => formatSchoolYear(getAcademicYearStart(date));

export const getCurrentAcademicYear = (date = new Date()) => {
  const startYear = getAcademicYearStart(date);
  return `${startYear}-${startYear + 1}`;
};

export const getSchoolYearOptions = (date = new Date(), previousYears = 2) => {
  const currentStart = getAcademicYearStart(date);
  return Array.from({ length: previousYears + 1 }, (_, index) => formatSchoolYear(currentStart - index));
};
