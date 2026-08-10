// components/projects/TodoCalendarView.tsx
"use client";

import { useMemo, useState } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  format,
  addMonths,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, Check, X } from "lucide-react";
import type { Todo } from "@/db/schema/projects";
import { STATUS_STYLE, STATUS_LABELS } from "@/utils/projects-helpers";
import { useTodoActions } from "./useTodoActions";
import TodoEditForm from "./TodoEditForm";

export default function TodoCalendarView({ todos }: { todos: Todo[] }) {
  const [cursor, setCursor] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const withDueDate = todos.filter((t) => t.dueDate);
  const withoutDueDate = todos.filter((t) => !t.dueDate);

  const days = useMemo(() => {
    const monthStart = startOfMonth(cursor);
    const monthEnd = endOfMonth(cursor);
    return eachDayOfInterval({ start: startOfWeek(monthStart), end: endOfWeek(monthEnd) });
  }, [cursor]);

  function todosForDay(day: Date) {
    const key = format(day, "yyyy-MM-dd");
    return withDueDate.filter((t) => t.dueDate === key);
  }

  return (
    <div className="p-3">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={() => setCursor((c) => subMonths(c, 1))} className="pixel-btn bg-card p-2">
          <ChevronLeft size={12} />
        </button>
        <div className="flex items-center gap-2">
          <span className="font-pixel text-xs">{format(cursor, "MMMM yyyy")}</span>
          <button
            type="button"
            onClick={() => setCursor(new Date())}
            className="pixel-tag bg-muted text-foreground border-abyssal hover:bg-oatmeal transition-colors"
            style={{ fontSize: "7px" }}
          >
            TODAY
          </button>
        </div>
        <button type="button" onClick={() => setCursor((c) => addMonths(c, 1))} className="pixel-btn bg-card p-2">
          <ChevronRight size={12} />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="font-pixel text-center text-muted-foreground" style={{ fontSize: "7px" }}>{d}</div>
        ))}
      </div>

      {/* Month grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dayTodos = todosForDay(day);
          const inMonth = isSameMonth(day, cursor);
          const isCurrentDay = isToday(day);
          const shown = dayTodos.slice(0, 3);
          const overflow = dayTodos.length - shown.length;
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => setSelectedDay(day)}
              className={`min-h-[64px] p-1 text-left pixel-inset flex flex-col gap-0.5 transition-colors overflow-hidden ${
                inMonth ? "bg-background hover:bg-muted/50" : "bg-muted/30 opacity-50 hover:opacity-75"
              }`}
              style={isCurrentDay ? { borderColor: "var(--burning-flame)" } : undefined}
            >
              <span className={`font-pixel ${isCurrentDay ? "text-burning-flame" : "text-foreground"}`} style={{ fontSize: "7px" }}>
                {format(day, "d")}
              </span>
              {shown.map((t) => (
                <span
                  key={t.id}
                  className={`pixel-tag border-abyssal truncate block w-full ${STATUS_STYLE[t.status]}`}
                  style={{ fontSize: "6px" }}
                >
                  {t.title}
                </span>
              ))}
              {overflow > 0 && (
                <span className="font-mono text-muted-foreground" style={{ fontSize: "7px" }}>+{overflow} more</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Todos without a due date — always visible so nothing is hidden from this view */}
      {withoutDueDate.length > 0 && (
        <div className="mt-4">
          <p className="font-pixel text-muted-foreground mb-2" style={{ fontSize: "8px" }}>
            NO DUE DATE ({withoutDueDate.length})
          </p>
          <div className="pixel-box-sm bg-card overflow-hidden">
            {withoutDueDate.map((t) => <DayPanelItem key={t.id} todo={t} />)}
          </div>
        </div>
      )}

      {selectedDay && (
        <DayPanel day={selectedDay} todos={todosForDay(selectedDay)} onClose={() => setSelectedDay(null)} />
      )}
    </div>
  );
}

function DayPanel({ day, todos, onClose }: { day: Date; todos: Todo[]; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-abyssal/70 z-50 flex items-end md:items-center justify-center p-4 bottom-12 md:bottom-0"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="pixel-box bg-card w-full max-w-md animate-slide-up max-h-[80dvh] overflow-y-auto">
        <div className="bg-abyssal text-palladian px-4 py-3 flex items-center justify-between sticky top-0">
          <span className="font-pixel text-xs">{format(day, "EEEE, MMM d")}</span>
          <button onClick={onClose} className="text-oatmeal hover:text-burning-flame transition-colors">
            <X size={14} />
          </button>
        </div>
        {todos.length === 0 ? (
          <p className="font-mono text-xs text-muted-foreground text-center p-8">nothing due this day</p>
        ) : (
          <div>{todos.map((t) => <DayPanelItem key={t.id} todo={t} />)}</div>
        )}
      </div>
    </div>
  );
}

function DayPanelItem({ todo }: { todo: Todo }) {
  const { patch, busy } = useTodoActions(todo.id);
  const [editing, setEditing] = useState(false);
  const isDone = todo.status === "done";

  if (editing) {
    return <TodoEditForm todo={todo} onDone={() => setEditing(false)} />;
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0">
      <button
        onClick={() => patch({ status: isDone ? "open" : "done" })}
        disabled={busy}
        aria-label={isDone ? "mark as open" : "mark as done"}
        className={`shrink-0 w-6 h-6 pixel-box-sm flex items-center justify-center transition-colors ${
          isDone ? "bg-burning-flame text-abyssal" : "bg-background hover:bg-muted"
        }`}
      >
        {isDone && <Check size={13} strokeWidth={3} />}
      </button>
      <button type="button" onClick={() => setEditing(true)} className="flex-1 min-w-0 text-left">
        <p className={`font-mono text-sm truncate ${isDone ? "line-through text-muted-foreground" : ""}`}>{todo.title}</p>
        <span className={`pixel-tag border-abyssal ${STATUS_STYLE[todo.status]}`} style={{ fontSize: "6px" }}>
          {STATUS_LABELS[todo.status]}
        </span>
      </button>
    </div>
  );
}
