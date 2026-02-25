export type VoteChoice = "WANT" | "OKAY" | "NOPE";

export interface LotteryRecipe {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  myVote: VoteChoice | null;
  totals: Record<VoteChoice, number>;
  totalVotes: number;
}

export interface LotteryState {
  roundId: string;
  startsAt: string;
  endsAt: string;
  recipes: LotteryRecipe[];
}
