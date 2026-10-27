
export type Mood = 1 | 2 | 3 | 4 | 5;

export interface CheckIn {
  id: string;
  date: string;
  mood: Mood;
  stress: number;
  sleep: number;
  activity: "Low" | "Moderate" | "High";
  screenTime?: number;
  notes?: string;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  mood?: Mood;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  name: string;
  email: string;
  joinedAt: string;
}

export interface AppData {
  checkIns: CheckIn[];
  journalEntries: JournalEntry[];
  profile: UserProfile | null;
}
