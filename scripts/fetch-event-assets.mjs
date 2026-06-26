#!/usr/bin/env node
/**
 * Scrapes ETHGlobal event + prizes pages and writes src/data/event-assets.json.
 * Sponsors are sourced from /events/{slug}/prizes (official prize partners).
 * Run: npm run fetch-assets
 */

import { writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const EVENT_SLUGS = {
  lisbon: "lisbon2026",
  tokyo: "tokyo2026",
  ethonline: "ethonline2026",
  mumbai: "mumbai2026",
};

/** Official hero artwork used as the event page background. */
const EVENT_BACKGROUNDS = {
  lisbon2026:
    "https://ethglobal.b-cdn.net/events/lisbon2026/images/o5deu/default.jpg",
};

const HERO_RE = /https:\/\/ethglobal\.b-cdn\.net\/events\/[^\s"\\)]+/g;
const HERO_STYLE_RE =
  /background\\":\\"url\((https:\/\/ethglobal\.b-cdn\.net\/events\/[^)]+)\)/;
const LOGO_RE =
  /organizations\/([a-z0-9]+)\/square-logo\/default\.png" alt="([^"]+) logo"/g;

function fetchUrl(url) {
  return execSync(`curl -sL "${url}" -H "User-Agent: Mozilla/5.0"`, {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
}

function parsePrizeSponsors(html) {
  const logos = new Map();

  for (const match of html.matchAll(LOGO_RE)) {
    const orgId = match[1];
    const alt = match[2];
    const existing = logos.get(orgId);
    if (!existing || alt.length > existing.name.length) {
      logos.set(orgId, {
        name: alt,
        logoUrl: `https://ethglobal.b-cdn.net/organizations/${orgId}/square-logo/default.png`,
      });
    }
  }

  const sponsors = [];
  const seen = new Set();

  for (const match of html.matchAll(/\\"prizeAmount\\":(\d+)/g)) {
    const before = html.slice(Math.max(0, match.index - 600), match.index);
    const after = html.slice(match.index, match.index + 800);

    let nameMatch = before.match(/\\"name\\":\\"([^\\]+)\\",\\"about\\"/);
    if (!nameMatch) {
      nameMatch = before
        .slice(-300)
        .concat('\\"prizeAmount\\":')
        .match(/\\"name\\":\\"([^\\]+)\\",\\"prizeAmount\\":/);
    }
    if (!nameMatch) continue;

    const name = nameMatch[1];
    if (
      name.includes("ETHGlobal") ||
      name.includes("Workshop") ||
      name.includes("Tutorial")
    ) {
      continue;
    }
    if (seen.has(name)) continue;
    seen.add(name);

    const orgMatch =
      after.match(
        /\\"organization\\":\{[^}]*?\\"uuid\\":\\"([a-z0-9]+)\\"/,
      ) ?? after.match(/\\"uuid\\":\\"([a-z0-9]+)\\"/);
    const orgId = orgMatch?.[1];
    const logo = orgId ? logos.get(orgId) : undefined;

    sponsors.push({
      name: logo?.name ?? name,
      prizeAmount: Number(match[1]),
      logoUrl:
        logo?.logoUrl ??
        (orgId
          ? `https://ethglobal.b-cdn.net/organizations/${orgId}/square-logo/default.png`
          : ""),
    });
  }

  return sponsors
    .filter((s) => s.logoUrl)
    .sort((a, b) => b.prizeAmount - a.prizeAmount);
}

function parseVenue(html) {
  const match = html.match(/\\"location\\":\{\\"name\\":\\"([^\\]+)\\"/);
  return match?.[1] ?? null;
}

function parseBackgroundImage(html, slug) {
  const styleMatch = html.match(HERO_STYLE_RE);
  if (styleMatch) return styleMatch[1];

  const preferred = EVENT_BACKGROUNDS[slug];
  if (preferred) return preferred;

  return null;
}

function parseHeroImages(html, slug) {
  const images = new Set();
  for (const url of html.match(HERO_RE) || []) {
    if (url.includes(`/events/${slug}/`)) images.add(url);
  }
  const styleMatch = html.match(HERO_STYLE_RE);
  if (styleMatch) images.add(styleMatch[1]);
  return [...images];
}

function probeCdn(url) {
  try {
    const code = execSync(`curl -sI -o /dev/null -w "%{http_code}" "${url}"`, {
      encoding: "utf8",
    }).trim();
    return code === "200" ? url : null;
  } catch {
    return null;
  }
}

/** Manual overrides for prize sponsors / pool when pages are incomplete or need pinning. */
const EVENT_OVERRIDES = {
  tokyo: {
    sponsors: [
      {
        name: "World",
        prizeAmount: 15000,
        logoUrl:
          "https://ethglobal.b-cdn.net/organizations/3zpxc/square-logo/default.png",
      },
      {
        name: "ENS",
        prizeAmount: 10000,
        logoUrl:
          "https://ethglobal.b-cdn.net/organizations/bw7y9/square-logo/default.png",
      },
      {
        name: "Uniswap Foundation",
        prizeAmount: 10000,
        logoUrl:
          "https://ethglobal.b-cdn.net/organizations/026zc/square-logo/default.png",
      },
      {
        name: "1inch",
        prizeAmount: 5000,
        logoUrl:
          "https://ethglobal.b-cdn.net/organizations/if0ri/square-logo/default.png",
      },
    ],
    totalPrizes: 40000,
    prizePool: "$50,000+",
  },
  ethonline: {
    sponsors: [
      {
        name: "0G",
        prizeAmount: 15000,
        logoUrl:
          "https://ethglobal.b-cdn.net/organizations/g8xu4/square-logo/default.png",
      },
      {
        name: "The Graph",
        prizeAmount: 15000,
        logoUrl:
          "https://ethglobal.b-cdn.net/organizations/pfyco/square-logo/default.png",
      },
      {
        name: "Hedera",
        prizeAmount: 15000,
        logoUrl:
          "https://ethglobal.b-cdn.net/organizations/bdi3h/square-logo/default.png",
      },
      {
        name: "1inch",
        prizeAmount: 10000,
        logoUrl:
          "https://ethglobal.b-cdn.net/organizations/if0ri/square-logo/default.png",
      },
      {
        name: "Uniswap Foundation",
        prizeAmount: 5000,
        logoUrl:
          "https://ethglobal.b-cdn.net/organizations/026zc/square-logo/default.png",
      },
    ],
    totalPrizes: 60000,
    prizePool: "$75,000+",
  },
  mumbai: {
    logo: "/events/mumbai-logo.png",
    sponsors: [
      {
        name: "World",
        prizeAmount: 20000,
        logoUrl:
          "https://ethglobal.b-cdn.net/organizations/3zpxc/square-logo/default.png",
      },
      {
        name: "1inch",
        prizeAmount: 20000,
        logoUrl:
          "https://ethglobal.b-cdn.net/organizations/if0ri/square-logo/default.png",
      },
      {
        name: "Uniswap Foundation",
        prizeAmount: 15000,
        logoUrl:
          "https://ethglobal.b-cdn.net/organizations/026zc/square-logo/default.png",
      },
      {
        name: "Arkiv",
        prizeAmount: 15000,
        logoUrl: "/sponsors/arkiv.png",
      },
      {
        name: "ENS",
        prizeAmount: 10000,
        logoUrl:
          "https://ethglobal.b-cdn.net/organizations/bw7y9/square-logo/default.png",
      },
    ],
    totalPrizes: 80000,
    prizePool: "$100,000+",
  },
};

function scrapeHomepagePartners() {
  const homepageHtml = fetchUrl("https://ethglobal.com/");
  const sponsors = [];
  const seen = new Set();

  for (const match of homepageHtml.matchAll(LOGO_RE)) {
    const orgId = match[1];
    const name = match[2];
    if (seen.has(orgId)) continue;
    seen.add(orgId);
    sponsors.push({
      name,
      prizeAmount: 0,
      logoUrl: `https://ethglobal.b-cdn.net/organizations/${orgId}/square-logo/default.png`,
    });
  }

  return sponsors.slice(0, 14);
}

function formatPrizePool(total) {
  if (total <= 0) return null;
  if (total >= 1000) {
    const rounded = Math.floor(total / 1000) * 1000;
    return `$${rounded.toLocaleString("en-US")}+`;
  }
  return `$${total.toLocaleString("en-US")}`;
}

function scrapeEvent(id, slug) {
  const eventHtml = fetchUrl(`https://ethglobal.com/events/${slug}`);
  const prizesHtml = fetchUrl(`https://ethglobal.com/events/${slug}/prizes`);

  let sponsors = parsePrizeSponsors(prizesHtml);
  const heroImages = parseHeroImages(eventHtml, slug);
  const backgroundImage =
    parseBackgroundImage(eventHtml, slug) ?? heroImages[0] ?? null;
  const venue = parseVenue(eventHtml);
  const totalPrizes = sponsors.reduce((sum, s) => sum + s.prizeAmount, 0);

  if (sponsors.length === 0) {
    sponsors = scrapeHomepagePartners();
  }

  const banner =
    probeCdn(`https://ethglobal.b-cdn.net/events/${slug}/banner/default.png`) ??
    heroImages[0] ??
    null;

  const logo =
    probeCdn(`https://ethglobal.b-cdn.net/events/${slug}/logo/default.png`) ??
    null;

  const result = {
    id,
    slug,
    prizesUrl: `https://ethglobal.com/events/${slug}/prizes`,
    backgroundImage,
    banner,
    logo,
    venue,
    heroImages,
    sponsors,
    totalPrizes,
    prizePool: formatPrizePool(totalPrizes),
    fetchedAt: new Date().toISOString(),
  };

  const override = EVENT_OVERRIDES[id];
  if (override) {
    return { ...result, ...override, fetchedAt: result.fetchedAt };
  }

  return result;
}

function main() {
  const assets = {};

  for (const [id, slug] of Object.entries(EVENT_SLUGS)) {
    console.log(`Fetching ${slug}...`);
    assets[id] = scrapeEvent(id, slug);
    console.log(
      `  ${assets[id].sponsors.length} prize sponsors (${assets[id].prizePool ?? "n/a"}), banner: ${assets[id].banner ? "yes" : "no"}`,
    );
  }

  const outDir = join(ROOT, "src/data");
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "event-assets.json");
  writeFileSync(outPath, JSON.stringify(assets, null, 2));
  console.log(`Wrote ${outPath}`);
}

main();
