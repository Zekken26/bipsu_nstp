const BILIRAN_MUNICIPALITIES = ['Almeria', 'Biliran', 'Cabucgayan', 'Caibiran', 'Culaba', 'Kawayan', 'Maripipi', 'Naval'];

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
    assignedMunicipalities: assigned,
    activeMunicipality,
  };
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
    const municipality = municipalityFromRecord(record);
    return Boolean(municipality && allowed.includes(municipality));
  });
}
