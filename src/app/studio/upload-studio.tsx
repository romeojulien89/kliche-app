"use client";

import { useRef, useState } from "react";

type EventOption = { id: string; name: string; code: string };

type QueueItem = {
  id: string;
  name: string;
  progress: number;
  status: "attente" | "envoi" | "traité" | "erreur";
};

export function UploadStudio({ events }: { events: EventOption[] }) {
  const [eventId, setEventId] = useState(events[0]?.id ?? "");
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const traitees = queue.filter(
    (q) => q.status === "traité" || q.status === "erreur",
  ).length;

  async function uploadFile(file: File, itemId: string) {
    // Safari envoie parfois un corps vide avec un objet File tel quel (notamment pour des
    // photos iCloud pas encore totalement téléchargées localement). Lire le fichier en mémoire
    // avant de construire le FormData force le téléchargement complet et évite le bug.
    let bytes: ArrayBuffer;
    try {
      bytes = await file.arrayBuffer();
    } catch {
      setQueue((q) =>
        q.map((item) =>
          item.id === itemId ? { ...item, status: "erreur" } : item,
        ),
      );
      return;
    }
    const blob = new Blob([bytes], { type: file.type || "image/jpeg" });

    return new Promise<void>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/photos/upload");

      xhr.upload.onprogress = (e) => {
        if (!e.lengthComputable) return;
        const progress = Math.round((e.loaded / e.total) * 100);
        setQueue((q) =>
          q.map((item) =>
            item.id === itemId ? { ...item, progress, status: "envoi" } : item,
          ),
        );
      };

      xhr.onload = () => {
        const ok = xhr.status >= 200 && xhr.status < 300;
        setQueue((q) =>
          q.map((item) =>
            item.id === itemId
              ? { ...item, progress: 100, status: ok ? "traité" : "erreur" }
              : item,
          ),
        );
        resolve();
      };

      xhr.onerror = () => {
        setQueue((q) =>
          q.map((item) =>
            item.id === itemId ? { ...item, status: "erreur" } : item,
          ),
        );
        resolve();
      };

      const formData = new FormData();
      formData.set("file", blob, file.name);
      formData.set("event_id", eventId);
      xhr.send(formData);
    });
  }

  async function handleFiles(files: FileList | null) {
    if (!files || !eventId) return;
    const items: QueueItem[] = Array.from(files).map((file) => ({
      id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`,
      name: file.name,
      progress: 0,
      status: "attente",
    }));
    setQueue((q) => [...q, ...items]);

    for (let i = 0; i < files.length; i++) {
      await uploadFile(files[i], items[i].id);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <label className="flex flex-col gap-1 font-sans text-sm">
        Événement
        <select
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          className="rounded-md border border-border bg-background px-3 py-2 font-sans text-sm text-foreground outline-none focus-visible:border-accent"
        >
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.name} ({event.code})
            </option>
          ))}
        </select>
      </label>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-12 text-center font-sans text-sm transition-colors ${
          dragOver ? "border-accent bg-accent/5" : "border-border"
        }`}
      >
        <p className="text-foreground/70">
          Glissez vos photos ici, ou cliquez pour choisir des fichiers.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {queue.length > 0 ? (
        <div className="flex flex-col gap-4">
          <div className="flex gap-6 font-sans text-sm text-foreground/70">
            <span>Envoyées : {queue.length}</span>
            <span>Traitées : {traitees}</span>
            <span>Livrées : 0</span>
          </div>

          <ul className="flex flex-col gap-2">
            {queue.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 font-sans text-xs text-foreground/70"
              >
                <span className="w-40 truncate">{item.name}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
                  <div
                    className={`h-full rounded-full transition-all ${
                      item.status === "erreur" ? "bg-red-500" : "bg-accent"
                    }`}
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
                <span className="w-16 text-right">{item.status}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
