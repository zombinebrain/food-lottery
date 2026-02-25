import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

const recipeInclude = {
  ingredients: {
    include: { ingredient: true },
  },
} as const;

function mapRecipe(recipe: Awaited<ReturnType<typeof prisma.recipe.update>>) {
  const r = recipe as typeof recipe & {
    ingredients: { ingredient: { id: string; name: string; imageUrl: string | null } }[];
  };
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    imageUrl: r.imageUrl,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    ingredients: r.ingredients.map((ri) => ri.ingredient),
  };
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { name, description, imageUrl, ingredientIds } = body as {
    name?: string;
    description?: string | null;
    imageUrl?: string | null;
    ingredientIds?: string[];
  };

  if (name !== undefined && !name.trim()) {
    return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
  }

  const recipe = await prisma.recipe.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
      ...(imageUrl !== undefined && { imageUrl }),
      ...(ingredientIds !== undefined && {
        ingredients: {
          deleteMany: {},
          create: ingredientIds.map((ingredientId) => ({ ingredientId })),
        },
      }),
    },
    include: recipeInclude,
  });

  return NextResponse.json(mapRecipe(recipe));
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  await prisma.recipe.delete({ where: { id } });

  return new NextResponse(null, { status: 204 });
}
