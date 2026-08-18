import React, { useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  TaskItem,
  Category,
  Priority,
  BYOKConfig,
  UserTier,
  AppScreen,
  ToastNotification
} from './types';
import { storageService } from './services/storageService';
import { geminiService } from './services/geminiService';
import { GoalInput } from './components/GoalInput';
import { DateStrip } from './components/DateStrip';
import { CategoryManager } from './components/CategoryManager';
import { TaskManager } from './components/TaskManager';
import { AddEditTaskModal } from './components/AddEditTaskModal';
import { AiBreakdownModal } from './components/AiBreakdownModal';
import { SettingsModal } from './components/SettingsModal';
import { UpgradeModal } from './components/UpgradeModal';
import { HistoryArchive } from './components/HistoryArchive';
import { Toast } from './components/Toast';
import {
  CheckSquare,
  History,
  Settings,
  Plus,
  Trash2,
  Key,
  ShieldCheck,
  Zap,
  Sparkles
} from 'lucide-react';

export const App: React.FC = () => {
  // State
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [byokConfig, setByokConfig] = useState<BYOKConfig>(storageService.getBYOKConfig());
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('DASHBOARD');

  // Filters
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<Priority | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<number | null>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  });

  // Modals & UI
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [isAiBreakdownModalOpen, setIsAiBreakdownModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Initial Load
  const loadData = useCallback(() => {
    setTasks(storageService.getTasks());
    setCategories(storageService.getCategories());
    setByokConfig(storageService.getBYOKConfig());
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Toast Helper
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Determine Active Tier
  const currentTier: UserTier = useMemo(() => {
    if (byokConfig.apiKey && byokConfig.isValidated) return 'BYOK_UNLOCKED';
    return 'FREE_DEMO';
  }, [byokConfig]);

  // Category task count mapping
  const categoryTaskCounts = useMemo(() => {
    const map: Record<string, number> = {};
    tasks.forEach((t) => {
      if (t.categoryId) {
        map[t.categoryId] = (map[t.categoryId] || 0) + 1;
      }
    });
    return map;
  }, [tasks]);

  // Filtered Tasks for Dashboard
  const activeTasks = useMemo(() => {
    return tasks.filter((t) => !t.isCompleted);
  }, [tasks]);

  const completedTasks = useMemo(() => {
    return tasks.filter((t) => t.isCompleted);
  }, [tasks]);

  const isDateMatching = (task: TaskItem, filterDateMs: number | null) => {
    if (!filterDateMs) return true;
    const filterDate = new Date(filterDateMs);
    filterDate.setHours(0, 0, 0, 0);
    const filterTime = filterDate.getTime();

    if (!task.dueDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return filterTime === today.getTime();
    }

    const taskDate = new Date(task.dueDate);
    taskDate.setHours(0, 0, 0, 0);
    const taskTime = taskDate.getTime();

    if (taskTime === filterTime) return true;

    // Overdue active tasks show on Today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (filterTime === today.getTime() && !task.isCompleted && taskTime < filterTime) {
      return true;
    }

    return false;
  };

  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        const matchesCategory = selectedCategoryId === null || task.categoryId === selectedCategoryId;
        const matchesPriority = selectedPriority === null || task.priority === selectedPriority;
        const matchesSearch =
          !searchQuery.trim() ||
          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDate = isDateMatching(task, selectedDate);

        return matchesCategory && matchesPriority && matchesSearch && matchesDate;
      })
      .sort((a, b) => {
        if (!a.isCompleted && b.isCompleted) return -1;
        if (a.isCompleted && !b.isCompleted) return 1;
        return (a.sortOrder || 0) - (b.sortOrder || 0);
      });
  }, [tasks, selectedCategoryId, selectedPriority, searchQuery, selectedDate]);

  // Stats calculation
  const totalDashboardCount = tasks.length;
  const completedDashboardCount = completedTasks.length;
  const progress = totalDashboardCount > 0 ? completedDashboardCount / totalDashboardCount : 0;

  // Task Handlers
  const handleToggleComplete = (taskId: string) => {
    const result = storageService.toggleTaskCompletion(taskId);
    loadData();

    if (result.updatedTask?.isCompleted) {
      showToast(`Completed: "${result.updatedTask.title}"`, 'success');

      // Check if all active tasks are completed -> Confetti celebration!
      const remaining = tasks.filter((t) => !t.isCompleted && t.id !== taskId);
      if (remaining.length === 0 && tasks.length > 0) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    }

    if (result.nextRecurringTask) {
      showToast(`Recurring habit spawned for next cycle!`, 'info');
    }
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    storageService.toggleSubtaskCompletion(taskId, subtaskId);
    loadData();
  };

  const handleSaveTask = (taskData: Omit<TaskItem, 'id' | 'createdAt' | 'sortOrder'>) => {
    if (editingTask) {
      storageService.updateTask({
        ...taskData,
        id: editingTask.id,
        createdAt: editingTask.createdAt,
        sortOrder: editingTask.sortOrder
      });
      showToast('Task updated successfully!', 'success');
    } else {
      storageService.addTask(taskData);
      showToast('New task added!', 'success');
    }
    loadData();
  };

  const handleDeleteTask = (taskId: string) => {
    storageService.deleteTask(taskId);
    loadData();
    showToast('Task deleted', 'info');
  };

  const handleRestoreTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      storageService.updateTask({
        ...task,
        isCompleted: false
      });
      loadData();
      showToast(`Restored: "${task.title}"`, 'success');
    }
  };

  const handleClearCompleted = () => {
    if (confirm('Clear all completed tasks from the active dashboard?')) {
      storageService.clearCompletedTasks();
      loadData();
      showToast('Cleared completed tasks.', 'info');
    }
  };

  const handleReorderTasks = (reorderedList: TaskItem[]) => {
    setTasks((prev) => {
      const nonActive = prev.filter((t) => t.isCompleted);
      return [...reorderedList, ...nonActive];
    });
    storageService.reorderTasks(reorderedList);
  };

  // Smart Add Natural Language Handler
  const handleSmartAdd = async (input: string) => {
    const canUse = storageService.canUseAi(byokConfig);
    if (!canUse.allowed) {
      setIsUpgradeModalOpen(true);
      return;
    }

    setIsAiLoading(true);
    try {
      const parsed = await geminiService.parseSmartTask(input, byokConfig);
      storageService.addTask({
        title: parsed.title,
        description: parsed.description,
        dueDate: parsed.dueDate,
        priority: parsed.priority,
        categoryId: selectedCategoryId,
        isCompleted: false,
        isRecurring: parsed.isRecurring,
        recurrenceInterval: parsed.recurrenceInterval,
        hasAlarm: false,
        subtasks: []
      });

      if (currentTier === 'FREE_DEMO') {
        storageService.incrementDemoAiUses();
        setByokConfig(storageService.getBYOKConfig());
      }

      loadData();
      showToast(`Smart Task Added: "${parsed.title}"`, 'success');
    } catch (e: any) {
      showToast(e.message || 'Failed to parse task', 'error');
    } finally {
      setIsAiLoading(false);
    }
  };

  // AI Generated tasks batch add
  const handleAddGeneratedTasks = (newTasks: Omit<TaskItem, 'id' | 'createdAt' | 'sortOrder'>[]) => {
    newTasks.forEach((task) => {
      storageService.addTask(task);
    });
    loadData();
    showToast(`Added ${newTasks.length} AI generated tasks to your focus list!`, 'success');
  };

  // Category Handlers
  const handleAddCategory = (name: string, color?: string) => {
    storageService.addCategory(name, color);
    loadData();
    showToast(`Category "${name}" created.`, 'success');
  };

  const handleUpdateCategory = (category: Category) => {
    storageService.updateCategory(category);
    loadData();
    showToast(`Category updated.`, 'success');
  };

  const handleDeleteCategory = (categoryId: string) => {
    storageService.deleteCategory(categoryId);
    if (selectedCategoryId === categoryId) {
      setSelectedCategoryId(null);
    }
    loadData();
    showToast(`Category removed.`, 'info');
  };

  // BYOK Save
  const handleSaveBYOKConfig = (newConfig: BYOKConfig) => {
    storageService.saveBYOKConfig(newConfig);
    setByokConfig(newConfig);
  };

  return (
    <div className="min-h-screen bg-tasker-bg text-tasker-text flex flex-col font-sans selection:bg-purple-500/30">
      {/* Top Center-Aligned Header (Matching Jetpack Compose CenterAlignedTopAppBar) */}
      <header className="sticky top-0 z-40 w-full bg-tasker-bg/95 backdrop-blur-md border-b border-slate-800/80 shadow-md">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Left / Back button if in History */}
          <div className="flex items-center gap-2">
            {currentScreen === 'COMPLETED_HISTORY' ? (
              <button
                onClick={() => setCurrentScreen('DASHBOARD')}
                className="px-2.5 py-1.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-xs font-bold text-purple-300 transition-colors"
              >
                ← Dashboard
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-600/30">
                  <CheckSquare className="w-4 h-4 stroke-[2.5]" />
                </div>
              </div>
            )}
          </div>

          {/* Center Brand Title */}
          <div className="flex flex-col items-center text-center">
            <span className="text-[10px] font-extrabold tracking-[0.2em] text-purple-400 uppercase font-display">
              {currentScreen === 'DASHBOARD' ? 'PRODUCTIVITY ENGINE' : 'HISTORY ARCHIVE'}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <h1 className="text-lg font-extrabold tracking-tight text-slate-100 font-display">
                Tasker <span className="italic font-black text-purple-400">AI</span>
              </h1>
            </div>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-1.5">
            {/* Tier Badge Button */}
            <button
              onClick={() => setIsUpgradeModalOpen(true)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all active:scale-95 ${
                currentTier === 'BYOK_UNLOCKED'
                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 hover:bg-emerald-950'
                  : 'bg-amber-950/60 border-amber-500/50 text-amber-300 hover:bg-amber-950'
              }`}
              title="Unlock All Features with Free BYOK"
            >
              {currentTier === 'BYOK_UNLOCKED' ? <ShieldCheck className="w-3 h-3" /> : <Zap className="w-3 h-3" />}
              <span>{currentTier === 'BYOK_UNLOCKED' ? 'BYOK Free' : 'Free Demo'}</span>
            </button>

            {/* History Toggle */}
            {currentScreen === 'DASHBOARD' && (
              <button
                onClick={() => setCurrentScreen('COMPLETED_HISTORY')}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                title="View Completed History Archive"
              >
                <History className="w-4 h-4" />
              </button>
            )}

            {/* Clear Completed Tasks */}
            {completedTasks.length > 0 && currentScreen === 'DASHBOARD' && (
              <button
                onClick={handleClearCompleted}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                title="Clear Completed Tasks"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            {/* Settings & BYOK Button */}
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="p-2 rounded-xl text-slate-400 hover:text-purple-300 hover:bg-slate-800 transition-colors"
              title="Settings & API Key"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto flex flex-col gap-3 pb-16">
        {currentScreen === 'DASHBOARD' ? (
          <>
            {/* Focus Summary & Smart Add & Search */}
            <GoalInput
              completedCount={completedDashboardCount}
              totalCount={totalDashboardCount}
              progress={progress}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSmartAdd={handleSmartAdd}
              onOpenAiBreakdown={() => setIsAiBreakdownModalOpen(true)}
              tier={currentTier}
              demoAiUsesCount={byokConfig.demoAiUsesCount}
              onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
              isAiLoading={isAiLoading}
            />

            {/* Category Filter Pills & Add Category */}
            <CategoryManager
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={setSelectedCategoryId}
              selectedPriority={selectedPriority}
              onSelectPriority={setSelectedPriority}
              tier={currentTier}
              onAddCategory={handleAddCategory}
              onUpdateCategory={handleUpdateCategory}
              onDeleteCategory={handleDeleteCategory}
              onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
              categoryTaskCounts={categoryTaskCounts}
              totalTasksCount={tasks.length}
            />

            {/* 7-Day Date Strip */}
            <DateStrip
              selectedDate={selectedDate}
              onDateSelected={setSelectedDate}
            />

            {/* Task Manager List with Drag & Drop */}
            <TaskManager
              tasks={filteredTasks}
              categories={categories}
              onToggleComplete={handleToggleComplete}
              onToggleSubtask={handleToggleSubtask}
              onEditTask={(task) => {
                setEditingTask(task);
                setIsAddEditModalOpen(true);
              }}
              onDeleteTask={handleDeleteTask}
              onReorderTasks={handleReorderTasks}
              onOpenAddTask={() => {
                setEditingTask(null);
                setIsAddEditModalOpen(true);
              }}
              onOpenAiBreakdown={() => setIsAiBreakdownModalOpen(true)}
              onResetFilters={() => {
                setSelectedCategoryId(null);
                setSelectedPriority(null);
                setSearchQuery('');
              }}
              searchQuery={searchQuery}
              selectedCategoryId={selectedCategoryId}
              selectedPriority={selectedPriority}
              currentScreen={currentScreen}
              isLoading={isAiLoading}
            />
          </>
        ) : (
          /* Completed History Archive Screen */
          <HistoryArchive
            completedTasks={completedTasks}
            categories={categories}
            onBackToDashboard={() => setCurrentScreen('DASHBOARD')}
            onRestoreTask={handleRestoreTask}
            onDeleteTask={handleDeleteTask}
            onClearAllHistory={() => {
              storageService.clearCompletedTasks();
              loadData();
              showToast('History archive cleared.', 'info');
            }}
          />
        )}
      </main>

      {/* Floating Action Button (FAB) Pinned at Bottom Right */}
      {currentScreen === 'DASHBOARD' && (
        <div className="fixed bottom-6 right-6 z-30">
          <button
            onClick={() => {
              setEditingTask(null);
              setIsAddEditModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-2xl shadow-purple-600/40 border border-purple-400/30 transition-all hover:scale-105 active:scale-95"
            title="Create new task"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>Add Task</span>
          </button>
        </div>
      )}

      {/* Modals */}
      {isAddEditModalOpen && (
        <AddEditTaskModal
          initialTask={editingTask}
          categories={categories}
          tier={currentTier}
          onClose={() => {
            setIsAddEditModalOpen(false);
            setEditingTask(null);
          }}
          onSave={handleSaveTask}
          onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
          defaultDate={selectedDate ?? Date.now()}
        />
      )}

      {isAiBreakdownModalOpen && (
        <AiBreakdownModal
          categories={categories}
          byokConfig={byokConfig}
          tier={currentTier}
          onClose={() => setIsAiBreakdownModalOpen(false)}
          onAddGeneratedTasks={handleAddGeneratedTasks}
          onOpenUpgradeModal={() => {
            setIsAiBreakdownModalOpen(false);
            setIsUpgradeModalOpen(true);
          }}
          onIncrementDemoUses={() => {
            storageService.incrementDemoAiUses();
            setByokConfig(storageService.getBYOKConfig());
          }}
        />
      )}

      {isSettingsModalOpen && (
        <SettingsModal
          config={byokConfig}
          tier={currentTier}
          onClose={() => setIsSettingsModalOpen(false)}
          onSaveConfig={handleSaveBYOKConfig}
          onDataImported={loadData}
          onShowToast={showToast}
        />
      )}

      {isUpgradeModalOpen && (
        <UpgradeModal
          tier={currentTier}
          onClose={() => setIsUpgradeModalOpen(false)}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
        />
      )}

      {/* Toast Notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};
