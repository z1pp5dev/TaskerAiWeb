import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Mic,
  MicOff,
  Trash2,
  Check,
  CheckCircle2,
  X,
  ArrowRight,
  RotateCcw,
  Cloud,
  Layers,
  Calendar,
  Zap,
  Lock,
  ListTodo
} from 'lucide-react';
import { Category, BYOKConfig, UserTier, Priority, PRIORITY_CONFIG } from '../types';
import { GoalBreakdownItem, geminiService } from '../services/geminiService';
import { storageService } from '../services/storageService';

interface BrainDumpModalProps {
  initialContent: string;
  categories: Category[];
  byokConfig: BYOKConfig;
  tier: UserTier;
  onClose: () => void;
  onSaveContent: (content: string) => void;
  onAddTasks: (newTasks: Array<{
    title: string;
    description: string;
    dueDate: number | null;
    priority: Priority;
    categoryId: string | null;
    isCompleted: boolean;
    isRecurring: boolean;
    recurrenceInterval: any;
    hasAlarm: boolean;
    subtaskTitles: string[];
  }>) => void;
  onOpenUpgradeModal: () => void;
  onIncrementDemoUses: () => void;
}

export const BrainDumpModal: React.FC<BrainDumpModalProps> = ({
  initialContent,
  categories,
  byokConfig,
  tier,
  onClose,
  onSaveContent,
  onAddTasks,
  onOpenUpgradeModal,
  onIncrementDemoUses
}) => {
  const [content, setContent] = useState(initialContent || '');
  const [isRecording, setIsRecording] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [extractedTasks, setExtractedTasks] = useState<GoalBreakdownItem[] | null>(null);
  const [selectedTaskIndices, setSelectedTaskIndices] = useState<Set<number>>(new Set());
  const [clearDumpAfterImport, setClearDumpAfterImport] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(categories[0]?.id || null);

  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync content state if initialContent changes
  useEffect(() => {
    setContent(initialContent || '');
  }, [initialContent]);

  // Voice dictation setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onresult = (e: any) => {
        const results = Array.from(e.results);
        const transcript = results
          .map((r: any) => r[0].transcript)
          .join(' ')
          .trim();

        if (transcript) {
          setContent((prev) => {
            const updated = prev ? `${prev}\n${transcript}` : transcript;
            storageService.saveBrainDump(updated);
            onSaveContent(updated);
            return updated;
          });
        }
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
    }
  }, [onSaveContent]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.warn('Recognition start error:', err);
      }
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    storageService.saveBrainDump(val);
    onSaveContent(val);
  };

  const handleClear = () => {
    if (!content.trim() || confirm('Clear all text from your Brain Dump scratchpad?')) {
      setContent('');
      storageService.saveBrainDump('');
      onSaveContent('');
    }
  };

  // Convert Brain Dump to tasks using Gemini AI
  const handleConvertToTasks = async () => {
    if (!content.trim()) return;

    const canUse = storageService.canUseAi(byokConfig);
    if (!canUse.allowed) {
      onOpenUpgradeModal();
      return;
    }

    setIsAiLoading(true);
    try {
      const results = await geminiService.parseBrainDumpToTasks(
        content,
        byokConfig,
        categories.map((c) => ({ id: c.id, name: c.name }))
      );

      if (tier === 'FREE_DEMO') {
        onIncrementDemoUses();
      }

      setExtractedTasks(results);
      setSelectedTaskIndices(new Set(results.map((_, i) => i)));
    } catch (err) {
      console.error('Brain dump AI parsing failed:', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const toggleTaskSelection = (index: number) => {
    setSelectedTaskIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleImportTasks = () => {
    if (!extractedTasks) return;

    const tasksToImport = extractedTasks.filter((_, i) => selectedTaskIndices.has(i));
    if (tasksToImport.length === 0) return;

    const payload = tasksToImport.map((t) => ({
      title: t.title,
      description: t.description,
      dueDate: t.dueDate,
      priority: t.priority,
      categoryId: selectedCategoryId,
      isCompleted: false,
      isRecurring: t.isRecurring,
      recurrenceInterval: t.recurrenceInterval,
      hasAlarm: false,
      subtaskTitles: t.subtaskTitles || []
    }));

    onAddTasks(payload);

    if (clearDumpAfterImport) {
      setContent('');
      storageService.saveBrainDump('');
      onSaveContent('');
    }

    onClose();
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const lineCount = content.trim() ? content.trim().split('\n').length : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden animate-scale-in">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0 bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">Brain Dump Scratchpad</h2>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-[10px] font-bold">
                  AI-Powered
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Jot down stream-of-consciousness thoughts & convert to structured tasks
              </p>
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
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {!extractedTasks ? (
            <>
              {/* Scratchpad Textarea */}
              <div className="relative flex flex-col flex-1">
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={handleTextChange}
                  placeholder={`Dump everything on your mind here...

• Call accountant before Friday
• Need to buy oat milk and avocados
• Follow up with design team on project roadmap
• Plan weekend hike with friends
• Research new gym routine and nutrition plan`}
                  rows={10}
                  className="w-full flex-1 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 leading-relaxed font-sans resize-none shadow-inner"
                  autoFocus
                />

                {/* Live Stats & Auto-Sync Bar */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 px-2 pt-2">
                  <div className="flex items-center gap-3">
                    <span>{wordCount} words</span>
                    <span>•</span>
                    <span>{lineCount} lines</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-cyan-400">
                      <Cloud className="w-3 h-3" /> Auto-saved to Cloud
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleRecording}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border transition-all ${
                        isRecording
                          ? 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                      }`}
                      title={isRecording ? 'Stop Dictating' : 'Dictate with Voice'}
                    >
                      {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                      <span>{isRecording ? 'Listening...' : 'Voice'}</span>
                    </button>

                    {content.trim() && (
                      <button
                        type="button"
                        onClick={handleClear}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors"
                        title="Clear Scratchpad"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Clear</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Free Tier Quota Info */}
              {tier === 'FREE_DEMO' && (
                <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-850 border border-slate-800 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      Free Demo AI Uses Left: <strong>{Math.max(0, 3 - byokConfig.demoAiUsesCount)}/3</strong>
                    </span>
                  </div>
                  <button
                    onClick={onOpenUpgradeModal}
                    className="text-xs font-bold text-purple-400 hover:text-purple-300 underline"
                  >
                    Unlock Unlimited →
                  </button>
                </div>
              )}
            </>
          ) : (
            /* AI Results Review Screen */
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-slate-200">
                    Extracted {extractedTasks.length} Structured Tasks
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <button
                    onClick={() => {
                      if (selectedTaskIndices.size === extractedTasks.length) {
                        setSelectedTaskIndices(new Set());
                      } else {
                        setSelectedTaskIndices(new Set(extractedTasks.map((_, i) => i)));
                      }
                    }}
                    className="text-purple-400 hover:text-purple-300 font-semibold"
                  >
                    {selectedTaskIndices.size === extractedTasks.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
              </div>

              {/* Category Assignment Option */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">Assign Category:</span>
                <select
                  value={selectedCategoryId || ''}
                  onChange={(e) => setSelectedCategoryId(e.target.value || null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="">No Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Task Items List */}
              <div className="flex flex-col gap-2.5 max-h-80 overflow-y-auto pr-1">
                {extractedTasks.map((task, idx) => {
                  const isSelected = selectedTaskIndices.has(idx);
                  const prioMeta = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.MEDIUM;

                  return (
                    <div
                      key={idx}
                      onClick={() => toggleTaskSelection(idx)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                        isSelected
                          ? 'bg-purple-950/30 border-purple-500/60 shadow-md'
                          : 'bg-slate-850/60 border-slate-800 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <div
                        className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-purple-600 border-purple-500 text-white'
                            : 'border-slate-600 bg-slate-800'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-bold text-slate-100 truncate">{task.title}</h4>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${prioMeta.bgClass}`}>
                            {prioMeta.label}
                          </span>
                        </div>

                        {task.description && (
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                            {task.description}
                          </p>
                        )}

                        {task.subtaskTitles?.length > 0 && (
                          <div className="mt-2 pl-2.5 border-l-2 border-slate-700/60 flex flex-col gap-1">
                            {task.subtaskTitles.map((st, sIdx) => (
                              <span key={sIdx} className="text-[11px] text-slate-300">
                                • {st}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Clear Dump Checkbox */}
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={clearDumpAfterImport}
                  onChange={(e) => setClearDumpAfterImport(e.target.checked)}
                  className="rounded border-slate-700 text-purple-600 focus:ring-purple-500"
                />
                <span>Clear Brain Dump scratchpad after adding tasks</span>
              </label>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 shrink-0 bg-slate-900">
          {!extractedTasks ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
              >
                Close
              </button>

              <button
                type="button"
                onClick={handleConvertToTasks}
                disabled={!content.trim() || isAiLoading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-purple-600/30 active:scale-95 transition-all"
              >
                <Sparkles className={`w-4 h-4 ${isAiLoading ? 'animate-spin' : ''}`} />
                <span>{isAiLoading ? 'Extracting Tasks with Gemini...' : 'Convert to Tasks with AI'}</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setExtractedTasks(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
              >
                Back to Notes
              </button>

              <button
                type="button"
                onClick={handleImportTasks}
                disabled={selectedTaskIndices.size === 0}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 active:scale-95 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Add {selectedTaskIndices.size} Tasks to Dashboard</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
