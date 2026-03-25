import { createClient } from '@/libs/supabase';

export interface Follow {
  follower_id: string;
  following_id: string;
}

export interface FollowStats {
  following: string[];
  followers: string[];
  followingCount: number;
  followerCount: number;
}

/**
 * Service for managing follow relationships
 * Separates backend logic from UI components
 */
export class FollowsService {
  private static getClient() {
    return createClient();
  }

  /**
   * Get list of users that a user is following
   */
  static async getFollowing(userId: string): Promise<string[]> {
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId);

    if (error) {
      console.error('Error fetching following:', error);
      return [];
    }

    return (data || []).map((f: Follow) => f.following_id);
  }

  /**
   * Get list of users that follow a user
   */
  static async getFollowers(userId: string): Promise<string[]> {
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('following_id', userId);

    if (error) {
      console.error('Error fetching followers:', error);
      return [];
    }

    return (data || []).map((f: Follow) => f.follower_id);
  }

  /**
   * Get both following and followers for a user
   */
  static async getFollowStats(userId: string): Promise<FollowStats> {
    const supabase = this.getClient();
    
    const [followingResult, followersResult] = await Promise.all([
      supabase.from('follows').select('following_id').eq('follower_id', userId),
      supabase.from('follows').select('follower_id').eq('following_id', userId)
    ]);

    const following = (followingResult.data || []).map((f: Follow) => f.following_id);
    const followers = (followersResult.data || []).map((f: Follow) => f.follower_id);

    return {
      following,
      followers,
      followingCount: following.length,
      followerCount: followers.length
    };
  }

  /**
   * Check if user A is following user B
   */
  static async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .maybeSingle();

    if (error) {
      console.error('Error checking follow status:', error);
      return false;
    }

    return !!data;
  }

  /**
   * Toggle follow relationship (follow if not following, unfollow if following)
   */
  static async toggleFollow(followerId: string, followingId: string): Promise<{ action: 'followed' | 'unfollowed' }> {
    const supabase = this.getClient();
    
    // Check if already following
    const { data: existing } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .maybeSingle();

    if (existing) {
      // Unfollow
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('id', existing.id);

      if (error) {
        console.error('Error unfollowing:', error);
        throw new Error('Failed to unfollow');
      }

      return { action: 'unfollowed' };
    } else {
      // Follow
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: followerId, following_id: followingId });

      if (error) {
        console.error('Error following:', error);
        throw new Error('Failed to follow');
      }

      return { action: 'followed' };
    }
  }

  /**
   * Get follow relationships for a user (both following and followers)
   */
  static async getUserFollows(userId: string): Promise<Follow[]> {
    const supabase = this.getClient();
    const { data, error } = await supabase
      .from('follows')
      .select('follower_id, following_id')
      .or(`follower_id.eq.${userId},following_id.eq.${userId}`);

    if (error) {
      console.error('Error fetching user follows:', error);
      return [];
    }

    return (data || []) as Follow[];
  }
}
