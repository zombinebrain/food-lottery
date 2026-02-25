"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface Props {
  itemName: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function DeleteConfirmModal({ itemName, onClose, onConfirm }: Props) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleConfirm() {
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl">
        <div className="p-6">
          <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-red-50">
            <svg className="size-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>

          <h2 className="text-lg font-semibold text-gray-900">Удалить?</h2>
          <p className="mt-1 text-sm text-gray-500">
            <span className="font-medium text-gray-700">{itemName}</span> будет удалён без возможности восстановления.
          </p>
        </div>

        <div className="flex gap-3 border-t border-gray-100 px-6 py-4">
          <Button variant="ghost" className="w-auto flex-1" onClick={onClose} disabled={isDeleting}>
            Отмена
          </Button>
          <Button
            className="flex-1 bg-red-500 hover:bg-red-600 focus:ring-red-400"
            isLoading={isDeleting}
            onClick={handleConfirm}
          >
            Удалить
          </Button>
        </div>
      </div>
    </div>
  );
}
