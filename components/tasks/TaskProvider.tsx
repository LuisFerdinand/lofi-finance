// components/tasks/TaskProvider.tsx
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  newId,
  toTaskItem,
  type PriorityKey,
  type ProjectOption,
  type TaskItem,
  type TodoStatusKey,
} from "@/utils/projects-helpers";

export type TaskPatch = Partial<
  Pick<
    TaskItem,
    "title" | "notes" | "links" | "images" | "checklist" | "status" | "priority" | "dueDate" | "projectId" | "sortOrder"
  >
>;

export interface CreateTaskInput {
  title: string;
  projectId?: string | null;
  status?: TodoStatusKey;
  priority?: PriorityKey;
  dueDate?: string | null;
}

interface TaskStore {
  tasks: TaskItem[];
  projects: ProjectOption[];
  /** The project new tasks land in by default (null on the cross-project page). */
  scopeProjectId: string | null;
  /** Number of saves in flight — drives the "saving…" indicator. */
  saving: number;
  createTask: (input: CreateTaskInput) => Promise<TaskItem | null>;
  /** Pass a function to derive the patch from the task's *latest* state
   *  (e.g. appending to an array when several saves can land together). */
  updateTask: (id: string, patch: TaskPatch | ((task: TaskItem) => TaskPatch)) => Promise<boolean>;
  deleteTask: (id: string) => Promise<boolean>;
  /** Persist several ranks (and optional status changes) in one request. */
  rankTasks: (moves: { id: string; sortOrder: number; status?: TodoStatusKey }[]) => Promise<boolean>;
}

const TaskContext = createContext<TaskStore | null>(null);

export function useTasks(): TaskStore {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error("useTasks must be used within a TaskProvider");
  return ctx;
}

export const isTempId = (id: string) => id.startsWith("tmp-");

// ─── Recent-edit memory ──────────────────────────────────────────────────────
// Browser back/forward re-shows a page from Next's client cache with the props
// it was first rendered with. Without this, editing a task on its detail page
// and pressing Back would show the board as it was before the edit. Every
// confirmed save/delete is remembered here (module scope survives client
// navigations) and applied over any older server snapshot on mount.
const RECENT_TTL_MS = 15 * 60 * 1000;
const recent = new Map<string, { task: TaskItem | null; at: number }>();

function remember(id: string, task: TaskItem | null) {
  recent.set(id, { task, at: Date.now() });
}

function reconcile(list: TaskItem[]): TaskItem[] {
  const cutoff = Date.now() - RECENT_TTL_MS;
  for (const [id, r] of recent) if (r.at < cutoff) recent.delete(id);
  const out: TaskItem[] = [];
  for (const t of list) {
    const r = recent.get(t.id);
    if (!r) out.push(t);
    else if (r.task && r.task.updatedAt >= t.updatedAt) out.push({ ...r.task });
    else if (r.task || r.at < new Date(t.updatedAt).getTime()) out.push(t);
    // else: deleted after this snapshot was taken — drop it
  }
  return out;
}

async function readError(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json();
    return typeof data?.error === "string" ? data.error : fallback;
  } catch {
    return fallback;
  }
}

export function TaskProvider({
  initialTasks,
  projects,
  scopeProjectId = null,
  children,
}: {
  initialTasks: TaskItem[];
  projects: ProjectOption[];
  scopeProjectId?: string | null;
  children: ReactNode;
}) {
  const router = useRouter();
  const [tasks, setTasksState] = useState<TaskItem[]>(() => reconcile(initialTasks));
  const [saving, setSaving] = useState(0);
  const tasksRef = useRef(tasks);
  const pending = useRef(0);
  const queues = useRef(new Map<string, Promise<unknown>>());

  const commit = useCallback((fn: (list: TaskItem[]) => TaskItem[]) => {
    const next = fn(tasksRef.current);
    tasksRef.current = next;
    setTasksState(next);
  }, []);

  // Adopt fresh server data (navigation / refresh) — but never while a save is
  // in flight, or the optimistic state would snap back to the pre-save rows.
  useEffect(() => {
    if (pending.current > 0) return;
    commit(() => reconcile(initialTasks));
  }, [initialTasks, commit]);

  const projectById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);

  const withProject = useCallback(
    (t: TaskItem, projectId: string | null): TaskItem => {
      const p = projectId ? projectById.get(projectId) : null;
      return { ...t, projectId, projectName: p?.name ?? null, projectIcon: p?.icon ?? null };
    },
    [projectById]
  );

  const begin = () => {
    pending.current += 1;
    setSaving((n) => n + 1);
  };
  const end = () => {
    pending.current -= 1;
    setSaving((n) => n - 1);
  };

  // Saves for one task run strictly in order, so a slow request can never land
  // after (and overwrite) a newer one.
  const enqueue = useCallback(<T,>(id: string, job: () => Promise<T>): Promise<T> => {
    const prev = queues.current.get(id) ?? Promise.resolve();
    const next = prev.then(job, job);
    queues.current.set(id, next);
    next.finally(() => {
      if (queues.current.get(id) === next) queues.current.delete(id);
    });
    return next;
  }, []);

  const resync = useCallback(
    (message: string) => {
      toast.error(message);
      router.refresh();
    },
    [router]
  );

  const updateTask = useCallback(
    (id: string, patchOrFn: TaskPatch | ((task: TaskItem) => TaskPatch)): Promise<boolean> => {
      if (isTempId(id)) return Promise.resolve(false);
      const current = tasksRef.current.find((t) => t.id === id);
      if (!current) return Promise.resolve(false);
      const patch = typeof patchOrFn === "function" ? patchOrFn(current) : patchOrFn;
      commit((list) =>
        list.map((t) => {
          if (t.id !== id) return t;
          let next: TaskItem = { ...t, ...patch };
          if (patch.projectId !== undefined) next = withProject(next, patch.projectId);
          if (patch.status && patch.status !== t.status) {
            next.completedAt = patch.status === "done" ? new Date().toISOString() : null;
          }
          return next;
        })
      );

      begin();
      return enqueue(id, async () => {
        try {
          const body: Record<string, unknown> = { ...patch };
          // Writing the arrays retires the legacy single-value columns.
          if (patch.links) body.link = null;
          if (patch.images) body.imageUrl = null;
          const res = await fetch(`/api/todos/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          if (!res.ok) throw new Error(await readError(res, "couldn't save the task"));
          const server = await res.json();
          commit((list) =>
            list.map((t) =>
              t.id === id ? { ...t, updatedAt: String(server.updatedAt), completedAt: server.completedAt ?? null } : t
            )
          );
          const latest = tasksRef.current.find((t) => t.id === id);
          if (latest) remember(id, latest);
          return true;
        } catch (err) {
          resync(err instanceof Error ? err.message : "couldn't save the task");
          return false;
        } finally {
          end();
        }
      });
    },
    [commit, enqueue, resync, withProject]
  );

  const createTask = useCallback(
    async (input: CreateTaskInput): Promise<TaskItem | null> => {
      const now = new Date().toISOString();
      const projectId = input.projectId === undefined ? scopeProjectId : input.projectId;
      const tempId = `tmp-${newId()}`;
      const optimistic = withProject(
        {
          id: tempId,
          userId: "",
          projectId: null,
          title: input.title,
          notes: null,
          links: [],
          images: [],
          checklist: [],
          status: input.status ?? "open",
          priority: input.priority ?? "medium",
          dueDate: input.dueDate ?? null,
          sortOrder: null,
          completedAt: null,
          createdAt: now,
          updatedAt: now,
          projectName: null,
          projectIcon: null,
        },
        projectId
      );
      commit((list) => [...list, optimistic]);

      begin();
      try {
        const res = await fetch("/api/todos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: input.title,
            projectId,
            status: input.status,
            priority: input.priority ?? "medium",
            dueDate: input.dueDate ?? null,
          }),
        });
        if (!res.ok) throw new Error(await readError(res, "couldn't add the task"));
        const created = toTaskItem(await res.json(), projectId ? projectById.get(projectId) ?? null : null);
        commit((list) => list.map((t) => (t.id === tempId ? created : t)));
        return created;
      } catch (err) {
        commit((list) => list.filter((t) => t.id !== tempId));
        toast.error(err instanceof Error ? err.message : "couldn't add the task");
        return null;
      } finally {
        end();
      }
    },
    [commit, projectById, scopeProjectId, withProject]
  );

  const deleteTask = useCallback(
    async (id: string): Promise<boolean> => {
      const index = tasksRef.current.findIndex((t) => t.id === id);
      const removed = tasksRef.current[index];
      if (!removed) return false;
      commit((list) => list.filter((t) => t.id !== id));

      begin();
      try {
        const res = await enqueue(id, () => fetch(`/api/todos/${id}`, { method: "DELETE" }));
        if (!res.ok && res.status !== 404) throw new Error(await readError(res, "couldn't delete the task"));
        remember(id, null);
        return true;
      } catch (err) {
        commit((list) => {
          const next = [...list];
          next.splice(Math.min(index, next.length), 0, removed);
          return next;
        });
        toast.error(err instanceof Error ? err.message : "couldn't delete the task");
        return false;
      } finally {
        end();
      }
    },
    [commit, enqueue]
  );

  const rankTasks = useCallback(
    async (moves: { id: string; sortOrder: number; status?: TodoStatusKey }[]): Promise<boolean> => {
      const real = moves.filter((m) => !isTempId(m.id));
      if (real.length === 0) return true;
      const byId = new Map(real.map((m) => [m.id, m]));
      commit((list) =>
        list.map((t) => {
          const m = byId.get(t.id);
          if (!m) return t;
          const next: TaskItem = { ...t, sortOrder: m.sortOrder };
          if (m.status && m.status !== t.status) {
            next.status = m.status;
            next.completedAt = m.status === "done" ? new Date().toISOString() : null;
          }
          return next;
        })
      );

      begin();
      try {
        const res = await fetch("/api/todos/reorder", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ moves: real }),
        });
        if (!res.ok) throw new Error(await readError(res, "couldn't save the new order"));
        const rows: { id: string; updatedAt: string; completedAt: string | null }[] = await res.json();
        const serverById = new Map(rows.map((r) => [r.id, r]));
        commit((list) =>
          list.map((t) => {
            const r = serverById.get(t.id);
            return r ? { ...t, updatedAt: String(r.updatedAt), completedAt: r.completedAt ?? null } : t;
          })
        );
        for (const id of byId.keys()) {
          const latest = tasksRef.current.find((t) => t.id === id);
          if (latest) remember(id, latest);
        }
        return true;
      } catch (err) {
        resync(err instanceof Error ? err.message : "couldn't save the new order");
        return false;
      } finally {
        end();
      }
    },
    [commit, resync]
  );

  // On a project page, a task moved to another project leaves this board.
  const visible = useMemo(
    () => (scopeProjectId ? tasks.filter((t) => t.projectId === scopeProjectId) : tasks),
    [tasks, scopeProjectId]
  );

  const value = useMemo<TaskStore>(
    () => ({ tasks: visible, projects, scopeProjectId, saving, createTask, updateTask, deleteTask, rankTasks }),
    [visible, projects, scopeProjectId, saving, createTask, updateTask, deleteTask, rankTasks]
  );

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}
