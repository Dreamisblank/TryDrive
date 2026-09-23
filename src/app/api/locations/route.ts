import { NextResponse } from "next/server";
import { searchLocations } from "@/lib/discovercars";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";

  try {
    const locations = await searchLocations(query);
    return NextResponse.json({ locations });
  } catch (err) {
    console.error("Location search failed:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: "Couldn't search locations right now." },
      { status: 502 },
    );
  }
}
