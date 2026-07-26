import type { Branch } from '../types';
import { api, http } from './api';

export interface CreateBranchInput {
  name: string;
  address?: string;
  phone?: string;
  city?: string;
  notes?: string;
  is_active?: boolean;
}

export interface UpdateBranchInput {
  name?: string;
  address?: string;
  phone?: string;
  city?: string;
  notes?: string;
  is_active?: boolean;
}

export const branchApi = {
  getBranches: async (): Promise<Branch[]> => {
    return api.get<Branch[]>('/api/branches');
  },

  createBranch: async (input: CreateBranchInput): Promise<Branch> => {
    return api.post<Branch>('/api/branches', input);
  },

  updateBranch: async (id: string, input: UpdateBranchInput): Promise<Branch> => {
    return http<Branch>(`/api/branches/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },

  deleteBranch: async (id: string): Promise<{ success: boolean; message: string }> => {
    return api.delete<{ success: boolean; message: string }>(`/api/branches/${encodeURIComponent(id)}`);
  },
};
