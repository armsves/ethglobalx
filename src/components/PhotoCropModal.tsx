"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { getCroppedImage } from "@/lib/cropImage";

interface PhotoCropModalProps {
  imageSrc: string;
  onCancel: () => void;
  onComplete: (croppedDataUrl: string) => void;
}

export default function PhotoCropModal({
  imageSrc,
  onCancel,
  onComplete,
}: PhotoCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    setIsSaving(true);
    try {
      const cropped = await getCroppedImage(imageSrc, croppedAreaPixels, true);
      onComplete(cropped);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-0 sm:items-center sm:p-4">
      <div className="flex w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-[#0f0c18] shadow-2xl sm:rounded-2xl">
        <div className="border-b border-white/10 px-4 py-3">
          <h2 className="text-sm font-semibold text-white">Crop & position photo</h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            Drag to reposition · Pinch or slide to zoom
          </p>
        </div>

        <div className="relative h-[min(52vh,360px)] w-full bg-zinc-950">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="space-y-3 border-t border-white/10 px-4 py-3">
          <label className="flex items-center gap-3 text-xs text-zinc-400">
            <span className="shrink-0">Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="h-1.5 w-full cursor-pointer accent-violet-500"
            />
          </label>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="min-h-11 flex-1 rounded-lg border border-white/10 py-2 text-sm font-medium text-zinc-300 active:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !croppedAreaPixels}
              className="min-h-11 flex-1 rounded-lg bg-violet-600 py-2 text-sm font-semibold text-white active:bg-violet-500 disabled:opacity-40"
            >
              {isSaving ? "Saving…" : "Use photo"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
