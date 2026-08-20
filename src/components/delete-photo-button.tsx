"use client";

import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-1 font-sans text-xs text-red-500 underline underline-offset-2 transition-opacity hover:text-red-400 disabled:opacity-50"
    >
      {pending ? "Suppression…" : "Supprimer"}
    </button>
  );
}

export function DeletePhotoForm({
  photoId,
  action,
}: {
  photoId: string;
  action: (formData: FormData) => void;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Supprimer définitivement cette photo ? Cette action est irréversible.")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="photoId" value={photoId} />
      <SubmitButton />
    </form>
  );
}
