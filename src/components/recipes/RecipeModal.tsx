"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Recipe } from "@/types/recipe";
import type { Ingredient } from "@/types/ingredient";

interface PexelsPhoto {
  id: number;
  url: string;
  alt: string;
}

interface Props {
  recipe?: Recipe;
  onClose: () => void;
  onSave: (data: {
    name: string;
    description: string | null;
    imageUrl: string | null;
    ingredientIds: string[];
  }) => Promise<void>;
}

export function RecipeModal({ recipe, onClose, onSave }: Props) {
  const isEditing = !!recipe;

  const [name, setName] = useState(recipe?.name ?? "");
  const [description, setDescription] = useState(recipe?.description ?? "");
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(recipe?.imageUrl ?? null);
  const [selectedPhoto, setSelectedPhoto] = useState<PexelsPhoto | null>(null);
  const [photos, setPhotos] = useState<PexelsPhoto[]>([]);
  const [isSearchingPhotos, setIsSearchingPhotos] = useState(false);
  const [searchedQuery, setSearchedQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [selectedIngredients, setSelectedIngredients] = useState<Ingredient[]>(
    recipe?.ingredients ?? []
  );
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [ingredientOptions, setIngredientOptions] = useState<Ingredient[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoadingIngredients, setIsLoadingIngredients] = useState(false);

  const photoDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === searchedQuery) return;

    if (photoDebounceRef.current) clearTimeout(photoDebounceRef.current);

    photoDebounceRef.current = setTimeout(async () => {
      setIsSearchingPhotos(true);
      try {
        const res = await fetch(`/api/pexels?query=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          setPhotos(data.photos ?? []);
          setSearchedQuery(trimmed);
        }
      } finally {
        setIsSearchingPhotos(false);
      }
    }, 600);

    return () => {
      if (photoDebounceRef.current) clearTimeout(photoDebounceRef.current);
    };
  }, [name, searchedQuery]);

  useEffect(() => {
    if (!isDropdownOpen) return;

    const timer = setTimeout(async () => {
      setIsLoadingIngredients(true);
      try {
        const url = ingredientSearch.trim()
          ? `/api/ingredients?search=${encodeURIComponent(ingredientSearch.trim())}`
          : "/api/ingredients";
        const res = await fetch(url);
        if (res.ok) setIngredientOptions(await res.json());
      } finally {
        setIsLoadingIngredients(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [ingredientSearch, isDropdownOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function toggleIngredient(ingredient: Ingredient) {
    setSelectedIngredients((prev) =>
      prev.some((i) => i.id === ingredient.id)
        ? prev.filter((i) => i.id !== ingredient.id)
        : [...prev, ingredient]
    );
  }

  function handleSelectPhoto(photo: PexelsPhoto) {
    setSelectedPhoto((prev) => (prev?.id === photo.id ? null : photo));
    setCurrentImageUrl(null);
  }

  function handleRemoveImage() {
    setCurrentImageUrl(null);
    setSelectedPhoto(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || null,
        imageUrl: selectedPhoto?.url ?? currentImageUrl,
        ingredientIds: selectedIngredients.map((i) => i.id),
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  }

  const hasImage = !!currentImageUrl || !!selectedPhoto;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4 sm:px-6">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditing ? "Редактировать рецепт" : "Добавить рецепт"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 overflow-y-auto p-4 sm:p-6">
          <Input
            label="Название"
            placeholder="Например: Паста карбонара"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Описание</label>
            <textarea
              placeholder="Порядок приготовления, советы..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div className="flex flex-col gap-2" ref={dropdownRef}>
            <label className="text-sm font-medium text-gray-700">Ингредиенты</label>

            {selectedIngredients.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedIngredients.map((ing) => (
                  <span
                    key={ing.id}
                    className="flex items-center gap-1 rounded-full bg-orange-50 py-0.5 pl-2.5 pr-1.5 text-xs font-medium text-orange-700"
                  >
                    {ing.name}
                    <button
                      type="button"
                      onClick={() => toggleIngredient(ing)}
                      className="flex size-4 items-center justify-center rounded-full text-orange-400 transition-colors hover:bg-orange-200 hover:text-orange-700"
                    >
                      <svg className="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="relative">
              <input
                type="text"
                value={ingredientSearch}
                onChange={(e) => setIngredientSearch(e.target.value)}
                onFocus={() => setIsDropdownOpen(true)}
                placeholder="Поиск ингредиентов..."
                className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
              />

              {isDropdownOpen && (
                <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
                  {isLoadingIngredients ? (
                    <div className="px-4 py-3 text-sm text-gray-400">Загрузка...</div>
                  ) : ingredientOptions.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-400">
                      {ingredientSearch ? "Ничего не найдено" : "Нет ингредиентов"}
                    </div>
                  ) : (
                    ingredientOptions.map((ing) => {
                      const isSelected = selectedIngredients.some((i) => i.id === ing.id);
                      return (
                        <label
                          key={ing.id}
                          className="flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleIngredient(ing)}
                            className="size-4 rounded border-gray-300 accent-orange-500"
                          />
                          <span className="text-sm text-gray-800">{ing.name}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          {name.trim() && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">
                  Изображение
                  {isSearchingPhotos && (
                    <span className="ml-2 text-xs text-gray-400">Поиск...</span>
                  )}
                </p>
                {hasImage && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="text-xs text-red-500 transition-colors hover:text-red-700"
                  >
                    Удалить картинку
                  </button>
                )}
              </div>

              {currentImageUrl && !selectedPhoto && (
                <div className="relative aspect-video w-full overflow-hidden rounded-xl border-2 border-orange-400">
                  <Image
                    src={currentImageUrl}
                    alt="Текущее изображение"
                    fill
                    className="object-cover"
                    sizes="480px"
                  />
                  <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/40 to-transparent p-2">
                    <span className="text-xs text-white">Текущее изображение</span>
                  </div>
                </div>
              )}

              {!isSearchingPhotos && photos.length === 0 && searchedQuery && (
                <p className="text-sm text-gray-400">Изображения не найдены</p>
              )}

              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((photo) => (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => handleSelectPhoto(photo)}
                      className={`relative aspect-square overflow-hidden rounded-xl border-2 transition-all ${
                        selectedPhoto?.id === photo.id
                          ? "border-orange-500 shadow-md"
                          : "border-transparent hover:border-gray-300"
                      }`}
                    >
                      <Image
                        src={photo.url}
                        alt={photo.alt}
                        fill
                        className="object-cover"
                        sizes="120px"
                      />
                      {selectedPhoto?.id === photo.id && (
                        <div className="absolute inset-0 flex items-center justify-center bg-orange-500/20">
                          <svg className="size-6 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15l-4.121-4.121a1 1 0 011.414-1.414L8.414 12.172l7.879-7.879a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {!hasImage && (
                <p className="text-xs text-gray-400">
                  Можно пропустить — рецепт сохранится без картинки
                </p>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <Button variant="ghost" type="button" className="w-auto flex-1" onClick={onClose}>
              Отмена
            </Button>
            <Button
              type="submit"
              className="flex-1"
              isLoading={isSaving}
              disabled={!name.trim()}
            >
              {isEditing ? "Сохранить" : "Добавить"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
