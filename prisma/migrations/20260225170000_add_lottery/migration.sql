-- CreateEnum
CREATE TYPE "LotteryVoteChoice" AS ENUM ('WANT', 'OKAY', 'NOPE');

-- CreateTable
CREATE TABLE "lottery_rounds" (
    "id" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lottery_rounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lottery_round_recipes" (
    "roundId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,

    CONSTRAINT "lottery_round_recipes_pkey" PRIMARY KEY ("roundId","recipeId")
);

-- CreateTable
CREATE TABLE "lottery_votes" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "choice" "LotteryVoteChoice" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lottery_votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lottery_rounds_dateKey_key" ON "lottery_rounds"("dateKey");

-- CreateIndex
CREATE UNIQUE INDEX "lottery_votes_roundId_recipeId_userId_key" ON "lottery_votes"("roundId", "recipeId", "userId");

-- CreateIndex
CREATE INDEX "lottery_votes_roundId_recipeId_idx" ON "lottery_votes"("roundId", "recipeId");

-- AddForeignKey
ALTER TABLE "lottery_round_recipes" ADD CONSTRAINT "lottery_round_recipes_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "lottery_rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lottery_round_recipes" ADD CONSTRAINT "lottery_round_recipes_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lottery_votes" ADD CONSTRAINT "lottery_votes_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "lottery_rounds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lottery_votes" ADD CONSTRAINT "lottery_votes_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lottery_votes" ADD CONSTRAINT "lottery_votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lottery_votes" ADD CONSTRAINT "lottery_votes_roundId_recipeId_fkey" FOREIGN KEY ("roundId", "recipeId") REFERENCES "lottery_round_recipes"("roundId", "recipeId") ON DELETE CASCADE ON UPDATE CASCADE;
