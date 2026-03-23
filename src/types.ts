export interface UserDetails {
    id: string;
    first_name: string;
    last_name: string;
    full_name?: string;
    avatar_url?: string;
    username?: string;
    website?: string;
    followers_count?: number;
    is_verified?: boolean;
    plan_type?: 'free' | 'premium';
    show_verified_badge?: boolean;
  }

export interface Vent {
  id: string;
  created_at: string;
  content: string;
  user_id: string;
  emotion: string;
  location: {
    latitude: number;
    longitude: number;
  } | null;
  profiles: {
    username: string;
  } | null;
}
