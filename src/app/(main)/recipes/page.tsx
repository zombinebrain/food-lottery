"use client";

import { useCallback, useEffect, useState } from "react";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { RecipeModal } from "@/components/recipes/RecipeModal";
import { DeleteConfirmModal } from "@/components/ingredients/DeleteConfirmModal";
import { Button } from "@/components/ui/Button";
import type { Recipe } from "@/types/recipe";

type RecipeSaveData = {
  name: string;
  description: string | null;
  imageUrl: string | null;
  ingredientIds: string[];
};

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [deletingRecipe, setDeletingRecipe] = useState<Recipe | null>(null);

  const fetchRecipes = useCallback(async (query: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/recipes${query ? `?search=${encodeURIComponent(query)}` : ""}`
      );
      if (res.ok) setRecipes(await res.json());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchRecipes(search), 300);
    return () => clearTimeout(timer);
  }, [search, fetchRecipes]);

  async function handleAdd(data: RecipeSaveData) {
    const res = await fetch("/api/recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const created = await res.json();
      setRecipes((prev) => [created, ...prev]);
    }
  }

  async function handleEdit(data: RecipeSaveData) {
    if (!editingRecipe) return;
    const res = await fetch(`/api/recipes/${editingRecipe.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const updated = await res.json();
      setRecipes((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    }
  }

  async function handleDelete() {
    if (!deletingRecipe) return;
    const res = await fetch(`/api/recipes/${deletingRecipe.id}`, { method: "DELETE" });
    if (res.ok) {
      setRecipes((prev) => prev.filter((r) => r.id !== deletingRecipe.id));
    }
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Рецепты</h1>
            <p className="mt-1 text-sm text-gray-500">
              {recipes.length > 0
                ? `${recipes.length} рецепт${plural(recipes.length)}`
                : "Пока нет ни одного рецепта"}
            </p>
          </div>
          <Button className="w-full sm:w-auto" onClick={() => setIsAddOpen(true)}>
            + Добавить рецепт
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse overflow-hidden rounded-2xl border border-gray-100 bg-white"
              >
                <div className="aspect-video bg-gray-200" />
                <div className="space-y-2 px-4 py-3">
                  <div className="h-4 w-3/4 rounded bg-gray-200" />
                  <div className="h-3 w-full rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        ) : recipes.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onEdit={() => setEditingRecipe(recipe)}
                onDelete={() => setDeletingRecipe(recipe)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center">
            <span className="text-5xl">🍽️</span>
            <p className="text-gray-500">
              {search
                ? `Ничего не найдено по запросу «${search}»`
                : "Добавь первый рецепт"}
            </p>
            {!search && (
              <Button className="mt-2 w-auto" onClick={() => setIsAddOpen(true)}>
                + Добавить рецепт
              </Button>
            )}
          </div>
        )}
      </div>

      {isAddOpen && (
        <RecipeModal onClose={() => setIsAddOpen(false)} onSave={handleAdd} />
      )}

      {editingRecipe && (
        <RecipeModal
          recipe={editingRecipe}
          onClose={() => setEditingRecipe(null)}
          onSave={handleEdit}
        />
      )}

      {deletingRecipe && (
        <DeleteConfirmModal
          itemName={deletingRecipe.name}
          onClose={() => setDeletingRecipe(null)}
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
