// components/projects/TodoListView.tsx
"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { Todo } from "@/db/schema/projects";
import TodoItem from "./TodoItem";

// todos is expected pre-sorted (see sortTodos in utils/projects-helpers.tsx) — active
// stages (open/in_progress/on_hold) shown up top, done/cancelled collapsed underneath
// so long lists stay manageable.
export default function TodoListView({ todos, hasAnyTodos }: { todos: Todo[]; hasAnyTodos: boolean }) {
  const [showClosed, setShowClosed] = useState(false);

  const active = todos.filter((t) => t.status === "open" || t.status === "in_progress" || t.status === "on_hold");
  const closed = todos.filter((t) => t.status === "done" || t.status === "cancelled");

  if (active.length === 0 && closed.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="font-mono text-xs text-muted-foreground">
          {hasAnyTodos ? "no tasks match your search" : "no tasks yet — add your first one above"}
        </p>
      </div>
    );
  }

  return (
    <div>
      {active.length === 0 ? (
        <div className="p-6 text-center">
          <p className="font-mono text-xs text-muted-foreground">all done — nice work</p>
        </div>
      ) : (
        <div>{active.map((todo) => <TodoItem key={todo.id} todo={todo} />)}</div>
      )}

      {closed.length > 0 && (
        <div className="border-t border-border">
          <button
            type="button"
            onClick={() => setShowClosed((s) => !s)}
            className="w-full flex items-center justify-between px-3 py-2.5 font-pixel text-muted-foreground hover:text-foreground transition-colors"
            style={{ fontSize: "8px" }}
          >
            <span>DONE &amp; CANCELLED ({closed.length})</span>
            {showClosed ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
          {showClosed && <div>{closed.map((todo) => <TodoItem key={todo.id} todo={todo} />)}</div>}
        </div>
      )}
    </div>
  );
}
