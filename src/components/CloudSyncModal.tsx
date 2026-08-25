import React, { useState } from 'react';
import {
  HardDrive,
  Cloud,
  CloudOff,
  RefreshCw,
  LogOut,
  ShieldCheck,
  Check,
  X
} from 'lucide-react';
import { googleDriveService, GoogleDriveUser } from '../services/googleDriveService';

interface CloudSyncModalProps {
  user: GoogleDriveUser | null;
  isSyncing: boolean;
  onClose: () => void;
  onSyncNow: () => Promise<void>;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  user,
  isSyncing,
  onClose,
  onSyncNow,
  onShowToast
}) => {
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    const res = await googleDriveService.signInWithGoogle();
    setIsSigningIn(false);

    if (!res.success) {
      onShowToast(res.error || 'Google Sign-In was cancelled or failed.', 'error');
    } else {
      onShowToast('Connected with Google! Tasks synced.', 'success');
      await onSyncNow();
    }
  };

  const handleSignOut = () => {
    googleDriveService.signOut();
    onShowToast('Signed out of Google Drive. Your local tasks are safely preserved.', 'info');
    onClose();
  };

  const formatLastSync = () => {
    const ms = googleDriveService.getLastSyncTime();
    if (!ms) return 'Not synced yet';
    const diff = Math.floor((Date.now() - ms) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md flex flex-col rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-purple-950/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Google Cloud Backup & Sync
              </h2>
              <p className="text-xs text-slate-400">Automatic Sync to your Google Drive</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-5">
          {/* User / Sync Status Card */}
          <div className="p-4 rounded-2xl bg-slate-850/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {user?.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-11 h-11 rounded-full border-2 border-emerald-500/60 shadow-md object-cover"
                />
              ) : (
                <div
                  className={`p-3 rounded-2xl ${
                    user
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {user ? <Cloud className="w-5 h-5" /> : <CloudOff className="w-5 h-5" />}
                </div>
              )}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Account Status
                </span>
                <h4 className="text-sm font-bold text-slate-100">
                  {user ? user.name : 'Local Guest Mode'}
                </h4>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  {user?.email ? user.email : 'Tasks saved locally on this device'}
                </p>
              </div>
            </div>

            {user && (
              <div className="flex flex-col items-end gap-1">
                <button
                  type="button"
                  onClick={onSyncNow}
                  disabled={isSyncing}
                  className="py-1.5 px-3 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-300 transition-all active:scale-95 flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                  title="Sync with Google Drive"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-cyan-400' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                </button>
                <span className="text-[10px] text-slate-400">{formatLastSync()}</span>
              </div>
            )}
          </div>

          {/* Local-First & Privacy Benefits */}
          <div className="p-4 rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-850 to-slate-900">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 mb-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>How Cloud Sync Works</span>
            </h3>
            <ul className="flex flex-col gap-2 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span><strong>Instant & Offline:</strong> Tasker AI runs directly in your browser with zero loading delay.</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span><strong>100% Private:</strong> Tasks automatically backup to <code className="text-emerald-300">TaskerAI_Backup.json</code> in your Google Drive.</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span><strong>Zero Data Loss:</strong> Signing in merges your local tasks into your Google account seamlessly.</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          {!user ? (
            <div className="flex flex-col gap-2.5 pt-1">
              <button
                type="button"
                disabled={isSigningIn}
                onClick={handleGoogleSignIn}
                className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-900 font-bold text-xs transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95 cursor-pointer"
              >
                {/* Official Google 'G' Logo */}
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span className="text-sm font-bold tracking-wide text-slate-850">
                  {isSigningIn ? 'Opening Google Sign-In...' : 'Sign in with Google'}
                </span>
              </button>

              <p className="text-center text-[11px] text-slate-400">
                1-Click Google Sign-In with official Google password & Google Drive authorization.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5 pt-1 border-t border-slate-800">
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-rose-950/50 hover:border-rose-500/40 border border-slate-700 text-xs font-semibold text-rose-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out of Google Drive Sync</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-800 shrink-0 bg-slate-900">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
