import { apiClient } from './api-client';
import type { ApiResponse } from '@/types';
import type {
  StaffMember,
  StaffRole,
  StaffListResponseData,
  QueryStaffParams,
  InviteStaffPayload,
  UpdateStaffPayload,
  CreateRolePayload,
  UpdateRolePayload,
} from '@/types/staff';

export interface ValidatedInviteData {
  valid: boolean;
  email: string;
  name?: string | null;
  roleName: string;
  roleDescription?: string | null;
  storeName: string;
  storeSlug: string;
  permissions: Record<string, string[]>;
}

export interface AcceptInviteResponseData {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    tenantId: string;
    staffRole?: string;
  };
  store: {
    id: string;
    name: string;
    slug: string;
  };
  redirectUrl: string;
}

export const staffService = {
  // ---------------------------------------------------------------------------
  // 1. Staff Members Management (/owner/staff/members)
  // ---------------------------------------------------------------------------

  /**
   * Fetch all staff members for the current store with pagination, search, status, and role filters.
   */
  async getStaffMembers(
    params: QueryStaffParams = {},
  ): Promise<ApiResponse<StaffListResponseData>> {
    const query = new URLSearchParams();
    if (params.search?.trim()) query.set('search', params.search.trim());
    if (params.role?.trim()) query.set('role', params.role.trim());
    if (params.status?.trim()) query.set('status', params.status.trim());
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.sortBy) query.set('sortBy', params.sortBy);
    if (params.sortOrder) query.set('sortOrder', params.sortOrder);
    if (params.tenantId) query.set('tenantId', params.tenantId);

    const queryString = query.toString();
    const endpoint = `/owner/staff/members${queryString ? `?${queryString}` : ''}`;
    return apiClient.get<ApiResponse<StaffListResponseData>>(endpoint);
  },

  /**
   * Invite or create a new staff member and assign their initial store role.
   */
  async inviteStaff(payload: InviteStaffPayload): Promise<ApiResponse<StaffMember>> {
    return apiClient.post<ApiResponse<StaffMember>>('/owner/staff/invite', payload);
  },

  /**
   * Resend invitation email to a pending invited staff member.
   */
  async resendInvite(id: string): Promise<ApiResponse<null>> {
    return apiClient.post<ApiResponse<null>>(`/owner/staff/members/${id}/resend`, {});
  },

  /**
   * Update staff member role assignment, status (active/deactivated), or profile details.
   */
  async updateStaffMember(
    id: string,
    payload: UpdateStaffPayload,
  ): Promise<ApiResponse<StaffMember>> {
    return apiClient.patch<ApiResponse<StaffMember>>(`/owner/staff/members/${id}`, payload);
  },

  /**
   * Soft-delete/remove a staff member from the current store.
   */
  async removeStaffMember(id: string): Promise<ApiResponse<null>> {
    return apiClient.delete<ApiResponse<null>>(`/owner/staff/members/${id}`);
  },

  // ---------------------------------------------------------------------------
  // 2. Roles & Permission Matrices Management (/owner/staff/roles)
  // ---------------------------------------------------------------------------

  /**
   * Fetch all default system and custom roles along with their full permission matrices.
   */
  async getRoles(tenantId?: string): Promise<ApiResponse<StaffRole[]>> {
    const endpoint = tenantId
      ? `/owner/staff/roles?tenantId=${encodeURIComponent(tenantId)}`
      : '/owner/staff/roles';
    return apiClient.get<ApiResponse<StaffRole[]>>(endpoint);
  },

  /**
   * Create a new custom staff role with modular permission matrix.
   */
  async createRole(payload: CreateRolePayload): Promise<ApiResponse<StaffRole>> {
    return apiClient.post<ApiResponse<StaffRole>>('/owner/staff/roles', payload);
  },

  /**
   * Update role metadata (name, description) or granular permission matrix.
   */
  async updateRole(
    id: string,
    payload: UpdateRolePayload,
  ): Promise<ApiResponse<StaffRole>> {
    return apiClient.patch<ApiResponse<StaffRole>>(`/owner/staff/roles/${id}`, payload);
  },

  /**
   * Delete a custom staff role (System default roles are protected).
   */
  async deleteRole(id: string): Promise<ApiResponse<null>> {
    return apiClient.delete<ApiResponse<null>>(`/owner/staff/roles/${id}`);
  },

  // ---------------------------------------------------------------------------
  // 3. Public Staff Invite Acceptance (/auth/staff)
  // ---------------------------------------------------------------------------

  /**
   * Validate a staff invitation token received via email.
   */
  async validateStaffInvite(token: string): Promise<ApiResponse<ValidatedInviteData>> {
    return apiClient.get<ApiResponse<ValidatedInviteData>>(
      `/auth/staff/invite?token=${encodeURIComponent(token)}`
    );
  },

  /**
   * Accept staff invitation, set initial password, and auto-authenticate.
   */
  async acceptStaffInvite(payload: {
    token: string;
    password: string;
    name?: string;
  }): Promise<ApiResponse<AcceptInviteResponseData>> {
    return apiClient.post<ApiResponse<AcceptInviteResponseData>>(
      '/auth/staff/accept-invite',
      payload
    );
  },
};
