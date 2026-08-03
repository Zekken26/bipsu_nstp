import { apiGet, apiPatch, apiPost } from './apiClient';
import type { BiliranMunicipality, CoordinatorScope, NstpComponent, StaffAccountStatus } from '../data/nstpData';

type ApiEnvelope<T> = { success: boolean; data: T };

export type CoordinatorRecord = {
  id: string;
  profileId: string;
  name: string;
  email: string;
  status: StaffAccountStatus;
  employeeNumber: string;
  scope: CoordinatorScope;
  title: string;
  contactNumber: string;
  facilitatorCount: number;
  createdAt: string;
  updatedAt: string;
};

export type FacilitatorRecord = {
  id: string;
  profileId: string;
  name: string;
  email: string;
  status: StaffAccountStatus;
  employeeNumber: string;
  title: string;
  contactNumber: string;
  componentId: string;
  component: 'CWTS' | 'LTS' | 'MTS_ARMY' | 'MTS_NAVY' | 'CWTS_COAST_GUARD';
  componentName: string;
  municipalities: BiliranMunicipality[];
  createdAt: string;
  updatedAt: string;
};

export type StaffIdentityInput = {
  name: string;
  email: string;
  employeeNumber: string;
  title?: string;
  contactNumber?: string;
  password?: string;
};

export type CoordinatorInput = StaffIdentityInput & { scope: CoordinatorScope };
export type FacilitatorInput = StaffIdentityInput & {
  component: FacilitatorRecord['component'];
  municipalities: BiliranMunicipality[];
};

export const SCOPE_COMPONENT_TYPES: Record<CoordinatorScope, FacilitatorRecord['component'][]> = {
  CWTS: ['CWTS', 'CWTS_COAST_GUARD'],
  MTS: ['MTS_ARMY', 'MTS_NAVY'],
  LTS: ['LTS'],
};

export const COMPONENT_TYPE_LABELS: Record<FacilitatorRecord['component'], NstpComponent> = {
  CWTS: 'CWTS', LTS: 'LTS', MTS_ARMY: 'MTS (Army)', MTS_NAVY: 'MTS (Navy)', CWTS_COAST_GUARD: 'CWTS (Coast Guard)',
};

export async function fetchAdminCoordinators(filters: { search?: string; scope?: CoordinatorScope; status?: StaffAccountStatus; page?: number; pageSize?: number } = {}) {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => { if (value !== undefined && value !== '') query.set(key, String(value)); });
  return (await apiGet<ApiEnvelope<{ items: CoordinatorRecord[]; pagination: { page: number; pageSize: number; total: number; pages: number } }>>(`/nstp/admin/coordinators?${query}`)).data;
}

export async function createCoordinator(input: CoordinatorInput & { password: string }) {
  return (await apiPost<ApiEnvelope<CoordinatorRecord>>('/nstp/admin/coordinators', input)).data;
}

export async function updateCoordinator(id: string, input: Partial<CoordinatorInput>) {
  return (await apiPatch<ApiEnvelope<CoordinatorRecord>>(`/nstp/admin/coordinators/${encodeURIComponent(id)}`, input)).data;
}

export async function setCoordinatorStatus(id: string, status: StaffAccountStatus) {
  return (await apiPost<ApiEnvelope<{ id: string; status: StaffAccountStatus }>>(`/nstp/admin/coordinators/${encodeURIComponent(id)}/${status === 'ACTIVE' ? 'reactivate' : 'suspend'}`, {})).data;
}

export async function fetchMyFacilitators() {
  return (await apiGet<ApiEnvelope<FacilitatorRecord[]>>('/nstp/coordinators/facilitators')).data;
}

export async function createMyFacilitator(input: FacilitatorInput & { password: string }) {
  return (await apiPost<ApiEnvelope<FacilitatorRecord>>('/nstp/coordinators/facilitators', input)).data;
}

export async function updateMyFacilitator(id: string, input: Partial<FacilitatorInput>) {
  return (await apiPatch<ApiEnvelope<FacilitatorRecord>>(`/nstp/coordinators/facilitators/${encodeURIComponent(id)}`, input)).data;
}

export async function setMyFacilitatorStatus(id: string, status: StaffAccountStatus) {
  return (await apiPost<ApiEnvelope<{ id: string; status: StaffAccountStatus }>>(`/nstp/coordinators/facilitators/${encodeURIComponent(id)}/${status === 'ACTIVE' ? 'reactivate' : 'suspend'}`, {})).data;
}
