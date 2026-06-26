import { NextResponse } from "next/server";
import type { EventId } from "@/lib/events";
import eventAssets from "@/data/event-assets.json";

export const revalidate = 3600;

const VALID_IDS = new Set(["lisbon", "tokyo", "ethonline", "mumbai"]);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const { eventId } = await params;

  if (!VALID_IDS.has(eventId)) {
    return NextResponse.json({ error: "Unknown event" }, { status: 404 });
  }

  const assets = eventAssets[eventId as EventId];
  if (!assets) {
    return NextResponse.json({ error: "No assets found" }, { status: 404 });
  }

  return NextResponse.json(assets, {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
  });
}
