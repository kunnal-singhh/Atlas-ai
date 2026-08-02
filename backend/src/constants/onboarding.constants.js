export const ONBOARDING_STEPS = {
  IDLE: 'IDLE',
  ASK_PROFESSION: 'ASK_PROFESSION',
  ASK_INDUSTRIES: 'ASK_INDUSTRIES',
  ASK_TOPICS: 'ASK_TOPICS',
  ASK_COMPANIES: 'ASK_COMPANIES',
  ASK_BRIEF_TIME: 'ASK_BRIEF_TIME',
  ASK_CUSTOM_TIME: 'ASK_CUSTOM_TIME',
  ASK_NOTIFICATIONS: 'ASK_NOTIFICATIONS',
  COMPLETED: 'COMPLETED',
  SKIPPED: 'SKIPPED',
};

export const PRESET_PROFESSIONS = [
  'Software Engineer',
  'Student',
  'Founder / CEO',
  'Investor / VC',
  'Product Manager',
  'Researcher',
];

export const PRESET_INDUSTRIES = [
  'Technology',
  'Artificial Intelligence',
  'Finance & Crypto',
  'Healthcare',
  'Startups & VC',
  'Education',
  'E-commerce',
  'Clean Energy',
];

export const PRESET_BRIEF_TIMES = [
  { label: '🌅 8:00 AM', value: '08:00' },
  { label: '☀️ 9:00 AM', value: '09:00' },
  { label: '🌆 6:00 PM', value: '18:00' },
  { label: '🌙 9:00 PM', value: '21:00' },
];

export const NOTIFICATION_TYPES = [
  { key: 'morningBrief', label: '🌅 Morning Brief' },
  { key: 'eveningSummary', label: '🌆 Evening Summary' },
  { key: 'weeklyDigest', label: '📊 Weekly Digest' },
  { key: 'breakingNews', label: '🚨 Breaking News Alerts' },
];