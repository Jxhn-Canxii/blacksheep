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
    stripe_subscription_id: string;
    stripe_customer_id: string;
    plan_type?: 'free' | 'premium';
    show_verified_badge?: boolean;
  }

export interface Vent {
  id: string;
  created_at: string;
  content: string;
  user_id: string;
  emotion: string;
  intensity?: number;
  location: {
    latitude: number;
    longitude: number;
  } | null;
  profiles: {
    username: string;
  } | null;
}

  export interface Notification{
        id: string;
        user_id: string;
        is_read: boolean;
        type: 'reply' | 'follow' | 'mention' | 'message' | 'group_info' | string;
        created_at: string;
        metadata?: {
            name?: string;
            cluster_id?: string;
        } | null;
        actor?: {
            username?: string;
            avatar_url?: string;
        } | null;
    };