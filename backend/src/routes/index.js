import { Router } from 'express';
import assessmentsRouter from '../modules/assessments/assessments.routes.js';
import authRouter from '../modules/auth/auth.routes.js';
import eventsRouter from '../modules/events/events.routes.js';
import followsRouter from '../modules/follows/follows.routes.js';
import gradesRouter from '../modules/grades/grades.routes.js';
import modulesRouter from '../modules/modules/modules.routes.js';
import { getDbTest } from '../modules/nstp/nstp.controller.js';
import nstpRouter from '../modules/nstp/nstp.routes.js';
import paymentsRouter from '../modules/payments/payments.routes.js';
import studentsRouter from '../modules/students/students.routes.js';
import { softReadLimiter } from '../middleware/rateLimit.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const apiRouter = Router();

apiRouter.get('/db-test', asyncHandler(getDbTest));
apiRouter.use('/auth', authRouter);
apiRouter.use('/students', softReadLimiter, studentsRouter);
apiRouter.use('/modules', softReadLimiter, modulesRouter);
apiRouter.use('/assessments', softReadLimiter, assessmentsRouter);
apiRouter.use('/grades', softReadLimiter, gradesRouter);
apiRouter.use('/nstp', softReadLimiter, nstpRouter);
apiRouter.use('/follows', followsRouter);
apiRouter.use('/payments', paymentsRouter);
apiRouter.use('/events', eventsRouter);

export default apiRouter;
