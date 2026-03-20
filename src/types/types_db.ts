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
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          user_id?: string;
        };
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}
