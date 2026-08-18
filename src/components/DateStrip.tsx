import React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';

interface DateStripProps {
  selectedDate: number | null;
  onDateSelected: (dateMs: number | null) => void;
}

export const DateStrip: React.FC<DateStripProps> = ({ selectedDate, onDateSelected }) => {
  const dates = React.useMemo(() => {
    const list: { ms: number; label: string; subLabel: string; isToday: boolean }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const isToday = i === 0;
      const isTomorrow = i === 1;

      let label = isToday ? 'Today' : isTomorrow ? 'Tmw' : d.toLocaleDateString('en-US', { weekday: 'short' });
      let subLabel = d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });

      list.push({
        ms: d.getTime(),
        label,
        subLabel,
        isToday
      });
    }
    return list;
  }, []);

  const isSameDay = (d1: number, d2: number | null) => {
    if (d2 === null) return false;
    const date1 = new Date(d1);
    const date2 = new Date(d2);
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-2 px-4 no-scrollbar">
      <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-400 mr-1 shrink-0">
        <CalendarIcon className="w-3.5 h-3.5 text-purple-400" />
        <span>Focus:</span>
      </div>

      <button
        onClick={() => onDateSelected(null)}
        className={`flex items-center px-3 py-2 rounded-xl border text-xs font-semibold shrink-0 transition-all active:scale-[0.96] ${
          selectedDate === null
            ? 'bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-500/25'
            : 'bg-slate-900/60 hover:bg-slate-850 border-slate-800/80 text-slate-300 hover:border-slate-700'
        }`}
      >
        All Dates
      </button>
      {dates.map((item) => {
        const selected = isSameDay(item.ms, selectedDate);
        return (
          <button
            key={item.ms}
            onClick={() => onDateSelected(item.ms)}
            className={`flex flex-col items-center justify-center min-w-[62px] px-3 py-1.5 rounded-xl border text-xs font-medium transition-all active:scale-[0.96] shrink-0 ${
              selected
                ? 'bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-500/25'
                : 'bg-slate-900/60 hover:bg-slate-850 border-slate-800/80 text-slate-300 hover:border-slate-700'
            }`}
          >
            <span className={`font-semibold ${selected ? 'text-white' : item.isToday ? 'text-purple-400' : 'text-slate-300'}`}>
              {item.label}
            </span>
            <span className={`text-[10px] ${selected ? 'text-purple-100' : 'text-slate-500'}`}>
              {item.subLabel}
            </span>
          </button>
        );
      })}
    </div>
  );
};
