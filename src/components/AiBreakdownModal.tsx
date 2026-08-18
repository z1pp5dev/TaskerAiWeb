import React, { useState } from 'react';
import { Category, Priority, PRIORITY_CONFIG, TaskItem, BYOKConfig, UserTier } from '../types';
import { geminiService, GoalBreakdownItem } from '../services/geminiService';
import {
  Sparkles,
  X,
  Target,
  CheckCircle2,
  Calendar,
  ListTodo,
  ArrowRight,
  Zap,
  Lock,
  Layers
} from 'lucide-react';

interface AiBreakdownModalProps {
  categories: Category[];
  byokConfig: BYOKConfig;
  tier: UserTier;
  onClose: () => void;
  onAddGeneratedTasks: (tasks: Omit<TaskItem, 'id' | 'createdAt' | 'sortOrder'>[]) => void;
  onOpenUpgradeModal: () => void;
  onIncrementDemoUses: () => void;
}

const PRESET_GOALS = [
  'Plan health & fitness routine',
  'Launch Android App MVP',
  'Prepare monthly financial budget',
  'Organize home office setup',
  'Prepare for technical job interview'
];

export const AiBreakdownModal: React.FC<AiBreakdownModalProps> = ({
  categories,
  byokConfig,
  tier,
  onClose,
  onAddGeneratedTasks,
  onOpenUpgradeModal,
  onIncrementDemoUses
}) => {
  const [goalPrompt, setGoalPrompt] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedItems, setGeneratedItems] = useState<GoalBreakdownItem[] | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  const handleGenerate = async () => {
    if (!goalPrompt.trim() || isLoading) return;

    // Check if free trial limit exceeded
    const isFreeTier = tier === 'FREE_DEMO';
    if (isFreeTier && byokConfig.demoAiUsesCount >= 3) {
      onOpenUpgradeModal();
      return;
    }

    setIsLoading(true);
    setGeneratedItems(null);

    try {
      const results = await geminiService.generateGoalBreakdown(goalPrompt, byokConfig);
      setGeneratedItems(results);
      setSelectedIndices(results.map((_, i) => i)); // Select all by default

      if (isFreeTier) {
        onIncrementDemoUses();
      }
    } catch (e) {
      console.error('Goal breakdown failed:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmAdd = () => {
    if (!generatedItems) return;

    const chosen = generatedItems.filter((_, idx) => selectedIndices.includes(idx));
    const tasksToAdd: Omit<TaskItem, 'id' | 'createdAt' | 'sortOrder'>[] = chosen.map((item) => ({
      title: item.title,
      description: item.description,
      dueDate: item.dueDate,
      priority: item.priority,
      categoryId: selectedCategoryId,
      isCompleted: false,
      isRecurring: item.isRecurring,
      recurrenceInterval: item.recurrenceInterval,
      hasAlarm: false,
      subtasks: item.subtaskTitles.map((title) => ({
        id: 'sub_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        title,
        isCompleted: false
      }))
    }));

    onAddGeneratedTasks(tasksToAdd);
    onClose();
  };

  const toggleSelectIndex = (idx: number) => {
    if (selectedIndices.includes(idx)) {
      setSelectedIndices(selectedIndices.filter((i) => i !== idx));
    } else {
      setSelectedIndices([...selectedIndices, idx]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl border border-purple-500/30 bg-slate-900 shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0 bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Tasker AI Goal Assistant
              </h2>
              <p className="text-xs text-slate-400">Decompose high-level goals into milestones</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
          {!generatedItems ? (
            <>
              {/* Presets */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-purple-400 mb-2">
                  Quick Inspiration Presets:
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_GOALS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setGoalPrompt(preset)}
                      className="px-3 py-1.5 rounded-xl bg-slate-850 hover:bg-purple-950/50 border border-slate-800 hover:border-purple-500/50 text-xs font-medium text-slate-300 hover:text-purple-200 transition-all active:scale-95"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Goal Input Area */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Your High-Level Goal or Project *
                </label>
                <textarea
                  value={goalPrompt}
                  onChange={(e) => setGoalPrompt(e.target.value)}
                  placeholder="e.g. Plan a 10-day trip to Japan, or launch a portfolio web app with 3 case studies..."
                  rows={3}
                  disabled={isLoading}
                  autoFocus
                  className="w-full px-4 py-3 rounded-2xl bg-slate-850 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all resize-none"
                />
              </div>

              {/* Assign to Category */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Assign Generated Tasks To Category
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryId(null)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                      selectedCategoryId === null
                        ? 'bg-purple-600/90 border-purple-400 text-white'
                        : 'bg-slate-850 border-slate-800 text-slate-400'
                    }`}
                  >
                    Auto / None
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                        selectedCategoryId === cat.id
                          ? 'bg-purple-950 border-purple-400 text-purple-200'
                          : 'bg-slate-850 border-slate-800 text-slate-300'
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

              {/* Loading Shimmer */}
              {isLoading && (
                <div className="flex flex-col items-center justify-center p-8 gap-3 text-center rounded-2xl bg-purple-950/20 border border-purple-500/20 animate-pulse">
                  <Sparkles className="w-8 h-8 text-purple-400 animate-spin" />
                  <p className="text-sm font-semibold text-purple-200">
                    Architecting milestones with Gemini...
                  </p>
                  <p className="text-xs text-slate-400 max-w-xs">
                    Structuring priorities, estimating timelines, and generating checklists.
                  </p>
                </div>
              )}
            </>
          ) : (
            /* Results Preview */
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Generated {generatedItems.length} Structured Tasks
                </span>
                <span className="text-xs text-slate-400">
                  {selectedIndices.length} selected
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {generatedItems.map((item, idx) => {
                  const isSelected = selectedIndices.includes(idx);
                  const meta = PRIORITY_CONFIG[item.priority];
                  const dateStr = item.dueDate
                    ? new Date(item.dueDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })
                    : 'Upcoming';

                  return (
                    <div
                      key={idx}
                      onClick={() => toggleSelectIndex(idx)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-slate-850 border-purple-500/80 shadow-md ring-1 ring-purple-500/30'
                          : 'bg-slate-900/60 border-slate-800 opacity-60'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectIndex(idx)}
                          className="mt-1 rounded border-slate-700 bg-slate-800 text-purple-600 focus:ring-0 w-4 h-4"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-slate-100">{item.title}</span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${meta.bgClass}`}
                            >
                              {meta.label}
                            </span>
                            <span className="flex items-center gap-1 text-[11px] text-slate-400">
                              <Calendar className="w-3 h-3" /> {dateStr}
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                              {item.description}
                            </p>
                          )}

                          {item.subtaskTitles.length > 0 && (
                            <div className="mt-2.5 flex flex-col gap-1 pl-2 border-l border-slate-700">
                              {item.subtaskTitles.map((sub, sIdx) => (
                                <span
                                  key={sIdx}
                                  className="text-[11px] text-slate-300 flex items-center gap-1.5"
                                >
                                  <ListTodo className="w-3 h-3 text-purple-400 shrink-0" />
                                  {sub}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 shrink-0 bg-slate-900">
          {generatedItems ? (
            <>
              <button
                type="button"
                onClick={() => setGeneratedItems(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 transition-colors"
              >
                Back to Edit
              </button>
              <button
                type="button"
                onClick={handleConfirmAdd}
                disabled={selectedIndices.length === 0}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-emerald-600 hover:from-purple-500 hover:to-emerald-500 disabled:opacity-40 text-xs font-bold text-white transition-all shadow-lg shadow-purple-600/30 active:scale-95"
              >
                <span>Add {selectedIndices.length} Tasks to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={!goalPrompt.trim() || isLoading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-xs font-bold text-white transition-all shadow-lg shadow-purple-600/30 active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>Generate Tasks</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
