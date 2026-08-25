import React, { useState, useEffect } from 'react';
import { TaskItem, Category, Priority, RecurrenceInterval, SubTask, PRIORITY_CONFIG, RECURRENCE_LABELS, FREE_TIER_LIMITS, UserTier } from '../types';
import {
  X,
  Calendar,
  Clock,
  Repeat,
  Bell,
  Plus,
  Trash2,
  ListTodo,
  Lock,
  Tag
} from 'lucide-react';

interface AddEditTaskModalProps {
  initialTask: TaskItem | null;
  categories: Category[];
  tier: UserTier;
  onClose: () => void;
  onSave: (taskData: Omit<TaskItem, 'id' | 'createdAt' | 'sortOrder'>) => void;
  onOpenUpgradeModal: () => void;
  defaultDate?: number | null;
}

export const AddEditTaskModal: React.FC<AddEditTaskModalProps> = ({
  initialTask,
  categories,
  tier,
  onClose,
  onSave,
  onOpenUpgradeModal,
  defaultDate
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [hasDueDate, setHasDueDate] = useState(false);
  const [dueDateString, setDueDateString] = useState('');
  const [dueTimeString, setDueTimeString] = useState('12:00');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceInterval, setRecurrenceInterval] = useState<RecurrenceInterval>('DAILY');
  const [hasAlarm, setHasAlarm] = useState(false);
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [newSubtaskInput, setNewSubtaskInput] = useState('');
  const [titleError, setTitleError] = useState(false);

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setDescription(initialTask.description || '');
      setPriority(initialTask.priority);
      setCategoryId(initialTask.categoryId);
      setIsRecurring(initialTask.isRecurring);
      setRecurrenceInterval(initialTask.recurrenceInterval || 'DAILY');
      setHasAlarm(initialTask.hasAlarm);
      setSubtasks(initialTask.subtasks || []);

      if (initialTask.dueDate) {
        setHasDueDate(true);
        const d = new Date(initialTask.dueDate);
        setDueDateString(d.toISOString().split('T')[0]);
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        setDueTimeString(`${hh}:${mm}`);
      } else {
        setHasDueDate(false);
        setDueDateString('');
      }
    } else {
      // Default to selected focus date
      const d = new Date(defaultDate ?? Date.now());
      setHasDueDate(true);
      setDueDateString(d.toISOString().split('T')[0]);
      setDueTimeString('12:00');
    }
  }, [initialTask, defaultDate]);

  const handleAddSubtask = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newSubtaskInput.trim()) return;

    setSubtasks([
      ...subtasks,
      {
        id: 'sub_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        title: newSubtaskInput.trim(),
        isCompleted: false
      }
    ]);
    setNewSubtaskInput('');
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter((s) => s.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setTitleError(true);
      return;
    }

    let calculatedDueDate: number | null = null;
    if (hasDueDate && dueDateString) {
      const [year, month, day] = dueDateString.split('-').map(Number);
      const [hours, minutes] = (dueTimeString || '12:00').split(':').map(Number);
      const dateObj = new Date(year, month - 1, day, hours || 12, minutes || 0, 0, 0);
      calculatedDueDate = dateObj.getTime();
    }

    onSave({
      title: title.trim(),
      description: description.trim(),
      dueDate: calculatedDueDate,
      priority,
      categoryId,
      isCompleted: initialTask ? initialTask.isCompleted : false,
      isRecurring,
      recurrenceInterval: isRecurring ? recurrenceInterval : 'NONE',
      hasAlarm,
      subtasks
    });
    onClose();
  };

  const isFreeTier = tier === 'FREE_DEMO';
  const isCategoryLimitReached = isFreeTier && categories.length >= FREE_TIER_LIMITS.MAX_CATEGORIES;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
          <h2 className="text-lg font-bold text-slate-100">
            {initialTask ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Task Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (titleError && e.target.value.trim()) setTitleError(false);
              }}
              placeholder="What needs to be done?"
              autoFocus
              className={`w-full px-4 py-3 rounded-2xl bg-slate-900 border text-sm font-medium text-slate-100 placeholder-slate-400 focus:outline-none transition-all ${
                titleError
                  ? 'border-rose-500 ring-1 ring-rose-500'
                  : 'border-slate-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50'
              }`}
            />
            {titleError && (
              <span className="text-xs text-rose-400 mt-1 block">Title is required.</span>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Description & Notes
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add extra details, checklist references, links, or context..."
              rows={2}
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-700 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all resize-none"
            />
          </div>

          {/* Priority Level */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Priority Level
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as Priority[]).map((p) => {
                const isSelected = priority === p;
                const meta = PRIORITY_CONFIG[p];
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-2 px-1 rounded-xl border text-xs font-semibold transition-all text-center ${
                      isSelected
                        ? `${meta.bgClass} ring-2 ring-purple-500 scale-100 shadow-md`
                        : 'bg-slate-850 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center justify-between">
              <span>Category</span>
              {isCategoryLimitReached && (
                <span className="text-[11px] text-amber-400 flex items-center gap-1 font-normal">
                  <Lock className="w-3 h-3" /> Max 3 categories on Free Tier
                </span>
              )}
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCategoryId(null)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                  categoryId === null
                    ? 'bg-purple-600/90 border-purple-400 text-white shadow-sm'
                    : 'bg-slate-850 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                None
              </button>

              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                    categoryId === cat.id
                      ? 'bg-purple-950 border-purple-400 text-purple-200 shadow-sm'
                      : 'bg-slate-850 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: cat.color || '#a855f7' }}
                  />
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Due Date & Time */}
          <div className="p-4 rounded-2xl bg-slate-850/70 border border-slate-800 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-200">
                <Calendar className="w-4 h-4 text-purple-400" />
                <span>Due Date & Time</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasDueDate}
                  onChange={(e) => setHasDueDate(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {hasDueDate && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Date</label>
                  <input
                    type="date"
                    value={dueDateString}
                    onChange={(e) => setDueDateString(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Time</label>
                  <div className="relative">
                    <input
                      type="time"
                      value={dueTimeString}
                      onChange={(e) => setDueTimeString(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Recurrence Settings */}
          <div className="p-4 rounded-2xl bg-slate-850/70 border border-slate-800 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-200">
                <Repeat className="w-4 h-4 text-cyan-400" />
                <span>Recurring Habit</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600"></div>
              </label>
            </div>

            {isRecurring && (
              <div className="pt-2 flex flex-wrap gap-2">
                {(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] as RecurrenceInterval[]).map(
                  (interval) => (
                    <button
                      key={interval}
                      type="button"
                      onClick={() => setRecurrenceInterval(interval)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                        recurrenceInterval === interval
                          ? 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-sm'
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {RECURRENCE_LABELS[interval]}
                    </button>
                  )
                )}
              </div>
            )}
          </div>

          {/* Alarm Reminder */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-850/70 border border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-200">
              <Bell className="w-4 h-4 text-amber-400" />
              <span>Alarm Notification</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={hasAlarm}
                onChange={(e) => setHasAlarm(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
            </label>
          </div>

          {/* Subtask Checklist Manager */}
          <div className="p-4 rounded-2xl bg-slate-850/70 border border-slate-800 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-200">
              <ListTodo className="w-4 h-4 text-purple-400" />
              <span>Subtask Checklist ({subtasks.length})</span>
            </div>

            {/* List of existing subtasks */}
            {subtasks.length > 0 && (
              <div className="flex flex-col gap-1.5 pt-1">
                {subtasks.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200"
                  >
                    <span className="truncate pr-2">{st.title}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(st.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors"
                      title="Remove subtask"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add Subtask input */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newSubtaskInput}
                onChange={(e) => setNewSubtaskInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                placeholder="Add checklist step..."
                className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              <button
                type="button"
                onClick={() => handleAddSubtask()}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 transition-colors"
                title="Add step"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 shrink-0 bg-slate-900">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white transition-all shadow-lg shadow-purple-600/30 active:scale-95"
          >
            {initialTask ? 'Update Task' : 'Save Task'}
          </button>
        </div>
      </div>
    </div>
  );
};
