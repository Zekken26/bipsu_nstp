import { followUser } from '../../data/mock/mockDb.js';
import { publishEvent } from '../events/events.service.js';

export async function createFollow({ followerId, targetUserId }) {
  if (!followerId || !targetUserId) {
    const error = new Error('Missing followerId or targetUserId');
    error.statusCode = 400;
    throw error;
  }

  const followRecord = await followUser({ followerId, targetUserId });

  publishEvent('follow.created', {
    followerId,
    targetUserId,
    totalFollowers: followRecord.totalFollowers,
  });

  return followRecord;
}
