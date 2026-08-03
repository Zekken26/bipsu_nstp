import { apiPost, ApiRequestError } from '../../../services/apiClient';

export type ApprovedRegistration = {
  id: string;
  email: string;
};

type ApprovalResponse = {
  success: boolean;
  data?: ApprovedRegistration;
};

type ApprovalRequest = (path: string, payload: Record<string, never>) => Promise<ApprovalResponse>;

export class RegistrationApprovalInProgressError extends Error {
  constructor() {
    super('This registration approval is already in progress.');
    this.name = 'RegistrationApprovalInProgressError';
  }
}

export function createRegistrationApprovalClient(request: ApprovalRequest = apiPost) {
  const inFlight = new Set<string>();

  return {
    async approve(registrationId: string): Promise<ApprovedRegistration> {
      if (inFlight.has(registrationId)) throw new RegistrationApprovalInProgressError();
      inFlight.add(registrationId);

      try {
        const response = await request(`/auth/admin/registrations/${encodeURIComponent(registrationId)}/approve`, {});
        if (!response.success || !response.data?.id) {
          throw new ApiRequestError(502, 'The server did not confirm the registration approval.');
        }
        return response.data;
      } finally {
        inFlight.delete(registrationId);
      }
    },
  };
}

export function getRegistrationApprovalErrorMessage(error: unknown): string {
  if (error instanceof RegistrationApprovalInProgressError) return error.message;
  if (error instanceof ApiRequestError) {
    if (error.status === 409) return 'This registration is no longer pending or conflicts with an existing account. Refresh the list and review it again.';
    if (error.retryable) return 'Approval was not saved because the service is temporarily unavailable. The request remains pending; please try again.';
    return error.message || 'The server rejected the approval. The request remains pending.';
  }
  return 'Approval was not saved. The request remains pending; please try again.';
}
