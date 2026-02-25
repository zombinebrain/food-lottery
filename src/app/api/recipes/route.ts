import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const recipeInclude = {
  ingredients: {
    include: { ingredient: true },
  },
} as const;

function mapRecipe(recipe: Awaited<ReturnType<typeof fetchRecipes>>[number]) {
  return {
    id: recipe.id,
    name: recipe.name,
    description: recipe.description,
    imageUrl: recipe.imageUrl,
    createdAt: recipe.createdAt,
    updatedAt: recipe.updatedAt,
    ingredients: recipe.ingredients.map((ri) => ri.ingredient),
  };
}

async function fetchRecipes(search: string) {
  return prisma.recipe.findMany({
    where: search ? { name: { contains: search, mode: "insensitive" } } : undefined,
    orderBy: { createdAt: "desc" },
    include: recipeInclude,
  });
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";

  const recipes = await fetchRecipes(search);
  return NextResponse.json(recipes.map(mapRecipe));
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { name, description, imageUrl, ingredientIds } = body as {
    name: string;
    description?: string;
    imageUrl?: string | null;
    ingredientIds?: string[];
  };

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const recipe = await prisma.recipe.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      imageUrl: imageUrl ?? null,
      ingredients: {
        create: (ingredientIds ?? []).map((id) => ({ ingredientId: id })),
      },
    },
    include: recipeInclude,
  });

  return NextResponse.json(mapRecipe(recipe), { status: 201 });
}
