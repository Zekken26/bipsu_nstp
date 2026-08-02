import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authLimiter } from '../../middleware/rateLimit.js';
import { authenticate, requireRole } from '../../middleware/authenticate.js';
import { rejectProhibitedCredentialFields, validateRequest } from '../../middleware/validateRequest.js';
import { registerSchema, loginSchema, updateProfileSchema } from '../../middleware/validationSchemas.js';
import { getAuthStatus, handleApproveRegistration, handleRegister, handleLogin, handleLogout, handlePendingRegistration, handleRejectRegistration, handleGetProfile, handleUpdateProfile } from './auth.controller.js';

const router = Router();

router.get('/status', asyncHandler(getAuthStatus));
router.post('/register', authLimiter, rejectProhibitedCredentialFields, validateRequest(registerSchema), asyncHandler(handleRegister));
router.post('/pending-registration', authLimiter, rejectProhibitedCredentialFields, validateRequest(registerSchema), asyncHandler(handlePendingRegistration));
router.post('/login', authLimiter, validateRequest(loginSchema), asyncHandler(handleLogin));
router.post('/logout', asyncHandler(handleLogout));
router.post('/admin/registrations/:id/approve', authenticate, requireRole('ADMIN'), asyncHandler(handleApproveRegistration));
router.post('/admin/registrations/:id/reject', authenticate, requireRole('ADMIN'), asyncHandler(handleRejectRegistration));
router.get('/me', authenticate, asyncHandler(handleGetProfile));
router.put('/me', authenticate, rejectProhibitedCredentialFields, validateRequest(updateProfileSchema), asyncHandler(handleUpdateProfile));

export default router;
