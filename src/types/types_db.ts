export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          updated_at: string | null;
          username: string | null;
          full_name: string | null;
          avatar_url: string | null;
          website: string | null;
        };
        Insert: {
          id: string;
          updated_at?: string | null;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          website?: string | null;
        };
        Update: {
          id?: string;
          updated_at?: string | null;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          website?: string | null;
        };
      };
      vents: {
        Row: {
          id: string;
          created_at: string;
          content: string;
          user_id: string;
          emotion: string | null;
          location: Json | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          content: string;
          user_id: string;
          emotion?: string | null;
          location?: Json | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          content?: string;
          user_id?: string;
          emotion?: string | null;
          location?: Json | null;
        };
      };
      replies: {
        Row: {
          id: string;
          created_at: string;
          content: string;
          user_id: string;
          vent_id: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          content: string;
          user_id: string;
          vent_id: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          content?: string;
          user_id?: string;
          vent_id?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          created_at: string;
          content: string;
          user_id: string;
          group_id: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          content: string;
          user_id: string;
          group_id?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          content?: string;
          user_id?: string;
          group_id?: string | null;
        };
      };
      groups: {
        Row: {
          id: string;
          created_at: string;
          name: string;
          description: string | null;
          created_by: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          name: string;
          description?: string | null;
          created_by: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          name?: string;
          description?: string | null;
          created_by?: string;
        };
      };
      group_members: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          status: string | null;
          role: string | null;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          status?: string | null;
          role?: string | null;
        };
        Update: {
          id?: string;
          group_id?: string;
          user_id?: string;
          status?: string | null;
          role?: string | null;
        };
      };
      follows: {
        Row: {
          id: string;
          created_at: string;
          follower_id: string;
          following_id: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          follower_id: string;
          following_id: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          follower_id?: string;
          following_id?: string;
        };
      };
      direct_messages: {
        Row: {
          id: string;
          created_at: string;
          content: string;
          sender_id: string;
          receiver_id: string;
          is_read: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          content: string;
          sender_id: string;
          receiver_id: string;
          is_read?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          content?: string;
          sender_id?: string;
          receiver_id?: string;
          is_read?: boolean;
        };
      };
      vent_reactions: {
        Row: {
          id: string;
          vent_id: string;
          user_id: string;
          type: string;
        };
        Insert: {
          id?: string;
          vent_id: string;
          user_id: string;
          type: string;
        };
        Update: {
          id?: string;
          vent_id?: string;
          user_id?: string;
          type?: string;
        };
      };
      reply_reactions: {
        Row: {
          id: string;
          reply_id: string;
          user_id: string;
          type: string;
        };
        Insert: {
          id?: string;
          reply_id: string;
          user_id: string;
          type: string;
        };
        Update: {
          id?: string;
          reply_id?: string;
          user_id?: string;
          type?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          actor_id: string;
          type: string;
          entity_id: string;
          is_read: boolean;
          created_at: string;
          metadata: string;
        };
        Insert: {
          id: string;
          user_id: string;
          actor_id: string;
          type: string;
          entity_id: string;
          is_read: boolean;
          created_at: string;
          metadata: string;
        };
        Update: {
          id: string;
          user_id: string;
          actor_id: string;
          type: string;
          entity_id: string;
          is_read: boolean;
          created_at: string;
          metadata: string;
        };
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}
