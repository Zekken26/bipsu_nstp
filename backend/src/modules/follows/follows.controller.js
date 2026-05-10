import { createFollow } from './follows.service.js';

export async function createFollowController(req, res) {
  return res.status(201).json(await createFollow(req.body || {}));
}
