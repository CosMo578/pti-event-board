export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type EventCategory =
  | "academic"
  | "social"
  | "sports"
  | "religious"
  | "departmental";

export type EventVisibility = "public" | "private";

export interface Database {
  public: {
    Tables: {
      events: {
        Row: {
          id: string;
          title: string;
          description: string;
          event_date: string;
          event_time: string;
          location: string;
          category: EventCategory;
          flyer_url: string | null;
          created_by: string;
          created_at: string;
          visibility: EventVisibility;
          hashtags: string[];
          host_name: string;
          host_avatar_url: string | null;
          updated_at: string;
          max_attendees: number | null;
          end_date: string | null;
          end_time: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          event_date: string;
          event_time: string;
          location: string;
          category: EventCategory;
          flyer_url?: string | null;
          created_by: string;
          created_at?: string;
          visibility?: EventVisibility;
          hashtags?: string[];
          host_name?: string;
          host_avatar_url?: string | null;
          updated_at?: string;
          max_attendees?: number | null;
          end_date?: string | null;
          end_time?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          event_date?: string;
          event_time?: string;
          location?: string;
          category?: EventCategory;
          flyer_url?: string | null;
          created_by?: string;
          created_at?: string;
          visibility?: EventVisibility;
          hashtags?: string[];
          host_name?: string;
          host_avatar_url?: string | null;
          updated_at?: string;
          max_attendees?: number | null;
          end_date?: string | null;
          end_time?: string | null;
        };
        Relationships: [];
      };
      event_rsvps: {
        Row: {
          id: string;
          event_id: string;
          user_id: string;
          display_name: string;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          user_id: string;
          display_name: string;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          user_id?: string;
          display_name?: string;
          avatar_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      notification_preferences: {
        Row: {
          user_id: string;
          push_enabled: boolean;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          push_enabled?: boolean;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          push_enabled?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          endpoint?: string;
          p256dh?: string;
          auth?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      event_category: EventCategory;
      event_visibility: EventVisibility;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Event = Database["public"]["Tables"]["events"]["Row"];
export type EventRsvp = Database["public"]["Tables"]["event_rsvps"]["Row"];
export type NotificationPreferences =
  Database["public"]["Tables"]["notification_preferences"]["Row"];

export type EventWithRsvps = Event & {
  event_rsvps: Pick<EventRsvp, "display_name" | "avatar_url" | "user_id">[];
};

export type EventWithRsvpCount = Event & {
  rsvp_count: number;
};
