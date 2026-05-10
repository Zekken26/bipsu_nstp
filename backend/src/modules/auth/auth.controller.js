import { sendSuccess } from '../../utils/apiResponse.js';

export async function getAuthStatus(req, res) {
  return sendSuccess(res, {
    configured: true,
    message: 'Auth module is ready for login/register implementation.',
  });
}
