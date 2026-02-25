import type { Ingredient } from "./ingredient";

export interface Recipe {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  ingredients: Pick<Ingredient, "id" | "name" | "imageUrl">[];
}
