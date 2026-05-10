import { getCached, invalidateKeys, setCached } from '../../cache/cacheStore.js';
import { publishEvent } from '../events/events.service.js';
import { getModule, listModules as listMockModules, updateModule } from '../../data/mock/mockDb.js';

export async function listLearningModules() {
  const cacheKey = 'module:list:v1';
  const cached = await getCached(cacheKey);
  if (cached) return { cache: 'HIT', data: cached };

  const modules = await listMockModules();
  await setCached(cacheKey, modules);
  return { cache: 'MISS', data: modules };
}

export async function getLearningModule(id) {
  const cacheKey = `module:detail:${id}:v1`;
  const cached = await getCached(cacheKey);
  if (cached) return { cache: 'HIT', data: cached };

  const moduleRecord = await getModule(id);
  if (!moduleRecord) return null;

  await setCached(cacheKey, moduleRecord);
  return { cache: 'MISS', data: moduleRecord };
}

export async function updateLearningModule(id, payload) {
  const updated = await updateModule(id, payload || {});
  if (!updated) return null;

  await invalidateKeys([
    'module:list',
    `module:detail:${id}`,
  ]);

  publishEvent('module.updated', {
    moduleId: updated.id,
    updatedAt: updated.updatedAt,
  });

  return updated;
}
