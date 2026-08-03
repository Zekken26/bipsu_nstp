import prisma from '../../db/prisma.js';

const TEMPLATE_KEY = 'student-profile';

function notFound() {
  const error = new Error('Profile export template version not found.');
  error.statusCode = 404;
  return error;
}

async function audit(tx, actorId, action, detail) {
  await tx.auditLogEntry.create({
    data: { id: crypto.randomUUID(), actor: actorId, action, detail: JSON.stringify(detail) },
  });
}

export async function listProfileTemplates() {
  const versions = await prisma.profileExportTemplate.findMany({
    where: { templateKey: TEMPLATE_KEY },
    orderBy: { version: 'desc' },
  });
  return {
    active: versions.find((version) => version.isActive) || null,
    latestDraft: versions.find((version) => version.status === 'DRAFT') || null,
    versions,
  };
}

export async function createProfileTemplateDraft(actorId, name, configuration) {
  return prisma.$transaction(async (tx) => {
    const latest = await tx.profileExportTemplate.aggregate({
      where: { templateKey: TEMPLATE_KEY },
      _max: { version: true },
    });
    const created = await tx.profileExportTemplate.create({
      data: {
        templateKey: TEMPLATE_KEY,
        name,
        version: (latest._max.version || 0) + 1,
        status: 'DRAFT',
        configuration,
        createdById: actorId,
        updatedById: actorId,
      },
    });
    await audit(tx, actorId, 'PROFILE_TEMPLATE_DRAFT_CREATED', { templateId: created.id, version: created.version });
    return created;
  });
}

export async function publishProfileTemplate(actorId, id) {
  return prisma.$transaction(async (tx) => {
    const draft = await tx.profileExportTemplate.findFirst({ where: { id, templateKey: TEMPLATE_KEY } });
    if (!draft) throw notFound();
    if (draft.status !== 'DRAFT') {
      const error = new Error('Only a draft template can be published.');
      error.statusCode = 409;
      throw error;
    }
    await tx.profileExportTemplate.updateMany({ where: { templateKey: TEMPLATE_KEY, isActive: true }, data: { isActive: false, updatedById: actorId } });
    const published = await tx.profileExportTemplate.update({
      where: { id },
      data: { status: 'PUBLISHED', isActive: true, updatedById: actorId },
    });
    await audit(tx, actorId, 'PROFILE_TEMPLATE_PUBLISHED', { templateId: id, version: published.version });
    return published;
  });
}

export async function activateProfileTemplate(actorId, id) {
  return prisma.$transaction(async (tx) => {
    const version = await tx.profileExportTemplate.findFirst({ where: { id, templateKey: TEMPLATE_KEY, status: 'PUBLISHED' } });
    if (!version) throw notFound();
    await tx.profileExportTemplate.updateMany({ where: { templateKey: TEMPLATE_KEY, isActive: true }, data: { isActive: false, updatedById: actorId } });
    const activated = await tx.profileExportTemplate.update({ where: { id }, data: { isActive: true, updatedById: actorId } });
    await audit(tx, actorId, 'PROFILE_TEMPLATE_ACTIVATED', { templateId: id, version: activated.version });
    return activated;
  });
}

export async function duplicateProfileTemplate(actorId, id) {
  const source = await prisma.profileExportTemplate.findFirst({ where: { id, templateKey: TEMPLATE_KEY } });
  if (!source) throw notFound();
  return createProfileTemplateDraft(actorId, `${source.name} copy`, source.configuration);
}

export async function deleteProfileTemplateDraft(actorId, id) {
  return prisma.$transaction(async (tx) => {
    const version = await tx.profileExportTemplate.findFirst({ where: { id, templateKey: TEMPLATE_KEY } });
    if (!version) throw notFound();
    if (version.status !== 'DRAFT' || version.isActive) {
      const error = new Error('Published or active template versions cannot be deleted.');
      error.statusCode = 409;
      throw error;
    }
    await tx.profileExportTemplate.delete({ where: { id } });
    await audit(tx, actorId, 'PROFILE_TEMPLATE_DRAFT_DELETED', { templateId: id, version: version.version });
    return { id };
  });
}

export async function recordProfileExportEvent(actorId, studentId, format) {
  await prisma.auditLogEntry.create({
    data: {
      id: crypto.randomUUID(),
      actor: actorId,
      action: 'PROFILE_EXPORTED',
      detail: JSON.stringify({ studentId, format }),
    },
  });
  return { recorded: true };
}
