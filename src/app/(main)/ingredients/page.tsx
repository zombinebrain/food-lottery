"use client";

import { useCallback, useEffect, useState } from "react";
import { IngredientCard } from "@/components/ingredients/IngredientCard";
import { IngredientModal } from "@/components/ingredients/IngredientModal";
import { DeleteConfirmModal } from "@/components/ingredients/DeleteConfirmModal";
import { Button } from "@/components/ui/Button";
import type { Ingredient } from "@/types/ingredient";

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [deletingIngredient, setDeletingIngredient] = useState<Ingredient | null>(null);

  const fetchIngredients = useCallback(async (query: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/ingredients${query ? `?search=${encodeURIComponent(query)}` : ""}`
      );
      if (res.ok) setIngredients(await res.json());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchIngredients(search), 300);
    return () => clearTimeout(timer);
  }, [search, fetchIngredients]);

  async function handleAdd(name: string, imageUrl: string | null) {
    const res = await fetch("/api/ingredients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, imageUrl }),
    });
    if (res.ok) {
      const created = await res.json();
      setIngredients((prev) => [created, ...prev]);
    }
  }

  async function handleEdit(name: string, imageUrl: string | null) {
    if (!editingIngredient) return;
    const res = await fetch(`/api/ingredients/${editingIngredient.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, imageUrl }),
    });
    if (res.ok) {
      const updated = await res.json();
      setIngredients((prev) =>
        prev.map((i) => (i.id === updated.id ? updated : i))
      );
    }
  }

  async function handleDelete() {
    if (!deletingIngredient) return;
    const res = await fetch(`/api/ingredients/${deletingIngredient.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setIngredients((prev) => prev.filter((i) => i.id !== deletingIngredient.id));
    }
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ингредиенты</h1>
            <p className="mt-1 text-sm text-gray-500">
              {ingredients.length > 0
                ? `${ingredients.length} ингредиент${plural(ingredients.length)}`
                : "Пока нет ни одного ингредиента"}
            </p>
          </div>
          <Button className="w-full sm:w-auto" onClick={() => setIsAddOpen(true)}>
            + Добавить ингредиент
          </Button>
        </div>

        <div className="relative">
          <svg
            className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Поиск по названию..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse overflow-hidden rounded-2xl border border-gray-100 bg-white"
              >
                <div className="aspect-square bg-gray-200" />
                <div className="px-3 py-2.5">
                  <div className="h-4 w-3/4 rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        ) : ingredients.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {ingredients.map((ingredient) => (
              <IngredientCard
                key={ingredient.id}
                ingredient={ingredient}
                onEdit={() => setEditingIngredient(ingredient)}
                onDelete={() => setDeletingIngredient(ingredient)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center">
            <span className="text-5xl">🥗</span>
            <p className="text-gray-500">
              {search
                ? `Ничего не найдено по запросу «${search}»`
                : "Добавь первый ингредиент"}
            </p>
            {!search && (
              <Button className="mt-2 w-auto" onClick={() => setIsAddOpen(true)}>
                + Добавить ингредиент
              </Button>
            )}
          </div>
        )}
      </div>

      {isAddOpen && (
        <IngredientModal
          onClose={() => setIsAddOpen(false)}
          onSave={handleAdd}
        />
      )}

      {editingIngredient && (
        <IngredientModal
          ingredient={editingIngredient}
          onClose={() => setEditingIngredient(null)}
          onSave={handleEdit}
        />
      )}

      {deletingIngredient && (
        <DeleteConfirmModal
          itemName={deletingIngredient.name}
          onClose={() => setDeletingIngredient(null)}
          onConfirm={handleDelete}
        />
      )}
    </>
  );
}

function plural(n: number) {
  if (n % 10 === 1 && n % 100 !== 11) return "";
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return "а";
  return "ов";
}
