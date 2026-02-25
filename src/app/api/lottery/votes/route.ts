import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { VoteChoice } from "@/types/lottery";

const VOTE_CHOICES: VoteChoice[] = ["WANT", "OKAY", "NOPE"];

function isVoteChoice(value: unknown): value is VoteChoice {
  return typeof value === "string" && VOTE_CHOICES.includes(value as VoteChoice);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as {
    roundId?: string;
    recipeId?: string;
    choice?: unknown;
  };
  const roundId = body.roundId?.trim();
  const recipeId = body.recipeId?.trim();
  const choice = body.choice;

  if (!roundId || !recipeId || !isVoteChoice(choice)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const roundRecipe = await prisma.lotteryRoundRecipe.findUnique({
    where: {
      roundId_recipeId: {
        roundId,
        recipeId,
      },
    },
  });
  const existsInRound = Boolean(roundRecipe);
  if (!existsInRound) {
    return NextResponse.json({ error: "Recipe is not part of selected lottery round" }, { status: 400 });
  }

  try {
    await prisma.lotteryVote.create({
      data: {
        roundId,
        recipeId,
        userId: session.user.id,
        choice,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "You have already voted for this recipe in the current round" },
        { status: 409 }
      );
    }

    throw error;
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
