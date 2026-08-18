export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type RecurrenceInterval = 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export type AppScreen = 'DASHBOARD' | 'COMPLETED_HISTORY';

export type UserTier = 'FREE_DEMO' | 'BYOK_UNLOCKED';

export interface SubTask {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface Category {
  id: string;
  name: string;
  color?: string;
  icon?: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  dueDate: number | null; // Milliseconds timestamp
  priority: Priority;
  categoryId: string | null;
  isCompleted: boolean;
  isRecurring: boolean;
  recurrenceInterval: RecurrenceInterval;
  hasAlarm: boolean;
  sortOrder: number;
  createdAt: number;
  subtasks: SubTask[];
}

export interface BYOKConfig {
  apiKey: string;
  model: string;
  isValidated: boolean;
  lastValidatedAt?: number;
  demoAiUsesCount: number;
}

export interface TaskFilterState {
  categoryId: string | null;
  priority: Priority | null;
  searchQuery: string;
  selectedDate: number;
  showCompletedOnly: boolean;
}

export interface ToastNotification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface PriorityMeta {
  label: string;
  weight: number;
  bgClass: string;
  textClass: string;
  borderClass: string;
  accentBarColor: string;
}

export const PRIORITY_CONFIG: Record<Priority, PriorityMeta> = {
  LOW: {
    label: 'Low',
    weight: 1,
    bgClass: 'bg-sky-950/70 text-sky-300 border-sky-800/60',
    textClass: 'text-sky-400',
    borderClass: 'border-sky-500',
    accentBarColor: '#0369a1'
  },
  MEDIUM: {
    label: 'Medium',
    weight: 2,
    bgClass: 'bg-amber-950/70 text-amber-300 border-amber-800/60',
    textClass: 'text-amber-400',
    borderClass: 'border-amber-500',
    accentBarColor: '#b45309'
  },
  HIGH: {
    label: 'High',
    weight: 3,
    bgClass: 'bg-orange-950/70 text-orange-300 border-orange-800/60',
    textClass: 'text-orange-400',
    borderClass: 'border-orange-500',
    accentBarColor: '#c2410c'
  },
  URGENT: {
    label: 'Urgent',
    weight: 4,
    bgClass: 'bg-rose-950/70 text-rose-300 border-rose-800/60',
    textClass: 'text-rose-400',
    borderClass: 'border-rose-500',
    accentBarColor: '#dc2626'
  }
};

export const RECURRENCE_LABELS: Record<RecurrenceInterval, string> = {
  NONE: 'One-time',
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
  YEARLY: 'Yearly'
};

export const FREE_TIER_LIMITS = {
  MAX_CATEGORIES: 3,
  MAX_DEMO_AI_USES: 3,
};
