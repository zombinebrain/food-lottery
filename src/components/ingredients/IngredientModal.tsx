"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Ingredient } from "@/types/ingredient";

interface PexelsPhoto {
  id: number;
  url: string;
  alt: string;
}

interface Props {
  ingredient?: Ingredient;
  onClose: () => void;
  onSave: (name: string, imageUrl: string | null) => Promise<void>;
}

export function IngredientModal({ ingredient, onClose, onSave }: Props) {
  const isEditing = !!ingredient;

  const [name, setName] = useState(ingredient?.name ?? "");
  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(
    ingredient?.imageUrl ?? null
  );
  const [photos, setPhotos] = useState<PexelsPhoto[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<PexelsPhoto | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchedQuery, setSearchedQuery] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === searchedQuery) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/pexels?query=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          setPhotos(data.photos ?? []);
          setSearchedQuery(trimmed);
        }
      } finally {
        setIsSearching(false);
      }
    }, 600);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [name, searchedQuery]);

  function handleSelectPhoto(photo: PexelsPhoto) {
    if (selectedPhoto?.id === photo.id) {
      setSelectedPhoto(null);
    } else {
      setSelectedPhoto(photo);
      setCurrentImageUrl(null);
    }
  }

  function handleRemoveCurrentImage() {
    setCurrentImageUrl(null);
    setSelectedPhoto(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      const imageUrl = selectedPhoto?.url ?? currentImageUrl;
      await onSave(name.trim(), imageUrl);
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
            {isEditing ? "Редактировать ингредиент" : "Добавить ингредиент"}
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
            placeholder="Например: Помидор"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />

          {name.trim() && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">
                  Изображение
                  {isSearching && (
                    <span className="ml-2 text-xs text-gray-400">Поиск...</span>
                  )}
                </p>
                {hasImage && (
                  <button
                    type="button"
                    onClick={handleRemoveCurrentImage}
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

              {!isSearching && photos.length === 0 && searchedQuery && (
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
                  Можно пропустить — ингредиент сохранится без картинки
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
