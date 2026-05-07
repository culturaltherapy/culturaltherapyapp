// Mock data — used when Supabase env vars are unset.
// Mirrors the shape of the production schema in HANDOFF.md §4.

export type Visibility = "public" | "tribe" | "village" | "private";

export type MockProfile = {
  id: string;
  alias: string;
  avatarColor: string;
  city: string;
  country: string;
  distanceKm: number;
  matchPct: number;
  descent: string[];
  experienceTags: string[];
  prompt: { question: string; answer: string };
  idVerified: boolean;
};

export const me: MockProfile = {
  id: "me",
  alias: "Yaa O.",
  avatarColor: "var(--ct-rust)",
  city: "London",
  country: "UK",
  distanceKm: 0,
  matchPct: 100,
  descent: ["Ghanaian", "British"],
  experienceTags: ["Diaspora", "Self-described", "Therapy-curious"],
  prompt: {
    question: "What anchors you?",
    answer: "Sunday calls home, my grandma's laugh, the smell of jollof."
  },
  idVerified: true
};

export const profiles: MockProfile[] = [
  {
    id: "p1",
    alias: "Adwoa K.",
    avatarColor: "#b3563a",
    city: "London",
    country: "UK",
    distanceKm: 4,
    matchPct: 91,
    descent: ["Ghanaian"],
    experienceTags: ["Anxiety", "Diaspora", "Self-diagnosed"],
    prompt: {
      question: "What brings you peace?",
      answer:
        "Sunday market with my sister, and the smell of jollof from a flat two doors down."
    },
    idVerified: true
  },
  {
    id: "p2",
    alias: "Marcus O.",
    avatarColor: "#2f4a32",
    city: "Birmingham",
    country: "UK",
    distanceKm: 152,
    matchPct: 88,
    descent: ["Jamaican", "British"],
    experienceTags: ["PTSD", "Therapy-positive"],
    prompt: {
      question: "Has therapy helped?",
      answer:
        "Took me three therapists to find one who didn't flinch when I named the racism. She did. That's when it started."
    },
    idVerified: true
  },
  {
    id: "p3",
    alias: "Ife A.",
    avatarColor: "#c8884a",
    city: "Lagos",
    country: "NG",
    distanceKm: 5023,
    matchPct: 84,
    descent: ["Yoruba"],
    experienceTags: ["Stigma", "Community"],
    prompt: {
      question: "Does stigma affect you?",
      answer:
        "Every sunday meeting, a small interrogation. I learned to smile and exit."
    },
    idVerified: true
  },
  {
    id: "p4",
    alias: "Tendai R.",
    avatarColor: "#1f3a3a",
    city: "Toronto",
    country: "CA",
    distanceKm: 5701,
    matchPct: 82,
    descent: ["Zimbabwean"],
    experienceTags: ["Bipolar", "Medication"],
    prompt: {
      question: "What's a coping strategy?",
      answer: "I track my sleep like a hawk. The rest follows."
    },
    idVerified: true
  },
  {
    id: "p5",
    alias: "Nneka I.",
    avatarColor: "#8a3d29",
    city: "Manchester",
    country: "UK",
    distanceKm: 297,
    matchPct: 79,
    descent: ["Igbo"],
    experienceTags: ["Faith", "Therapy-curious"],
    prompt: {
      question: "What's hard to say at home?",
      answer: "That I see a therapist. I haven't told my mum yet."
    },
    idVerified: false
  },
  {
    id: "p6",
    alias: "Kwame B.",
    avatarColor: "#6b2f1d",
    city: "Accra",
    country: "GH",
    distanceKm: 5106,
    matchPct: 76,
    descent: ["Ghanaian"],
    experienceTags: ["Depression", "Father"],
    prompt: {
      question: "What did your father teach you about feelings?",
      answer:
        "Nothing directly. He sang every Sunday morning. That was the lesson."
    },
    idVerified: true
  }
];

// TRIBES
export type MockTribe = {
  id: string;
  name: string;
  blurb: string;
  color: string;
  motif: "ubuntu" | "sankofa" | "dwennimmen" | "funtunfunefu" | "ankh" | "eye" | "pyramid";
  memberCount: number;
  preview: string;
};

export const tribes: MockTribe[] = [
  {
    id: "t1",
    name: "Diaspora London",
    blurb: "Two homes, two languages. We meet at the seam.",
    color: "#b3563a",
    motif: "ubuntu",
    memberCount: 24,
    preview: "Live in the Village now"
  },
  {
    id: "t2",
    name: "Bipolar peers",
    blurb: "We talk meds, sleep, and the work of staying.",
    color: "#6b2f1d",
    motif: "dwennimmen",
    memberCount: 9,
    preview: "Crystal hosting Tuesday"
  },
  {
    id: "t3",
    name: "Therapy-curious",
    blurb: "First-time, between-therapist, or skeptical. All welcome.",
    color: "#2f4a32",
    motif: "sankofa",
    memberCount: 22,
    preview: "New thread: finding a therapist who gets it"
  }
];

export const tribeRequests = [
  {
    id: "r1",
    tribeId: "t1",
    requester: profiles[2],
    message: "Saw your prompt about does stigma affect you? — me too."
  },
  {
    id: "r2",
    tribeId: "t1",
    requester: profiles[3],
    message: "Saw your prompt about what's a coping strategy? — me too."
  }
];

// DISCUSSIONS
export type MockRoom = {
  id: string;
  title: string;
  blurb: string;
  count: number;
  isChat: boolean;
};

export const discussionRooms: MockRoom[] = [
  {
    id: "d1",
    title: "Stigma & systems",
    blurb: "When the work is also the problem.",
    count: 247,
    isChat: false
  },
  {
    id: "d2",
    title: "Diaspora",
    blurb: "Two homes, two languages.",
    count: 189,
    isChat: false
  },
  {
    id: "d3",
    title: "Family",
    blurb: "What we say, what we don't, and the cost of either.",
    count: 156,
    isChat: false
  },
  {
    id: "d4",
    title: "Medication",
    blurb: "Starting, coming off, or staying the course.",
    count: 98,
    isChat: false
  },
  {
    id: "d5",
    title: "Faith & spirit",
    blurb: "Where therapy meets tradition.",
    count: 71,
    isChat: false
  },
  {
    id: "d6",
    title: "Right now",
    blurb: "Live chatroom — moderated, peer-only.",
    count: 12,
    isChat: true
  }
];

export const discussionThreads = [
  {
    id: "th1",
    roomId: "d1",
    title: "When the GP says 'have you tried mindfulness'",
    replies: 47,
    last: "12m"
  },
  {
    id: "th2",
    roomId: "d2",
    title: "Coping in two languages — does anyone else?",
    replies: 31,
    last: "1h"
  },
  {
    id: "th3",
    roomId: "d4",
    title: "Came off SSRIs last month — checking in",
    replies: 24,
    last: "2h"
  },
  {
    id: "th4",
    roomId: "d5",
    title: "Auntie calls it 'the spirit'. My therapist calls it depression. Both?",
    replies: 88,
    last: "3h"
  }
];

// ACADEMY
export const courses = [
  {
    id: "c1",
    title: "Foundations of Lived Experience Practice",
    blurb: "Six weeks. Ethics, story, listening, scope.",
    motif: "dwennimmen",
    progress: 42,
    modules: [
      {
        id: "m1",
        title: "Foundation",
        weeks: 6,
        lessons: [
          { id: "l1", title: "What is lived experience?", min: 18, done: true },
          {
            id: "l2",
            title: "The difference between sharing and projecting",
            min: 22,
            done: true
          },
          {
            id: "l3",
            title: "Story as method — narrative ethics",
            min: 27,
            done: true
          },
          {
            id: "l4",
            title: "When your story isn't ready to be told",
            min: 24,
            done: false,
            current: true
          },
          { id: "l5", title: "Confidentiality, even of the self", min: 16, done: false },
          { id: "l6", title: "Practice: a peer call, debriefed", min: 30, done: false }
        ]
      }
    ]
  },
  {
    id: "c2",
    title: "Crisis & Safeguarding for Peer Supporters",
    blurb: "How to spot, support, and escalate.",
    motif: "ankh",
    progress: 0,
    modules: []
  },
  {
    id: "c3",
    title: "Cultural Humility in Practice",
    blurb: "From colonial frames to community-rooted listening.",
    motif: "sankofa",
    progress: 0,
    modules: []
  }
];

// POSTS (for the wall)
export const wallPosts = [
  {
    id: "w1",
    body: "First time in months I sat at the table for Sunday lunch without rehearsing. Small win.",
    visibility: "tribe" as Visibility,
    likes: 14,
    comments: 3,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString()
  },
  {
    id: "w2",
    body: "Therapist asked what 'home' means. I cried for the first ten minutes. Worth it.",
    visibility: "tribe" as Visibility,
    likes: 22,
    comments: 7,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString()
  },
  {
    id: "w3",
    body: "Reminder to self: rest is also work.",
    visibility: "public" as Visibility,
    likes: 41,
    comments: 5,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString()
  }
];

// CRISIS RESOURCES
export const crisisResources = {
  GB: [
    { name: "Samaritans", phone: "116 123", url: "https://samaritans.org", hours: "24/7" },
    { name: "Shout (text)", phone: "Text 85258", url: "https://giveusashout.org", hours: "24/7" },
    { name: "NHS 111", phone: "111", url: "https://nhs.uk", hours: "24/7" }
  ],
  US: [
    { name: "988 Suicide & Crisis Lifeline", phone: "988", url: "https://988lifeline.org", hours: "24/7" },
    { name: "Crisis Text Line", phone: "Text HOME to 741741", url: "https://crisistextline.org", hours: "24/7" }
  ],
  NG: [
    { name: "Mentally Aware Nigeria", phone: "0809 210 6493", url: "https://mani.org.ng", hours: "Mon-Fri" }
  ],
  GH: [
    { name: "Mental Health Authority Ghana", phone: "+233 244 846 701", url: "#", hours: "Office hours" }
  ],
  CA: [
    { name: "Talk Suicide Canada", phone: "1-833-456-4566", url: "https://talksuicide.ca", hours: "24/7" }
  ]
};

// MODERATION
export const modReports = [
  {
    id: "rep1",
    targetKind: "post" as const,
    targetTitle: "Post in Tribe 'Bipolar peers'",
    reason: "crisis" as const,
    severity: "crisis" as const,
    status: "open" as const,
    createdAt: new Date(Date.now() - 1000 * 60 * 4).toISOString()
  },
  {
    id: "rep2",
    targetKind: "comment" as const,
    targetTitle: "Comment on 'Auntie calls it the spirit'",
    reason: "abuse" as const,
    severity: "high" as const,
    status: "open" as const,
    createdAt: new Date(Date.now() - 1000 * 60 * 22).toISOString()
  },
  {
    id: "rep3",
    targetKind: "profile" as const,
    targetTitle: "Profile @anon-1471",
    reason: "spam" as const,
    severity: "normal" as const,
    status: "triaged" as const,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString()
  }
];

// ONBOARDING — light/medium/heavy prompt library
export const promptLibrary = {
  light: [
    "What anchors you?",
    "A song that always works.",
    "What's home about home?",
    "A place I'd take a friend who needed to exhale.",
    "First language I dream in."
  ],
  medium: [
    "What brings you to this app?",
    "What does therapy mean in my family?",
    "A truth I'm still learning to say out loud.",
    "What I want from a Tribe.",
    "Where stigma shows up in my life."
  ],
  heavy: [
    "A part of my story I'm still working out.",
    "What I've lived through that I rarely name.",
    "How I carry what I carry."
  ]
};

export const codeOfConduct = [
  {
    id: "coc1",
    title: "Lived experience first",
    body: "We lead with story, not status. No 'expert' poses; no diagnoses imposed."
  },
  {
    id: "coc2",
    title: "Confidentiality is the floor",
    body: "What's said in your Tribe stays in your Tribe. Screenshots are a red line."
  },
  {
    id: "coc3",
    title: "Crisis isn't a debate",
    body: "If a member names crisis, we surface resources and call a mod. We do not argue."
  },
  {
    id: "coc4",
    title: "No content from machines",
    body: "Posts, comments and prompts are written by you. AI for accessibility (transcript, translation) is fine."
  },
  {
    id: "coc5",
    title: "Names, not diagnoses",
    body: "Ask before labeling. Self-description is the default; clinical labels are opt-in."
  },
  {
    id: "coc6",
    title: "Mods can join your room",
    body: "Audio rooms can be silently joined by an on-call mod. It's how we keep this safe."
  }
];

export const experienceTagPool = [
  "Anxiety",
  "Depression",
  "Bipolar",
  "PTSD",
  "Grief",
  "Diaspora",
  "Faith",
  "Family",
  "Stigma",
  "Therapy-positive",
  "Therapy-curious",
  "Self-described",
  "Medication",
  "Substance",
  "Recovery",
  "Burnout",
  "Carer",
  "Parent",
  "Father",
  "Mother",
  "First-gen"
];
