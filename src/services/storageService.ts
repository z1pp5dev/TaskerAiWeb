import { Category, TaskItem, BYOKConfig, SubTask, RecurrenceInterval, FREE_TIER_LIMITS } from '../types';

const STORAGE_KEYS = {
  TASKS: 'tasker_ai_tasks_v1',
  CATEGORIES: 'tasker_ai_categories_v1',
  BYOK_CONFIG: 'tasker_ai_byok_config_v1',
  THEME: 'tasker_ai_theme_v1'
};

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat_work', name: 'Work', color: '#a855f7' },
  { id: 'cat_personal', name: 'Personal', color: '#38bdf8' },
  { id: 'cat_health', name: 'Health', color: '#10b981' }
];

const DEFAULT_TASKS: TaskItem[] = [
  {
    id: 'task_demo_1',
    title: 'Explore Tasker AI & Goal Breakdown',
    description: 'Tap the AI Goal button or use Smart Add to automatically decompose complex goals into daily milestones.',
    dueDate: Date.now() + 1000 * 60 * 60 * 4, // 4 hours from now
    priority: 'HIGH',
    categoryId: 'cat_work',
    isCompleted: false,
    isRecurring: false,
    recurrenceInterval: 'NONE',
    hasAlarm: false,
    sortOrder: 0,
    createdAt: Date.now() - 1000 * 60 * 30,
    subtasks: [
      { id: 'sub_1', title: 'Open Settings and add your personal Gemini API key (BYOK)', isCompleted: false },
      { id: 'sub_2', title: 'Try dictating a task with the microphone button', isCompleted: false },
      { id: 'sub_3', title: 'Break down a major life goal with AI Goal Assistant', isCompleted: false }
    ]
  },
  {
    id: 'task_demo_2',
    title: 'Daily Mindfulness & 30-min Workout',
    description: 'Prioritize physical and mental clarity with recurring habits.',
    dueDate: Date.now() + 1000 * 60 * 60 * 8,
    priority: 'MEDIUM',
    categoryId: 'cat_health',
    isCompleted: false,
    isRecurring: true,
    recurrenceInterval: 'DAILY',
    hasAlarm: true,
    sortOrder: 1,
    createdAt: Date.now() - 1000 * 60 * 60,
    subtasks: [
      { id: 'sub_4', title: '10-minute meditation session', isCompleted: true },
      { id: 'sub_5', title: 'Core & cardio circuit', isCompleted: false }
    ]
  },
  {
    id: 'task_demo_3',
    title: 'Review Weekly Financial Budget',
    description: 'Track ongoing subscription costs and optimize savings allocation.',
    dueDate: Date.now() + 1000 * 60 * 60 * 24 * 2, // 2 days
    priority: 'LOW',
    categoryId: 'cat_personal',
    isCompleted: false,
    isRecurring: true,
    recurrenceInterval: 'WEEKLY',
    hasAlarm: false,
    sortOrder: 2,
    createdAt: Date.now() - 1000 * 60 * 120,
    subtasks: []
  }
];

const DEFAULT_BYOK_CONFIG: BYOKConfig = {
  apiKey: '',
  model: 'gemini-3.6-flash',
  isValidated: false,
  demoAiUsesCount: 0
};

const ALLOWED_TASK_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.6-pro',
  'gemini-3.6-flash-lite',
  'gemini-3.6-flash-8b'
];

export const storageService = {
  // Categories
  getCategories(): Category[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (!raw) {
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
        return DEFAULT_CATEGORIES;
      }
      return JSON.parse(raw);
    } catch (e) {
      console.error('Failed to load categories from localStorage:', e);
      return DEFAULT_CATEGORIES;
    }
  },

  saveCategories(categories: Category[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    } catch (e) {
      console.error('Failed to save categories to localStorage:', e);
    }
  },

  addCategory(name: string, color?: string): Category {
    const categories = this.getCategories();
    const newCategory: Category = {
      id: 'cat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      name: name.trim(),
      color: color || '#a855f7'
    };
    categories.push(newCategory);
    this.saveCategories(categories);
    return newCategory;
  },

  updateCategory(updatedCategory: Category): void {
    const categories = this.getCategories();
    const index = categories.findIndex((c) => c.id === updatedCategory.id);
    if (index !== -1) {
      categories[index] = updatedCategory;
      this.saveCategories(categories);
    }
  },

  deleteCategory(categoryId: string): void {
    const categories = this.getCategories().filter((c) => c.id !== categoryId);
    this.saveCategories(categories);

    // Cascade update to unassign deleted category from tasks
    const tasks = this.getTasks();
    let hasChanges = false;
    const updatedTasks = tasks.map((task) => {
      if (task.categoryId === categoryId) {
        hasChanges = true;
        return { ...task, categoryId: null };
      }
      return task;
    });

    if (hasChanges) {
      this.saveTasks(updatedTasks);
    }
  },

  // Tasks
  getTasks(): TaskItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (!raw) {
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(DEFAULT_TASKS));
        return DEFAULT_TASKS;
      }
      const parsed: TaskItem[] = JSON.parse(raw);
      // Ensure subtasks array exists on older records
      return parsed.map((t) => ({
        ...t,
        subtasks: Array.isArray(t.subtasks) ? t.subtasks : []
      }));
    } catch (e) {
      console.error('Failed to load tasks from localStorage:', e);
      return DEFAULT_TASKS;
    }
  },

  saveTasks(tasks: TaskItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    } catch (e) {
      console.error('Failed to save tasks to localStorage:', e);
    }
  },

  addTask(task: Omit<TaskItem, 'id' | 'createdAt' | 'sortOrder'>): TaskItem {
    const tasks = this.getTasks();
    const newTask: TaskItem = {
      ...task,
      id: 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      createdAt: Date.now(),
      sortOrder: 0,
      subtasks: task.subtasks || []
    };

    // Increment sortOrder for existing tasks
    const shiftedTasks = tasks.map((t) => ({ ...t, sortOrder: t.sortOrder + 1 }));
    shiftedTasks.unshift(newTask);
    this.saveTasks(shiftedTasks);
    return newTask;
  },

  updateTask(updatedTask: TaskItem): void {
    const tasks = this.getTasks();
    const index = tasks.findIndex((t) => t.id === updatedTask.id);
    if (index !== -1) {
      tasks[index] = updatedTask;
      this.saveTasks(tasks);
    }
  },

  deleteTask(taskId: string): void {
    const tasks = this.getTasks().filter((t) => t.id !== taskId);
    this.saveTasks(tasks);
  },

  toggleTaskCompletion(taskId: string): { updatedTask?: TaskItem; nextRecurringTask?: TaskItem } {
    const tasks = this.getTasks();
    const index = tasks.findIndex((t) => t.id === taskId);
    if (index === -1) return {};

    const currentTask = tasks[index];
    const newCompletionState = !currentTask.isCompleted;

    const updatedTask: TaskItem = {
      ...currentTask,
      isCompleted: newCompletionState,
      // If marking as completed, also mark subtasks as completed
      subtasks: newCompletionState
        ? currentTask.subtasks.map((s) => ({ ...s, isCompleted: true }))
        : currentTask.subtasks
    };

    tasks[index] = updatedTask;

    let nextRecurringTask: TaskItem | undefined;

    // Handle recurrence: when completing a recurring task, spawn the next occurrence
    if (newCompletionState && currentTask.isRecurring && currentTask.recurrenceInterval !== 'NONE') {
      const nextDueDate = this.calculateNextDueDate(currentTask.dueDate, currentTask.recurrenceInterval);
      nextRecurringTask = {
        ...currentTask,
        id: 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        isCompleted: false,
        dueDate: nextDueDate,
        createdAt: Date.now(),
        sortOrder: 0,
        subtasks: currentTask.subtasks.map((s) => ({
          ...s,
          id: 'sub_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          isCompleted: false
        }))
      };
      tasks.unshift(nextRecurringTask);
    }

    this.saveTasks(tasks);
    return { updatedTask, nextRecurringTask };
  },

  toggleSubtaskCompletion(taskId: string, subtaskId: string): TaskItem | null {
    const tasks = this.getTasks();
    const taskIndex = tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) return null;

    const task = tasks[taskIndex];
    const subtasks = task.subtasks.map((s) =>
      s.id === subtaskId ? { ...s, isCompleted: !s.isCompleted } : s
    );

    const allSubtasksDone = subtasks.length > 0 && subtasks.every((s) => s.isCompleted);
    const updatedTask: TaskItem = {
      ...task,
      subtasks,
      // Automatically toggle parent task if all subtasks are finished
      isCompleted: allSubtasksDone ? true : task.isCompleted
    };

    tasks[taskIndex] = updatedTask;
    this.saveTasks(tasks);
    return updatedTask;
  },

  clearCompletedTasks(): void {
    const tasks = this.getTasks().filter((t) => !t.isCompleted);
    this.saveTasks(tasks);
  },

  reorderTasks(reorderedTasks: TaskItem[]): void {
    const updated = reorderedTasks.map((task, idx) => ({
      ...task,
      sortOrder: idx
    }));
    this.saveTasks(updated);
  },

  calculateNextDueDate(currentDueDate: number | null, interval: RecurrenceInterval): number {
    const baseDate = currentDueDate ? new Date(currentDueDate) : new Date();
    const nextDate = new Date(baseDate.getTime());

    switch (interval) {
      case 'DAILY':
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case 'WEEKLY':
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case 'MONTHLY':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'YEARLY':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      default:
        break;
    }
    return nextDate.getTime();
  },

  // BYOK & Tier Configuration
  getBYOKConfig(): BYOKConfig {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.BYOK_CONFIG);
      if (!raw) {
        localStorage.setItem(STORAGE_KEYS.BYOK_CONFIG, JSON.stringify(DEFAULT_BYOK_CONFIG));
        return DEFAULT_BYOK_CONFIG;
      }
      const parsed = JSON.parse(raw);
      // Auto-migrate legacy/discontinued models to gemini-3.6-flash
      if (!parsed.model || !ALLOWED_TASK_MODELS.includes(parsed.model)) {
        parsed.model = 'gemini-3.6-flash';
        localStorage.setItem(STORAGE_KEYS.BYOK_CONFIG, JSON.stringify(parsed));
      }
      return { ...DEFAULT_BYOK_CONFIG, ...parsed };
    } catch (e) {
      console.error('Failed to load BYOK config:', e);
      return DEFAULT_BYOK_CONFIG;
    }
  },

  saveBYOKConfig(config: BYOKConfig): void {
    try {
      localStorage.setItem(STORAGE_KEYS.BYOK_CONFIG, JSON.stringify(config));
    } catch (e) {
      console.error('Failed to save BYOK config:', e);
    }
  },

  incrementDemoAiUses(): number {
    const config = this.getBYOKConfig();
    config.demoAiUsesCount = (config.demoAiUsesCount || 0) + 1;
    this.saveBYOKConfig(config);
    return config.demoAiUsesCount;
  },

  canUseAi(config: BYOKConfig): { allowed: boolean; reason?: string } {
    if (config.apiKey && config.isValidated) {
      return { allowed: true };
    }
    if (config.demoAiUsesCount < FREE_TIER_LIMITS.MAX_DEMO_AI_USES) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: `You've used all ${FREE_TIER_LIMITS.MAX_DEMO_AI_USES} free AI trials. Enter your personal Gemini API Key in Settings to unlock unlimited use for free!`
    };
  },

  // Backup & Reset
  resetToDefaults(): void {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(DEFAULT_TASKS));
    localStorage.setItem(STORAGE_KEYS.BYOK_CONFIG, JSON.stringify(DEFAULT_BYOK_CONFIG));
  },

  exportData(): string {
    const data = {
      tasks: this.getTasks(),
      categories: this.getCategories(),
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    };
    return JSON.stringify(data, null, 2);
  },

  importData(jsonString: string): { success: boolean; message: string } {
    try {
      const data = JSON.parse(jsonString);
      if (!data || !Array.isArray(data.tasks) || !Array.isArray(data.categories)) {
        return { success: false, message: 'Invalid backup file structure.' };
      }
      this.saveTasks(data.tasks);
      this.saveCategories(data.categories);
      return { success: true, message: `Successfully imported ${data.tasks.length} tasks and ${data.categories.length} categories!` };
    } catch (e) {
      return { success: false, message: 'Failed to parse backup JSON file.' };
    }
  }
};
