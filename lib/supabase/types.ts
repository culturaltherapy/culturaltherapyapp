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

// Supabase requires all four schema sections to be present for generics to resolve correctly.
// Missing Views/Functions/Enums/CompositeTypes causes table Insert/Update types to collapse to `never`.
type TableDef<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles:         TableDef<Profile,       Partial<Profile>       & { id: string }>;
      tribes:           TableDef<Tribe,          Partial<Tribe>         & { name: string; owner_id: string }>;
      tribe_members:    TableDef<TribeMember,    TribeMember>;
      posts:            TableDef<Post,           Partial<Post>          & { owner_id: string; visibility: Visibility }>;
      village_threads:  TableDef<VillageThread,  Partial<VillageThread> & { tribe_id: string; author_id: string; title: string }>;
      village_messages: TableDef<VillageMessage, Partial<VillageMessage>& { thread_id: string; author_id: string; body: string }>;
      discussion_rooms: TableDef<DiscussionRoom, Partial<DiscussionRoom>& { title: string }>;
      discussion_posts: TableDef<DiscussionPost, Partial<DiscussionPost>& { room_id: string; author_id: string }>;
      profile_prompts:  TableDef<{ id: string; user_id: string; prompt_id: string; answer: string; visibility: Visibility }, { user_id: string; prompt_id: string; answer: string; visibility: Visibility }>;
      courses:          TableDef<Course,         Partial<Course>        & { title: string }>;
      mod_reports:      TableDef<ModReport,      Partial<ModReport>     & { reporter_id: string; target_kind: string; target_id: string; reason: ReportReason }>;
      crisis_resources: TableDef<CrisisResource, Partial<CrisisResource>& { country_code: string; name: string }>;
    };
    Views:          Record<string, never>;
    Functions:      Record<string, never>;
    Enums:          Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
