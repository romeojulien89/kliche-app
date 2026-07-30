"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print:hidden rounded-full bg-accent px-6 py-3 font-sans text-sm font-medium text-accent-foreground"
    >
      Imprimer / Enregistrer en PDF
    </button>
  );
}
