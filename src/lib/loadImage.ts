import type { SponsorAsset } from "./event-assets";

const imageCache = new Map<string, HTMLImageElement>();

export function proxyImageUrl(url: string): string {
  return `/api/image?url=${encodeURIComponent(url)}`;
}

export function loadImage(url: string): Promise<HTMLImageElement> {
  const src = url.startsWith("/") ? url : proxyImageUrl(url);
  const cached = imageCache.get(src);
  if (cached) return Promise.resolve(cached);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = src;
  });
}

export async function loadSponsorLogos(
  sponsors: SponsorAsset[],
): Promise<{ name: string; image: HTMLImageElement }[]> {
  const loaded = await Promise.allSettled(
    sponsors.map(async (sponsor) => ({
      name: sponsor.name,
      image: await loadImage(sponsor.logoUrl),
    })),
  );

  return loaded
    .filter(
      (r): r is PromiseFulfilledResult<{ name: string; image: HTMLImageElement }> =>
        r.status === "fulfilled",
    )
    .map((r) => r.value);
}

export function clearImageCache() {
  imageCache.clear();
}
