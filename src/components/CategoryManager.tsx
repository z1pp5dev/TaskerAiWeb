import React, { useState } from 'react';
import { Category, Priority, PRIORITY_CONFIG, UserTier, FREE_TIER_LIMITS } from '../types';
import {
  Check,
  Plus,
  Edit2,
  Lock,
  Filter,
  Trash2,
  X,
  Palette
} from 'lucide-react';

interface CategoryManagerProps {
  categories: Category[];
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
  selectedPriority: Priority | null;
  onSelectPriority: (priority: Priority | null) => void;
  tier: UserTier;
  onAddCategory: (name: string, color?: string) => void;
  onUpdateCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
  onOpenUpgradeModal: () => void;
  categoryTaskCounts: Record<string, number>;
  totalTasksCount: number;
}

const PRESET_COLORS = [
  '#a855f7', // Purple
  '#38bdf8', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#f43f5e', // Rose
  '#ec4899', // Pink
  '#6366f1', // Indigo
  '#14b8a6'  // Teal
];

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
  selectedPriority,
  onSelectPriority,
  tier,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onOpenUpgradeModal,
  categoryTaskCounts,
  totalTasksCount
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);

  const isFreeTier = tier === 'FREE_DEMO';
  const isCategoryLimitReached = isFreeTier && categories.length >= FREE_TIER_LIMITS.MAX_CATEGORIES;

  const handleOpenAdd = () => {
    if (isCategoryLimitReached) {
      onOpenUpgradeModal();
      return;
    }
    setEditingCategory(null);
    setNameInput('');
    setSelectedColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (category: Category, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCategory(category);
    setNameInput(category.name);
    setSelectedColor(category.color || PRESET_COLORS[0]);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;

    if (editingCategory) {
      onUpdateCategory({
        ...editingCategory,
        name: nameInput.trim(),
        color: selectedColor
      });
    } else {
      onAddCategory(nameInput.trim(), selectedColor);
    }
    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (editingCategory) {
      onDeleteCategory(editingCategory.id);
      setIsModalOpen(false);
    }
  };

  return (
    <div className="flex flex-col gap-2.5 px-4">
      {/* Category Chips Horizontal Bar */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
        {/* "All" Category Chip */}
        <button
          onClick={() => onSelectCategory(null)}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition-all shrink-0 active:scale-95 ${
            selectedCategoryId === null
              ? 'bg-purple-600/90 border-purple-500 text-white shadow-md shadow-purple-600/20'
              : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-300'
          }`}
        >
          {selectedCategoryId === null && <Check className="w-3 h-3 stroke-[3]" />}
          <span>All</span>
          <span className="ml-0.5 px-1.5 py-0.2 text-[10px] rounded-full bg-slate-800/80 text-slate-300">
            {totalTasksCount}
          </span>
        </button>

        {/* Custom Category Pills */}
        {categories.map((cat) => {
          const isSelected = selectedCategoryId === cat.id;
          const count = categoryTaskCounts[cat.id] || 0;
          return (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-all shrink-0 active:scale-95 ${
                isSelected
                  ? 'bg-purple-950/80 border-purple-500 text-purple-200 shadow-md shadow-purple-900/30'
                  : 'bg-slate-900/70 hover:bg-slate-800/90 border-slate-800 text-slate-300'
              }`}
            >
              {/* Color Dot */}
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: cat.color || '#a855f7' }}
              />

              {isSelected && <Check className="w-3 h-3 stroke-[3] text-purple-400" />}

              <span>{cat.name}</span>

              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-850 text-slate-400">
                {count}
              </span>

              {/* Edit Category Button */}
              <button
                onClick={(e) => handleOpenEdit(cat, e)}
                className="opacity-60 hover:opacity-100 hover:text-purple-300 p-0.5 rounded transition-opacity"
                title="Edit / Rename category"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
          );
        })}

        {/* Add Category Button */}
        <button
          onClick={handleOpenAdd}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border border-dashed text-xs font-medium transition-all shrink-0 active:scale-95 ${
            isCategoryLimitReached
              ? 'border-amber-500/40 text-amber-400 hover:border-amber-500 hover:bg-amber-950/20'
              : 'border-slate-700 hover:border-purple-400 text-slate-400 hover:text-purple-300 hover:bg-purple-950/20'
          }`}
          title={isCategoryLimitReached ? 'Upgrade to add more categories' : 'Create new category'}
        >
          {isCategoryLimitReached ? (
            <>
              <Lock className="w-3 h-3 text-amber-400" />
              <span>3/3 Max</span>
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              <span>New Category</span>
            </>
          )}
        </button>
      </div>

      {/* Priority Filters Row */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar text-xs">
        <div className="flex items-center gap-1 text-slate-500 font-semibold uppercase tracking-wider text-[10px] mr-1 shrink-0">
          <Filter className="w-3 h-3" />
          <span>Priority:</span>
        </div>

        {/* Any Priority Chip */}
        <button
          onClick={() => onSelectPriority(null)}
          className={`px-2.5 py-1 rounded-lg border text-xs transition-all shrink-0 ${
            selectedPriority === null
              ? 'bg-slate-700 border-slate-500 text-white font-semibold'
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          Any
        </button>

        {/* Individual Priority Chips */}
        {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as Priority[]).map((p) => {
          const isSelected = selectedPriority === p;
          const meta = PRIORITY_CONFIG[p];
          return (
            <button
              key={p}
              onClick={() => onSelectPriority(isSelected ? null : p)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs transition-all shrink-0 ${
                isSelected
                  ? `${meta.bgClass} font-semibold ring-1 ring-purple-500/50`
                  : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
              <span>{meta.label}</span>
            </button>
          );
        })}
      </div>

      {/* Category Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Palette className="w-4 h-4 text-purple-400" />
                {editingCategory ? 'Edit Category' : 'Create Category'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col gap-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="e.g. Work, Fitness, Side Hustle"
                  required
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-850 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Color Presets */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Accent Color
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        selectedColor === color ? 'ring-2 ring-white scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {selectedColor === color && <Check className="w-4 h-4 text-white stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Info if editing */}
              {editingCategory && (
                <div className="p-3 rounded-xl bg-slate-850/70 border border-slate-800 text-xs text-slate-400">
                  Renaming this category will immediately update all {categoryTaskCounts[editingCategory.id] || 0} associated tasks.
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800 mt-2">
                {editingCategory ? (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-950/40 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!nameInput.trim()}
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-xs font-bold text-white transition-all shadow-md shadow-purple-600/30"
                  >
                    {editingCategory ? 'Update' : 'Create'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
