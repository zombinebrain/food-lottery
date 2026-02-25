import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOrCreateTodayRound, normalizeTimeZone } from "@/lib/lottery";
import type { VoteChoice } from "@/types/lottery";

type VoteTotals = Record<VoteChoice, number>;

function createEmptyTotals(): VoteTotals {
  return {
    WANT: 0,
    OKAY: 0,
    NOPE: 0,
  };
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const searchParams = new URL(request.url).searchParams;
  const requestedTimeZone = searchParams.get("timeZone") ?? undefined;
  const timeZone = normalizeTimeZone(requestedTimeZone);
  const round = await getOrCreateTodayRound(timeZone);
  const userId = session.user.id;

  const payload = {
    roundId: round.id,
    startsAt: round.startsAt.toISOString(),
    endsAt: round.endsAt.toISOString(),
    recipes: round.recipes.map((roundRecipe) => {
      const votes = round.votes.filter((vote) => vote.recipeId === roundRecipe.recipeId);
      const myVote = votes.find((vote) => vote.userId === userId)?.choice ?? null;
      const totals = votes.reduce<VoteTotals>((acc, vote) => {
        acc[vote.choice] += 1;
        return acc;
      }, createEmptyTotals());

      return {
        id: roundRecipe.recipe.id,
        name: roundRecipe.recipe.name,
        description: roundRecipe.recipe.description,
        imageUrl: roundRecipe.recipe.imageUrl,
        myVote,
        totals,
        totalVotes: votes.length,
      };
    }),
  };

  return NextResponse.json(payload);
}
