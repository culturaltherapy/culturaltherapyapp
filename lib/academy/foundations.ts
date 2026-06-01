// The Academy's first real course. Lives in code (not the DB) so it can be
// iterated on as the course is built on Teachable — single file to edit when
// modules land or lesson titles change.
//
// To swap the Teachable URL (e.g. when the course goes public) update
// FOUNDATIONS.teachableUrl below. To add a module / lesson, drop a new entry
// in the modules array — the in-app course page renders straight off this.

export type AcademyLesson = {
  /** url-slug-friendly id; only used as a React key for now */
  id: string;
  title: string;
  /** Approximate run time in minutes — shown as a small pill on the row */
  durationMin?: number;
  /** Direct Teachable lecture URL. When omitted, the row links to the course
   *  root URL instead — so we can list lesson titles before each lesson page
   *  exists. */
  teachableUrl?: string;
  /** One-line preview shown under the lesson title */
  blurb?: string;
};

export type AcademyModule = {
  id: string;
  title: string;
  lessons: AcademyLesson[];
};

export type AcademyCourse = {
  /** Slug used in the URL — /academy/[id] */
  id: string;
  title: string;
  blurb: string;
  /** Estimated total length in hours (rounded). */
  estimatedHours?: number;
  /** Top-level Teachable URL. Used for the "Open on Teachable" CTA and as a
   *  fallback for lesson rows that don't have their own URL yet. */
  teachableUrl: string;
  /** True for courses that are still being built — surfaces an "In progress"
   *  pill so members know it's incomplete. */
  inProgress?: boolean;
  modules: AcademyModule[];
};

export const FOUNDATIONS: AcademyCourse = {
  id: "foundations",
  title: "Foundations of Lived Experience Practice",
  blurb:
    "The first stretch of the Peer Support Academy. Listening, scope, ethics, and culturally-rooted care — taught by people who've been here.",
  estimatedHours: 4,
  // Note: this is the "preview as logged-in student" URL — works for the
  // course owner. Swap for the public sales-page URL
  // (https://culturaltherapy.teachable.com/p/<slug>) once the course is
  // published.
  teachableUrl:
    "https://culturaltherapy.teachable.com/courses/enrolled/2986162?preview=logged_in",
  inProgress: true,
  modules: [
    // Add modules + lessons here as they land on Teachable. Each lesson can
    // take an optional teachableUrl that points at its lecture page; when
    // omitted, clicking the row falls back to the course root URL above.
    //
    // Example shape (uncomment and fill in once you have real content):
    //
    // {
    //   id: "intro",
    //   title: "Why this exists",
    //   lessons: [
    //     {
    //       id: "welcome",
    //       title: "Welcome — the Sankofa story",
    //       durationMin: 8,
    //       blurb: "What 'lived experience practice' means here, and why it's different.",
    //     },
    //   ],
    // },
  ],
};

export const ACADEMY_COURSES: AcademyCourse[] = [FOUNDATIONS];

/** Look up a course by its slug; null when nothing matches. */
export function getAcademyCourse(courseId: string): AcademyCourse | null {
  return ACADEMY_COURSES.find((c) => c.id === courseId) ?? null;
}
