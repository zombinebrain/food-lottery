import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Pexels API key not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");
  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  const response = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=9&orientation=square`,
    { headers: { Authorization: apiKey } }
  );

  if (!response.ok) {
    return NextResponse.json({ error: "Pexels request failed" }, { status: response.status });
  }

  const data = await response.json();

  const photos = (data.photos as PexelsPhoto[]).map((p) => ({
    id: p.id,
    url: p.src.medium,
    alt: p.alt,
  }));

  return NextResponse.json({ photos });
}

interface PexelsPhoto {
  id: number;
  alt: string;
  src: { medium: string };
}
