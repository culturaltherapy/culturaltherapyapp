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
    "First language I dream in.",
    "What makes you happy or brings you peace?",
    "What's your biggest success story?",
    "What would be your perfect Tribe?",
    "Is peer support / helping others something you would consider?",
    "Would you use your journey to help others?"
  ],
  medium: [
    "What brings you to this app?",
    "What does therapy mean in my family?",
    "A truth I'm still learning to say out loud.",
    "What I want from a Tribe.",
    "Where stigma shows up in my life.",
    "What are your best coping strategies?",
    "Has therapy helped? (If yes, share what helped.)",
    "Do you feel like you have a good support system?",
    "Who has been the most supportive to you in your journey?",
    "Are you diagnosed, undiagnosed, or self-diagnosed?"
  ],
  heavy: [
    "A part of my story I'm still working out.",
    "What I've lived through that I rarely name.",
    "How I carry what I carry.",
    "Have you ever been sectioned before?",
    "How long have you been managing mental health challenges?",
    "If you were professionally diagnosed, do you agree with it?",
    "Does mental health stigma affect you?",
    "Are you comfortable discussing trauma / lived experience here?"
  ]
};

// Comprehensive language list — broadened from the original 10 for a global diaspora.
// Users can also add custom languages via a text input that falls back to free-text.
export const LANGUAGE_OPTIONS = [
  // Common English-speaking & European
  "English", "French", "Portuguese", "Spanish", "Italian", "German", "Dutch", "Greek",
  "Russian", "Polish", "Romanian", "Hungarian",
  // West African
  "Twi", "Yoruba", "Igbo", "Hausa", "Pidgin English", "Wolof", "Fulani / Fulfulde",
  "Bambara", "Ewe", "Ga", "Mandinka",
  // East / Central African
  "Swahili", "Amharic", "Tigrinya", "Oromo", "Somali", "Lingala", "Kinyarwanda",
  "Luganda", "Kikuyu",
  // Southern African
  "Zulu", "Xhosa", "Sotho", "Tswana", "Shona", "Ndebele", "Afrikaans",
  // Caribbean
  "Patois", "Haitian Creole", "Krio",
  // Middle Eastern
  "Arabic", "Hebrew", "Persian / Farsi", "Turkish", "Kurdish",
  // South Asian
  "Hindi", "Urdu", "Bengali", "Punjabi", "Tamil", "Telugu", "Gujarati",
  "Marathi", "Malayalam", "Kannada", "Sinhala", "Nepali",
  // East / South-East Asian
  "Mandarin", "Cantonese", "Japanese", "Korean", "Vietnamese", "Thai",
  "Tagalog / Filipino", "Indonesian", "Malay", "Khmer", "Burmese",
  // Sign languages
  "BSL (British Sign Language)", "ASL (American Sign Language)",
];

// Social link platforms — each profile can have any/all of these.
// ─────────────────────────────────────────────────────────────────────────────
// Heritage / descent — every UN-recognised country (as a nationality / demonym),
// plus major sub-national, indigenous, regional, and diaspora identifiers.
// Mixed-heritage friendly (pick multiple). Users can also add their own via
// the TagPicker's custom input.
// ─────────────────────────────────────────────────────────────────────────────
export const HERITAGE_OPTIONS = [
  // ─── Africa ─────────────────────────────────────────────────
  // West African
  "Beninese", "Burkinabé", "Cabo Verdean", "Cameroonian", "Gambian", "Ghanaian",
  "Guinean", "Bissau-Guinean", "Ivorian", "Liberian", "Malian", "Nigerien",
  "Nigerian", "Senegalese", "Sierra Leonean", "Togolese",
  // East African
  "Burundian", "Comoran", "Djiboutian", "Eritrean", "Ethiopian", "Kenyan",
  "Malagasy", "Mauritian", "Rwandan", "Seychellois", "Somali", "South Sudanese",
  "Sudanese", "Tanzanian", "Ugandan",
  // Central African
  "Angolan", "Central African", "Chadian", "Congolese (DRC)",
  "Congolese (Brazzaville)", "Equatorial Guinean", "Gabonese", "Mozambican",
  "São Toméan",
  // Southern African
  "Botswanan", "Eswatini (Swazi)", "Lesothan", "Mosotho", "Malawian", "Namibian",
  "South African", "Zambian", "Zimbabwean",
  // North African
  "Algerian", "Egyptian", "Libyan", "Mauritanian", "Moroccan", "Sahrawi", "Tunisian",

  // ─── Asia ───────────────────────────────────────────────────
  // South Asian
  "Bangladeshi", "Bhutanese", "Indian", "Maldivian", "Nepali", "Pakistani",
  "Sri Lankan",
  // Indian sub-national / linguistic
  "Bengali", "Gujarati", "Kannada", "Kashmiri", "Malayali", "Marathi", "Punjabi",
  "Sindhi", "Tamil", "Telugu",
  // East Asian
  "Chinese", "Han Chinese", "Hakka", "Hong Konger", "Macanese", "Taiwanese",
  "Japanese", "Korean", "South Korean", "North Korean", "Mongolian", "Tibetan",
  // South-East Asian
  "Bruneian", "Burmese (Myanmar)", "Cambodian", "Filipino", "Hmong", "Indonesian",
  "Laotian", "Malaysian", "Singaporean", "Thai", "Timorese", "Vietnamese",
  // Central Asian
  "Afghan", "Kazakh", "Kyrgyz", "Tajik", "Turkmen", "Uzbek",
  // Caucasus
  "Armenian", "Azerbaijani", "Georgian",
  // Middle Eastern
  "Bahraini", "Emirati", "Iranian", "Iraqi", "Israeli", "Jordanian", "Kuwaiti",
  "Lebanese", "Omani", "Palestinian", "Qatari", "Saudi", "Syrian", "Turkish",
  "Yemeni",
  // Middle Eastern sub-ethnic
  "Assyrian", "Chaldean", "Druze", "Kurdish", "Bedouin", "Mizrahi", "Sephardic",

  // ─── Europe ─────────────────────────────────────────────────
  // British Isles
  "British", "English", "Scottish", "Welsh", "Northern Irish", "Irish",
  "Manx", "Cornish", "Gibraltarian",
  // Western
  "Andorran", "Austrian", "Belgian", "Dutch", "French", "German", "Liechtensteiner",
  "Luxembourgish", "Monégasque", "Swiss",
  // Southern
  "Italian", "Maltese", "Portuguese", "Spanish", "San Marinese", "Vatican",
  // Iberian sub-national
  "Basque", "Catalan", "Galician",
  // Nordic
  "Danish", "Faroese", "Finnish", "Greenlandic", "Icelandic", "Norwegian",
  "Sami", "Swedish",
  // Central / Eastern
  "Belarusian", "Bulgarian", "Czech", "Estonian", "Hungarian", "Latvian",
  "Lithuanian", "Moldovan", "Polish", "Romanian", "Russian", "Slovak",
  "Ukrainian",
  // Balkan / South-East European
  "Albanian", "Bosnian", "Croatian", "Cypriot", "Greek", "Kosovar",
  "North Macedonian", "Montenegrin", "Serbian", "Slovenian",
  // European other identifiers
  "Roma", "Romani", "Ashkenazi", "European Jewish", "Afropean",

  // ─── Americas — North ───────────────────────────────────────
  "American", "African American", "Black American", "Asian American",
  "Latino/Hispanic American", "Italian American", "Irish American",
  "Jewish American", "Arab American",
  "Canadian", "African Canadian", "Québécois", "Acadian",
  "Mexican", "Mexican American", "Chicano/Chicana",

  // ─── Caribbean ──────────────────────────────────────────────
  "Anguillan", "Antiguan", "Aruban", "Bahamian", "Bajan (Barbadian)",
  "Belizean", "Bermudian", "British Virgin Islander", "Caymanian",
  "Cuban", "Curaçaoan", "Dominican (Dominica)", "Dominican (DR)",
  "Grenadian", "Guyanese", "Haitian", "Jamaican", "Kittitian (St Kitts)",
  "Montserratian", "Puerto Rican", "St Lucian", "Surinamese",
  "Trinidadian", "Turks & Caicos Islander", "US Virgin Islander",
  "Vincentian (St Vincent)", "Afro-Caribbean",

  // ─── Americas — Central & South ─────────────────────────────
  "Argentine", "Bolivian", "Brazilian", "Chilean", "Colombian", "Costa Rican",
  "Ecuadorian", "Falkland Islander", "French Guianese", "Guatemalan",
  "Honduran", "Nicaraguan", "Panamanian", "Paraguayan", "Peruvian",
  "Salvadoran", "Uruguayan", "Venezuelan",
  // Indigenous & Afro-Latin
  "Afro-Latin", "Afro-Brazilian", "Quechua", "Aymara", "Mapuche",
  "Guaraní", "Garifuna",

  // ─── Oceania ────────────────────────────────────────────────
  "Australian", "New Zealander", "Pākehā",
  "Indigenous Australian", "Aboriginal Australian", "Torres Strait Islander",
  "Māori",
  "Cook Islander", "Fijian", "I-Kiribati", "Marshallese", "Micronesian",
  "Nauruan", "Niuean", "Palauan", "Papua New Guinean", "Samoan",
  "Solomon Islander", "Tongan", "Tuvaluan", "Vanuatuan",
  "Pacific Islander",

  // ─── Indigenous (Americas + global) ─────────────────────────
  "Native American", "First Nations (Canada)", "Métis", "Inuit",
  "Native Hawaiian",

  // ─── Diaspora / Mixed / Identity labels ─────────────────────
  "Black British", "British Asian", "Black European",
  "Mixed heritage", "Mixed Black & White", "Mixed Black & Asian",
  "Mixed Asian & White", "Mixed (other)", "Multiracial",
  "Diaspora (other)", "Other / prefer not to say",
];

// All UN-recognised countries (alphabetical). Users pick one via the
// searchable picker on the Location step.
export const COUNTRY_OPTIONS = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda",
  "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
  "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize",
  "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil",
  "Brunei", "Bulgaria", "Burkina Faso", "Burundi",
  "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic",
  "Chad", "Chile", "China", "Colombia", "Comoros", "Congo (Brazzaville)",
  "Congo (DRC)", "Costa Rica", "Côte d'Ivoire", "Croatia", "Cuba", "Cyprus", "Czechia",
  "Denmark", "Djibouti", "Dominica", "Dominican Republic",
  "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia",
  "Eswatini", "Ethiopia",
  "Fiji", "Finland", "France",
  "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada",
  "Guatemala", "Guinea", "Guinea-Bissau", "Guyana",
  "Haiti", "Honduras", "Hungary",
  "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy",
  "Jamaica", "Japan", "Jordan",
  "Kazakhstan", "Kenya", "Kiribati", "Kosovo", "Kuwait", "Kyrgyzstan",
  "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein",
  "Lithuania", "Luxembourg",
  "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta",
  "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia",
  "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar",
  "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua",
  "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway",
  "Oman",
  "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea", "Paraguay",
  "Peru", "Philippines", "Poland", "Portugal",
  "Qatar",
  "Romania", "Russia", "Rwanda",
  "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines",
  "Samoa", "San Marino", "São Tomé and Príncipe", "Saudi Arabia", "Senegal",
  "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia",
  "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan",
  "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria",
  "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga",
  "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu",
  "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States",
  "Uruguay", "Uzbekistan",
  "Vanuatu", "Vatican City", "Venezuela", "Vietnam",
  "Yemen",
  "Zambia", "Zimbabwe",
  "Other / prefer not to say",
];

// Curated city list per country (keyed by country NAME, matching COUNTRY_OPTIONS).
// Users can still type a custom city if theirs isn't listed.
export const CITIES_BY_COUNTRY: Record<string, string[]> = {
  "United Kingdom": ["London", "Manchester", "Birmingham", "Leeds", "Liverpool", "Sheffield",
       "Bristol", "Newcastle", "Nottingham", "Leicester", "Glasgow", "Edinburgh",
       "Cardiff", "Belfast", "Brighton", "Oxford", "Cambridge", "Reading",
       "Coventry", "Wolverhampton", "Bradford", "Croydon", "Luton", "Hackney"],
  "United States": ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia",
       "San Antonio", "San Diego", "Dallas", "Austin", "Jacksonville", "Fort Worth",
       "Columbus", "Indianapolis", "Charlotte", "San Francisco", "Seattle", "Denver",
       "Washington DC", "Boston", "Detroit", "Atlanta", "Miami", "Minneapolis",
       "New Orleans", "Baltimore", "Portland", "Las Vegas", "Memphis"],
  "Canada": ["Toronto", "Montreal", "Vancouver", "Calgary", "Edmonton", "Ottawa",
       "Winnipeg", "Quebec City", "Hamilton", "Brampton", "Mississauga", "Halifax",
       "Surrey", "Markham", "Victoria"],
  "Nigeria": ["Lagos", "Abuja", "Kano", "Ibadan", "Port Harcourt", "Benin City", "Kaduna",
       "Onitsha", "Aba", "Maiduguri", "Enugu", "Jos", "Ilorin", "Owerri",
       "Calabar", "Uyo", "Abeokuta", "Akure", "Warri", "Sokoto"],
  "Ghana": ["Accra", "Kumasi", "Tamale", "Takoradi", "Tema", "Sunyani", "Cape Coast",
       "Koforidua", "Ho", "Wa", "Bolgatanga", "Sekondi", "Madina", "Obuasi"],
  "Jamaica": ["Kingston", "Spanish Town", "Portmore", "Montego Bay", "Mandeville",
       "May Pen", "Old Harbour", "Linstead", "Ocho Rios", "Negril"],
  "South Africa": ["Johannesburg", "Cape Town", "Durban", "Pretoria", "Port Elizabeth",
       "Bloemfontein", "East London", "Pietermaritzburg", "Polokwane", "Nelspruit",
       "Kimberley", "Soweto"],
  "Kenya": ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Thika", "Malindi",
       "Kitale", "Garissa", "Kakamega", "Machakos", "Meru"],
  "Zimbabwe": ["Harare", "Bulawayo", "Chitungwiza", "Mutare", "Gweru", "Kwekwe", "Kadoma",
       "Masvingo", "Chinhoyi", "Marondera"],

  // ── All other UN-recognised countries (alphabetical) ──
  "Afghanistan": ["Kabul", "Kandahar", "Herat", "Mazar-i-Sharif", "Jalalabad", "Kunduz", "Ghazni"],
  "Albania": ["Tirana", "Durrës", "Vlorë", "Shkodër", "Elbasan", "Korçë", "Fier"],
  "Algeria": ["Algiers", "Oran", "Constantine", "Annaba", "Blida", "Batna", "Sétif", "Sidi Bel Abbès"],
  "Andorra": ["Andorra la Vella", "Escaldes-Engordany", "Encamp", "Sant Julià de Lòria", "La Massana", "Ordino"],
  "Angola": ["Luanda", "Huambo", "Lobito", "Benguela", "Lubango", "Kuito", "Malanje", "Namibe"],
  "Antigua and Barbuda": ["Saint John's", "All Saints", "Liberta", "Potter's Village", "Bolans", "Codrington"],
  "Argentina": ["Buenos Aires", "Córdoba", "Rosario", "Mendoza", "La Plata", "Tucumán", "Mar del Plata", "Salta"],
  "Armenia": ["Yerevan", "Gyumri", "Vanadzor", "Vagharshapat", "Hrazdan", "Abovyan", "Kapan"],
  "Australia": ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Gold Coast", "Canberra", "Newcastle", "Hobart", "Darwin"],
  "Austria": ["Vienna", "Graz", "Linz", "Salzburg", "Innsbruck", "Klagenfurt", "Villach", "Wels"],
  "Azerbaijan": ["Baku", "Ganja", "Sumqayit", "Mingachevir", "Lankaran", "Shirvan", "Nakhchivan"],
  "Bahamas": ["Nassau", "Freeport", "West End", "Coopers Town", "Marsh Harbour", "Andros Town"],
  "Bahrain": ["Manama", "Riffa", "Muharraq", "Hamad Town", "A'ali", "Isa Town", "Sitra"],
  "Bangladesh": ["Dhaka", "Chittagong", "Khulna", "Rajshahi", "Sylhet", "Mymensingh", "Barisal", "Rangpur"],
  "Barbados": ["Bridgetown", "Speightstown", "Oistins", "Bathsheba", "Holetown", "Hastings"],
  "Belarus": ["Minsk", "Gomel", "Mogilev", "Vitebsk", "Grodno", "Brest", "Bobruisk", "Baranovichi"],
  "Belgium": ["Brussels", "Antwerp", "Ghent", "Charleroi", "Liège", "Bruges", "Namur", "Leuven"],
  "Belize": ["Belmopan", "Belize City", "San Ignacio", "Orange Walk", "Dangriga", "Corozal", "Punta Gorda"],
  "Benin": ["Porto-Novo", "Cotonou", "Parakou", "Djougou", "Bohicon", "Kandi", "Abomey"],
  "Bhutan": ["Thimphu", "Phuntsholing", "Punakha", "Wangdue Phodrang", "Jakar", "Trashigang", "Mongar"],
  "Bolivia": ["La Paz", "Santa Cruz de la Sierra", "Cochabamba", "Sucre", "Oruro", "Tarija", "Potosí", "El Alto"],
  "Bosnia and Herzegovina": ["Sarajevo", "Banja Luka", "Tuzla", "Zenica", "Mostar", "Bijeljina", "Brčko"],
  "Botswana": ["Gaborone", "Francistown", "Molepolole", "Maun", "Serowe", "Selibe-Phikwe", "Kanye"],
  "Brazil": ["São Paulo", "Rio de Janeiro", "Brasília", "Salvador", "Fortaleza", "Belo Horizonte", "Manaus", "Curitiba", "Recife", "Porto Alegre"],
  "Brunei": ["Bandar Seri Begawan", "Kuala Belait", "Seria", "Tutong", "Bangar"],
  "Bulgaria": ["Sofia", "Plovdiv", "Varna", "Burgas", "Ruse", "Stara Zagora", "Pleven", "Sliven"],
  "Burkina Faso": ["Ouagadougou", "Bobo-Dioulasso", "Koudougou", "Banfora", "Ouahigouya", "Kaya", "Tenkodogo"],
  "Burundi": ["Gitega", "Bujumbura", "Muyinga", "Ruyigi", "Ngozi", "Kayanza", "Rumonge"],
  "Cabo Verde": ["Praia", "Mindelo", "Santa Maria", "Assomada", "Espargos", "São Filipe", "Pedra Badejo"],
  "Cambodia": ["Phnom Penh", "Siem Reap", "Battambang", "Sihanoukville", "Poipet", "Kampong Cham", "Takeo"],
  "Cameroon": ["Yaoundé", "Douala", "Bafoussam", "Bamenda", "Garoua", "Maroua", "Ngaoundéré", "Limbe"],
  "Central African Republic": ["Bangui", "Bimbo", "Berbérati", "Carnot", "Bambari", "Bouar", "Bossangoa"],
  "Chad": ["N'Djamena", "Moundou", "Sarh", "Abéché", "Kelo", "Doba", "Pala"],
  "Chile": ["Santiago", "Valparaíso", "Concepción", "La Serena", "Antofagasta", "Temuco", "Iquique", "Punta Arenas"],
  "China": ["Beijing", "Shanghai", "Guangzhou", "Shenzhen", "Chongqing", "Tianjin", "Chengdu", "Wuhan", "Hangzhou", "Hong Kong", "Xi'an", "Nanjing"],
  "Colombia": ["Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena", "Cúcuta", "Bucaramanga", "Pereira"],
  "Comoros": ["Moroni", "Mutsamudu", "Fomboni", "Domoni", "Tsembehou", "Sima"],
  "Congo (Brazzaville)": ["Brazzaville", "Pointe-Noire", "Dolisie", "Nkayi", "Owando", "Ouesso", "Madingou"],
  "Congo (DRC)": ["Kinshasa", "Lubumbashi", "Mbuji-Mayi", "Kananga", "Kisangani", "Goma", "Bukavu", "Mbandaka"],
  "Costa Rica": ["San José", "Alajuela", "Cartago", "Heredia", "Liberia", "Puntarenas", "Limón"],
  "Côte d'Ivoire": ["Abidjan", "Yamoussoukro", "Bouaké", "Daloa", "San-Pédro", "Korhogo", "Man", "Gagnoa"],
  "Croatia": ["Zagreb", "Split", "Rijeka", "Osijek", "Zadar", "Slavonski Brod", "Pula", "Dubrovnik"],
  "Cuba": ["Havana", "Santiago de Cuba", "Camagüey", "Holguín", "Santa Clara", "Guantánamo", "Bayamo", "Cienfuegos"],
  "Cyprus": ["Nicosia", "Limassol", "Larnaca", "Paphos", "Famagusta", "Kyrenia"],
  "Czechia": ["Prague", "Brno", "Ostrava", "Plzeň", "Liberec", "Olomouc", "České Budějovice", "Hradec Králové"],
  "Denmark": ["Copenhagen", "Aarhus", "Odense", "Aalborg", "Esbjerg", "Randers", "Kolding", "Vejle"],
  "Djibouti": ["Djibouti City", "Ali Sabieh", "Tadjoura", "Dikhil", "Obock", "Arta"],
  "Dominica": ["Roseau", "Portsmouth", "Marigot", "Berekua", "Mahaut", "Atkinson"],
  "Dominican Republic": ["Santo Domingo", "Santiago", "La Romana", "San Pedro de Macorís", "Puerto Plata", "San Cristóbal", "San Francisco de Macorís"],
  "Ecuador": ["Quito", "Guayaquil", "Cuenca", "Santo Domingo", "Machala", "Manta", "Portoviejo", "Loja"],
  "Egypt": ["Cairo", "Alexandria", "Giza", "Shubra El Kheima", "Port Said", "Suez", "Luxor", "Mansoura", "Aswan"],
  "El Salvador": ["San Salvador", "Santa Ana", "San Miguel", "Soyapango", "Mejicanos", "Santa Tecla", "Apopa"],
  "Equatorial Guinea": ["Malabo", "Bata", "Ebebiyín", "Aconibe", "Añisoc", "Luba", "Evinayong"],
  "Eritrea": ["Asmara", "Keren", "Massawa", "Assab", "Mendefera", "Barentu", "Adi Keyh"],
  "Estonia": ["Tallinn", "Tartu", "Narva", "Pärnu", "Kohtla-Järve", "Viljandi", "Maardu"],
  "Eswatini": ["Mbabane", "Manzini", "Lobamba", "Nhlangano", "Siteki", "Big Bend"],
  "Ethiopia": ["Addis Ababa", "Dire Dawa", "Mek'ele", "Adama", "Gondar", "Hawassa", "Bahir Dar", "Dessie"],
  "Fiji": ["Suva", "Nadi", "Lautoka", "Labasa", "Nausori", "Ba", "Sigatoka"],
  "Finland": ["Helsinki", "Espoo", "Tampere", "Vantaa", "Turku", "Oulu", "Lahti", "Kuopio"],
  "France": ["Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", "Strasbourg", "Montpellier", "Bordeaux", "Lille", "Rennes"],
  "Gabon": ["Libreville", "Port-Gentil", "Franceville", "Oyem", "Moanda", "Lambaréné", "Mouila"],
  "Gambia": ["Banjul", "Serekunda", "Brikama", "Bakau", "Farafenni", "Lamin", "Sukuta"],
  "Georgia": ["Tbilisi", "Kutaisi", "Batumi", "Rustavi", "Zugdidi", "Gori", "Poti", "Sokhumi"],
  "Germany": ["Berlin", "Hamburg", "Munich", "Cologne", "Frankfurt", "Stuttgart", "Düsseldorf", "Leipzig", "Dortmund", "Essen", "Bremen"],
  "Greece": ["Athens", "Thessaloniki", "Patras", "Heraklion", "Larissa", "Volos", "Ioannina", "Chania"],
  "Grenada": ["Saint George's", "Gouyave", "Grenville", "Victoria", "Saint David's"],
  "Guatemala": ["Guatemala City", "Mixco", "Villa Nueva", "Quetzaltenango", "Escuintla", "Cobán"],
  "Guinea": ["Conakry", "Nzérékoré", "Kankan", "Kindia", "Labé", "Boké", "Mamou", "Faranah"],
  "Guinea-Bissau": ["Bissau", "Bafatá", "Gabú", "Bissorã", "Bolama", "Cacheu", "Catió"],
  "Guyana": ["Georgetown", "Linden", "New Amsterdam", "Anna Regina", "Bartica", "Mahdia", "Lethem"],
  "Haiti": ["Port-au-Prince", "Cap-Haïtien", "Gonaïves", "Pétion-Ville", "Les Cayes", "Jacmel", "Jérémie"],
  "Honduras": ["Tegucigalpa", "San Pedro Sula", "Choloma", "La Ceiba", "El Progreso", "Comayagua"],
  "Hungary": ["Budapest", "Debrecen", "Szeged", "Miskolc", "Pécs", "Győr", "Nyíregyháza", "Kecskemét"],
  "Iceland": ["Reykjavík", "Kópavogur", "Hafnarfjörður", "Akureyri", "Reykjanesbær", "Garðabær"],
  "India": ["New Delhi", "Mumbai", "Bengaluru", "Kolkata", "Chennai", "Hyderabad", "Ahmedabad", "Pune", "Jaipur", "Lucknow", "Surat", "Kanpur"],
  "Indonesia": ["Jakarta", "Surabaya", "Bandung", "Medan", "Semarang", "Makassar", "Palembang", "Tangerang", "Depok"],
  "Iran": ["Tehran", "Mashhad", "Isfahan", "Karaj", "Shiraz", "Tabriz", "Qom", "Ahvaz"],
  "Iraq": ["Baghdad", "Basra", "Mosul", "Erbil", "Kirkuk", "Najaf", "Karbala", "Sulaymaniyah"],
  "Ireland": ["Dublin", "Cork", "Galway", "Limerick", "Waterford", "Sligo", "Drogheda", "Dundalk", "Kilkenny", "Wexford"],
  "Israel": ["Jerusalem", "Tel Aviv", "Haifa", "Rishon LeZion", "Petah Tikva", "Ashdod", "Netanya", "Beersheba"],
  "Italy": ["Rome", "Milan", "Naples", "Turin", "Palermo", "Genoa", "Bologna", "Florence", "Venice", "Verona", "Bari"],
  "Japan": ["Tokyo", "Yokohama", "Osaka", "Nagoya", "Sapporo", "Fukuoka", "Kobe", "Kawasaki", "Kyoto", "Hiroshima"],
  "Jordan": ["Amman", "Zarqa", "Irbid", "Russeifa", "Aqaba", "Madaba", "Salt", "Jerash"],
  "Kazakhstan": ["Astana", "Almaty", "Shymkent", "Karaganda", "Aktobe", "Taraz", "Pavlodar", "Öskemen"],
  "Kiribati": ["Tarawa", "Betio", "Bairiki", "Bikenibeu", "Eita"],
  "Kosovo": ["Pristina", "Prizren", "Peja", "Mitrovica", "Gjakova", "Gjilan", "Ferizaj"],
  "Kuwait": ["Kuwait City", "Hawalli", "Salmiya", "Jahra", "Farwaniya", "Ahmadi"],
  "Kyrgyzstan": ["Bishkek", "Osh", "Jalal-Abad", "Karakol", "Tokmok", "Naryn", "Talas"],
  "Laos": ["Vientiane", "Pakse", "Savannakhet", "Luang Prabang", "Thakhek", "Xam Neua"],
  "Latvia": ["Riga", "Daugavpils", "Liepāja", "Jelgava", "Jūrmala", "Ventspils", "Rēzekne"],
  "Lebanon": ["Beirut", "Tripoli", "Sidon", "Tyre", "Zahlé", "Baalbek", "Jounieh"],
  "Lesotho": ["Maseru", "Teyateyaneng", "Mafeteng", "Hlotse", "Mohale's Hoek", "Maputsoe"],
  "Liberia": ["Monrovia", "Gbarnga", "Buchanan", "Kakata", "Voinjama", "Harper", "Robertsport"],
  "Libya": ["Tripoli", "Benghazi", "Misrata", "Bayda", "Zawiya", "Sabha", "Sirte"],
  "Liechtenstein": ["Vaduz", "Schaan", "Triesen", "Balzers", "Eschen", "Mauren"],
  "Lithuania": ["Vilnius", "Kaunas", "Klaipėda", "Šiauliai", "Panevėžys", "Alytus", "Marijampolė"],
  "Luxembourg": ["Luxembourg City", "Esch-sur-Alzette", "Differdange", "Dudelange", "Ettelbruck"],
  "Madagascar": ["Antananarivo", "Toamasina", "Antsirabe", "Mahajanga", "Fianarantsoa", "Toliara", "Antsiranana"],
  "Malawi": ["Lilongwe", "Blantyre", "Mzuzu", "Zomba", "Karonga", "Kasungu", "Mangochi"],
  "Malaysia": ["Kuala Lumpur", "George Town", "Ipoh", "Johor Bahru", "Kuching", "Kota Kinabalu", "Malacca", "Putrajaya"],
  "Maldives": ["Malé", "Addu City", "Fuvahmulah", "Kulhudhuffushi", "Thinadhoo"],
  "Mali": ["Bamako", "Sikasso", "Mopti", "Ségou", "Kayes", "Timbuktu", "Gao"],
  "Malta": ["Valletta", "Birkirkara", "Mosta", "Sliema", "Qormi", "Naxxar", "Żabbar"],
  "Marshall Islands": ["Majuro", "Ebeye", "Arno", "Jaluit", "Wotje"],
  "Mauritania": ["Nouakchott", "Nouadhibou", "Rosso", "Adrar", "Kaédi", "Zouérat"],
  "Mauritius": ["Port Louis", "Beau Bassin-Rose Hill", "Vacoas-Phoenix", "Curepipe", "Quatre Bornes", "Triolet"],
  "Mexico": ["Mexico City", "Guadalajara", "Monterrey", "Puebla", "Tijuana", "León", "Juárez", "Cancún", "Mérida"],
  "Micronesia": ["Palikir", "Weno", "Tofol", "Kolonia", "Colonia"],
  "Moldova": ["Chișinău", "Tiraspol", "Bălți", "Bender", "Cahul", "Ungheni", "Soroca"],
  "Monaco": ["Monaco-Ville", "Monte Carlo", "La Condamine", "Fontvieille"],
  "Mongolia": ["Ulaanbaatar", "Erdenet", "Darkhan", "Choibalsan", "Mörön", "Khovd"],
  "Montenegro": ["Podgorica", "Nikšić", "Pljevlja", "Bijelo Polje", "Cetinje", "Bar", "Herceg Novi"],
  "Morocco": ["Rabat", "Casablanca", "Marrakech", "Fez", "Tangier", "Agadir", "Meknes", "Oujda"],
  "Mozambique": ["Maputo", "Matola", "Beira", "Nampula", "Chimoio", "Nacala", "Quelimane"],
  "Myanmar": ["Naypyidaw", "Yangon", "Mandalay", "Mawlamyine", "Bago", "Pathein", "Monywa"],
  "Namibia": ["Windhoek", "Walvis Bay", "Swakopmund", "Oshakati", "Rundu", "Rehoboth"],
  "Nauru": ["Yaren", "Anibare", "Baiti", "Denigomodu", "Aiwo"],
  "Nepal": ["Kathmandu", "Pokhara", "Lalitpur", "Bharatpur", "Biratnagar", "Birgunj"],
  "Netherlands": ["Amsterdam", "Rotterdam", "The Hague", "Utrecht", "Eindhoven", "Tilburg", "Groningen", "Almere"],
  "New Zealand": ["Wellington", "Auckland", "Christchurch", "Hamilton", "Tauranga", "Dunedin", "Palmerston North"],
  "Nicaragua": ["Managua", "León", "Masaya", "Granada", "Chinandega", "Matagalpa", "Estelí"],
  "Niger": ["Niamey", "Zinder", "Maradi", "Agadez", "Tahoua", "Dosso"],
  "North Korea": ["Pyongyang", "Hamhung", "Chongjin", "Wonsan", "Kaesong", "Sariwon"],
  "North Macedonia": ["Skopje", "Bitola", "Kumanovo", "Prilep", "Tetovo", "Veles", "Ohrid"],
  "Norway": ["Oslo", "Bergen", "Trondheim", "Stavanger", "Drammen", "Fredrikstad", "Kristiansand", "Tromsø"],
  "Oman": ["Muscat", "Salalah", "Nizwa", "Sohar", "Sur", "Bahla", "Rustaq"],
  "Pakistan": ["Islamabad", "Karachi", "Lahore", "Faisalabad", "Rawalpindi", "Multan", "Peshawar", "Quetta", "Hyderabad"],
  "Palau": ["Ngerulmud", "Koror", "Airai", "Meyungs"],
  "Palestine": ["Ramallah", "East Jerusalem", "Gaza", "Hebron", "Nablus", "Bethlehem", "Jenin", "Jericho"],
  "Panama": ["Panama City", "San Miguelito", "Colón", "David", "Santiago", "Chitré"],
  "Papua New Guinea": ["Port Moresby", "Lae", "Mount Hagen", "Madang", "Wewak", "Goroka"],
  "Paraguay": ["Asunción", "Ciudad del Este", "San Lorenzo", "Capiatá", "Lambaré", "Encarnación"],
  "Peru": ["Lima", "Arequipa", "Trujillo", "Chiclayo", "Piura", "Cusco", "Iquitos", "Huancayo"],
  "Philippines": ["Manila", "Quezon City", "Davao", "Cebu", "Caloocan", "Zamboanga", "Antipolo", "Pasig"],
  "Poland": ["Warsaw", "Kraków", "Łódź", "Wrocław", "Poznań", "Gdańsk", "Szczecin", "Lublin", "Katowice"],
  "Portugal": ["Lisbon", "Porto", "Amadora", "Braga", "Setúbal", "Coimbra", "Funchal", "Aveiro"],
  "Qatar": ["Doha", "Al Rayyan", "Umm Salal", "Al Khor", "Al Wakrah", "Mesaieed"],
  "Romania": ["Bucharest", "Cluj-Napoca", "Timișoara", "Iași", "Constanța", "Craiova", "Brașov", "Galați"],
  "Russia": ["Moscow", "Saint Petersburg", "Novosibirsk", "Yekaterinburg", "Kazan", "Nizhny Novgorod", "Chelyabinsk", "Samara"],
  "Rwanda": ["Kigali", "Butare", "Gitarama", "Ruhengeri", "Gisenyi", "Byumba", "Cyangugu"],
  "Saint Kitts and Nevis": ["Basseterre", "Charlestown", "Sandy Point Town", "Cayon", "Old Road Town"],
  "Saint Lucia": ["Castries", "Vieux Fort", "Soufrière", "Dennery", "Gros Islet", "Micoud"],
  "Saint Vincent and the Grenadines": ["Kingstown", "Layou", "Barrouallie", "Georgetown", "Chateaubelair", "Port Elizabeth"],
  "Samoa": ["Apia", "Asau", "Mulifanua", "Saleimoa", "Salelologa"],
  "San Marino": ["City of San Marino", "Serravalle", "Borgo Maggiore", "Domagnano", "Faetano"],
  "São Tomé and Príncipe": ["São Tomé", "Santo Antônio", "Trindade", "Neves", "Santana"],
  "Saudi Arabia": ["Riyadh", "Jeddah", "Mecca", "Medina", "Dammam", "Khobar", "Tabuk", "Abha"],
  "Senegal": ["Dakar", "Touba", "Thiès", "Saint-Louis", "Kaolack", "Ziguinchor", "Diourbel"],
  "Serbia": ["Belgrade", "Novi Sad", "Niš", "Kragujevac", "Subotica", "Pančevo", "Čačak"],
  "Seychelles": ["Victoria", "Anse Boileau", "Beau Vallon", "Cascade", "Bel Ombre", "Glacis"],
  "Sierra Leone": ["Freetown", "Bo", "Kenema", "Makeni", "Koidu", "Lunsar", "Port Loko"],
  "Singapore": ["Singapore"],
  "Slovakia": ["Bratislava", "Košice", "Prešov", "Žilina", "Nitra", "Trnava", "Banská Bystrica"],
  "Slovenia": ["Ljubljana", "Maribor", "Celje", "Kranj", "Velenje", "Koper", "Novo Mesto"],
  "Solomon Islands": ["Honiara", "Auki", "Gizo", "Buala", "Tulagi"],
  "Somalia": ["Mogadishu", "Hargeisa", "Bosaso", "Galkayo", "Kismayo", "Berbera", "Baidoa"],
  "South Korea": ["Seoul", "Busan", "Incheon", "Daegu", "Daejeon", "Gwangju", "Suwon", "Ulsan"],
  "South Sudan": ["Juba", "Wau", "Malakal", "Yei", "Aweil", "Bor", "Rumbek"],
  "Spain": ["Madrid", "Barcelona", "Valencia", "Seville", "Zaragoza", "Málaga", "Murcia", "Bilbao", "Granada"],
  "Sri Lanka": ["Colombo", "Sri Jayawardenepura Kotte", "Galle", "Kandy", "Jaffna", "Negombo", "Trincomalee"],
  "Sudan": ["Khartoum", "Omdurman", "Port Sudan", "Kassala", "Nyala", "El Obeid", "Wad Madani"],
  "Suriname": ["Paramaribo", "Lelydorp", "Nieuw Nickerie", "Moengo", "Brokopondo", "Albina"],
  "Sweden": ["Stockholm", "Gothenburg", "Malmö", "Uppsala", "Västerås", "Örebro", "Linköping", "Helsingborg"],
  "Switzerland": ["Bern", "Zurich", "Geneva", "Basel", "Lausanne", "Lucerne", "Lugano", "St. Gallen"],
  "Syria": ["Damascus", "Aleppo", "Homs", "Latakia", "Hama", "Deir ez-Zor", "Raqqa", "Tartus"],
  "Taiwan": ["Taipei", "Kaohsiung", "Taichung", "Tainan", "Hsinchu", "Keelung", "Chiayi"],
  "Tajikistan": ["Dushanbe", "Khujand", "Kulob", "Qurghonteppa", "Istaravshan", "Tursunzoda"],
  "Tanzania": ["Dodoma", "Dar es Salaam", "Mwanza", "Arusha", "Mbeya", "Morogoro", "Tanga", "Zanzibar"],
  "Thailand": ["Bangkok", "Nonthaburi", "Chiang Mai", "Pattaya", "Phuket", "Khon Kaen", "Udon Thani"],
  "Timor-Leste": ["Dili", "Baucau", "Maliana", "Lospalos", "Same", "Suai"],
  "Togo": ["Lomé", "Sokodé", "Kara", "Kpalimé", "Atakpamé", "Bassar", "Tsévié"],
  "Tonga": ["Nukuʻalofa", "Neiafu", "Haveluloto", "Vaini", "Pangai"],
  "Trinidad and Tobago": ["Port of Spain", "San Fernando", "Chaguanas", "Arima", "Point Fortin", "Scarborough"],
  "Tunisia": ["Tunis", "Sfax", "Sousse", "Kairouan", "Bizerte", "Gabès", "Ariana"],
  "Turkey": ["Istanbul", "Ankara", "Izmir", "Bursa", "Adana", "Gaziantep", "Konya", "Antalya"],
  "Turkmenistan": ["Ashgabat", "Türkmenabat", "Daşoguz", "Mary", "Balkanabat", "Türkmenbaşy"],
  "Tuvalu": ["Funafuti", "Asau", "Tanrake", "Toga"],
  "Uganda": ["Kampala", "Wakiso", "Mukono", "Gulu", "Mbarara", "Jinja", "Mbale", "Lira"],
  "Ukraine": ["Kyiv", "Kharkiv", "Odesa", "Dnipro", "Donetsk", "Zaporizhzhia", "Lviv", "Mariupol"],
  "United Arab Emirates": ["Abu Dhabi", "Dubai", "Sharjah", "Al Ain", "Ajman", "Ras Al Khaimah", "Fujairah"],
  "Uruguay": ["Montevideo", "Salto", "Paysandú", "Las Piedras", "Rivera", "Maldonado", "Tacuarembó"],
  "Uzbekistan": ["Tashkent", "Samarkand", "Namangan", "Andijan", "Bukhara", "Nukus", "Fergana"],
  "Vanuatu": ["Port Vila", "Luganville", "Norsup", "Sola", "Isangel"],
  "Vatican City": ["Vatican City"],
  "Venezuela": ["Caracas", "Maracaibo", "Valencia", "Barquisimeto", "Maracay", "Ciudad Guayana", "Maturín"],
  "Vietnam": ["Hanoi", "Ho Chi Minh City", "Hai Phong", "Can Tho", "Da Nang", "Bien Hoa", "Hue", "Nha Trang"],
  "Yemen": ["Sana'a", "Aden", "Taiz", "Hodeidah", "Mukalla", "Ibb", "Dhamar"],
  "Zambia": ["Lusaka", "Kitwe", "Ndola", "Kabwe", "Chingola", "Mufulira", "Livingstone"],
};

export const SOCIAL_PLATFORMS = [
  { value: "instagram", label: "Instagram", prefix: "https://instagram.com/" },
  { value: "twitter",   label: "X / Twitter", prefix: "https://x.com/" },
  { value: "tiktok",    label: "TikTok",     prefix: "https://tiktok.com/@" },
  { value: "linkedin",  label: "LinkedIn",   prefix: "https://linkedin.com/in/" },
  { value: "youtube",   label: "YouTube",    prefix: "https://youtube.com/@" },
  { value: "website",   label: "Website",    prefix: "https://" },
  { value: "other",     label: "Other",      prefix: "" },
] as const;

export const codeOfConduct = [
  {
    id: "coc1",
    title: "Lived experience comes first",
    body: "Cultural Therapy is built on the belief that the people who've lived through mental health challenges have the most valuable knowledge to share. When you post, comment, or message someone here, lead with your own story — not a position of authority over theirs. Don't diagnose other members. Don't tell people what they 'really' have. Speak from where you've stood."
  },
  {
    id: "coc2",
    title: "What's said here, stays here",
    body: "Conversations inside Tribes, Villages, direct messages, and threads are private to the people in them. Do not share, copy, paste, repost, or describe what other members say — anywhere outside this app. This includes social media, group chats, family conversations, and journalism. The app will display the viewer's username faintly across sensitive screens; if a screenshot ever surfaces, it will identify the person who took it. Breaching confidentiality is one of the fastest routes to having your account permanently removed."
  },
  {
    id: "coc3",
    title: "Crisis is not a discussion",
    body: "If another member names that they're in crisis — actively suicidal, in danger, or in immediate distress — your job is not to debate, evaluate, or fix. Use the crisis button at the top of every page to surface professional resources, and report the conversation so a trained moderator can step in within 15 minutes. We are peers, not clinicians. The moderator on call exists for exactly this reason."
  },
  {
    id: "coc4",
    title: "No content from machines",
    body: "All posts, comments, prompt answers, profile bios, and messages should be written by you — a human. Using artificial intelligence to generate the substance of what you say to another member breaks the trust this network depends on. Using accessibility tools (live transcription, screen readers, translation between languages you actually speak) is fine and encouraged. If we detect AI-generated content posing as personal experience, we will remove it and may suspend the account."
  },
  {
    id: "coc5",
    title: "Self-description over clinical labels",
    body: "Use language that the person uses about themselves. If a member describes themselves as 'living with bipolar', call them that — not 'a bipolar person'. Don't slap clinical terms onto people who haven't claimed them. Don't ask someone to disclose their diagnosis unless they've said they're open to it. Lived experience is not an identity check."
  },
  {
    id: "coc6",
    title: "Moderators may quietly observe",
    body: "Trained moderators may silently join Village audio rooms and read public Tribe threads as part of keeping the space safe — they do not announce their presence. They never join 1-on-1 direct messages or Village text threads unless something has been reported. Moderators may message you directly if a safeguarding concern is raised. Their role is to protect members, not to surveil them."
  },
  {
    id: "coc7",
    title: "No harassment, hate, or discrimination",
    body: "Slurs, hate speech, sexual harassment, threats, doxxing (sharing someone's real-world details), persistent unwanted contact, or any conduct targeting a member based on race, ethnicity, religion, gender, sexuality, disability, age, body, or background — will result in account suspension or removal. Disagreement is fine; cruelty is not. If you witness it, report it."
  },
  {
    id: "coc8",
    title: "Don't share personal contact details in chat",
    body: "Don't share — or ask another member to share — their phone number, home address, financial details, government ID, or any information a stranger could use to find or harm them. Keep conversations inside the app where moderators can see context if something goes wrong. Voice and video calls are only available between accredited peer supporters and the members they work with."
  },
  {
    id: "coc9",
    title: "Reporting and consequences",
    body: "Every post, comment, message, and audio room has a 'report' option. Reports go to a human moderator and are reviewed within 15 minutes during peak hours. Depending on what we find, action ranges from a private warning, to content removal, to temporary suspension, to permanent account removal. Repeated reports about your conduct, even if individually minor, will trigger a review. Decisions can be appealed by emailing support."
  },
  {
    id: "coc10",
    title: "Legal and terms",
    body: "By accepting this code of conduct you also accept Cultural Therapy's terms of service and privacy policy. You confirm you are 18 or older. You agree that we may store the information you provide during onboarding (including your real name for safeguarding purposes — never shown publicly), and may share information with emergency services where there is a credible threat to life. You may request access to or deletion of your account at any time from Settings. Your relationship with this service is governed by the laws of England and Wales."
  }
];

export const experienceTagPool = [
  // — Mental health & wellbeing —
  "Anxiety",
  "Depression",
  "Bipolar",
  "OCD",
  "Schizophrenia",
  "Psychosis",
  "PTSD",
  "Complex trauma",
  "ADHD",
  "Autism",
  "Neurodivergent",
  "Eating disorder",
  "Self-harm",
  "Suicidal ideation",
  "Panic",
  "Insomnia",
  "Burnout",
  "Grief",
  "Substance",
  "Medication",
  "Recovery",
  "Therapy-positive",
  "Therapy-curious",
  "Self-described",
  "Stigma",
  // — Identity, culture & faith —
  "Diaspora",
  "First-gen",
  "Second-gen",
  "Immigrant",
  "Returnee",
  "Mixed heritage",
  "Adopted",
  "Faith",
  "Faith journey",
  "Spirituality",
  "Religion",
  "Black history",
  "Political",
  "Gender",
  "Sexuality",
  "LGBTQ+",
  // — Life stage, class & family —
  "Eldest child",
  "Middle child",
  "Youngest child",
  "Only child",
  "Parent",
  "Father",
  "Mother",
  "Single parent",
  "Co-parenting",
  "Carer",
  "Estranged family",
  "Working class",
  "Middle class",
  "Upper class",
  "Family",
];
