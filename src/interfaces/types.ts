export interface Profile {
  id: string;
  username?: string;
  avatar_url?: string;
  is_verified?: boolean;
  show_verified_badge?: boolean;
  follower_count?: { count: number }[];
}

export interface Reaction {
  id: string;
  user_id: string;
  type: string;
}

export interface Reply {
  id: string;
  created_at: string;
  content: string;
  user_id: string;
  vent_id: string;
  parent_reply_id?: string;
  profiles: Profile | null;
  reply_reactions?: Reaction[];
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
  profiles: Profile | null;
  vent_reactions?: Reaction[];
  reply_count?: { count: number }[];
  replies?: Reply[];
  media_url?: string;
  media_type?: 'image' | 'video' | 'audio';
  metadata?: Record<string, unknown>;
  followerCount?: number;
}

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

export interface Notification {
  id: string;
  user_id: string;
  actor_id?: string | null;
  is_read: boolean;
  type: 'reply' | 'follow' | 'mention' | 'message' | 'group_info' | string;
  created_at: string;
  metadata?: Record<string, unknown> | null;
  actor?: {
    username?: string;
    avatar_url?: string;
  } | null;
}