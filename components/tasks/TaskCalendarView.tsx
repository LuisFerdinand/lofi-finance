// components/tasks/TaskCalendarView.tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/utils";
import {
  ACTIVE_STATUSES,
  STATUS_COLOR,
  PriorityIcon,
  compareByPriority,
  type TaskItem,
  type TodoStatusKey,
} from "@/utils/projects-helpers";
import Modal from "@/components/ui/Modal";
import { isTempId, useTasks } from "./TaskProvider";
import { ProjectChip, StatusPill } from "./TaskBits";
import { useToday } from "./useToday";

const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

export default function TaskCalendarView({ tasks, showProject }: { tasks: TaskItem[]; showProject: boolean }) {
  const today = useToday();
  const [cursor, setCursor] = useState(() => parseISO(today));
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const byDay = useMemo(() => {
    const map = new Map<string, TaskItem[]>();
    for (const t of tasks) {
      if (!t.dueDate) continue;
      const list = map.get(t.dueDate) ?? [];
      list.push(t);
      map.set(t.dueDate, list);
    }
    for (const list of map.values()) list.sort(compareByPriority);
    return map;
  }, [tasks]);

  const unscheduled = useMemo(
    () =>
      tasks
        .filter((t) => !t.dueDate && (ACTIVE_STATUSES as readonly string[]).includes(t.status))
        .sort(compareByPriority),
    [tasks]
  );

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  return (
    <div className="p-3 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setCursor((c) => subMonths(c, 1))}
          aria-label="previous month"
          className="pixel-btn bg-card p-2"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="flex items-center gap-3">
          <h3 className="font-pixel text-xs">{format(cursor, "MMMM yyyy").toUpperCase()}</h3>
          <button
            type="button"
            onClick={() => setCursor(parseISO(today))}
            className="pixel-tag bg-muted text-foreground border-abyssal hover:bg-oatmeal transition-colors"
          >
            TODAY
          </button>
        </div>
        <button
          type="button"
          onClick={() => setCursor((c) => addMonths(c, 1))}
          aria-label="next month"
          className="pixel-btn bg-card p-2"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAYS.map((d) => (
            <div key={d} className="font-pixel text-center text-muted-foreground" style={{ fontSize: "9px" }}>
              <span className="sm:hidden">{d[0]}</span>
              <span className="hidden sm:inline">{d}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayTasks = byDay.get(key) ?? [];
            const inMonth = isSameMonth(day, cursor);
            const isToday = key === today;
            const isPast = key < today;
            const hasOverdue = isPast && dayTasks.some((t) => (ACTIVE_STATUSES as readonly string[]).includes(t.status));
            const shown = dayTasks.slice(0, 3);
            const overflow = dayTasks.length - shown.length;
            return (
              <div
                key={key}
                onClick={() => setSelectedDay(key)}
                className={cn(
                  "min-h-[64px] sm:min-h-[104px] p-1 sm:p-1.5 flex flex-col gap-1 border-2 cursor-pointer transition-colors overflow-hidden",
                  inMonth ? "bg-background hover:bg-muted/60" : "bg-muted/30 opacity-60 hover:opacity-90",
                  isToday ? "border-burning-flame" : "border-border"
                )}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDay(key);
                  }}
                  aria-label={`open ${format(day, "EEEE d MMMM")}`}
                  className={cn(
                    "self-start font-pixel px-1 leading-5",
                    isToday ? "bg-burning-flame text-abyssal" : hasOverdue ? "text-due-overdue" : "text-foreground"
                  )}
                  style={{ fontSize: "10px" }}
                >
                  {format(day, "d")}
                </button>

                {/* Phones: a row of stage-colored dots. */}
                {dayTasks.length > 0 && (
                  <div className="flex flex-wrap gap-0.5 sm:hidden">
                    {dayTasks.slice(0, 6).map((t) => (
                      <span key={t.id} className={cn("w-2 h-2", STATUS_COLOR[t.status as TodoStatusKey].dot)} />
                    ))}
                  </div>
                )}

                {/* Wider screens: neutral chips with a stage-colored edge. */}
                <div className="hidden sm:flex flex-col gap-1 min-w-0">
                  {shown.map((t) => {
                    const closed = t.status === "done" || t.status === "cancelled";
                    return (
                      <Link
                        key={t.id}
                        href={isTempId(t.id) ? "#" : `/tasks/${t.id}`}
                        prefetch={false}
                        onClick={(e) => e.stopPropagation()}
                        title={t.title}
                        className={cn(
                          "block truncate bg-card border border-border border-l-4 px-1.5 py-0.5 font-mono text-xs hover:border-abyssal transition-colors",
                          STATUS_COLOR[t.status as TodoStatusKey].edge,
                          closed && "line-through text-muted-foreground"
                        )}
                      >
                        {t.title}
                      </Link>
                    );
                  })}
                  {overflow > 0 && <span className="font-mono text-xs text-muted-foreground">+{overflow} more</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {unscheduled.length > 0 && (
        <div>
          <p className="font-pixel text-muted-foreground mb-2" style={{ fontSize: "10px" }}>
            UNSCHEDULED · {unscheduled.length}
          </p>
          <div className="pixel-box-sm bg-card divide-y divide-border">
            {unscheduled.map((t) => (
              <DayItem key={t.id} task={t} showProject={showProject} />
            ))}
          </div>
        </div>
      )}

      {selectedDay && (
        <DayPanel
          day={selectedDay}
          tasks={byDay.get(selectedDay) ?? []}
          showProject={showProject}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </div>
  );
}

function DayPanel({
  day,
  tasks,
  showProject,
  onClose,
}: {
  day: string;
  tasks: TaskItem[];
  showProject: boolean;
  onClose: () => void;
}) {
  const { createTask } = useTasks();
  const [title, setTitle] = useState("");

  return (
    <Modal open onClose={onClose} title={format(parseISO(day), "EEEE, d MMMM").toUpperCase()}>
      {tasks.length === 0 ? (
        <p className="font-mono text-sm text-muted-foreground text-center p-8">nothing due this day</p>
      ) : (
        <div className="divide-y divide-border">
          {tasks.map((t) => (
            <DayItem key={t.id} task={t} showProject={showProject} />
          ))}
        </div>
      )}
      <form
        className="flex gap-2 p-3 border-t border-border bg-background/40"
        onSubmit={(e) => {
          e.preventDefault();
          const t = title.trim();
          if (!t) return;
          setTitle("");
          createTask({ title: t, dueDate: day });
        }}
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          placeholder="Add a task due this day…"
          className="flex-1 min-w-0 pixel-inset bg-background px-3 py-2 font-mono text-sm focus:outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          disabled={!title.trim()}
          aria-label="add task"
          className="pixel-btn bg-burning-flame text-abyssal p-2.5 disabled:opacity-50"
        >
          <Plus size={16} strokeWidth={3} />
        </button>
      </form>
    </Modal>
  );
}

function DayItem({ task, showProject }: { task: TaskItem; showProject: boolean }) {
  const closed = task.status === "done" || task.status === "cancelled";
  const temp = isTempId(task.id);
  return (
    <Link
      href={temp ? "#" : `/tasks/${task.id}`}
      prefetch={false}
      className={cn("flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors", temp && "pointer-events-none opacity-60")}
    >
      <PriorityIcon priority={task.priority} size={15} />
      <div className="flex-1 min-w-0">
        <p className={cn("font-mono text-sm truncate", closed && "line-through text-muted-foreground")}>{task.title}</p>
        {showProject && <ProjectChip name={task.projectName} icon={task.projectIcon} />}
      </div>
      <StatusPill status={task.status} />
    </Link>
  );
}
