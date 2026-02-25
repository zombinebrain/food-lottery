import Image from "next/image";
import type { Recipe } from "@/types/recipe";

interface Props {
  recipe: Recipe;
  onEdit: () => void;
  onDelete: () => void;
}

export function RecipeCard({ recipe, onEdit, onDelete }: Props) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-video bg-gray-100">
        {recipe.imageUrl ? (
          <Image
            src={recipe.imageUrl}
            alt={recipe.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl text-gray-300">
            🍽️
          </div>
        )}

        <div className="absolute inset-0 flex items-start justify-end gap-1.5 p-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
          <button
            onClick={onEdit}
            title="Редактировать"
            className="flex size-9 items-center justify-center rounded-lg bg-white/90 text-gray-600 shadow-sm backdrop-blur-sm transition-colors hover:bg-white hover:text-orange-500 sm:size-8"
          >
            <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            title="Удалить"
            className="flex size-9 items-center justify-center rounded-lg bg-white/90 text-gray-600 shadow-sm backdrop-blur-sm transition-colors hover:bg-white hover:text-red-500 sm:size-8"
          >
            <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 px-4 py-3">
        <p className="truncate text-sm font-semibold text-gray-900">{recipe.name}</p>

        {recipe.description && (
          <p className="line-clamp-2 text-xs text-gray-500">{recipe.description}</p>
        )}

        {recipe.ingredients.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-1 pt-1">
            {recipe.ingredients.slice(0, 4).map((ing) => (
              <span
                key={ing.id}
                className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700"
              >
                {ing.name}
              </span>
            ))}
            {recipe.ingredients.length > 4 && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                +{recipe.ingredients.length - 4}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
