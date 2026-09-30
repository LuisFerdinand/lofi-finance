// components/tasks/TaskBoardView.tsx
"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCorners,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronsLeftRight, ChevronsRightLeft, Plus } from "lucide-react";
import { cn } from "@/utils";
import {
  RANK_STEP,
  STATUS_COLOR,
  STATUS_LABELS,
  STATUS_ORDER,
  PriorityIcon,
  compareBoard,
  dueInfo,
  rankBetween,
  type TaskItem,
  type TodoStatusKey,
} from "@/utils/projects-helpers";
import { isTempId, useTasks } from "./TaskProvider";
import { ChecklistBar, DueChip, ProjectChip, TaskMeta } from "./TaskBits";
import { useToday } from "./useToday";

type Columns = Record<TodoStatusKey, string[]>;

const COLLAPSE_KEY = "lofi:boardCollapsed";
const COL_PREFIX = "col:";

function buildColumns(tasks: TaskItem[]): Columns {
  const cols: Columns = { open: [], in_progress: [], on_hold: [], done: [], cancelled: [] };
  for (const t of [...tasks].sort(compareBoard)) cols[t.status as TodoStatusKey]?.push(t.id);
  return cols;
}

function findColumn(id: string, cols: Columns): TodoStatusKey | null {
  if (id.startsWith(COL_PREFIX)) return id.slice(COL_PREFIX.length) as TodoStatusKey;
  for (const s of STATUS_ORDER) if (cols[s].includes(id)) return s;
  return null;
}

// Prefer whatever is directly under the pointer (a card, else its column);
// fall back to the nearest corners so dragging through gaps between columns
// still resolves to something sensible.
const collision: CollisionDetection = (args) => {
  const hits = pointerWithin(args);
  if (hits.length > 0) {
    const card = hits.find((h) => !String(h.id).startsWith(COL_PREFIX));
    return card ? [card] : hits;
  }
  return closestCorners(args);
};

export default function TaskBoardView({ tasks, showProject }: { tasks: TaskItem[]; showProject: boolean }) {
  const { tasks: allTasks, updateTask, rankTasks } = useTasks();
  // Stable id for dnd-kit's aria-describedby — its default is a module
  // counter that differs between server and client render (hydration error).
  const dndId = useId();
  const byId = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);
  const baseColumns = useMemo(() => buildColumns(tasks), [tasks]);
  const [dragColumns, setDragColumns] = useState<Columns | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const lastDragEnd = useRef(0);
  const columns = dragColumns ?? baseColumns;

  const [collapsed, setCollapsed] = useState<TodoStatusKey[]>(["cancelled"]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(COLLAPSE_KEY);
      // Per-viewer preference read after mount (no localStorage on the server).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setCollapsed(JSON.parse(raw));
    } catch {
      // unreadable storage — keep the default
    }
  }, []);
  function toggleCollapsed(status: TodoStatusKey) {
    setCollapsed((list) => {
      const next = list.includes(status) ? list.filter((s) => s !== status) : [...list, status];
      try {
        localStorage.setItem(COLLAPSE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    // Press-and-hold on touch, so a normal swipe still scrolls the board.
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function onDragStart({ active }: DragStartEvent) {
    setActiveId(String(active.id));
    setDragColumns(baseColumns);
  }

  // Cross-column moves happen live while dragging so the target column opens
  // a gap exactly where the card will land.
  function onDragOver({ active, over }: DragOverEvent) {
    if (!over) return;
    const activeKey = String(active.id);
    const overKey = String(over.id);
    setDragColumns((prev) => {
      const cols = prev ?? baseColumns;
      const from = findColumn(activeKey, cols);
      const to = findColumn(overKey, cols);
      // A collapsed column renders no cards to open a gap in — it just takes
      // the drop (handled in onDragEnd).
      if (!from || !to || from === to || collapsed.includes(to)) return prev;
      const target = cols[to];
      const overIndex = target.indexOf(overKey);
      const translated = active.rect.current.translated;
      const below = translated ? translated.top > over.rect.top + over.rect.height / 2 : false;
      const index = overIndex >= 0 ? overIndex + (below ? 1 : 0) : target.length;
      return {
        ...cols,
        [from]: cols[from].filter((id) => id !== activeKey),
        [to]: [...target.slice(0, index), activeKey, ...target.slice(index)],
      };
    });
  }

  function reset() {
    setDragColumns(null);
    setActiveId(null);
    lastDragEnd.current = Date.now();
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    const id = String(active.id);
    const cols = dragColumns ?? baseColumns;
    const task = byId.get(id);
    if (!over || !task) return reset();
    const overKey = String(over.id);
    const overCol = findColumn(overKey, cols);

    let col: TodoStatusKey | null;
    let ids: string[];
    if (overCol && collapsed.includes(overCol) && overKey.startsWith(COL_PREFIX)) {
      // Dropped on a collapsed column's strip → append to the end of it.
      col = overCol;
      ids = [...cols[col].filter((x) => x !== id), id];
    } else {
      col = findColumn(id, cols);
      if (!col) return reset();
      ids = cols[col];
      if (!overKey.startsWith(COL_PREFIX) && overKey !== id && ids.includes(overKey)) {
        ids = arrayMove(ids, ids.indexOf(id), ids.indexOf(overKey));
      }
    }
    const statusChanged = col !== task.status;
    const unchanged = !statusChanged && ids.join() === baseColumns[col].join();
    if (unchanged) return reset();

    // Rank against the *full* column (search/priority filters may hide cards),
    // anchoring on the visible neighbour the card was dropped next to.
    const idx = ids.indexOf(id);
    const visiblePrev = ids[idx - 1];
    const visibleNext = ids[idx + 1];
    const full = allTasks
      .filter((t) => t.status === col && t.id !== id)
      .sort(compareBoard);
    let at = full.length;
    if (visiblePrev) at = full.findIndex((t) => t.id === visiblePrev) + 1;
    else if (visibleNext) at = Math.max(0, full.findIndex((t) => t.id === visibleNext));

    const rank = rankBetween(full[at - 1], full[at]);
    if (rank !== null) {
      updateTask(id, statusChanged ? { status: col, sortOrder: rank } : { sortOrder: rank });
    } else {
      // Neighbours were never ranked — give the whole column even spacing once.
      const order = [...full.slice(0, at).map((t) => t.id), id, ...full.slice(at).map((t) => t.id)];
      rankTasks(
        order.map((tid, i) => ({
          id: tid,
          sortOrder: (i + 1) * RANK_STEP,
          ...(tid === id && statusChanged ? { status: col } : {}),
        }))
      );
    }
    reset();
  }

  const activeTask = activeId ? byId.get(activeId) ?? null : null;

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={collision}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={reset}
    >
      <div className="flex gap-3 overflow-x-auto p-3 pb-4 snap-x snap-mandatory md:snap-none scroll-thin items-stretch">
        {STATUS_ORDER.map((status) => (
          <BoardColumn
            key={status}
            status={status}
            ids={columns[status]}
            byId={byId}
            collapsed={collapsed.includes(status)}
            onToggle={() => toggleCollapsed(status)}
            showProject={showProject}
            lastDragEnd={lastDragEnd}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 160, easing: "ease-out" }}>
        {activeTask ? <CardBody task={activeTask} showProject={showProject} overlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function BoardColumn({
  status,
  ids,
  byId,
  collapsed,
  onToggle,
  showProject,
  lastDragEnd,
}: {
  status: TodoStatusKey;
  ids: string[];
  byId: Map<string, TaskItem>;
  collapsed: boolean;
  onToggle: () => void;
  showProject: boolean;
  lastDragEnd: React.RefObject<number>;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `${COL_PREFIX}${status}` });
  const color = STATUS_COLOR[status];

  if (collapsed) {
    return (
      <button
        ref={setNodeRef}
        type="button"
        onClick={onToggle}
        title={`expand ${STATUS_LABELS[status].toLowerCase()}`}
        className={cn(
          "shrink-0 w-12 pixel-box-sm border-t-4 flex flex-col items-center gap-3 py-3 snap-start",
          "bg-background hover:bg-muted transition-colors",
          color.bar,
          isOver && "ring-2 ring-burning-flame ring-inset bg-muted"
        )}
      >
        <ChevronsLeftRight size={14} className="text-muted-foreground" />
        <span className={cn("w-2.5 h-2.5", color.dot)} />
        <span className="font-pixel [writing-mode:vertical-rl] rotate-180" style={{ fontSize: "10px" }}>
          {STATUS_LABELS[status]} · {ids.length}
        </span>
      </button>
    );
  }

  return (
    <section
      className={cn(
        "shrink-0 w-[85vw] max-w-[320px] sm:w-[280px] snap-start",
        "lg:flex-1 lg:min-w-[250px] lg:max-w-[360px]",
        "pixel-box-sm bg-background border-t-4 flex flex-col",
        "max-h-[calc(100dvh-230px)] md:max-h-[calc(100dvh-250px)] min-h-[320px]",
        color.bar,
        isOver && "ring-2 ring-burning-flame ring-inset"
      )}
    >
      <header className={cn("px-3 py-2.5 flex items-center gap-2 shrink-0 border-b border-border", color.tint)}>
        <span className={cn("w-2.5 h-2.5 shrink-0", color.dot)} />
        <h3 className="font-pixel flex-1 min-w-0 truncate" style={{ fontSize: "10px" }}>
          {STATUS_LABELS[status]}
        </h3>
        <span className="font-mono text-xs px-1.5 bg-card border border-border tabular-nums">{ids.length}</span>
        <button
          type="button"
          onClick={onToggle}
          aria-label={`collapse ${STATUS_LABELS[status].toLowerCase()}`}
          title="collapse column"
          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronsRightLeft size={14} />
        </button>
      </header>

      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={cn("flex-1 overflow-y-auto scroll-thin p-2 space-y-2 min-h-[72px]", color.tint)}
        >
          {ids.length === 0 && (
            <p className="font-mono text-xs text-muted-foreground text-center py-8 border-2 border-dashed border-border">
              {isOver ? "drop here" : "no tasks"}
            </p>
          )}
          {ids.map((id) => {
            const task = byId.get(id);
            return task ? (
              <SortableCard key={id} task={task} showProject={showProject} lastDragEnd={lastDragEnd} />
            ) : null;
          })}
        </div>
      </SortableContext>

      <ColumnComposer status={status} />
    </section>
  );
}

function SortableCard({
  task,
  showProject,
  lastDragEnd,
}: {
  task: TaskItem;
  showProject: boolean;
  lastDragEnd: React.RefObject<number>;
}) {
  const router = useRouter();
  const temp = isTempId(task.id);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: temp,
  });
  const href = `/tasks/${task.id}`;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...attributes}
      {...listeners}
      aria-roledescription="draggable task"
      className={cn(
        "relative touch-manipulation outline-none focus-visible:ring-2 focus-visible:ring-burning-flame",
        temp ? "cursor-wait opacity-60" : "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-30"
      )}
      onMouseEnter={() => !temp && router.prefetch(href)}
    >
      <CardBody task={task} showProject={showProject} />
      {!temp && (
        // Stretched link: a plain click opens the task; a drag doesn't (the
        // mouse sensor needs 6px of movement, and clicks right after a drop are
        // swallowed). draggable=false stops the browser's native link drag.
        <Link
          href={href}
          prefetch={false}
          draggable={false}
          aria-label={`open task: ${task.title}`}
          className="absolute inset-0"
          onClick={(e) => {
            if (Date.now() - (lastDragEnd.current ?? 0) < 250) e.preventDefault();
          }}
        />
      )}
    </div>
  );
}

function CardBody({ task, showProject, overlay = false }: { task: TaskItem; showProject: boolean; overlay?: boolean }) {
  const today = useToday();
  const closed = task.status === "done" || task.status === "cancelled";
  const overdue = dueInfo(task.dueDate, today, task.status)?.tone === "overdue";

  return (
    <article
      className={cn(
        "bg-card border-2 border-abyssal p-3 space-y-2 select-none",
        overdue && "border-l-[5px] border-l-due-overdue",
        overlay ? "shadow-[6px_6px_0_var(--abyssal)] rotate-[2deg] cursor-grabbing w-[260px]" : "shadow-[2px_2px_0_var(--abyssal)] hover:bg-muted/40 transition-colors"
      )}
    >
      {showProject && <ProjectChip name={task.projectName} icon={task.projectIcon} className="max-w-full" />}
      <p
        className={cn(
          "font-mono text-sm leading-snug break-words line-clamp-3",
          closed && "line-through text-muted-foreground"
        )}
      >
        {task.title}
      </p>
      <ChecklistBar task={task} />
      <div className="flex items-center gap-2.5 flex-wrap">
        <PriorityIcon priority={task.priority} size={15} />
        <DueChip dueDate={task.dueDate} status={task.status} today={today} />
        <TaskMeta task={task} />
      </div>
    </article>
  );
}

function ColumnComposer({ status }: { status: TodoStatusKey }) {
  const { createTask } = useTasks();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");

  function submit() {
    const t = title.trim();
    if (!t) return;
    setTitle("");
    createTask({ title: t, status });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 border-t border-border font-pixel text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        style={{ fontSize: "9px" }}
      >
        <Plus size={13} /> CREATE
      </button>
    );
  }

  return (
    <form
      className="shrink-0 p-2 border-t border-border bg-card"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => {
          if (!title.trim()) setOpen(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setTitle("");
            setOpen(false);
          }
        }}
        maxLength={200}
        placeholder="What needs doing? ⏎"
        className="w-full pixel-inset bg-background px-2 py-1.5 font-mono text-sm focus:outline-none placeholder:text-muted-foreground"
      />
    </form>
  );
}
