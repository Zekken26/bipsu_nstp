import { Router } from 'express';
import { softReadLimiter } from '../../middleware/rateLimit.js';
import { streamEvents } from './events.controller.js';

const router = Router();

router.get('/stream', softReadLimiter, streamEvents);

export default router;
