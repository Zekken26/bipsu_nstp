import prisma from '../../db/prisma.js';
import { emitUserEvent } from '../../websocket.js';

export async function createFollow(followerId, { targetUserId }) {
  if (!followerId || !targetUserId) {
    const error = new Error('Target user is required.');
    error.statusCode = 400;
    throw error;
  }

  if (followerId === targetUserId) {
    const error = new Error('You cannot follow yourself.');
    error.statusCode = 400;
    throw error;
  }

  const target = await prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true } });
  if (!target) {
    const error = new Error('Target user not found.');
    error.statusCode = 404;
    throw error;
  }

  const existing = await prisma.follow.findUnique({ where: { followerId_targetUserId: { followerId, targetUserId } } });
  if (existing) return { created: false, follow: existing };

  let follow;
  try {
    follow = await prisma.follow.create({ data: { followerId, targetUserId } });
  } catch (error) {
    if (error?.code !== 'P2002') throw error;
    follow = await prisma.follow.findUnique({ where: { followerId_targetUserId: { followerId, targetUserId } } });
    return { created: false, follow };
  }

  const totalFollowers = await prisma.follow.count({ where: { targetUserId } });
  emitUserEvent(targetUserId, 'follow.updated', { action: 'created', totalFollowers });
  return { created: true, follow };
}

export async function deleteFollow(followerId, targetUserId) {
  const result = await prisma.follow.deleteMany({ where: { followerId, targetUserId } });
  if (result.count !== 1) {
    const error = new Error('Follow relationship not found.');
    error.statusCode = 404;
    throw error;
  }

  const totalFollowers = await prisma.follow.count({ where: { targetUserId } });
  emitUserEvent(targetUserId, 'follow.updated', { action: 'deleted', totalFollowers });
}
