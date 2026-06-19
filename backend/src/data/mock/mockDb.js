const modules = new Map();

const followCounts = new Map();

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

export async function chargePayment({ userId, amount, currency }) {
  return {
    id: `pay_${Math.random().toString(36).slice(2, 10)}`,
    userId,
    amount,
    currency,
    status: 'succeeded',
    createdAt: new Date().toISOString(),
  };
}

export async function followUser({ followerId, targetUserId }) {
  const key = `${followerId}->${targetUserId}`;
  const alreadyFollowing = followCounts.has(key);
  if (!alreadyFollowing) {
    followCounts.set(key, true);
  }

  let totalFollowers = 0;
  for (const followKey of followCounts.keys()) {
    if (followKey.endsWith(`->${targetUserId}`)) {
      totalFollowers += 1;
    }
  }

  return {
    followerId,
    targetUserId,
    totalFollowers,
    createdAt: new Date().toISOString(),
  };
}
