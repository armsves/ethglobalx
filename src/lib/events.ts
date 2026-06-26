export type EventId = "lisbon" | "tokyo" | "ethonline" | "mumbai";

export interface EthGlobalEvent {
  id: EventId;
  name: string;
  shortName: string;
  dates: string;
  dateRange: string;
  location: string;
  type: string;
  url: string;
  prizePool: string;
  accent: string;
  accentSecondary: string;
}

export const EVENTS: Record<EventId, EthGlobalEvent> = {
  lisbon: {
    id: "lisbon",
    name: "ETHGlobal Lisbon 2026",
    shortName: "Lisbon",
    dates: "Jul 24 – 26, 2026",
    dateRange: "July 24–26, 2026",
    location: "Lisbon, Portugal",
    type: "IRL Hackathon",
    url: "https://ethglobal.com/events/lisbon2026",
    prizePool: "$125,000+",
    accent: "#7c3aed",
    accentSecondary: "#a855f7",
  },
  tokyo: {
    id: "tokyo",
    name: "ETHGlobal Tokyo 2026",
    shortName: "Tokyo",
    dates: "Sep 25 – 27, 2026",
    dateRange: "September 25–27, 2026",
    location: "Tokyo, Japan",
    type: "IRL Hackathon",
    url: "https://ethglobal.com/events/tokyo2026",
    prizePool: "$100,000+",
    accent: "#dc2626",
    accentSecondary: "#f97316",
  },
  ethonline: {
    id: "ethonline",
    name: "ETHOnline 2026",
    shortName: "ETHOnline",
    dates: "Sep 4 – 16, 2026",
    dateRange: "September 4–16, 2026",
    location: "Online · Worldwide",
    type: "Async Hackathon",
    url: "https://ethglobal.com/events/ethonline2026",
    prizePool: "$200,000+",
    accent: "#2563eb",
    accentSecondary: "#06b6d4",
  },
  mumbai: {
    id: "mumbai",
    name: "ETHGlobal Mumbai 2026",
    shortName: "Mumbai",
    dates: "Nov 6 – 8, 2026",
    dateRange: "November 6–8, 2026",
    location: "Mumbai, India",
    type: "IRL Hackathon",
    url: "https://ethglobal.com/events/mumbai2026",
    prizePool: "$100,000+",
    accent: "#ea580c",
    accentSecondary: "#f59e0b",
  },
};

export const EVENT_LIST = Object.values(EVENTS);

export function getEvent(id: EventId): EthGlobalEvent {
  return EVENTS[id];
}

export function formatLocation(
  venue: string | null | undefined,
  cityCountry: string,
): { venue: string | null; cityCountry: string } {
  return {
    venue: venue?.trim() || null,
    cityCountry,
  };
}

function getTweetEventTitle(event: EthGlobalEvent): string {
  const title = event.name.startsWith("ETHGlobal ")
    ? event.name.slice("ETHGlobal ".length)
    : event.name;
  return `@ETHGlobal ${title}`;
}

export function getTweetText(event: EthGlobalEvent, name: string): string {
  return `I'm attending ${getTweetEventTitle(event)}!\n\n${event.dates} · ${event.location}\n${event.prizePool} in prizes\n\nApply: ${event.url}\n\n#ETHGlobal #${event.shortName}2026 #Ethereum`;
}
