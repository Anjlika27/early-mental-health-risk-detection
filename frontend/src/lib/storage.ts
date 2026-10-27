import type { AppData } from "../types";

const STORAGE_KEY = "mindful-path-demo-v1";

function createEmptyData(): AppData {
  return {
    checkIns: [],
    journalEntries: [],
    profile: null,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function loadAppData(): AppData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return createEmptyData();
    }

    const parsed: unknown = JSON.parse(saved);

    if (!isRecord(parsed)) {
      return createEmptyData();
    }

    return {
      checkIns: Array.isArray(parsed.checkIns) ? parsed.checkIns : [],
      journalEntries: Array.isArray(parsed.journalEntries)
        ? parsed.journalEntries
        : [],
      profile:
  isRecord(parsed.profile) &&
  typeof parsed.profile.name === "string" &&
  typeof parsed.profile.email === "string" &&
  typeof parsed.profile.joinedAt === "string"
    ? {
        name: parsed.profile.name,
        email: parsed.profile.email,
        joinedAt: parsed.profile.joinedAt,
      }
    : null,
    };
  } catch (error) {
    console.error("Unable to load saved MindfulPath data:", error);
    return createEmptyData();
  }
}

export function saveAppData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Unable to save MindfulPath data:", error);
    throw error;
  }
}

export function clearAppData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Unable to clear saved MindfulPath data:", error);
    throw error;
  }
}

export function createId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}