import { useState } from 'react';
import { ChevronDown, ChevronUp, BookOpen, CheckSquare, Star, Layers } from 'lucide-react';
import { cn } from '../../utils/cn.js';

// ─── Item bullet list ────────────────────────────────────────────────────────
function ItemList({ items, markerType = 'bullet' }) {
  if (!items?.length) return null;
  return (
    <ul className="space-y-1.5 mt-2">
      {items.map((item, i) => (
        <li
          key={item._id ?? i}
          className={cn(
            'flex gap-2 text-sm leading-relaxed text-[#475569]',
            item.indent === 1 && 'ml-5',
            item.indent === 2 && 'ml-10',
          )}
        >
          <span className={cn(
            'mt-1 shrink-0 w-1.5 h-1.5 rounded-full',
            markerType === 'check' ? 'bg-[#CA6357]' : 'bg-[#C45E52]',
            item.indent > 0 && 'bg-[#F2B3AC]',
          )} />
          <span>{item.text}</span>
        </li>
      ))}
    </ul>
  );
}

// ─── Single Task block ────────────────────────────────────────────────────────
function TaskBlock({ task, index }) {
  return (
    <div className="bg-[#F8F9FB] border border-[#E2E8F0] rounded-xl p-4">
      {task.title && (
        <p className="font-semibold text-[#1E293B] text-sm mb-1">{task.title}</p>
      )}
      {task.intro && (
        <p className="text-sm text-[#475569] mb-1">{task.intro}</p>
      )}
      <ItemList items={task.items} markerType="check" />
    </div>
  );
}

// ─── Single Day card ─────────────────────────────────────────────────────────
const DAY_COLORS = [
  'bg-[#FDEFEE] border-[#F2B3AC] text-[#CA6357]',
  'bg-purple-50   border-purple-200  text-purple-700',
  'bg-amber-50    border-amber-200   text-amber-700',
  'bg-green-50    border-green-200   text-green-700',
  'bg-rose-50     border-rose-200    text-rose-700',
  'bg-sky-50      border-sky-200     text-sky-700',
  'bg-fuchsia-50  border-fuchsia-200 text-fuchsia-700',
];

function DayCard({ day, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const colorClass = DAY_COLORS[(day.isExtraDay ? 6 : (day.dayNumber - 1)) % DAY_COLORS.length];

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
      {/* Day header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 p-4 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className={cn(
            'shrink-0 flex items-center justify-center w-9 h-9 rounded-xl text-xs font-bold border',
            colorClass,
          )}>
            {day.isExtraDay ? 'EX' : `D${day.dayNumber}`}
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-[#1E293B] text-sm leading-snug truncate">
              {day.isExtraDay ? 'Extra Day' : `Day ${day.dayNumber}`}
              {day.title ? ` — ${day.title}` : ''}
            </p>
            {!open && day.objective && (
              <p className="text-xs text-[#94A3B8] mt-0.5 truncate">{day.objective}</p>
            )}
          </div>
        </div>
        {open ? (
          <ChevronUp className="shrink-0 w-4 h-4 text-[#94A3B8]" />
        ) : (
          <ChevronDown className="shrink-0 w-4 h-4 text-[#94A3B8]" />
        )}
      </button>

      {open && (
        <div className="px-4 pb-5 space-y-4 border-t border-[#F1F5F9]">
          {/* Objective */}
          {day.objective && (
            <div className="pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-1">
                Objective
              </p>
              <p className="text-sm text-[#475569] leading-relaxed">{day.objective}</p>
            </div>
          )}

          {/* Topics covered */}
          {day.contentItems?.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <BookOpen className="w-3.5 h-3.5 text-[#CA6357]" />
                <p className="text-xs font-semibold uppercase tracking-wider text-[#CA6357]">
                  Topics Covered
                </p>
              </div>
              <div className="bg-[#F8F9FB] rounded-xl p-3">
                <ItemList items={day.contentItems} />
              </div>
            </div>
          )}

          {/* Tasks */}
          {day.tasks?.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <CheckSquare className="w-3.5 h-3.5 text-[#D96C5F]" />
                <p className="text-xs font-semibold uppercase tracking-wider text-[#D96C5F]">
                  {day.tasks.length === 1 ? 'Task' : 'Tasks'}
                </p>
              </div>
              <div className="space-y-3">
                {day.tasks.map((task, i) => (
                  <TaskBlock key={task._id ?? i} task={task} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* Final step */}
          {day.finalStep && (
            <div className="bg-[#CA6357] rounded-xl p-4 flex items-start gap-3">
              <Star className="w-4 h-4 text-white shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-[#F2B3AC] uppercase tracking-wider mb-1">
                  Final Step
                </p>
                <p className="text-sm text-white leading-relaxed">{day.finalStep}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main exported component ──────────────────────────────────────────────────
export default function WeekTaskSheet({ content }) {
  const [allOpen, setAllOpen] = useState(false);

  if (!content) return null;

  const regularDays = content.days?.filter(d => !d.isExtraDay) ?? [];
  const extraDays   = content.days?.filter(d => d.isExtraDay)  ?? [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#CA6357] to-[#A94E43] rounded-2xl p-5 text-white">
        <div className="flex items-center gap-2 mb-1">
          <Layers className="w-4 h-4 text-[#F2B3AC]" />
          <span className="text-xs font-semibold text-[#F2B3AC] uppercase tracking-wider">
            Week {content.week}
          </span>
        </div>
        <h2 className="text-xl font-bold leading-snug">
          {content.topicsOverview || `Week ${content.week} Task Sheet`}
        </h2>
        <p className="text-sm text-[#F2B3AC] mt-1">
          {regularDays.length} day{regularDays.length !== 1 ? 's' : ''}
          {extraDays.length > 0 && ` + ${extraDays.length} extra day${extraDays.length > 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Expand/collapse all */}
      <div className="flex justify-end">
        <button
          onClick={() => setAllOpen(o => !o)}
          className="text-xs text-[#CA6357] font-medium hover:underline flex items-center gap-1"
        >
          {allOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {allOpen ? 'Collapse all' : 'Expand all'}
        </button>
      </div>

      {/* Day cards */}
      {content.days?.map((day, i) => (
        <DayCard key={day._id ?? i} day={day} defaultOpen={allOpen} />
      ))}
    </div>
  );
}
