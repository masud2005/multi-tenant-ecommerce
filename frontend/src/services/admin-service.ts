import { apiClient } from './api-client';
import { staff, roles, auditLogs, discounts, campaigns, automations } from '@/data/admin';

export const adminService = {
  async getStaff() {
    try {
      return await apiClient.get('/admin/staff');
    } catch {
      return staff;
    }
  },

  async getRoles() {
    try {
      return await apiClient.get('/admin/roles');
    } catch {
      return roles;
    }
  },

  async getAuditLogs() {
    try {
      return await apiClient.get('/admin/audit-logs');
    } catch {
      return auditLogs;
    }
  },

  async getDiscounts() {
    try {
      return await apiClient.get('/admin/discounts');
    } catch {
      return discounts;
    }
  },

  async getMarketingCampaigns() {
    try {
      return await apiClient.get('/admin/marketing/campaigns');
    } catch {
      return campaigns;
    }
  },

  async getAutomations() {
    try {
      return await apiClient.get('/admin/marketing/automations');
    } catch {
      return automations;
    }
  },
};
