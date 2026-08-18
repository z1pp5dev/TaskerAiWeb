import React from 'react';
import { TaskItem, Category, PRIORITY_CONFIG } from '../types';
import {
  ArrowLeft,
  Trash2,
  RotateCcw,
  CheckCircle2,
  Calendar,
  History,
  Tag
} from 'lucide-react';

interface HistoryArchiveProps {
  completedTasks: TaskItem[];
  categories: Category[];
  onBackToDashboard: () => void;
  onRestoreTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onClearAllHistory: () => void;
}

export const HistoryArchive: React.FC<HistoryArchiveProps> = ({
  completedTasks,
  categories,
  onBackToDashboard,
  onRestoreTask,
  onDeleteTask,
  onClearAllHistory
}) => {
  const getCategory = (catId: string | null) => {
    if (!catId) return undefined;
    return categories.find((c) => c.id === catId);
  };

  return (
    <div className="flex-1 flex flex-col gap-4 px-4 py-2">
      {/* Subheader */}
      <div className="flex items-center justify-between py-2 border-b border-slate-800">
        <button
          onClick={onBackToDashboard}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        {completedTasks.length > 0 && (
          <button
            onClick={() => {
              if (confirm('Clear all completed tasks from history archive?')) {
                onClearAllHistory();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-950/80 border border-rose-800/60 text-xs font-semibold text-rose-300 transition-colors active:scale-95"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History ({completedTasks.length})</span>
          </button>
        )}
      </div>

      {/* List or Empty State */}
      {completedTasks.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[350px]">
          <div className="w-16 h-16 rounded-3xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4 text-purple-400">
            <History className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-100">No History Yet</h3>
          <p className="text-xs text-slate-400 max-w-xs mt-1.5 leading-relaxed">
            When you complete tasks on your dashboard, they will be archived here so you can review your productivity accomplishments.
          </p>
          <button
            onClick={onBackToDashboard}
            className="mt-5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white transition-all shadow-md shadow-purple-600/30"
          >
            Go to Active Tasks
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 pb-24">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Completed Tasks ({completedTasks.length})
          </span>

          {completedTasks.map((task) => {
            const cat = getCategory(task.categoryId);
            const meta = PRIORITY_CONFIG[task.priority];
            const dateStr = task.dueDate
              ? new Date(task.dueDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })
              : null;

            return (
              <div
                key={task.id}
                className="flex items-center justify-between p-4 rounded-2xl border border-slate-850 bg-slate-900/50 hover:bg-slate-900 transition-all gap-4"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="mt-0.5 w-5 h-5 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-slate-300 line-through truncate">
                      {task.title}
                    </h4>

                    {task.description && (
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-2 flex-wrap text-[10px]">
                      <span className={`px-2 py-0.2 rounded border ${meta.bgClass}`}>
                        {meta.label}
                      </span>

                      {cat && (
                        <span
                          className="px-2 py-0.2 rounded border text-slate-400"
                          style={{
                            borderColor: `${cat.color || '#a855f7'}40`,
                            color: cat.color || '#d8b4fe'
                          }}
                        >
                          {cat.name}
                        </span>
                      )}

                      {dateStr && (
                        <span className="flex items-center gap-1 text-slate-500">
                          <Calendar className="w-3 h-3" />
                          {dateStr}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => onRestoreTask(task.id)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-purple-950/60 border border-slate-700 hover:border-purple-500 text-slate-300 hover:text-purple-300 text-xs font-medium transition-all"
                    title="Restore task to dashboard"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/60 border border-slate-700 hover:border-rose-500 text-slate-400 hover:text-rose-300 transition-all"
                    title="Delete permanently"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
