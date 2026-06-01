import { listCollection } from '../nstp/nstp.service.js';

function normalizeComponent(value) {
  const raw = String(value || '').toUpperCase();
  if (!raw) return 'COMMON';
  if (raw.includes('ARMY')) return 'MTS';
  if (raw.includes('NAVY')) return 'MTS';
  if (raw.includes('MTS')) return 'MTS';
  if (raw.includes('LTS')) return 'LTS';
  if (raw.includes('CWTS')) return 'CWTS';
  return 'COMMON';
}

function assessmentAudience(assessment) {
  return normalizeComponent(
    assessment.component
    || assessment.phase
    || assessment.module?.component?.name
    || assessment.module?.component?.type
    || assessment.module?.component
  );
}

export async function listAssessments(req) {
  const assessments = await listCollection('assessments');
  if (req?.user?.role !== 'student') return assessments;

  const userComponent = normalizeComponent(req.user.component);
  return assessments.filter((assessment) => {
    const status = String(assessment.status || 'published').toLowerCase();
    if (status !== 'published') return false;
    const audience = assessmentAudience(assessment);
    return audience === 'COMMON' || audience === userComponent;
  });
}
