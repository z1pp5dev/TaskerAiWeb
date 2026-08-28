export interface ProUserData {
  isPro: boolean;
  proUnlockType: "rewarded_ad_pass" | "lifetime" | "none";
  proExpiresAt: string | null; // ISO 8601 string (e.g. 2026-08-28T15:30:00Z)
}

export interface TaskItem {
  id: string;
  categoryId: string;
  title: string;
  isCompleted: boolean;
  priority: "High" | "Medium" | "Low";
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

export interface CategoryItem {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export interface AppDataBackup {
  version: string;
  lastSynced: string;
  user: ProUserData;
  categories: CategoryItem[];
  tasks: TaskItem[];
  brainDump: string;
  byokConfig?: {
    apiKey: string;
    model: string;
    isValidated: boolean;
    lastValidatedAt?: number;
    demoAiUsesCount: number;
  };
}
