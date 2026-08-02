const modules = new Map();

export async function listModules() {
  return Array.from(modules.values());
}

export async function getModule(id) {
  return modules.get(id) || null;
}

export async function updateModule(id, patch) {
  const current = modules.get(id);
  if (!current) return null;
  const next = { ...current, ...patch, updatedAt: new Date().toISOString() };
  modules.set(id, next);
  return next;
}
