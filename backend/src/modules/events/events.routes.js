import { Router } from 'express';
import { streamEvents } from './events.controller.js';

const router = Router();

router.get('/stream', streamEvents);

export default router;
