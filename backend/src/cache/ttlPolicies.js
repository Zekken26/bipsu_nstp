export const TTL_SECONDS = {
  moduleDetail: 300,
  moduleList: 120,
  leaderboard: 30,
  userProfile: 600,
  feed: 45,
};

export function getTtlForKey(cacheKey) {
  if (cacheKey.startsWith('module:list')) return TTL_SECONDS.moduleList;
  if (cacheKey.startsWith('module:detail')) return TTL_SECONDS.moduleDetail;
  if (cacheKey.startsWith('leaderboard')) return TTL_SECONDS.leaderboard;
  if (cacheKey.startsWith('user:profile')) return TTL_SECONDS.userProfile;
  if (cacheKey.startsWith('feed')) return TTL_SECONDS.feed;
  return 60;
}
