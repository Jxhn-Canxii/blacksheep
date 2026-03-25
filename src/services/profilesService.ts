import { apiGet } from '@/utils/logger';

export interface ProfileSummary {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  followers_count: number;
  vents_count: number;
}

export async function fetchProfiles(params: {
  search?: string;
  exclude_id?: string;
  exclude_following?: string;
  limit?: number;
}): Promise<ProfileSummary[]> {
  return apiGet<ProfileSummary[]>('/api/profiles', { params });
}
