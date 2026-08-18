import React, { useState } from 'react';
import { BYOKConfig, UserTier } from '../types';
import { geminiService } from '../services/geminiService';
import { storageService } from '../services/storageService';
import {
  Key,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ExternalLink,
  ShieldCheck,
  Cpu,
  Download,
  Upload,
  RotateCcw,
  X,
  Sparkles,
  Zap
} from 'lucide-react';

interface SettingsModalProps {
  config: BYOKConfig;
  tier: UserTier;
  onClose: () => void;
  onSaveConfig: (config: BYOKConfig) => void;
  onDataImported: () => void;
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const DEFAULT_MODELS = [
  { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash (Recommended - Fastest & High Accuracy)' },
  { id: 'gemini-3.6-pro', name: 'Gemini 3.6 Pro (Advanced Reasoning & Goal Breakdown)' },
  { id: 'gemini-3.6-flash-lite', name: 'Gemini 3.6 Flash Lite (Ultra-Low Latency)' },
  { id: 'gemini-3.6-flash-8b', name: 'Gemini 3.6 Flash 8B (Lightweight Efficiency)' }
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  config,
  tier,
  onClose,
  onSaveConfig,
  onDataImported,
  onShowToast
}) => {
  const [apiKey, setApiKey] = useState(config.apiKey);
  const [selectedModel, setSelectedModel] = useState((config.model && config.model.includes('3.6')) ? config.model : 'gemini-3.6-flash');
  const [modelOptions, setModelOptions] = useState<Array<{ id: string; name: string }>>(DEFAULT_MODELS);
  const [showKey, setShowKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    error?: string;
  } | null>(null);

  const handleValidateAndSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!apiKey.trim()) {
      // Clear key -> revert to Free Demo
      const updated: BYOKConfig = {
        ...config,
        apiKey: '',
        isValidated: false,
        model: selectedModel
      };
      onSaveConfig(updated);
      setValidationResult(null);
      onShowToast('API key removed. Reverted to Free Demo tier.', 'info');
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    const result = await geminiService.validateApiKey(apiKey.trim(), selectedModel);
    setIsValidating(false);
    setValidationResult(result);

    if (result.valid) {
      if (result.availableModels && result.availableModels.length > 0) {
        setModelOptions(result.availableModels);
      }
      const finalModel = result.resolvedModel || selectedModel;
      setSelectedModel(finalModel);
      const updated: BYOKConfig = {
        ...config,
        apiKey: apiKey.trim(),
        model: finalModel,
        isValidated: true,
        lastValidatedAt: Date.now()
      };
      onSaveConfig(updated);
      onShowToast(`Gemini API Key verified! Model: ${finalModel}. Unlimited BYOK Tier unlocked.`, 'success');
    } else {
      onShowToast(result.error || 'Failed to validate API Key', 'error');
    }
  };

  const handleExport = () => {
    const json = storageService.exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tasker-ai-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast('Data exported successfully!', 'success');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = storageService.importData(content);
        if (res.success) {
          onDataImported();
          onShowToast(res.message, 'success');
          onClose();
        } else {
          onShowToast(res.message, 'error');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    if (confirm('Are you sure you want to reset all tasks and categories to default sample data?')) {
      storageService.resetToDefaults();
      onDataImported();
      onShowToast('Sample data restored.', 'info');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Settings & BYOK Engine</h2>
              <p className="text-xs text-slate-400">Bring Your Own Key & Data Management</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {/* Current Tier Badge Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 to-slate-850 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl ${
                  tier === 'BYOK_UNLOCKED'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {tier === 'BYOK_UNLOCKED' ? <ShieldCheck className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Active Tier
                </span>
                <h4 className="text-sm font-bold text-slate-100">
                  {tier === 'BYOK_UNLOCKED'
                    ? 'BYOK Free Unlocked (Unlimited)'
                    : 'Free Demo (Limited)'}
                </h4>
              </div>
            </div>
            {tier === 'FREE_DEMO' && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800 font-semibold">
                {config.demoAiUsesCount}/3 trials used
              </span>
            )}
          </div>

          {/* BYOK Section */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-purple-400" />
                <span>Personal Gemini API Key</span>
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium underline"
              >
                <span>Get Free Gemini Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Tasker AI runs 100% client-side. Your API key is stored safely in your browser's <code className="text-purple-300">localStorage</code> and never sent to any intermediary server.
            </p>

            <div className="relative flex items-center">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full pl-3.5 pr-20 py-2.5 rounded-xl bg-slate-850 border border-slate-700 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 text-slate-400 hover:text-slate-200 p-1"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Validation Feedback */}
            {validationResult && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                  validationResult.valid
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                }`}
              >
                {validationResult.valid ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span>
                  {validationResult.valid
                    ? 'Connection successful! Your API key is active.'
                    : `Error: ${validationResult.error}`}
                </span>
              </div>
            )}

            {/* Test & Save Key Action */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleValidateAndSave}
                disabled={isValidating}
                className="flex-1 py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-xs font-bold text-white transition-all shadow-md shadow-purple-600/30 flex items-center justify-center gap-2"
              >
                {isValidating ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying with Google Gemini...</span>
                  </>
                ) : (
                  <span>Test & Save API Key</span>
                )}
              </button>
            </div>
          </div>

          {/* Model Selection */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>Gemini Model Engine</span>
            </label>
            <select
              value={selectedModel}
              onChange={(e) => {
                setSelectedModel(e.target.value);
                const updated = { ...config, model: e.target.value };
                onSaveConfig(updated);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-850 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              {modelOptions.map((m) => (
                <option key={m.id} value={m.id} className="bg-slate-900 text-slate-200">
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Data Backup & Restore */}
          <div className="flex flex-col gap-3 pt-3 border-t border-slate-800">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Data & Backup Management
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleExport}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-purple-400" />
                <span>Export Backup (JSON)</span>
              </button>

              <label className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                <span>Import Backup</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={handleResetData}
              className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-950/30 transition-colors mt-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Sample Data</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-800 shrink-0 bg-slate-900">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
