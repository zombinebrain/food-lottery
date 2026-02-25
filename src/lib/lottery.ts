import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const DAILY_RECIPE_LIMIT = 10;
const DEFAULT_TIME_ZONE = "UTC";

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export async function getOrCreateTodayRound(rawTimeZone?: string) {
  const timeZone = normalizeTimeZone(rawTimeZone);
  const now = new Date();
  const { dateKey, nextMidnightUtc } = await getRoundBoundaryForTimeZone(timeZone);

  const existing = await prisma.lotteryRound.findFirst({
    where: {
      OR: [{ dateKey }, { endsAt: nextMidnightUtc }],
    },
    orderBy: { createdAt: "asc" },
    include: {
      recipes: {
        include: { recipe: true },
      },
      votes: true,
    },
  });

  if (existing) return existing;

  const recipes = await prisma.recipe.findMany({
    select: { id: true },
  });

  const selectedRecipeIds = shuffle(recipes)
    .slice(0, DAILY_RECIPE_LIMIT)
    .map((recipe) => recipe.id);

  try {
    return await prisma.lotteryRound.create({
      data: {
        dateKey,
        startsAt: now,
        endsAt: nextMidnightUtc,
        recipes: {
          create: selectedRecipeIds.map((recipeId) => ({
            recipeId,
          })),
        },
      },
      include: {
        recipes: {
          include: { recipe: true },
        },
        votes: true,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const concurrentRound = await prisma.lotteryRound.findFirst({
        where: {
          OR: [{ dateKey }, { endsAt: nextMidnightUtc }],
        },
        orderBy: { createdAt: "asc" },
        include: {
          recipes: {
            include: { recipe: true },
          },
          votes: true,
        },
      });

      if (concurrentRound) return concurrentRound;
    }

    throw error;
  }
}

export function getTimeLeftMs(endsAt: Date) {
  return Math.max(0, endsAt.getTime() - Date.now());
}

export function normalizeTimeZone(rawTimeZone?: string) {
  if (!rawTimeZone) return DEFAULT_TIME_ZONE;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: rawTimeZone });
    return rawTimeZone;
  } catch {
    return DEFAULT_TIME_ZONE;
  }
}

async function getRoundBoundaryForTimeZone(timeZone: string) {
  const rows = await prisma.$queryRaw<
    { nextMidnightUtcMs: bigint }[]
  >`
    SELECT
      (extract(epoch from ((date_trunc('day', CURRENT_TIMESTAMP AT TIME ZONE ${timeZone}) + interval '1 day') AT TIME ZONE ${timeZone})) * 1000)::bigint AS "nextMidnightUtcMs"
  `;

  const row = rows[0];
  return {
    dateKey: `round:${row.nextMidnightUtcMs.toString()}`,
    nextMidnightUtc: new Date(Number(row.nextMidnightUtcMs)),
  };
}
