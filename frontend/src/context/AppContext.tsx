import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type {
  AppData,
  CheckIn,
  JournalEntry,
  UserProfile,
} from "../types";

import {
  clearAppData,
  createId,
  loadAppData,
  saveAppData,
} from "../lib/storage";

interface AppContextValue {
  data: AppData;
  updateProfile: (profile: UserProfile) => void;
  addCheckIn: (checkIn: Omit<CheckIn, "id" | "createdAt">) => void;
  deleteCheckIn: (id: string) => void;
  saveJournal: (
    entry: Omit<JournalEntry, "id" | "createdAt" | "updatedAt"> & {
      id?: string;
    }
  ) => void;
  deleteJournal: (id: string) => void;
  resetDemoData: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function createEmptyAppData(): AppData {
  return {
    checkIns: [],
    journalEntries: [],
    profile: null,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => {
    try {
      return loadAppData();
    } catch (error) {
      console.error("Unable to load MindfulPath data:", error);
      return createEmptyAppData();
    }
  });

  useEffect(() => {
    try {
      saveAppData(data);
    } catch (error) {
      console.error("Unable to save MindfulPath data:", error);
    }
  }, [data]);

  const updateProfile = useCallback((profile: UserProfile) => {
    setData((current) => ({
      ...current,
      profile,
    }));
  }, []);

  const addCheckIn = useCallback(
    (checkIn: Omit<CheckIn, "id" | "createdAt">) => {
      setData((current) => {
        const existingCheckIn = current.checkIns.find(
          (item) => item.date === checkIn.date
        );

        const savedCheckIn: CheckIn = {
          ...checkIn,
          id: existingCheckIn?.id ?? createId(),
          createdAt:
            existingCheckIn?.createdAt ?? new Date().toISOString(),
        };

        const otherCheckIns = current.checkIns.filter(
          (item) => item.date !== checkIn.date
        );

        return {
          ...current,
          checkIns: [savedCheckIn, ...otherCheckIns].sort((a, b) =>
            b.date.localeCompare(a.date)
          ),
        };
      });
    },
    []
  );

  const deleteCheckIn = useCallback((id: string) => {
    setData((current) => ({
      ...current,
      checkIns: current.checkIns.filter((item) => item.id !== id),
    }));
  }, []);

  const saveJournal = useCallback(
    (
      entry: Omit<JournalEntry, "id" | "createdAt" | "updatedAt"> & {
        id?: string;
      }
    ) => {
      setData((current) => {
        const existing = current.journalEntries.find(
          (item) => item.id === entry.id
        );

        const now = new Date().toISOString();

        const savedEntry: JournalEntry = {
          ...entry,
          id: existing?.id ?? createId(),
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
        };

        return {
          ...current,
          journalEntries: existing
            ? current.journalEntries.map((item) =>
                item.id === existing.id ? savedEntry : item
              )
            : [savedEntry, ...current.journalEntries],
        };
      });
    },
    []
  );

  const deleteJournal = useCallback((id: string) => {
    setData((current) => ({
      ...current,
      journalEntries: current.journalEntries.filter(
        (item) => item.id !== id
      ),
    }));
  }, []);

  const resetDemoData = useCallback(() => {
    try {
      clearAppData();
    } catch (error) {
      console.error("Unable to clear MindfulPath storage:", error);
    }

    setData(createEmptyAppData());
  }, []);

  return (
    <AppContext.Provider
      value={{
        data,
        updateProfile,
        addCheckIn,
        deleteCheckIn,
        saveJournal,
        deleteJournal,
        resetDemoData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppData(): AppContextValue {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useAppData must be used inside AppProvider.");
  }

  return context;
}