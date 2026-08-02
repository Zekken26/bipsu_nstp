import { createFollow, deleteFollow } from './follows.service.js';

export async function createFollowController(req, res) {
  const result = await createFollow(req.user.id, req.validated.body);
  return res.status(result.created ? 201 : 200).json(result.follow);
}

export async function deleteFollowController(req, res) {
  await deleteFollow(req.user.id, req.params.targetUserId);
  return res.status(204).end();
}
