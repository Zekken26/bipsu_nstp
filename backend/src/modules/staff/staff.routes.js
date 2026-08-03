import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/authenticate.js';
import { strictWriteLimiter } from '../../middleware/rateLimit.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getCurrentCoordinator } from '../nstp/nstp.authorization.js';
import {
  createAdminCoordinator, createMyFacilitator, listAdminCoordinators, listMyFacilitators,
  reactivateAdminCoordinator, reactivateMyFacilitator, suspendAdminCoordinator, suspendMyFacilitator,
  updateAdminCoordinator, updateMyFacilitator,
} from './staff.controller.js';
import {
  createCoordinatorSchema, createFacilitatorSchema, listStaffSchema, staffIdSchema,
  updateCoordinatorSchema, updateFacilitatorSchema,
} from './staff.validation.js';

const router = Router();
const admin = [authenticate, requireRole('ADMIN')];
const coordinator = [authenticate, requireRole('COORDINATOR'), asyncHandler(getCurrentCoordinator)];

router.get('/admin/coordinators', ...admin, validateRequest(listStaffSchema), asyncHandler(listAdminCoordinators));
router.post('/admin/coordinators', ...admin, strictWriteLimiter, validateRequest(createCoordinatorSchema), asyncHandler(createAdminCoordinator));
router.patch('/admin/coordinators/:id', ...admin, strictWriteLimiter, validateRequest(updateCoordinatorSchema), asyncHandler(updateAdminCoordinator));
router.post('/admin/coordinators/:id/suspend', ...admin, strictWriteLimiter, validateRequest(staffIdSchema), asyncHandler(suspendAdminCoordinator));
router.post('/admin/coordinators/:id/reactivate', ...admin, strictWriteLimiter, validateRequest(staffIdSchema), asyncHandler(reactivateAdminCoordinator));

router.get('/coordinators/facilitators', ...coordinator, asyncHandler(listMyFacilitators));
router.post('/coordinators/facilitators', ...coordinator, strictWriteLimiter, validateRequest(createFacilitatorSchema), asyncHandler(createMyFacilitator));
router.patch('/coordinators/facilitators/:id', ...coordinator, strictWriteLimiter, validateRequest(updateFacilitatorSchema), asyncHandler(updateMyFacilitator));
router.post('/coordinators/facilitators/:id/suspend', ...coordinator, strictWriteLimiter, validateRequest(staffIdSchema), asyncHandler(suspendMyFacilitator));
router.post('/coordinators/facilitators/:id/reactivate', ...coordinator, strictWriteLimiter, validateRequest(staffIdSchema), asyncHandler(reactivateMyFacilitator));

export default router;
