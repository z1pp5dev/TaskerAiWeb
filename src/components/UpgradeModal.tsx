import React from 'react';
import {
  Sparkles,
  Key,
  ShieldCheck,
  Check,
  X,
  ExternalLink,
  ArrowRight,
  Crown,
  Smartphone
} from 'lucide-react';
import { UserTier } from '../types';
import { ProUserData } from '../types/sync';

interface UpgradeModalProps {
  tier: UserTier;
  proUserData?: ProUserData;
  onClose: () => void;
  onOpenSettings: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  tier,
  proUserData,
  onClose,
  onOpenSettings
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0 bg-gradient-to-r from-purple-950/40 via-slate-900 to-indigo-950/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Unlock Tasker AI — 100% Free Forever
              </h2>
              <p className="text-xs text-slate-400">Bring Your Own Key (BYOK) from Google Gemini</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
          {/* Pro Pass Status Card (if unlocked via Android App) */}
          {proUserData?.isPro && (
            <div className="p-4 rounded-2xl border-2 border-amber-500/80 bg-gradient-to-r from-amber-950/50 via-slate-900 to-slate-850 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-bold text-amber-200">
                    {proUserData.proUnlockType === 'lifetime' ? 'Lifetime Pro Pass Active' : 'Rewarded Ad Pass Active'}
                  </h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[11px] font-bold">
                  Synced from Android
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {proUserData.proUnlockType === 'lifetime'
                  ? 'Your lifetime Pro license was successfully detected from your Google Drive backup. Enjoy unlimited AI!'
                  : `Your Rewarded Ad Pass is active until ${proUserData.proExpiresAt ? new Date(proUserData.proExpiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'expiry'}.`}
              </p>
            </div>
          )}

          {/* Android App Ad Pass Card (if not active) */}
          {!proUserData?.isPro && (
            <div className="p-4 rounded-2xl border border-slate-800 bg-gradient-to-r from-indigo-950/40 to-slate-900">
              <div className="flex items-center gap-2 mb-1.5">
                <Smartphone className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-bold text-indigo-200">Watch an Ad on Android for Free Pro Pass</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Watch a quick rewarded video ad in the Tasker AI Android app to unlock a 4-hour Pro Pass that automatically syncs to this web browser via Google Drive!
              </p>
            </div>
          )}

          {/* BYOK Activation Card */}
          <div className="relative flex flex-col justify-between p-5 rounded-2xl border-2 border-purple-500/80 bg-gradient-to-b from-purple-950/40 via-slate-850 to-slate-900 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-1.5">
                <Key className="w-4 h-4 text-purple-400" />
                BYOK Free Activation
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-extrabold">
                Free Forever
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Get a free personal API Key directly from Google AI Studio. Paste it once into Settings to permanently unlock all AI capabilities with zero subscriptions or fees.
            </p>

            <ul className="flex flex-col gap-2.5 text-xs text-slate-200 mb-5">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong>Unlimited</strong> AI Goal Breakdowns & Milestones</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong>Unlimited</strong> Natural Language Smart Add</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong>Unlimited</strong> Custom Categories & Colors</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong>Voice Dictation</strong> with Speech-to-Task</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>100% Client-Side Privacy (Key stays in your browser)</span>
              </li>
            </ul>

            <div className="flex flex-col gap-2.5 pt-3 border-t border-purple-800/40">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSettings();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white transition-all shadow-lg shadow-purple-600/30 flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Enter Free Gemini Key in Settings</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </button>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-center text-xs text-purple-400 hover:text-purple-300 flex items-center justify-center gap-1 font-medium py-1"
              >
                <span>Get a Free API Key from Google AI Studio</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Free Demo Status */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 flex items-center gap-3">
            <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
            <span>
              On the default Free Demo tier, you have 3 trial AI uses and 3 categories. Basic task management and habit tracking are always 100% free!
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-800 shrink-0 bg-slate-900">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
