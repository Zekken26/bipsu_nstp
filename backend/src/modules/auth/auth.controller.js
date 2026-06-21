import { sendSuccess, sendCreated, sendError } from '../../utils/apiResponse.js';
import { registerUser, loginUser, getUserById, updateUserProfile } from './auth.service.js';

export async function getAuthStatus(req, res) {
  return sendSuccess(res, {
    configured: true,
    message: 'Auth module is ready.',
  });
}

export async function handleRegister(req, res) {
  try {
    const result = await registerUser(req.body);
    return sendCreated(res, result);
  } catch (err) {
    return sendError(res, err.message, err.statusCode || 500);
  }
}

export async function handleLogin(req, res) {
  try {
    const { identifier, password } = req.body;
    const result = await loginUser(identifier, password);
    return sendSuccess(res, result);
  } catch (err) {
    return sendError(res, err.message, err.statusCode || 500);
  }
}

export async function handleGetProfile(req, res) {
  try {
    const profile = await getUserById(req.user.id);
    return sendSuccess(res, profile);
  } catch (err) {
    return sendError(res, err.message, err.statusCode || 500);
  }
}

export async function handleUpdateProfile(req, res) {
  try {
    const { password, ...safeFields } = req.body;
    const profile = await updateUserProfile(req.user.id, req.body);
    return sendSuccess(res, profile);
  } catch (err) {
    return sendError(res, err.message, err.statusCode || 500);
  }
}
