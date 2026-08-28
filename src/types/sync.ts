export interface ProUserData {
  isPro: boolean;
  proUnlockType: string;
  proExpiresAt: string | null; // ISO 8601 string (e.g. 2026-08-28T15:30:00Z)
}

export interface SyncCategoryItem {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export interface SyncTaskItem {
  id: string;
  categoryId: string;
  title: string;
  isCompleted: boolean;
  priority: string;
  createdAt: string;
  updatedAt: string;
  description?: string;
  dueDate?: number | null;
  isRecurring?: boolean;
  recurrenceInterval?: string;
  hasAlarm?: boolean;
  sortOrder?: number;
  subtasks?: Array<{ id: string; title: string; isCompleted: boolean }>;
}

export interface AppDataBackup {
  version: string;
  lastSynced: string;
  user: ProUserData;
  categories: SyncCategoryItem[];
  tasks: SyncTaskItem[];
  brainDump: string; // Exact match to Kotlin @SerializedName("brainDump")
  byokConfig?: {
    apiKey: string;
    model: string;
    isValidated: boolean;
    lastValidatedAt?: number;
    demoAiUsesCount: number;
  };
}

// Backwards-compatible aliases
export type CategoryItem = SyncCategoryItem;
export type TaskItem = SyncTaskItem;
