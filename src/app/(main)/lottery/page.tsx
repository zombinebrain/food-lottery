"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import type { LotteryState, VoteChoice } from "@/types/lottery";

const VOTE_OPTIONS: { value: VoteChoice; label: string; className: string }[] = [
  {
    value: "WANT",
    label: "Хочу",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 focus:ring-emerald-300",
  },
  {
    value: "OKAY",
    label: "Пойдёт",
    className:
      "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 focus:ring-amber-300",
  },
  {
    value: "NOPE",
    label: "Не хочу",
    className: "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 focus:ring-rose-300",
  },
];

type PendingVote = {
  roundId: string;
  recipeId: string;
  recipeName: string;
  choice: VoteChoice;
};

export default function LotteryPage() {
  const [data, setData] = useState<LotteryState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingVote, setPendingVote] = useState<PendingVote | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [timeLeftMs, setTimeLeftMs] = useState(0);
  const browserTimeZone =
    typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC";

  const fetchLottery = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/lottery?timeZone=${encodeURIComponent(browserTimeZone || "UTC")}`,
        { cache: "no-store" }
      );
      if (!response.ok) throw new Error("Не удалось загрузить лотерею");
      const payload = (await response.json()) as LotteryState;
      setData(payload);
      setTimeLeftMs(Math.max(0, new Date(payload.endsAt).getTime() - Date.now()));
    } catch {
      setError("Не удалось загрузить лотерею. Обнови страницу и попробуй снова.");
    } finally {
      setIsLoading(false);
    }
  }, [browserTimeZone]);

  useEffect(() => {
    void fetchLottery();
  }, [fetchLottery]);

  useEffect(() => {
    if (!data) return;
    const interval = setInterval(() => {
      const next = Math.max(0, new Date(data.endsAt).getTime() - Date.now());
      setTimeLeftMs(next);
      if (next === 0) {
        void fetchLottery();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [data, fetchLottery]);

  const timerText = useMemo(() => formatDuration(timeLeftMs), [timeLeftMs]);

  async function confirmVote() {
    if (!pendingVote) return;
    setIsVoting(true);
    try {
      const response = await fetch("/api/lottery/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roundId: pendingVote.roundId,
          recipeId: pendingVote.recipeId,
          choice: pendingVote.choice,
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Не удалось сохранить голос");
      }

      await fetchLottery();
      setPendingVote(null);
    } catch (voteError) {
      setError(voteError instanceof Error ? voteError.message : "Не удалось сохранить голос");
    } finally {
      setIsVoting(false);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 sm:p-5">
          <p className="text-center text-sm font-medium text-orange-700">До следующей лотереи:</p>
          <p className="mt-1 text-center text-2xl font-bold text-orange-900 sm:text-3xl">{timerText}</p>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="animate-pulse overflow-hidden rounded-2xl border border-gray-100 bg-white">
                <div className="aspect-video bg-gray-200" />
                <div className="space-y-3 p-4">
                  <div className="h-5 w-3/4 rounded bg-gray-200" />
                  <div className="h-4 w-full rounded bg-gray-200" />
                  <div className="h-10 w-full rounded-xl bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        ) : data && data.recipes.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {data.recipes.map((recipe) => {
              const voted = Boolean(recipe.myVote);
              return (
                <article
                  key={recipe.id}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                >
                  <div className="relative aspect-video bg-gray-100">
                    {recipe.imageUrl ? (
                      <Image
                        src={recipe.imageUrl}
                        alt={recipe.name}
                        fill
                        sizes="(min-width: 1024px) 50vw, 100vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-6xl">🍽️</div>
                    )}
                  </div>

                  <div className="p-4 sm:p-5">
                    <h2 className="text-lg font-semibold text-gray-900">{recipe.name}</h2>
                    <p className="mt-1 min-h-10 text-sm text-gray-600">
                      {recipe.description || "Без описания"}
                    </p>

                    <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                      {VOTE_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          disabled={voted || isVoting}
                          onClick={() =>
                            setPendingVote({
                              roundId: data.roundId,
                              recipeId: recipe.id,
                              recipeName: recipe.name,
                              choice: option.value,
                            })
                          }
                          className={`min-h-11 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 ${
                            option.className
                          } ${voted || isVoting ? "cursor-not-allowed opacity-60" : ""}`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>

                    {voted ? (
                      <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                        <p className="font-medium text-gray-900">
                          Твой голос: {recipe.myVote ? labelForChoice(recipe.myVote) : "—"}
                        </p>
                        <p className="mt-1">Хочу: {recipe.totals.WANT}</p>
                        <p>Пойдёт: {recipe.totals.OKAY}</p>
                        <p>Не хочу: {recipe.totals.NOPE}</p>
                        <p className="mt-1 text-gray-500">Всего голосов: {recipe.totalVotes}</p>
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-gray-500">
                        Рейтинг откроется после твоего голоса.
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 py-20 text-center">
            <span className="text-5xl">🧾</span>
            <p className="text-gray-500">В базе пока нет рецептов для лотереи.</p>
          </div>
        )}
      </div>

      {pendingVote && (
        <VoteConfirmModal
          recipeName={pendingVote.recipeName}
          choice={pendingVote.choice}
          isLoading={isVoting}
          onCancel={() => setPendingVote(null)}
          onConfirm={confirmVote}
        />
      )}
    </>
  );
}

function VoteConfirmModal({
  recipeName,
  choice,
  isLoading,
  onCancel,
  onConfirm,
}: {
  recipeName: string;
  choice: VoteChoice;
  isLoading: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(event) => event.target === event.currentTarget && onCancel()}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900">Подтвердить голос?</h2>
          <p className="mt-2 text-sm text-gray-600">
            Блюдо: <span className="font-medium text-gray-900">{recipeName}</span>
          </p>
          <p className="mt-1 text-sm text-gray-600">
            Выбор: <span className="font-medium text-gray-900">{labelForChoice(choice)}</span>
          </p>
          <p className="mt-3 text-sm text-rose-600">После подтверждения изменить или убрать голос нельзя.</p>
        </div>
        <div className="flex gap-3 border-t border-gray-100 px-6 py-4">
          <Button variant="ghost" className="w-auto flex-1" onClick={onCancel} disabled={isLoading}>
            Отмена
          </Button>
          <Button className="flex-1" isLoading={isLoading} onClick={() => void onConfirm()}>
            Подтвердить
          </Button>
        </div>
      </div>
    </div>
  );
}

function labelForChoice(choice: VoteChoice) {
  switch (choice) {
    case "WANT":
      return "Хочу";
    case "OKAY":
      return "Пойдёт";
    case "NOPE":
      return "Не хочу";
  }
}

function formatDuration(totalMs: number) {
  const totalSeconds = Math.max(0, Math.floor(totalMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
