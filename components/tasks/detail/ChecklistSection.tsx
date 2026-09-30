// components/tasks/detail/ChecklistSection.tsx
"use client";

import { useId, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, GripVertical, ListChecks, Plus, Trash2 } from "lucide-react";
import { cn } from "@/utils";
import { newId, type ChecklistItem } from "@/utils/projects-helpers";
import { Section } from "./Section";

const MAX_ITEMS = 50;

export default function ChecklistSection({
  items,
  onChange,
}: {
  items: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const dndId = useId(); // stable across SSR/hydration (see TaskBoardView)
  const done = items.filter((i) => i.done).length;
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function add() {
    const text = draft.trim();
    if (!text || items.length >= MAX_ITEMS) return;
    onChange([...items, { id: newId(), text: text.slice(0, 200), done: false }]);
    setDraft("");
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const from = items.findIndex((i) => i.id === active.id);
    const to = items.findIndex((i) => i.id === over.id);
    if (from < 0 || to < 0) return;
    onChange(arrayMove(items, from, to));
  }

  return (
    <Section
      icon={ListChecks}
      title="CHECKLIST"
      aside={items.length > 0 ? `${done}/${items.length} · ${pct}%` : undefined}
    >
      {items.length > 0 && (
        <div className="h-2 bg-muted border border-abyssal overflow-hidden mb-3">
          <div
            className={cn("h-full transition-all", pct >= 100 ? "bg-status-done" : "bg-status-in-progress")}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <ul className="space-y-1.5">
            {items.map((item) => (
              <ChecklistRow
                key={item.id}
                item={item}
                onToggle={() => onChange(items.map((i) => (i.id === item.id ? { ...i, done: !i.done } : i)))}
                onRename={(text) => onChange(items.map((i) => (i.id === item.id ? { ...i, text } : i)))}
                onRemove={() => onChange(items.filter((i) => i.id !== item.id))}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      <form
        className="flex items-center gap-2 mt-3"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={200}
          disabled={items.length >= MAX_ITEMS}
          placeholder={items.length >= MAX_ITEMS ? "checklist is full (50)" : "add a step and hit enter"}
          className="flex-1 min-w-0 pixel-inset bg-background px-3 py-2 font-mono text-sm focus:outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          aria-label="add checklist item"
          className="shrink-0 pixel-btn bg-muted p-2 hover:bg-burning-flame hover:text-abyssal disabled:opacity-50 transition-colors"
        >
          <Plus size={15} strokeWidth={3} />
        </button>
      </form>
    </Section>
  );
}

function ChecklistRow({
  item,
  onToggle,
  onRename,
  onRemove,
}: {
  item: ChecklistItem;
  onToggle: () => void;
  onRename: (text: string) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });
  const [text, setText] = useState(item.text);

  function commit() {
    const t = text.trim();
    if (!t) setText(item.text);
    else if (t !== item.text) onRename(t);
  }

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn("flex items-center gap-2 bg-card", isDragging && "relative z-10 opacity-80 shadow-[3px_3px_0_var(--abyssal)]")}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label="reorder item"
        className="shrink-0 p-0.5 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical size={15} />
      </button>
      <button
        type="button"
        onClick={onToggle}
        aria-label={item.done ? "mark item not done" : "mark item done"}
        className={cn(
          "shrink-0 w-6 h-6 border-2 border-abyssal flex items-center justify-center transition-colors",
          item.done ? "bg-status-done text-white" : "bg-background hover:bg-status-done/15"
        )}
      >
        {item.done && <Check size={14} strokeWidth={3} />}
      </button>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") {
            setText(item.text);
            (e.target as HTMLInputElement).blur();
          }
        }}
        maxLength={200}
        aria-label="checklist item"
        className={cn(
          "flex-1 min-w-0 bg-transparent px-2 py-1.5 font-mono text-sm border-2 border-transparent hover:border-border focus:border-burning-flame focus:bg-background focus:outline-none",
          item.done && "line-through text-muted-foreground"
        )}
      />
      <button
        type="button"
        onClick={onRemove}
        aria-label="remove checklist item"
        className="shrink-0 p-1.5 text-muted-foreground hover:text-truffle transition-colors"
      >
        <Trash2 size={14} />
      </button>
    </li>
  );
}
