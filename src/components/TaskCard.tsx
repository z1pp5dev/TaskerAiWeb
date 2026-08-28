import React, { useState } from 'react';
import { TaskItem, Category, PRIORITY_CONFIG, RECURRENCE_LABELS } from '../types';
import {
  Check,
  MoreVertical,
  Edit2,
  Trash2,
  Calendar,
  Repeat,
  Bell,
  GripVertical,
  ChevronDown,
  ChevronUp,
  ListTodo
} from 'lucide-react';

interface TaskCardProps {
  task: TaskItem;
  category?: Category;
  onToggleComplete: (taskId: string) => void;
  onToggleSubtask: (taskId: string, subtaskId: string) => void;
  onEdit: (task: TaskItem) => void;
  onDelete: (taskId: string) => void;
  isDragging?: boolean;
  dragHandleProps?: any;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  category,
  onToggleComplete,
  onToggleSubtask,
  onEdit,
  onDelete,
  isDragging,
  dragHandleProps
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [isSubtasksExpanded, setIsSubtasksExpanded] = useState(false);

  const handleToggleMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    setOpenUpward(spaceBelow < 160);
    setIsMenuOpen((prev) => !prev);
  };

  const priorityMeta = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.MEDIUM;
  const hasLeftAccentBar = !task.isCompleted && (task.priority === 'HIGH' || task.priority === 'URGENT');

  // Subtask progress
  const totalSubtasks = task.subtasks?.length || 0;
  const completedSubtasks = task.subtasks?.filter((s) => s.isCompleted).length || 0;
  const subtaskProgress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  // Format Due Date
  const formatDueDate = (ms: number | null) => {
    if (!ms) return null;
    const date = new Date(ms);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const taskDate = new Date(ms);
    taskDate.setHours(0, 0, 0, 0);

    const diffDays = Math.round((taskDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const isOverdue = ms < Date.now() && diffDays < 0;

    let text = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (diffDays === 0) text = 'Today';
    else if (diffDays === 1) text = 'Tomorrow';
    else if (diffDays === -1) text = 'Yesterday';

    const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    return { text: `${text}${date.getHours() !== 0 ? ` at ${timeStr}` : ''}`, isOverdue };
  };

  const dueInfo = formatDueDate(task.dueDate);

  return (
    <div
      className={`group relative flex rounded-2xl border transition-all duration-200 ${
        isDragging
          ? 'scale-[1.02] shadow-2xl border-purple-500 bg-slate-900 ring-2 ring-purple-500/50'
          : task.isCompleted
          ? 'bg-slate-950/40 border-slate-850 opacity-60'
          : 'bg-tasker-surface/90 hover:bg-tasker-surface border-slate-800/90 hover:border-slate-700 shadow-md hover:shadow-xl'
      }`}
    >
      {/* Left accent color bar for High & Urgent priority tasks */}
      {hasLeftAccentBar && (
        <div
          className="w-1.5 shrink-0 rounded-l-2xl"
          style={{ backgroundColor: priorityMeta.accentBarColor }}
        />
      )}

      <div className="flex-1 p-4 flex flex-col gap-3">
        {/* Main Header Row: Checkbox, Title, Drag Handle & Menu */}
        <div className="flex items-start gap-3">
          {/* Custom Checkbox */}
          <button
            onClick={() => onToggleComplete(task.id)}
            className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition-all shrink-0 active:scale-90 ${
              task.isCompleted
                ? 'bg-purple-600 border-purple-500 text-white shadow-sm'
                : 'border-slate-600 bg-slate-800/50 hover:border-purple-400'
            }`}
            aria-label="Toggle task completion"
          >
            {task.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
          </button>

          {/* Title & Description */}
          <div className="flex-1 min-w-0">
            <h3
              className={`text-base font-semibold tracking-tight transition-all leading-snug break-words ${
                task.isCompleted
                  ? 'line-through text-slate-500 font-normal'
                  : 'text-slate-100 group-hover:text-purple-200'
              }`}
            >
              {task.title}
            </h3>

            {task.description && (
              <p
                className={`text-xs mt-1 leading-relaxed line-clamp-2 break-words ${
                  task.isCompleted ? 'text-slate-600' : 'text-slate-400'
                }`}
              >
                {task.description}
              </p>
            )}
          </div>

          {/* Drag Handle */}
          <div
            {...dragHandleProps}
            className="cursor-grab active:cursor-grabbing p-1 text-slate-600 hover:text-slate-400 transition-colors shrink-0"
            title="Drag to reorder"
          >
            <GripVertical className="w-4 h-4" />
          </div>

          {/* More Actions Menu */}
          <div className="relative shrink-0">
            <button
              onClick={handleToggleMenu}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              aria-label="Task options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsMenuOpen(false)}
                />
                <div
                  className={`absolute right-0 w-36 rounded-xl border border-slate-700 bg-slate-900/95 backdrop-blur-md p-1 shadow-2xl z-50 animate-scale-in ${
                    openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
                  }`}
                >
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onEdit(task);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-purple-300 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit Task
                  </button>
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onDelete(task.id);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Task
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Subtasks Progress / Checklist Toggle */}
        {totalSubtasks > 0 && (
          <div className="pl-8 flex flex-col gap-2">
            <button
              onClick={() => setIsSubtasksExpanded(!isSubtasksExpanded)}
              className="flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 py-1 px-2.5 rounded-lg bg-slate-900/40 border border-slate-800/60 hover:border-slate-700 transition-all"
            >
              <div className="flex items-center gap-2">
                <ListTodo className="w-3.5 h-3.5 text-purple-400" />
                <span className="font-medium">
                  {completedSubtasks} of {totalSubtasks} subtasks
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-purple-500 transition-all duration-300"
                    style={{ width: `${subtaskProgress}%` }}
                  />
                </div>
                {isSubtasksExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </div>
            </button>

            {/* Expandable Subtask List */}
            {isSubtasksExpanded && (
              <div className="flex flex-col gap-1.5 pl-2 pt-1 border-l-2 border-slate-800/80">
                {task.subtasks.map((subtask) => (
                  <label
                    key={subtask.id}
                    className="flex items-center gap-2 text-xs text-slate-300 hover:text-slate-100 cursor-pointer py-0.5"
                  >
                    <input
                      type="checkbox"
                      checked={subtask.isCompleted}
                      onChange={() => onToggleSubtask(task.id, subtask.id)}
                      className="rounded border-slate-700 bg-slate-800 text-purple-600 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer"
                    />
                    <span className={subtask.isCompleted ? 'line-through text-slate-500' : ''}>
                      {subtask.title}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bottom Metadata Badges */}
        <div className="flex flex-wrap items-center gap-2 pl-8 text-[11px] font-medium">
          {/* Priority Badge */}
          <span
            className={`px-2 py-0.5 rounded-md border text-[11px] font-semibold ${priorityMeta.bgClass}`}
          >
            {priorityMeta.label}
          </span>

          {/* Category Chip */}
          {category && (
            <span
              className="px-2 py-0.5 rounded-md border text-slate-300"
              style={{
                backgroundColor: `${category.color || '#a855f7'}18`,
                borderColor: `${category.color || '#a855f7'}40`,
                color: category.color || '#d8b4fe'
              }}
            >
              {category.name}
            </span>
          )}

          {/* Recurrence Tag */}
          {task.isRecurring && task.recurrenceInterval !== 'NONE' && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-950/40 border border-purple-800/50 text-purple-300">
              <Repeat className="w-3 h-3" />
              {RECURRENCE_LABELS[task.recurrenceInterval]}
            </span>
          )}

          {/* Due Date Tag */}
          {dueInfo && (
            <span
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md border ${
                dueInfo.isOverdue
                  ? 'bg-rose-950/60 border-rose-800/60 text-rose-300'
                  : 'bg-slate-850/80 border-slate-700/60 text-slate-300'
              }`}
            >
              <Calendar className="w-3 h-3" />
              {dueInfo.text}
            </span>
          )}

          {/* Alarm Badge */}
          {task.hasAlarm && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-950/40 border border-amber-800/50 text-amber-300" title="Alarm reminder set">
              <Bell className="w-3 h-3" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
