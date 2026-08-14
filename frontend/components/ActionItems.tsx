"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  Check,
  CheckCircle2,
  Circle,
  ListChecks,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import {
  createActionItem,
  deleteActionItem,
  getActionItems,
  updateActionItem,
} from "../lib/api";
import { ActionItem } from "../types/meeting";

interface ActionItemsProps {
  meetingId: number;
}

export default function ActionItems({ meetingId }: ActionItemsProps) {
  // Load and manage the editable action items belonging to this meeting.
  const [items, setItems] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newAssignee, setNewAssignee] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAssignee, setEditAssignee] = useState("");

  useEffect(() => {
    // Refresh local items when the rendered meeting changes.
    getActionItems(meetingId)
      .then((data) => {
        setItems(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load action items.");
        setLoading(false);
      });
  }, [meetingId]);

  const handleAdd = async (e: FormEvent) => {
    // Create a validated item and append the server response to local state.
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      const item = await createActionItem(meetingId, {
        title: newTitle.trim(),
        assignee: newAssignee.trim() || undefined,
      });
      setItems((prev) => [...prev, item]);
      setNewTitle("");
      setNewAssignee("");
    } catch {
      setError("Could not add action item.");
    }
  };

  const handleToggle = async (item: ActionItem) => {
    // Persist the inverse completion state before replacing the local item.
    try {
      const updated = await updateActionItem(item.id, {
        completed: !item.completed,
      });
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? updated : i))
      );
    } catch {
      setError("Could not update action item.");
    }
  };

  const startEdit = (item: ActionItem) => {
    // Prime the inline form with the item being edited.
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditAssignee(item.assignee ?? "");
  };

  const handleSaveEdit = async (e: FormEvent) => {
    // Save inline edits and leave editing mode only after a successful response.
    e.preventDefault();
    if (!editingId || !editTitle.trim()) return;
    try {
      const updated = await updateActionItem(editingId, {
        title: editTitle.trim(),
        assignee: editAssignee.trim() || undefined,
      });
      setItems((prev) =>
        prev.map((i) => (i.id === editingId ? updated : i))
      );
      setEditingId(null);
    } catch {
      setError("Could not save action item.");
    }
  };

  const handleDelete = async (item: ActionItem) => {
    // Request confirmation before removing the item from the server and UI.
    if (!window.confirm(`Delete action item "${item.title}"?`)) return;
    try {
      await deleteActionItem(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch {
      setError("Could not delete action item.");
    }
  };

  const completedCount = items.filter((i) => i.completed).length;

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-100 text-violet-600">
            <ListChecks className="h-3.5 w-3.5" />
          </span>
          Action Items
        </h2>
        {items.length > 0 && (
          <span className="text-xs text-zinc-500">
            {completedCount}/{items.length} done
          </span>
        )}
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <form onSubmit={handleAdd} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          placeholder="New action item..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-violet-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-100"
        />
        <input
          type="text"
          placeholder="Assignee"
          value={newAssignee}
          onChange={(e) => setNewAssignee(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-violet-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-100 sm:w-40"
        />
        <button
          type="submit"
          className="flex items-center justify-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700"
        >
          <Plus className="h-4 w-4" />
          Add
        </button>
      </form>

      <ul className="mt-4 space-y-2">
        {loading && (
          <li className="flex items-center justify-center gap-2 py-6 text-sm text-zinc-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading action items...
          </li>
        )}

        {!loading && items.length === 0 && (
          <li className="py-6 text-center text-sm text-zinc-500">
            No action items yet. Add one above.
          </li>
        )}

        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-3 rounded-lg border border-zinc-100 px-3 py-2.5 transition-colors hover:bg-zinc-50"
          >
            <button
              type="button"
              onClick={() => handleToggle(item)}
              aria-label={
                item.completed ? "Mark as not completed" : "Mark as completed"
              }
              className="shrink-0"
            >
              {item.completed ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              ) : (
                <Circle className="h-5 w-5 text-zinc-300 transition-colors hover:text-violet-400" />
              )}
            </button>

            {editingId === item.id ? (
              <form
                onSubmit={handleSaveEdit}
                className="flex flex-1 flex-col gap-2 sm:flex-row"
              >
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="flex-1 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-sm text-zinc-900 focus:border-violet-400 focus:outline-none"
                />
                <input
                  type="text"
                  value={editAssignee}
                  onChange={(e) => setEditAssignee(e.target.value)}
                  placeholder="Assignee"
                  className="w-full rounded-lg border border-zinc-200 px-2.5 py-1.5 text-sm text-zinc-900 focus:border-violet-400 focus:outline-none sm:w-36"
                />
                <div className="flex gap-1">
                  <button
                    type="submit"
                    aria-label="Save"
                    className="flex items-center justify-center rounded-lg bg-violet-600 p-2 text-white transition-colors hover:bg-violet-700"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    aria-label="Cancel"
                    className="flex items-center justify-center rounded-lg border border-zinc-200 p-2 text-zinc-500 transition-colors hover:bg-zinc-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="min-w-0 flex-1">
                  <p
                    className={`truncate text-sm ${
                      item.completed
                        ? "text-zinc-400 line-through"
                        : "text-zinc-800"
                    }`}
                  >
                    {item.title}
                  </p>
                  {item.assignee && (
                    <p className="text-xs text-zinc-500">{item.assignee}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => startEdit(item)}
                  aria-label="Edit"
                  className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(item)}
                  aria-label="Delete"
                  className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
