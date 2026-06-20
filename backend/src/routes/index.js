import { Router } from 'express';
import authRouter from '../modules/auth/auth.routes.js';
import eventsRouter from '../modules/events/events.routes.js';
import followsRouter from '../modules/follows/follows.routes.js';
import { getDbTest } from '../modules/nstp/nstp.controller.js';
import nstpRouter from '../modules/nstp/nstp.routes.js';
import paymentsRouter from '../modules/payments/payments.routes.js';
import { softReadLimiter } from '../middleware/rateLimit.js';
import { authenticate, requireRole } from '../middleware/authenticate.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const apiRouter = Router();

apiRouter.get('/db-test', asyncHandler(getDbTest));
apiRouter.use('/auth', authRouter);
apiRouter.use('/nstp', authenticate, softReadLimiter, nstpRouter);
apiRouter.use('/follows', authenticate, followsRouter);
apiRouter.use('/payments', authenticate, paymentsRouter);
apiRouter.use('/events', authenticate, eventsRouter);

export { requireRole };
export default apiRouter;
