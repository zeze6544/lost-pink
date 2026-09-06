"use client";

export function GoBack({ className = "" }: { className?: string }) {
  return (
    <button
      type="button"
      className={`mark text-sm opacity-55 transition hover:opacity-100 ${className}`}
      onClick={() => {
        if (window.history.length > 1) window.history.back();
        else window.location.href = "/";
      }}
    >
      back
    </button>
  );
}
