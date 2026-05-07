// Lightweight manual types — replace with `supabase gen types typescript`
// once the project matures.

export type Visibility = "public" | "tribe" | "village" | "private";
export type TribeRole = "owner" | "mod" | "member";
export type MediaKind = "image" | "video";
export type ReportReason = "safety" | "abuse" | "spam" | "crisis" | "other";
export type ReportSeverity = "normal" | "high" | "crisis";
export type ReportStatus = "open" | "triaged" | "actioned" | "dismissed";

export interface Profile {
  id: string;
  alias: string;
  avatar_url: string | null;
  bio: string | null;
  pronouns: string | null;
  city: string | null;
  country: string | null;
  lat: number | null;
  lng: number | null;
  descent: string[];
  languages: string[];
  diagnosis: string | null;
  diagnosis_visibility: Visibility;
  experience_tags: string[];
  id_verified: boolean;
  wall_enabled: boolean;
  accepts_tribe_requests: boolean;
  accepts_dms: boolean;
  accepts_calls: boolean;
  accepts_video: boolean;
  created_at: string;
}

export interface Tribe {
  id: string;
  name: string;
  blurb: string | null;
  color: string | null;
  motif: string | null;
  owner_id: string;
  created_at: string;
}

export interface TribeMember {
  tribe_id: string;
  user_id: string;
  role: TribeRole;
  joined_at: string;
}

export interface VillageThread {
  id: string;
  tribe_id: string;
  author_id: string;
  title: string;
  body: string | null;
  created_at: string;
}

export interface VillageMessage {
  id: string;
  thread_id: string;
  author_id: string;
  body: string;
  created_at: string;
}

export interface Post {
  id: string;
  owner_id: string;
  body: string | null;
  visibility: Visibility;
  village_id: string | null;
  created_at: string;
  edited_at: string | null;
}

export interface DiscussionRoom {
  id: string;
  title: string;
  blurb: string | null;
  motif: string | null;
  is_chat: boolean;
}

export interface DiscussionPost {
  id: string;
  room_id: string;
  author_id: string;
  body: string | null;
  created_at: string;
}

export interface Course {
  id: string;
  title: string;
  blurb: string | null;
  motif: string | null;
  published: boolean;
}

export interface ModReport {
  id: string;
  reporter_id: string;
  target_kind: string;
  target_id: string;
  reason: ReportReason;
  severity: ReportSeverity;
  status: ReportStatus;
  notes: string | null;
  created_at: string;
}

export interface CrisisResource {
  id: string;
  country_code: string;
  name: string;
  phone: string | null;
  url: string | null;
  hours: string | null;
}

// Minimal Database shape for the Supabase client generic
export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile> & { id: string; alias: string }; Update: Partial<Profile> };
      tribes: { Row: Tribe; Insert: Partial<Tribe> & { name: string; owner_id: string }; Update: Partial<Tribe> };
      tribe_members: { Row: TribeMember; Insert: TribeMember; Update: Partial<TribeMember> };
      posts: { Row: Post; Insert: Partial<Post> & { owner_id: string; visibility: Visibility }; Update: Partial<Post> };
      village_threads: { Row: VillageThread; Insert: Partial<VillageThread> & { tribe_id: string; author_id: string; title: string }; Update: Partial<VillageThread> };
      village_messages: { Row: VillageMessage; Insert: Partial<VillageMessage> & { thread_id: string; author_id: string; body: string }; Update: Partial<VillageMessage> };
      discussion_rooms: { Row: DiscussionRoom; Insert: Partial<DiscussionRoom> & { title: string }; Update: Partial<DiscussionRoom> };
      discussion_posts: { Row: DiscussionPost; Insert: Partial<DiscussionPost> & { room_id: string; author_id: string }; Update: Partial<DiscussionPost> };
      courses: { Row: Course; Insert: Partial<Course> & { title: string }; Update: Partial<Course> };
      mod_reports: { Row: ModReport; Insert: Partial<ModReport> & { reporter_id: string; target_kind: string; target_id: string; reason: ReportReason }; Update: Partial<ModReport> };
      crisis_resources: { Row: CrisisResource; Insert: Partial<CrisisResource> & { country_code: string; name: string }; Update: Partial<CrisisResource> };
    };
  };
};
