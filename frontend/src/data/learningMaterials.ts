import { safeJsonParse, type NstpAccount } from './nstpData';

export type MaterialAudience = 'Common Phase' | 'CWTS' | 'LTS' | 'MTS';
export type MaterialCategory = 'YouTube Video' | 'Google Drive Video' | 'Google Drive Document' | 'PDF / Document' | 'Web Resource';
export type MaterialVisibility = 'Draft' | 'Published' | 'Archived';

export type LearningMaterial = {
  id: string;
  facilitatorId: string;
  facilitatorName: string;
  title: string;
  description: string;
  url: string;
  category: MaterialCategory;
  audience: MaterialAudience;
  visibility: MaterialVisibility;
  sessionDate: string;
  speaker: string;
  relatedActivity: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
  overriddenBy?: string;
  moduleId?: string;
  videoLink?: string;
  resourceLink?: string;
  attachmentName?: string;
};

type LegacyMaterial = {
  id: string;
  facilitatorId: string;
  title: string;
  description?: string;
  videoLink?: string;
  resourceLink?: string;
  attachmentName?: string;
  moduleId?: string;
  updatedAt?: string;
};

const MATERIALS_KEY = 'nstp-learning-material-links';
const LEGACY_KEY = (facilitatorId: string) => `nstp-facilitator-materials-${facilitatorId}`;

const DEMO_MATERIALS: LearningMaterial[] = [
  {
    id: 'material-common-orientation-video',
    facilitatorId: 'facilitator-1',
    facilitatorName: 'Dr. Maria Elena Santos',
    title: 'NSTP Orientation: Program Foundations',
    description: 'Recorded orientation introducing the Common Phase, service pathways, and student responsibilities.',
    url: 'https://www.youtube.com/watch?v=ysz5S6PUM-U',
    category: 'YouTube Video',
    audience: 'Common Phase',
    visibility: 'Published',
    sessionDate: '2026-05-04',
    speaker: 'Dr. Maria Elena Santos',
    relatedActivity: 'Orientation reflection journal',
    tags: ['orientation', 'common phase', 'RA 9163'],
    moduleId: 'm1',
    createdAt: new Date('2026-05-01T08:00:00').toISOString(),
    updatedAt: new Date('2026-05-01T08:00:00').toISOString(),
  },
  {
    id: 'material-common-drrm-drive',
    facilitatorId: 'facilitator-1',
    facilitatorName: 'Dr. Maria Elena Santos',
    title: 'Disaster Preparedness Workshop Reference',
    description: 'Google Drive reference document supporting hazard mapping and emergency response activities.',
    url: 'https://drive.google.com/file/d/1A2B3C4D5E6F7G8H9I0jKlmNOPqrstUV/view?usp=sharing',
    category: 'Google Drive Document',
    audience: 'Common Phase',
    visibility: 'Published',
    sessionDate: '2026-05-16',
    speaker: 'DRRM Resource Speaker',
    relatedActivity: 'Community hazard map',
    tags: ['DRRM', 'workshop', 'reference'],
    moduleId: 'm5',
    createdAt: new Date('2026-05-12T08:00:00').toISOString(),
    updatedAt: new Date('2026-05-12T08:00:00').toISOString(),
  },
  {
    id: 'material-cwts-project-guide',
    facilitatorId: 'facilitator-1',
    facilitatorName: 'Dr. Maria Elena Santos',
    title: 'CWTS Community Project Planning Guide',
    description: 'Link-based reference for community profiling, proposal preparation, and field documentation.',
    url: 'https://www.bipsu.edu.ph/',
    category: 'Web Resource',
    audience: 'CWTS',
    visibility: 'Published',
    sessionDate: '2026-05-21',
    speaker: 'Dr. Maria Elena Santos',
    relatedActivity: 'CWTS project proposal',
    tags: ['CWTS', 'proposal', 'community'],
    moduleId: 'm3',
    createdAt: new Date('2026-05-18T08:00:00').toISOString(),
    updatedAt: new Date('2026-05-18T08:00:00').toISOString(),
  },
];

function normalizeLegacy(row: LegacyMaterial, url: string, suffix = ''): LearningMaterial {
  const timestamp = row.updatedAt || new Date().toISOString();
  return {
    id: `${row.id}${suffix}`,
    facilitatorId: row.facilitatorId,
    facilitatorName: row.facilitatorId === 'facilitator-1' ? 'Dr. Maria Elena Santos' : 'Facilitator',
    title: suffix ? `${row.title} - Reference Link` : row.title,
    description: row.description || '',
    url,
    category: url.includes('youtube.com') || url.includes('youtu.be') ? 'YouTube Video' : url.toLowerCase().includes('.pdf') ? 'PDF / Document' : 'Web Resource',
    audience: 'Common Phase',
    visibility: 'Published',
    sessionDate: '',
    speaker: '',
    relatedActivity: '',
    tags: [],
    moduleId: row.moduleId,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function ensureLearningMaterialData() {
  if (typeof window === 'undefined') return;
  const current = safeJsonParse<LearningMaterial[]>(localStorage.getItem(MATERIALS_KEY), []);
  if (current.length) return;

  const legacy = safeJsonParse<LegacyMaterial[]>(localStorage.getItem(LEGACY_KEY('facilitator-1')), []);
  const migrated = legacy.flatMap((row) => {
    const values: LearningMaterial[] = [];
    if (row.videoLink) values.push(normalizeLegacy(row, row.videoLink));
    if (row.resourceLink) values.push(normalizeLegacy(row, row.resourceLink, '-resource'));
    return values;
  });
  localStorage.setItem(MATERIALS_KEY, JSON.stringify(migrated.length ? migrated : DEMO_MATERIALS));
}

export function loadAllLearningMaterials(): LearningMaterial[] {
  if (typeof window === 'undefined') return DEMO_MATERIALS;
  ensureLearningMaterialData();
  return safeJsonParse<LearningMaterial[]>(localStorage.getItem(MATERIALS_KEY), DEMO_MATERIALS);
}

export function saveAllLearningMaterials(materials: LearningMaterial[]) {
  if (typeof window === 'undefined') return;
  // TODO(API): replace link material local persistence with role-scoped backend routes when available.
  localStorage.setItem(MATERIALS_KEY, JSON.stringify(materials));
  window.dispatchEvent(new CustomEvent('nstp-learning-materials-updated'));
}

export function materialsForFacilitator(facilitatorId: string) {
  return loadAllLearningMaterials().filter((material) => material.facilitatorId === facilitatorId);
}

export function saveFacilitatorOwnedMaterials(facilitatorId: string, materials: LearningMaterial[]) {
  const retained = loadAllLearningMaterials().filter((material) => material.facilitatorId !== facilitatorId);
  saveAllLearningMaterials([...materials, ...retained]);
}

export function studentMaterialAudience(user: NstpAccount): MaterialAudience[] {
  if (user.demoStage === 'common' || !user.component) return ['Common Phase'];
  if (user.component === 'CWTS') return ['Common Phase', 'CWTS'];
  if (user.component === 'LTS') return ['Common Phase', 'LTS'];
  return ['Common Phase', 'MTS'];
}

export function publishedMaterialsForStudent(user: NstpAccount) {
  const audiences = studentMaterialAudience(user);
  return loadAllLearningMaterials().filter((material) => material.visibility === 'Published' && audiences.includes(material.audience));
}
