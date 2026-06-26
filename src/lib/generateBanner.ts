import type { EthGlobalEvent } from "./events";
import { formatLocation } from "./events";
import type { EventAssetData } from "./event-assets";
import { loadImage, loadSponsorLogos } from "./loadImage";

export const BANNER_WIDTH = 1200;
export const BANNER_HEIGHT = 675;

export interface BannerOptions {
  event: EthGlobalEvent;
  assets: EventAssetData;
  name: string;
  photo?: HTMLImageElement | null;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

async function drawBackground(
  ctx: CanvasRenderingContext2D,
  event: EthGlobalEvent,
  assets: EventAssetData,
) {
  const hero =
    assets.backgroundImage ?? assets.banner ?? assets.heroImages[0] ?? null;

  let drewImage = false;
  if (hero) {
    try {
      const bg = await loadImage(hero);
      const scale = Math.max(
        BANNER_WIDTH / bg.width,
        BANNER_HEIGHT / bg.height,
      );
      const sw = bg.width * scale;
      const sh = bg.height * scale;
      const sx = (BANNER_WIDTH - sw) / 2;
      const sy = (BANNER_HEIGHT - sh) / 2;
      ctx.drawImage(bg, sx, sy, sw, sh);
      drewImage = true;
    } catch {
      drewImage = false;
    }
  }

  if (!drewImage) {
    drawGradientBackground(ctx, event);
  }

  const bottomScrim = ctx.createLinearGradient(0, BANNER_HEIGHT * 0.25, 0, BANNER_HEIGHT);
  bottomScrim.addColorStop(0, "rgba(8, 6, 18, 0)");
  bottomScrim.addColorStop(0.55, "rgba(8, 6, 18, 0.35)");
  bottomScrim.addColorStop(1, "rgba(8, 6, 18, 0.72)");
  ctx.fillStyle = bottomScrim;
  ctx.fillRect(0, 0, BANNER_WIDTH, BANNER_HEIGHT);

  const leftScrim = ctx.createLinearGradient(0, 0, BANNER_WIDTH * 0.72, 0);
  leftScrim.addColorStop(0, "rgba(8, 6, 18, 0.55)");
  leftScrim.addColorStop(1, "rgba(8, 6, 18, 0)");
  ctx.fillStyle = leftScrim;
  ctx.fillRect(0, 0, BANNER_WIDTH, BANNER_HEIGHT);
}

function drawGradientBackground(
  ctx: CanvasRenderingContext2D,
  event: EthGlobalEvent,
) {
  const gradient = ctx.createLinearGradient(0, 0, BANNER_WIDTH, BANNER_HEIGHT);
  gradient.addColorStop(0, "#0f0a1a");
  gradient.addColorStop(0.45, "#1a1033");
  gradient.addColorStop(1, "#0c1224");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, BANNER_WIDTH, BANNER_HEIGHT);

  const glow = ctx.createRadialGradient(900, 120, 0, 900, 120, 420);
  glow.addColorStop(0, `${event.accent}55`);
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, BANNER_WIDTH, BANNER_HEIGHT);
}

function drawPhoto(
  ctx: CanvasRenderingContext2D,
  photo: HTMLImageElement,
  x: number,
  y: number,
  size: number,
) {
  const cx = x + size / 2;
  const cy = y + size / 2;
  const r = size / 2;

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r + 3, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  const aspect = photo.width / photo.height;
  let sw = photo.width;
  let sh = photo.height;
  let sx = 0;
  let sy = 0;

  if (aspect > 1) {
    sw = photo.height;
    sx = (photo.width - sw) / 2;
  } else {
    sh = photo.width;
    sy = (photo.height - sh) / 2;
  }

  ctx.drawImage(photo, sx, sy, sw, sh, x, y, size, size);
  ctx.restore();
}

function drawLogo(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  maxW: number,
  maxH: number,
) {
  const scale = Math.min(maxW / image.width, maxH / image.height);
  const w = image.width * scale;
  const h = image.height * scale;
  ctx.drawImage(image, x, y, w, h);
}

function drawSponsorCircles(
  ctx: CanvasRenderingContext2D,
  logos: { name: string; image: HTMLImageElement }[],
  centerY: number,
) {
  const count = logos.length;
  if (count === 0) return;

  const gap = 10;
  const maxRowWidth = BANNER_WIDTH - 64;
  const diameter = Math.min(52, (maxRowWidth - gap * (count - 1)) / count);
  const totalW = count * diameter + (count - 1) * gap;
  let x = (BANNER_WIDTH - totalW) / 2;
  const y = centerY - diameter / 2;

  for (const { image } of logos) {
    const cx = x + diameter / 2;
    const cy = y + diameter / 2;
    const r = diameter / 2;

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, r - 2, 0, Math.PI * 2);
    ctx.clip();

    const scale = Math.max(diameter / image.width, diameter / image.height);
    const w = image.width * scale;
    const h = image.height * scale;
    ctx.drawImage(image, cx - w / 2, cy - h / 2, w, h);
    ctx.restore();

    x += diameter + gap;
  }
}

export async function generateBanner(
  canvas: HTMLCanvasElement,
  options: BannerOptions,
): Promise<void> {
  const { event, assets, name, photo } = options;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = BANNER_WIDTH;
  canvas.height = BANNER_HEIGHT;

  await drawBackground(ctx, event, assets);

  if (assets.logo) {
    try {
      const eventLogo = await loadImage(assets.logo);
      drawLogo(ctx, eventLogo, 40, 20, 280, 56);
    } catch {
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.font = "bold 22px system-ui, -apple-system, sans-serif";
      ctx.fillText("ETHGlobal", 48, 52);
    }
  }

  const photoSize = 176;
  const photoX = 56;
  const photoY = 130;

  if (photo) {
    drawPhoto(ctx, photo, photoX, photoY, photoSize);
  } else {
    ctx.save();
    ctx.beginPath();
    ctx.arc(
      photoX + photoSize / 2,
      photoY + photoSize / 2,
      photoSize / 2,
      0,
      Math.PI * 2,
    );
    const placeholderGrad = ctx.createLinearGradient(
      photoX,
      photoY,
      photoX + photoSize,
      photoY + photoSize,
    );
    placeholderGrad.addColorStop(0, event.accent);
    placeholderGrad.addColorStop(1, event.accentSecondary);
    ctx.fillStyle = placeholderGrad;
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "bold 64px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const initial = (name.trim()[0] || "?").toUpperCase();
    ctx.fillText(initial, photoX + photoSize / 2, photoY + photoSize / 2);
    ctx.textAlign = "left";
    ctx.restore();
  }

  const textX = photoX + photoSize + 40;
  const displayName = name.trim() || "Your Name";
  const { venue, cityCountry } = formatLocation(assets.venue, event.location);

  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = "500 24px system-ui, -apple-system, sans-serif";
  ctx.fillText("I'm attending", textX, 168);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 38px system-ui, -apple-system, sans-serif";
  ctx.fillText(event.name, textX, 220);

  ctx.fillStyle = "rgba(255,255,255,0.98)";
  ctx.font = "bold 34px system-ui, -apple-system, sans-serif";
  ctx.fillText(displayName, textX, 272);

  roundRect(ctx, textX, 296, 500, venue ? 124 : 108, 14);
  ctx.fillStyle = "rgba(0,0,0,0.42)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.font = "600 19px system-ui, -apple-system, sans-serif";
  ctx.fillText(`📅  ${event.dateRange}`, textX + 16, 332);

  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = "500 17px system-ui, -apple-system, sans-serif";
  if (venue) {
    ctx.fillText(`🏛️  ${venue}`, textX + 16, 362);
    ctx.fillText(`📍  ${cityCountry}`, textX + 16, 388);
  } else {
    ctx.fillText(`📍  ${cityCountry}`, textX + 16, 366);
  }

  ctx.fillStyle = "#fbbf24";
  ctx.font = "bold 17px system-ui, -apple-system, sans-serif";
  ctx.fillText(`🏆  ${event.prizePool} in prizes`, textX + 16, venue ? 414 : 398);

  const sponsorLogos = await loadSponsorLogos(assets.sponsors);

  if (sponsorLogos.length > 0) {
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "600 10px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("SPONSORED BY", BANNER_WIDTH / 2, 548);
    ctx.textAlign = "left";
    drawSponsorCircles(ctx, sponsorLogos, 598);
  }

  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.font = "500 12px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("ethglobal.com", BANNER_WIDTH - 32, BANNER_HEIGHT - 20);
  ctx.textAlign = "left";
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to generate image"));
      },
      "image/png",
      1,
    );
  });
}

export function downloadCanvas(
  canvas: HTMLCanvasElement,
  filename: string,
): void {
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
