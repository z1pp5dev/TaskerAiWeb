import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Search,
  X,
  Mic,
  MicOff,
  ArrowRight,
  Target,
  Lock,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { UserTier, FREE_TIER_LIMITS } from '../types';

interface GoalInputProps {
  completedCount: number;
  totalCount: number;
  progress: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSmartAdd: (input: string) => Promise<void>;
  onOpenAiBreakdown: () => void;
  tier: UserTier;
  demoAiUsesCount: number;
  onOpenUpgradeModal: () => void;
  isAiLoading: boolean;
}

export const GoalInput: React.FC<GoalInputProps> = ({
  completedCount,
  totalCount,
  progress,
  searchQuery,
  onSearchChange,
  onSmartAdd,
  onOpenAiBreakdown,
  tier,
  demoAiUsesCount,
  onOpenUpgradeModal,
  isAiLoading
}) => {
  const [smartInput, setSmartInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Initialize Web Speech API if supported
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setSmartInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleVoiceRecording = () => {
    if (!recognitionRef.current) {
      alert('Voice dictation is not supported in this browser. Try Chrome, Edge, or Safari.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (e) {
        console.error('Error starting recognition:', e);
        setIsRecording(false);
      }
    }
  };

  const handleSmartSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!smartInput.trim() || isAiLoading) return;
    const text = smartInput.trim();
    setSmartInput('');
    await onSmartAdd(text);
  };

  const remainingAiTrials = Math.max(0, FREE_TIER_LIMITS.MAX_DEMO_AI_USES - demoAiUsesCount);
  const isFreeTier = tier === 'FREE_DEMO';

  return (
    <div className="flex flex-col gap-4 px-4 pt-2">
      {/* Today's Focus Card */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-purple-950/40 via-slate-900/60 to-cyan-950/30 p-5 shadow-lg backdrop-blur-md">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                Today's Focus
              </span>
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-purple-500/20 text-purple-300">
                <Sparkles className="w-3 h-3" />
              </span>
            </div>

            <h2 className="text-lg font-bold text-slate-100 mt-1">
              {totalCount === 0 ? (
                'No tasks scheduled yet. Start below!'
              ) : completedCount === totalCount ? (
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" /> All {totalCount} tasks completed! Awesome!
                </span>
              ) : (
                `${completedCount} of ${totalCount} tasks completed`
              )}
            </h2>

            {/* Horizontal Progress Bar */}
            <div className="w-full bg-slate-800/80 rounded-full h-2 mt-3 overflow-hidden border border-slate-700/40">
              <div
                className="bg-gradient-to-r from-purple-500 to-cyan-400 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
          </div>

          {/* Circular Progress Ring */}
          <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-purple-500 transition-all duration-500 ease-out"
                strokeDasharray={`${Math.round(progress * 100)}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-xs font-extrabold text-slate-100">
              {Math.round(progress * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Trial Quota Notice on Free Demo Tier */}
      {isFreeTier && (
        <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Free Demo Tier: <strong className="text-amber-300">{remainingAiTrials}</strong> AI trial generations left
            </span>
          </div>
          <button
            onClick={onOpenUpgradeModal}
            className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors ml-2 shrink-0 underline"
          >
            Unlock Free with BYOK →
          </button>
        </div>
      )}

      {/* Smart Add NLP Input Bar */}
      <form onSubmit={handleSmartSubmit} className="relative flex items-center w-full">
        <div className="relative flex-1 flex items-center">
          <div className="absolute left-3.5 text-purple-400 pointer-events-none">
            <Sparkles className={`w-4 h-4 ${isAiLoading ? 'animate-spin' : ''}`} />
          </div>

          <input
            type="text"
            value={smartInput}
            onChange={(e) => setSmartInput(e.target.value)}
            disabled={isAiLoading}
            placeholder="Smart Add (e.g. Sync review tomorrow at 2 PM with high priority)"
            className="w-full pl-10 pr-24 py-3 rounded-2xl bg-tasker-surface/90 border border-slate-700/80 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 shadow-inner transition-all"
          />

          <div className="absolute right-2.5 flex items-center gap-1.5">
            {/* Voice Dictation Button */}
            <button
              type="button"
              onClick={toggleVoiceRecording}
              className={`p-1.5 rounded-xl transition-all ${
                isRecording
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title={isRecording ? 'Stop voice recording' : 'Dictate task with voice'}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Smart Add Submit Button */}
            <button
              type="submit"
              disabled={!smartInput.trim() || isAiLoading}
              className="p-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:hover:bg-purple-600 text-white transition-all active:scale-95 shadow-md shadow-purple-600/20"
              title="Parse and create smart task"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>

      {/* Search Bar & AI Goal Assistant Button */}
      <div className="flex items-center gap-2">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-tasker-surface border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-600 focus:ring-1 focus:ring-slate-700 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* AI Goal Breakdown Trigger */}
        <button
          onClick={onOpenAiBreakdown}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition-all active:scale-95 shadow-md shadow-purple-600/25 shrink-0"
        >
          <Target className="w-4 h-4" />
          <span>AI Goal</span>
        </button>
      </div>
    </div>
  );
};
