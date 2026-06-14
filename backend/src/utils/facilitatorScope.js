const BILIRAN_MUNICIPALITIES = ['Almeria', 'Biliran', 'Cabucgayan', 'Caibiran', 'Culaba', 'Kawayan', 'Maripipi', 'Naval'];

export function normalizeComponent(value) {
  const raw = String(value || '').trim();
  const upper = raw.toUpperCase().replace(/\s+/g, '_').replace(/[()]/g, '');
  if (raw === 'CWTS-Coastguard' || upper === 'CWTS_COASTGUARD') return 'CWTS-Coastguard';
  if (raw === 'CWTS-Sunday' || upper === 'CWTS_SUNDAY') return 'CWTS-Sunday';
  if (upper === 'LTS') return 'LTS';
  if (upper === 'MTS' || upper === 'MTS_ARMY' || upper === 'MTS_NAVY' || upper.includes('MTS')) return 'MTS';
  if (upper === 'CWTS') return 'CWTS';
  return raw;
}

const splitScope = (value) => String(value || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean)
  .filter((item) => BILIRAN_MUNICIPALITIES.includes(item));

export function getFacilitatorScope(req) {
  const role = String(req.user?.role || req.headers['x-user-role'] || req.query.role || '').toLowerCase();
  const assigned = splitScope(req.user?.municipalities?.join(',') || req.headers['x-user-municipalities'] || req.query.municipalities);
  const active = String(req.user?.activeMunicipality || req.headers['x-active-municipality'] || req.query.municipality || '').trim();
  const activeMunicipality = BILIRAN_MUNICIPALITIES.includes(active) && assigned.includes(active) ? active : null;

  return {
    isFacilitator: role === 'facilitator' || role === 'speaker' || role === 'instructor',
    component: normalizeComponent(req.user?.component || req.headers['x-user-component'] || req.query.component),
    assignedMunicipalities: assigned,
    activeMunicipality,
  };
}

export function componentFromRecord(record) {
  const direct = record?.component
    || record?.componentName
    || record?.student?.component
    || record?.studentProfile?.component
    || record?.student?.studentProfile?.component
    || record?.section?.component
    || record?.student?.section?.component;

  if (typeof direct === 'string') return normalizeComponent(direct);
  return normalizeComponent(direct?.name || direct?.type);
}

export function municipalityFromRecord(record) {
  const direct = record?.municipality
    || record?.student?.municipality
    || record?.studentProfile?.municipality
    || record?.student?.studentProfile?.municipality
    || record?.section?.municipality
    || record?.student?.section?.municipality
    || record?.groupMunicipality;
  if (BILIRAN_MUNICIPALITIES.includes(direct)) return direct;

  const searchable = [
    record?.section?.name,
    record?.section?.code,
    record?.student?.section?.name,
    record?.student?.section?.code,
    record?.group,
    record?.classGroup,
  ].filter(Boolean).join(' ').toLowerCase();

  return BILIRAN_MUNICIPALITIES.find((municipality) => searchable.includes(municipality.toLowerCase())) || null;
}

export function applyFacilitatorMunicipalityScope(records, req) {
  const scope = getFacilitatorScope(req);
  if (!scope.isFacilitator) return records;
  const allowed = scope.activeMunicipality ? [scope.activeMunicipality] : scope.assignedMunicipalities;
  if (!allowed.length) return [];

  return records.filter((record) => {
    if (scope.component && componentFromRecord(record) !== scope.component) return false;
    const municipality = municipalityFromRecord(record);
    return Boolean(municipality && allowed.includes(municipality));
  });
}
