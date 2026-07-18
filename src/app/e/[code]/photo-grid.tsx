"use client";

import { useState } from "react";
import Image from "next/image";
import { PhotoViewer, type ViewerPhoto } from "./photo-viewer";

export function PhotoGrid({
  photos,
  hashtag,
  hdIncluded,
  columnsClassName = "grid-cols-2 sm:grid-cols-3",
}: {
  photos: ViewerPhoto[];
  hashtag: string | null;
  hdIncluded: boolean;
  columnsClassName?: string;
}) {
  const [open, setOpen] = useState<ViewerPhoto | null>(null);

  return (
    <>
      <div className={`grid gap-2 ${columnsClassName}`}>
        {photos.map((photo) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setOpen(photo)}
            className="cascade relative aspect-square overflow-hidden rounded-md bg-surface"
          >
            <Image src={photo.url} alt="" fill sizes="50vw" className="object-cover" />
          </button>
        ))}
      </div>

      {open ? (
        <PhotoViewer
          photo={open}
          hashtag={hashtag}
          hdIncluded={hdIncluded}
          onClose={() => setOpen(null)}
        />
      ) : null}
    </>
  );
}
