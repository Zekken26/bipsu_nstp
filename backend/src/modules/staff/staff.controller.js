import { sendSuccess } from '../../utils/apiResponse.js';
import {
  createCoordinator, createOwnedFacilitator, listCoordinators, listOwnedFacilitators,
  setCoordinatorStatus, setOwnedFacilitatorStatus, updateCoordinator, updateOwnedFacilitator,
} from './staff.service.js';

export async function listAdminCoordinators(req, res) { return sendSuccess(res, await listCoordinators(req.validated.query)); }
export async function createAdminCoordinator(req, res) { return sendSuccess(res, await createCoordinator(req.user.id, req.validated.body), 201); }
export async function updateAdminCoordinator(req, res) { return sendSuccess(res, await updateCoordinator(req.user.id, req.params.id, req.validated.body)); }
export async function suspendAdminCoordinator(req, res) { return sendSuccess(res, await setCoordinatorStatus(req.user.id, req.params.id, 'SUSPENDED')); }
export async function reactivateAdminCoordinator(req, res) { return sendSuccess(res, await setCoordinatorStatus(req.user.id, req.params.id, 'ACTIVE')); }

export async function listMyFacilitators(req, res) { return sendSuccess(res, await listOwnedFacilitators(req.coordinator.id)); }
export async function createMyFacilitator(req, res) { return sendSuccess(res, await createOwnedFacilitator(req.user.id, req.coordinator, req.validated.body), 201); }
export async function updateMyFacilitator(req, res) { return sendSuccess(res, await updateOwnedFacilitator(req.user.id, req.coordinator, req.params.id, req.validated.body)); }
export async function suspendMyFacilitator(req, res) { return sendSuccess(res, await setOwnedFacilitatorStatus(req.user.id, req.coordinator.id, req.params.id, 'SUSPENDED')); }
export async function reactivateMyFacilitator(req, res) { return sendSuccess(res, await setOwnedFacilitatorStatus(req.user.id, req.coordinator.id, req.params.id, 'ACTIVE')); }
