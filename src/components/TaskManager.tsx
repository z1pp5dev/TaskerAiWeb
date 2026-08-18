import React, { useState } from 'react';
import { TaskItem, Category, Priority, AppScreen } from '../types';
import { TaskCard } from './TaskCard';
import {
  CheckCircle2,
  Sparkles,
  Plus,
  RotateCcw,
  Inbox
} from 'lucide-react';

interface TaskManagerProps {
  tasks: TaskItem[];
  categories: Category[];
  onToggleComplete: (taskId: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onEditTask: (task: TaskItem) => void;
  onDeleteTask: (taskId: string) => void;
  onReorderTasks: (tasks: TaskItem[]) => void;
  onOpenAddTask: () => void;
  onOpenAiBreakdown: () => void;
  onResetFilters: () => void;
  searchQuery: string;
  selectedCategoryId: string | null;
  selectedPriority: Priority | null;
  currentScreen: AppScreen;
  isLoading: boolean;
}

export const TaskManager: React.FC<TaskManagerProps> = ({
  tasks,
  categories,
  onToggleComplete,
  onToggleSubtask,
  onEditTask,
  onDeleteTask,
  onReorderTasks,
  onOpenAddTask,
  onOpenAiBreakdown,
  onResetFilters,
  searchQuery,
  selectedCategoryId,
  selectedPriority,
  currentScreen,
  isLoading
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const getCategory = (catId: string | null) => {
    if (!catId) return undefined;
    return categories.find((c) => c.id === catId);
  };

  // Drag and drop reordering handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const newTasks = [...tasks];
    const item = newTasks.splice(draggedIndex, 1)[0];
    newTasks.splice(targetIndex, 0, item);
    setDraggedIndex(targetIndex);
    onReorderTasks(newTasks);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 px-4 py-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse flex items-center p-4 gap-4"
          >
            <div className="w-5 h-5 rounded-lg bg-slate-800 shrink-0" />
            <div className="flex-1 flex flex-col gap-2">
              <div className="w-2/3 h-4 rounded bg-slate-800" />
              <div className="w-1/2 h-3 rounded bg-slate-800/60" />
              <div className="w-1/4 h-3 rounded bg-slate-800/40" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty State
  if (tasks.length === 0) {
    const hasFilters = Boolean(searchQuery || selectedCategoryId || selectedPriority);

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
        <div className="w-16 h-16 rounded-3xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4 text-purple-400">
          {hasFilters ? (
            <Inbox className="w-8 h-8" />
          ) : (
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          )}
        </div>

        <h3 className="text-base font-bold text-slate-100">
          {searchQuery
            ? `No tasks match "${searchQuery}"`
            : hasFilters
            ? 'No tasks match current filters'
            : currentScreen === 'DASHBOARD'
            ? 'All Caught Up!'
            : 'No History Yet'}
        </h3>

        <p className="text-xs text-slate-400 max-w-xs mt-1.5 leading-relaxed">
          {hasFilters
            ? 'Try clearing your search query, category, or priority filters to view other tasks.'
            : currentScreen === 'DASHBOARD'
            ? 'You have zero active tasks remaining. Add a task manually or breakdown a goal with AI.'
            : 'Your completed tasks will be archived here. Check off active tasks to track progress!'}
        </p>

        <div className="flex items-center gap-3 mt-5">
          {hasFilters ? (
            <button
              onClick={onResetFilters}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-all active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          ) : (
            <>
              <button
                onClick={onOpenAiBreakdown}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-950 border border-purple-800 text-xs font-semibold text-purple-300 hover:bg-purple-900 transition-all active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Generate with AI
              </button>

              <button
                onClick={onOpenAddTask}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white transition-all shadow-md shadow-purple-600/30 active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                New Task
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-2.5 px-4 pb-28">
      {tasks.map((task, index) => (
        <div
          key={task.id}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragEnd={handleDragEnd}
        >
          <TaskCard
            task={task}
            category={getCategory(task.categoryId)}
            onToggleComplete={onToggleComplete}
            onToggleSubtask={onToggleSubtask}
            onEdit={onEditTask}
            onDelete={onDeleteTask}
            isDragging={draggedIndex === index}
            dragHandleProps={{
              onMouseDown: () => handleDragStart(index)
            }}
          />
        </div>
      ))}
    </div>
  );
};
