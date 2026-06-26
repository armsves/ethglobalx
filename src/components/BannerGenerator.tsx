"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  EVENT_LIST,
  type EventId,
  getEvent,
  getTweetText,
} from "@/lib/events";
import type { EventAssetData } from "@/lib/event-assets";
import { clearImageCache } from "@/lib/loadImage";
import {
  BANNER_HEIGHT,
  BANNER_WIDTH,
  canvasToBlob,
  downloadCanvas,
  generateBanner,
} from "@/lib/generateBanner";
import eventAssetsData from "@/data/event-assets.json";
import PhotoCropModal from "@/components/PhotoCropModal";
import { loadImageFromDataUrl } from "@/lib/cropImage";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-zinc-900/80 px-3 py-2.5 text-base text-white placeholder:text-zinc-600 outline-none ring-violet-500 transition focus:ring-1 md:py-2 md:text-sm";

function useCanShareFiles() {
  const [canShareFiles, setCanShareFiles] = useState(false);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.canShare) return;
    try {
      const probe = new File([new Uint8Array([137, 80, 78, 71])], "probe.png", {
        type: "image/png",
      });
      setCanShareFiles(navigator.canShare({ files: [probe] }));
    } catch {
      setCanShareFiles(false);
    }
  }, []);

  return canShareFiles;
}

export default function BannerGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLImageElement | null>(null);
  const canShareFiles = useCanShareFiles();

  const [eventId, setEventId] = useState<EventId>("lisbon");
  const [name, setName] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoLoaded, setPhotoLoaded] = useState(0);
  const [isRendering, setIsRendering] = useState(false);
  const [assets, setAssets] = useState<EventAssetData | null>(
    eventAssetsData.lisbon as EventAssetData,
  );
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [cropSource, setCropSource] = useState<string | null>(null);
  const [photoOriginal, setPhotoOriginal] = useState<string | null>(null);

  const event = getEvent(eventId);

  useEffect(() => {
    let cancelled = false;

    async function loadAssets() {
      const fallback = eventAssetsData[eventId] as EventAssetData;
      try {
        const res = await fetch(`/api/event-assets/${eventId}`);
        if (!res.ok) throw new Error("Failed to load assets");
        const data = (await res.json()) as EventAssetData;
        if (!cancelled) setAssets(data);
      } catch {
        if (!cancelled) setAssets(fallback);
      }
    }

    clearImageCache();
    loadAssets();

    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const renderBanner = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || !assets) return;

    setIsRendering(true);
    try {
      await generateBanner(canvas, {
        event,
        assets,
        name,
        photo: photoRef.current,
      });
    } finally {
      setIsRendering(false);
    }
  }, [event, assets, name, photoLoaded]);

  useEffect(() => {
    renderBanner();
  }, [renderBanner]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      setPhotoOriginal(src);
      setCropSource(src);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const applyCroppedPhoto = async (croppedDataUrl: string) => {
    const img = await loadImageFromDataUrl(croppedDataUrl);
    photoRef.current = img;
    setPhotoPreview(croppedDataUrl);
    setPhotoLoaded((n) => n + 1);
    setCropSource(null);
  };

  const openCropEditor = () => {
    const source = photoOriginal ?? photoPreview;
    if (source) setCropSource(source);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const slug = event.shortName.toLowerCase();
    const safeName = (name.trim() || "banner").replace(/\s+/g, "-").toLowerCase();
    downloadCanvas(canvas, `ethglobal-${slug}-${safeName}.png`);
    setShareStatus(null);
  };

  const openTweetIntent = (text: string) => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const shareWithImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setShareStatus(null);
    const tweetText = getTweetText(event, name.trim() || "I");

    try {
      const blob = await canvasToBlob(canvas);
      const file = new File(
        [blob],
        `ethglobal-${event.shortName.toLowerCase()}.png`,
        { type: "image/png" },
      );

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          text: tweetText,
        });
        setShareStatus("Pick X in the share sheet — your banner is attached.");
        return;
      }

      downloadCanvas(canvas, `ethglobal-${event.shortName.toLowerCase()}.png`);
      openTweetIntent(tweetText);
      setShareStatus(
        "Banner saved. Attach it in the X compose window (desktop browsers can't auto-attach).",
      );
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setShareStatus("Could not share. Try Download instead.");
    }
  };

  const canShare = name.trim().length > 0;
  const shareHint = canShareFiles
    ? "Tap Share — choose X and the image is attached automatically."
    : "Downloads the banner, then opens X. Attach the image in compose.";

  const preview = (
    <div className="relative flex h-full w-full items-center justify-center p-2 md:p-3">
      <canvas
        ref={canvasRef}
        width={BANNER_WIDTH}
        height={BANNER_HEIGHT}
        className="max-h-full max-w-full rounded-lg border border-white/10 shadow-xl shadow-black/40 md:shadow-2xl"
        style={{
          aspectRatio: `${BANNER_WIDTH} / ${BANNER_HEIGHT}`,
          height: "auto",
          width: "auto",
        }}
      />
      {isRendering && (
        <div className="absolute inset-2 flex items-center justify-center rounded-lg bg-black/25 md:inset-3">
          <span className="text-xs text-white/80">Updating…</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex min-h-dvh flex-col md:h-dvh md:flex-row md:overflow-hidden">
      {/* Mobile: preview on top */}
      <div className="order-1 h-[38vh] min-h-[200px] shrink-0 border-b border-white/10 bg-[#07050f] md:order-2 md:h-auto md:min-h-0 md:flex-1 md:border-b-0 md:border-l">
        {preview}
      </div>

      {/* Form panel */}
      <div className="order-2 flex w-full shrink-0 flex-col bg-[#0a0812] md:order-1 md:h-full md:w-[min(100%,380px)] md:border-r md:border-white/10">
        <div className="border-b border-white/10 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-violet-400">
            ETHGlobal
          </p>
          <h1 className="text-lg font-bold text-white">Banner Generator</h1>
        </div>

        <div className="flex flex-col gap-3 overflow-y-auto px-4 py-3 md:flex-1">
          <Field label="Event">
            <select
              id="event"
              value={eventId}
              onChange={(e) => {
                setEventId(e.target.value as EventId);
              }}
              className={inputClass}
            >
              {EVENT_LIST.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.shortName} — {ev.dates}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Name">
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
              }}
              placeholder="Your name"
              className={inputClass}
              autoComplete="name"
            />
          </Field>

          <Field label="Photo">
            <div className="flex items-center gap-2">
              {photoPreview ? (
                <button
                  type="button"
                  onClick={openCropEditor}
                  className="shrink-0 rounded-full ring-2 ring-violet-500/50 active:opacity-80"
                  title="Adjust crop"
                >
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="h-11 w-11 rounded-full border border-white/30 object-cover"
                  />
                </button>
              ) : (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-dashed border-white/20 bg-zinc-900 text-[10px] text-zinc-500">
                  ?
                </div>
              )}
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <label className="flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-dashed border-white/20 bg-zinc-900/50 px-3 text-xs font-medium text-violet-300 active:bg-zinc-800">
                  {photoPreview ? "Change photo" : "Choose photo"}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="sr-only"
                  />
                </label>
                {photoPreview && (
                  <button
                    type="button"
                    onClick={openCropEditor}
                    className="min-h-9 rounded-lg border border-white/10 py-1.5 text-xs text-zinc-400 active:bg-white/5"
                  >
                    Adjust crop & position
                  </button>
                )}
              </div>
            </div>
          </Field>

          <div className="flex flex-col gap-2 pt-1 sm:flex-row">
            <button
              type="button"
              onClick={handleDownload}
              disabled={!canShare || isRendering}
              className="min-h-11 flex-1 rounded-lg bg-white py-2.5 text-sm font-semibold text-zinc-900 transition active:bg-zinc-200 disabled:opacity-40 md:text-xs"
            >
              Download
            </button>
            <button
              type="button"
              onClick={shareWithImage}
              disabled={!canShare || isRendering}
              className="flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#1d9bf0] py-2.5 text-sm font-semibold text-white transition active:bg-[#1a8cd8] disabled:opacity-40 md:text-xs"
            >
              <XIcon />
              {canShareFiles ? "Post on X" : "Share on X"}
            </button>
          </div>

          <p className="text-[11px] leading-snug text-zinc-500">
            {shareStatus ?? (canShare ? shareHint : "Enter your name to continue.")}
          </p>

          <div className="rounded-lg border border-white/5 bg-white/[0.03] p-2.5 text-[11px] leading-relaxed text-zinc-500 md:mt-auto">
            <p className="font-medium text-zinc-400">{event.name}</p>
            <p>{event.dates}</p>
            {assets?.venue && <p>{assets.venue}</p>}
            <p>{event.location}</p>
            <p>{event.prizePool} in prizes</p>
            <a
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-400 hover:text-violet-300"
            >
              ethglobal.com →
            </a>
          </div>
        </div>
      </div>

      {cropSource && (
        <PhotoCropModal
          imageSrc={cropSource}
          onCancel={() => setCropSource(null)}
          onComplete={applyCroppedPhoto}
        />
      )}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="flex items-baseline gap-1.5 text-xs font-medium text-zinc-300">
        {label}
        {hint && <span className="font-normal text-zinc-600">({hint})</span>}
      </label>
      {children}
    </div>
  );
}

function XIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-3.5 w-3.5 fill-current"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
