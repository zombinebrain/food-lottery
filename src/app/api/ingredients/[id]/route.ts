import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { name, imageUrl } = body as { name?: string; imageUrl?: string | null };

  if (name !== undefined && !name.trim()) {
    return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
  }

  const ingredient = await prisma.ingredient.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(imageUrl !== undefined && { imageUrl }),
    },
  });

  return NextResponse.json(ingredient);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  await prisma.ingredient.delete({ where: { id } });

  return new NextResponse(null, { status: 204 });
}
