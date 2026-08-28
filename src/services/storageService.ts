import { Category, TaskItem, BYOKConfig, SubTask, RecurrenceInterval, FREE_TIER_LIMITS, Priority } from '../types';
import { ProUserData } from '../types/sync';
import { googleDriveService } from './googleDriveService';

const STORAGE_KEYS = {
  TASKS: 'tasker_ai_tasks_v1',
  CATEGORIES: 'tasker_ai_categories_v1',
  BYOK_CONFIG: 'tasker_ai_byok_config_v1',
  PRO_USER: 'tasker_ai_pro_user_data_v1',
  BRAIN_DUMP: 'tasker_ai_brain_dump_v1',
  THEME: 'tasker_ai_theme_v1',
  NOTES: 'tasker_ai_notes_v1'
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
    isDeleted: false,
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
    isDeleted: false,
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
    isDeleted: false,
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
  isValidated: false,
  model: 'gemini-3.6-flash',
  demoAiUsesCount: 0
};

const ALLOWED_TASK_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.6-pro',
  'gemini-3.6-flash-lite',
  'gemini-3.6-flash-8b'
];

// --- STORAGE ADAPTER INTERFACE ---
export interface StorageAdapter {
  loadCategories(): Promise<Category[]>;
  saveCategory(category: Category): Promise<void>;
  deleteCategory(id: string): Promise<void>;
  loadTasks(): Promise<TaskItem[]>;
  saveTask(task: TaskItem): Promise<void>;
  deleteTask(id: string): Promise<void>;
  loadNotes(): Promise<string>;
  saveNotes(content: string): Promise<void>;
}

// --- LOCAL STORAGE ADAPTER ---
export class LocalStorageAdapter implements StorageAdapter {
  async loadCategories(): Promise<Category[]> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (!raw) {
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
        return DEFAULT_CATEGORIES;
      }
      return JSON.parse(raw);
    } catch (e) {
      return DEFAULT_CATEGORIES;
    }
  }

  async saveCategory(category: Category): Promise<void> {
    const cats = await this.loadCategories();
    const idx = cats.findIndex((c) => c.id === category.id);
    if (idx >= 0) {
      cats[idx] = category;
    } else {
      cats.push(category);
    }
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(cats));
  }

  async deleteCategory(id: string): Promise<void> {
    const cats = (await this.loadCategories()).filter((c) => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(cats));
  }

  async loadTasks(): Promise<TaskItem[]> {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (!raw) {
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(DEFAULT_TASKS));
        return DEFAULT_TASKS;
      }
      return JSON.parse(raw);
    } catch (e) {
      return DEFAULT_TASKS;
    }
  }

  async saveTask(task: TaskItem): Promise<void> {
    const tasks = await this.loadTasks();
    const idx = tasks.findIndex((t) => t.id === task.id);
    if (idx >= 0) {
      tasks[idx] = task;
    } else {
      tasks.unshift(task);
    }
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  }

  async deleteTask(id: string): Promise<void> {
    const tasks = (await this.loadTasks()).filter((t) => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  }

  async loadNotes(): Promise<string> {
    return localStorage.getItem(STORAGE_KEYS.NOTES) || '';
  }

  async saveNotes(content: string): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.NOTES, content);
  }
}

// --- GOOGLE DRIVE STORAGE ADAPTER ---
export class GoogleDriveStorageAdapter implements StorageAdapter {
  async loadCategories(): Promise<Category[]> {
    const data = await googleDriveService.loadFromDrive();
    return data?.categories || [];
  }

  async saveCategory(category: Category): Promise<void> {
    const tasks = storageService.getTasks();
    const categories = storageService.getCategories();
    await googleDriveService.saveToDrive(tasks, categories);
  }

  async deleteCategory(id: string): Promise<void> {
    const tasks = storageService.getTasks();
    const categories = storageService.getCategories();
    await googleDriveService.saveToDrive(tasks, categories);
  }

  async loadTasks(): Promise<TaskItem[]> {
    const data = await googleDriveService.loadFromDrive();
    return data?.tasks || [];
  }

  async saveTask(task: TaskItem): Promise<void> {
    const tasks = storageService.getTasks();
    const categories = storageService.getCategories();
    await googleDriveService.saveToDrive(tasks, categories);
  }

  async deleteTask(id: string): Promise<void> {
    const tasks = storageService.getTasks();
    const categories = storageService.getCategories();
    await googleDriveService.saveToDrive(tasks, categories);
  }

  async loadNotes(): Promise<string> {
    return '';
  }

  async saveNotes(content: string): Promise<void> {}
}

// --- UNIFIED STORAGE SERVICE ---
class StorageService {
  private localAdapter = new LocalStorageAdapter();
  private driveAdapter = new GoogleDriveStorageAdapter();
  private isSyncing = false;
  private autoSyncTimer: any = null;

  getIsSyncing(): boolean {
    return this.isSyncing;
  }

  scheduleBackgroundSync(): void {
    if (!googleDriveService.getUser()) return;

    if (this.autoSyncTimer) {
      clearTimeout(this.autoSyncTimer);
    }

    this.autoSyncTimer = setTimeout(async () => {
      try {
        await googleDriveService.saveToDrive(
          this.getAllTasks(),
          this.getCategories(),
          this.getBrainDump(),
          this.getBYOKConfig(),
          this.getProUserData()
        );
      } catch (e) {
        console.warn('Background Google Drive sync failed:', e);
      }
    }, 1000);
  }

  // --- BRAIN DUMP API ---
  getBrainDump(): string {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.BRAIN_DUMP);
      return raw || '';
    } catch (e) {
      console.error('Failed to load brain dump:', e);
      return '';
    }
  }

  saveBrainDump(content: string): void {
    try {
      localStorage.setItem(STORAGE_KEYS.BRAIN_DUMP, content || '');
      this.scheduleBackgroundSync();
    } catch (e) {
      console.error('Failed to save brain dump:', e);
    }
  }

  // --- CATEGORIES API ---
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
  }

  saveCategories(categories: Category[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
      this.scheduleBackgroundSync();
    } catch (e) {
      console.error('Failed to save categories:', e);
    }
  }

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
  }

  updateCategory(updatedCategory: Category): void {
    const categories = this.getCategories();
    const index = categories.findIndex((c) => c.id === updatedCategory.id);
    if (index !== -1) {
      categories[index] = updatedCategory;
      this.saveCategories(categories);
    }
  }

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
  }

  // --- TASKS API ---
  getTasks(includeDeleted = false): TaskItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (!raw) {
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(DEFAULT_TASKS));
        return DEFAULT_TASKS;
      }
      const parsed: TaskItem[] = JSON.parse(raw);
      const mapped = parsed.map((t) => ({
        ...t,
        isCompleted: Boolean(t.isCompleted),
        isDeleted: Boolean(t.isDeleted),
        subtasks: Array.isArray(t.subtasks) ? t.subtasks : []
      }));
      return includeDeleted ? mapped : mapped.filter((t) => !t.isDeleted);
    } catch (e) {
      console.error('Failed to load tasks from localStorage:', e);
      return DEFAULT_TASKS;
    }
  }

  getAllTasks(): TaskItem[] {
    return this.getTasks(true);
  }

  saveTasks(tasks: TaskItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
      this.scheduleBackgroundSync();
    } catch (e) {
      console.error('Failed to save tasks:', e);
    }
  }

  addTask(task: Omit<TaskItem, 'id' | 'createdAt' | 'sortOrder'>): TaskItem {
    const tasks = this.getTasks();
    const now = Date.now();
    const newTask: TaskItem = {
      ...task,
      id: 'task_' + now + '_' + Math.random().toString(36).substring(2, 7),
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
      sortOrder: 0,
      subtasks: task.subtasks || []
    };

    const shiftedTasks = tasks.map((t) => ({ ...t, sortOrder: t.sortOrder + 1 }));
    shiftedTasks.unshift(newTask);
    this.saveTasks(shiftedTasks);
    return newTask;
  }

  updateTask(updatedTask: TaskItem): void {
    const allTasks = this.getTasks();
    const index = allTasks.findIndex((t) => t.id === updatedTask.id);
    const now = Date.now();
    const taskWithTimestamp: TaskItem = {
      ...updatedTask,
      updatedAt: now
    };

    if (index !== -1) {
      allTasks[index] = taskWithTimestamp;
    } else {
      allTasks.push(taskWithTimestamp);
    }
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(allTasks));
    this.scheduleBackgroundSync();
  }

  deleteTask(taskId: string): void {
    const remaining = this.getTasks().filter((t) => t.id !== taskId);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(remaining));
    this.scheduleBackgroundSync();
  }

  toggleTaskCompletion(taskId: string): { updatedTask?: TaskItem; nextRecurringTask?: TaskItem } {
    const allTasks = this.getAllTasks();
    const index = allTasks.findIndex((t) => t.id === taskId);
    if (index === -1) return {};

    const currentTask = allTasks[index];
    const newCompletionState = !currentTask.isCompleted;
    const now = Date.now();

    const updatedTask: TaskItem = {
      ...currentTask,
      isCompleted: newCompletionState,
      updatedAt: now,
      subtasks: newCompletionState
        ? currentTask.subtasks.map((s) => ({ ...s, isCompleted: true }))
        : currentTask.subtasks
    };

    allTasks[index] = updatedTask;

    let nextRecurringTask: TaskItem | undefined;

    if (newCompletionState && currentTask.isRecurring && currentTask.recurrenceInterval !== 'NONE') {
      const nextDueDate = this.calculateNextDueDate(currentTask.dueDate, currentTask.recurrenceInterval);
      nextRecurringTask = {
        ...currentTask,
        id: 'task_' + now + '_' + Math.random().toString(36).substring(2, 7),
        isCompleted: false,
        isDeleted: false,
        dueDate: nextDueDate,
        createdAt: now,
        updatedAt: now,
        sortOrder: 0,
        subtasks: currentTask.subtasks.map((s) => ({
          ...s,
          id: 'sub_' + now + '_' + Math.random().toString(36).substring(2, 7),
          isCompleted: false
        }))
      };
      allTasks.unshift(nextRecurringTask);
    }

    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(allTasks));
    this.scheduleBackgroundSync();
    return { updatedTask, nextRecurringTask };
  }

  toggleSubtaskCompletion(taskId: string, subtaskId: string): TaskItem | null {
    const allTasks = this.getAllTasks();
    const taskIndex = allTasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) return null;

    const task = allTasks[taskIndex];
    const subtasks = task.subtasks.map((s) =>
      s.id === subtaskId ? { ...s, isCompleted: !s.isCompleted } : s
    );

    const allSubtasksDone = subtasks.length > 0 && subtasks.every((s) => s.isCompleted);
    const updatedTask: TaskItem = {
      ...task,
      subtasks,
      isCompleted: allSubtasksDone ? true : task.isCompleted,
      updatedAt: Date.now()
    };

    allTasks[taskIndex] = updatedTask;
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(allTasks));
    this.scheduleBackgroundSync();
    return updatedTask;
  }

  clearCompletedTasks(): void {
    const remaining = this.getTasks().filter((t) => !t.isCompleted);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(remaining));
    this.scheduleBackgroundSync();
  }

  restoreTask(taskId: string): void {
    const allTasks = this.getTasks();
    const now = Date.now();
    const updated = allTasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          isCompleted: false,
          isDeleted: false,
          deletedAt: undefined,
          updatedAt: now
        };
      }
      return t;
    });
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updated));
    this.scheduleBackgroundSync();
  }

  reorderTasks(reorderedTasks: TaskItem[]): void {
    const allExisting = this.getAllTasks();
    const reorderedMap = new Map<string, TaskItem>();
    reorderedTasks.forEach((t, idx) => {
      reorderedMap.set(t.id, { ...t, sortOrder: idx });
    });

    const updated = allExisting.map((t) => {
      if (reorderedMap.has(t.id)) {
        return reorderedMap.get(t.id)!;
      }
      return t;
    });

    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updated));
    this.scheduleBackgroundSync();
  }

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
  }

  // --- PRO USER DATA & REWARDED-PASS SHARING ---
  getProUserData(): ProUserData {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PRO_USER);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {}
    return {
      isPro: false,
      proUnlockType: 'none',
      proExpiresAt: null
    };
  }

  saveProUserData(data: ProUserData): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PRO_USER, JSON.stringify(data));
      this.scheduleBackgroundSync();
    } catch (e) {
      console.error('Failed to save pro user data:', e);
    }
  }

  isProUserActive(): boolean {
    const pro = this.getProUserData();
    if (pro.isPro) {
      if (pro.proUnlockType === 'lifetime') return true;
      if (pro.proUnlockType === 'rewarded_ad_pass') {
        if (!pro.proExpiresAt) return true;
        const expiresMs = new Date(pro.proExpiresAt).getTime();
        return !isNaN(expiresMs) && expiresMs > Date.now();
      }
      return true;
    }
    return false;
  }

  // --- SEAMLESS GOOGLE DRIVE SYNC & MERGE ---
  async syncAndMerge(): Promise<{ mergedTasksCount: number; mergedCategoriesCount: number; success: boolean; error?: string }> {
    if (!googleDriveService.getUser()) return { mergedTasksCount: 0, mergedCategoriesCount: 0, success: false, error: 'Not signed in' };

    this.isSyncing = true;
    try {
      // 1. Fetch local data
      let localCategories = this.getCategories();
      let localTasks = this.getAllTasks();
      const localBYOK = this.getBYOKConfig();
      const localPro = this.getProUserData();
      const localBrainDump = this.getBrainDump();

      // 2. Fetch Google Drive data
      const driveData = await googleDriveService.loadFromDrive();
      const driveCategories = driveData?.categories || [];
      const driveTasks = driveData?.tasks || [];
      const driveBYOK = driveData?.byokConfig;
      const drivePro = driveData?.user;
      const driveBrainDump = driveData?.brainDump;

      // 3. Merge Brain Dump (Exact match to Kotlin @SerializedName("brainDump"))
      let mergedBrainDump = localBrainDump;
      if (typeof driveBrainDump === 'string' && driveBrainDump) {
        if (!localBrainDump || driveBrainDump !== localBrainDump) {
          mergedBrainDump = driveBrainDump;
          localStorage.setItem(STORAGE_KEYS.BRAIN_DUMP, mergedBrainDump);
        }
      }

      // 4. Merge Pro User Data (Android Rewarded Pass / Lifetime Pro)
      let mergedPro = localPro;
      if (drivePro) {
        const isDriveProActive = drivePro.isPro && (
          drivePro.proUnlockType === 'lifetime' ||
          (drivePro.proUnlockType === 'rewarded_ad_pass' && (!drivePro.proExpiresAt || new Date(drivePro.proExpiresAt).getTime() > Date.now()))
        );
        const isLocalProActive = localPro.isPro && (
          localPro.proUnlockType === 'lifetime' ||
          (localPro.proUnlockType === 'rewarded_ad_pass' && (!localPro.proExpiresAt || new Date(localPro.proExpiresAt).getTime() > Date.now()))
        );

        if (isDriveProActive || (!isLocalProActive && drivePro.proUnlockType !== 'none')) {
          mergedPro = drivePro;
          localStorage.setItem(STORAGE_KEYS.PRO_USER, JSON.stringify(mergedPro));
        }
      }

      // 5. Merge BYOK Config (Sync API Key across devices)
      let mergedBYOK = localBYOK;
      if (driveBYOK && driveBYOK.apiKey && driveBYOK.isValidated) {
        if (!localBYOK.apiKey || !localBYOK.isValidated || (driveBYOK.lastValidatedAt || 0) >= (localBYOK.lastValidatedAt || 0)) {
          mergedBYOK = driveBYOK;
          this.saveBYOKConfig(mergedBYOK);
        }
      } else if (localBYOK.apiKey && localBYOK.isValidated) {
        mergedBYOK = localBYOK;
      }

      // 6. Normalize and merge tasks from Drive
      const normalizedDriveTasks: TaskItem[] = driveTasks.map((t: any, idx: number) => {
        let prio: Priority = 'MEDIUM';
        if (t.priority === 'High' || t.priority === 'HIGH') prio = 'HIGH';
        else if (t.priority === 'Low' || t.priority === 'LOW') prio = 'LOW';
        else if (t.priority === 'URGENT') prio = 'URGENT';

        let createdMs = Date.now();
        if (typeof t.createdAt === 'number') createdMs = t.createdAt;
        else if (t.createdAt) {
          const parsed = new Date(t.createdAt).getTime();
          if (!isNaN(parsed)) createdMs = parsed;
        }

        let updatedMs = createdMs;
        if (typeof t.updatedAt === 'number') updatedMs = t.updatedAt;
        else if (t.updatedAt) {
          const parsed = new Date(t.updatedAt).getTime();
          if (!isNaN(parsed)) updatedMs = parsed;
        }

        const isDel = Boolean(t.isDeleted);

        return {
          id: String(t.id),
          title: t.title,
          description: t.description || '',
          dueDate: t.dueDate ?? null,
          priority: prio,
          categoryId: t.categoryId ? String(t.categoryId) : null,
          isCompleted: Boolean(t.isCompleted),
          isDeleted: isDel,
          deletedAt: isDel ? updatedMs : undefined,
          isRecurring: Boolean(t.isRecurring),
          recurrenceInterval: t.recurrenceInterval || 'NONE',
          hasAlarm: Boolean(t.hasAlarm),
          sortOrder: typeof t.sortOrder === 'number' ? t.sortOrder : idx,
          createdAt: createdMs,
          updatedAt: updatedMs,
          subtasks: Array.isArray(t.subtasks) ? t.subtasks : []
        };
      });

      // Discard initial sample tasks if drive has user tasks
      const isLocalOnlySampleTasks = localTasks.length <= 3 && localTasks.every((t) => t.id.startsWith('task_demo_') || t.id.startsWith('task_1') || t.id.startsWith('task_2') || t.id.startsWith('task_3'));
      if (isLocalOnlySampleTasks && normalizedDriveTasks.length > 0) {
        localTasks = [];
      }

      const isLocalOnlySampleCategories = localCategories.length <= 3 && localCategories.every((c) => ['cat_work', 'cat_personal', 'cat_health'].includes(c.id));
      if (isLocalOnlySampleCategories && driveCategories.length > 0) {
        localCategories = [];
      }

      // Merge Categories
      const categoryMap = new Map<string, Category>();
      driveCategories.forEach((c: any) => categoryMap.set(String(c.id), { id: String(c.id), name: c.name, color: c.color, icon: c.icon }));
      localCategories.forEach((localCat) => {
        if (!categoryMap.has(String(localCat.id))) {
          categoryMap.set(String(localCat.id), localCat);
        }
      });
      const mergedCategories = Array.from(categoryMap.values());
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(mergedCategories));

      // Merge Tasks with Tombstone & LWW conflict resolution
      const taskMap = new Map<string, TaskItem>();
      normalizedDriveTasks.forEach((driveTask) => {
        taskMap.set(driveTask.id, driveTask);
      });

      localTasks.forEach((localTask) => {
        if (!taskMap.has(localTask.id)) {
          taskMap.set(localTask.id, localTask);
        } else {
          const driveTask = taskMap.get(localTask.id)!;
          const localUpdated = localTask.updatedAt || localTask.createdAt || 0;
          const driveUpdated = driveTask.updatedAt || driveTask.createdAt || 0;

          // Conflict resolution for soft-deletes:
          if (localTask.isDeleted && !driveTask.isDeleted) {
            if (localUpdated >= driveUpdated) {
              taskMap.set(localTask.id, { ...localTask, isDeleted: true });
            }
          } else if (driveTask.isDeleted && !localTask.isDeleted) {
            if (driveUpdated >= localUpdated) {
              taskMap.set(localTask.id, { ...driveTask, isDeleted: true });
            } else {
              taskMap.set(localTask.id, localTask);
            }
          } else if (localUpdated >= driveUpdated) {
            taskMap.set(localTask.id, localTask);
          }
        }
      });

      const mergedTasks = Array.from(taskMap.values()).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(mergedTasks));

      // 7. Upload merged snapshot to Google Drive
      const saveRes = await googleDriveService.saveToDrive(mergedTasks, mergedCategories, mergedBrainDump, mergedBYOK, mergedPro);

      return {
        mergedTasksCount: mergedTasks.filter((t) => !t.isDeleted).length,
        mergedCategoriesCount: mergedCategories.length,
        success: saveRes.success,
        error: saveRes.error
      };
    } catch (e: any) {
      console.error('Failed to sync and merge data with Google Drive:', e);
      return { mergedTasksCount: 0, mergedCategoriesCount: 0, success: false, error: e?.message };
    } finally {
      this.isSyncing = false;
    }
  }

  // --- MANUAL CLOUD PULL/PUSH ---
  async syncToCloud(): Promise<{ success: boolean; error?: string }> {
    if (!googleDriveService.getUser()) return { success: false, error: 'Not signed in with Google.' };
    this.isSyncing = true;
    try {
      const categories = this.getCategories();
      const tasks = this.getAllTasks();
      const byokConfig = this.getBYOKConfig();
      const proUser = this.getProUserData();
      const brainDump = this.getBrainDump();
      const res = await googleDriveService.saveToDrive(tasks, categories, brainDump, byokConfig, proUser);
      return res;
    } catch (e: any) {
      console.error('Failed manual sync to Google Drive:', e);
      return { success: false, error: e?.message || 'Failed to sync with Google Drive.' };
    } finally {
      this.isSyncing = false;
    }
  }

  // --- BYOK & TIER CONFIGURATION ---
  getBYOKConfig(): BYOKConfig {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.BYOK_CONFIG);
      if (!raw) {
        localStorage.setItem(STORAGE_KEYS.BYOK_CONFIG, JSON.stringify(DEFAULT_BYOK_CONFIG));
        return DEFAULT_BYOK_CONFIG;
      }
      const parsed = JSON.parse(raw);
      if (!parsed.model || !ALLOWED_TASK_MODELS.includes(parsed.model)) {
        parsed.model = 'gemini-3.6-flash';
        localStorage.setItem(STORAGE_KEYS.BYOK_CONFIG, JSON.stringify(parsed));
      }
      return { ...DEFAULT_BYOK_CONFIG, ...parsed };
    } catch (e) {
      console.error('Failed to load BYOK config:', e);
      return DEFAULT_BYOK_CONFIG;
    }
  }

  saveBYOKConfig(config: BYOKConfig): void {
    try {
      localStorage.setItem(STORAGE_KEYS.BYOK_CONFIG, JSON.stringify(config));
      this.scheduleBackgroundSync();
    } catch (e) {
      console.error('Failed to save BYOK config:', e);
    }
  }

  incrementDemoAiUses(): number {
    const config = this.getBYOKConfig();
    config.demoAiUsesCount = (config.demoAiUsesCount || 0) + 1;
    this.saveBYOKConfig(config);
    return config.demoAiUsesCount;
  }

  canUseAi(config: BYOKConfig): { allowed: boolean; reason?: string; isPro?: boolean } {
    if (this.isProUserActive()) {
      return { allowed: true, isPro: true };
    }
    if (config.apiKey && config.isValidated) {
      return { allowed: true };
    }
    if (config.demoAiUsesCount < FREE_TIER_LIMITS.MAX_DEMO_AI_USES) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: `You've used all ${FREE_TIER_LIMITS.MAX_DEMO_AI_USES} free AI trials. Enter your personal Gemini API Key in Settings or unlock a Pro Pass in the Android app to enjoy unlimited AI!`
    };
  }

  // --- BACKUP & RESET ---
  resetToDefaults(): void {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(DEFAULT_TASKS));
    localStorage.setItem(STORAGE_KEYS.BYOK_CONFIG, JSON.stringify(DEFAULT_BYOK_CONFIG));
    localStorage.setItem(STORAGE_KEYS.PRO_USER, JSON.stringify({ isPro: false, proUnlockType: 'none', proExpiresAt: null }));
    localStorage.setItem(STORAGE_KEYS.BRAIN_DUMP, '');
  }

  exportData(): string {
    const data = {
      tasks: this.getTasks(),
      categories: this.getCategories(),
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    };
    return JSON.stringify(data, null, 2);
  }

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
}

export const storageService = new StorageService();
