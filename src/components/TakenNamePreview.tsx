export function TakenNamePreview({
  slug,
  word,
  line,
}: {
  slug: string;
  word?: string | null;
  line?: string | null;
}) {
  return (
    <div className="mt-3 w-full max-w-sm text-center">
      <p className="font-display text-[1.65rem] leading-none tracking-tight text-[var(--ink)]">
        {word || slug}
      </p>
      {line ? (
        <p className="mt-2 font-mono text-[12px] leading-relaxed text-[var(--ink-muted)]">
          {line}
        </p>
      ) : null}
      <p className="mark mt-3 text-[11px] text-[var(--ink-muted)]">
        that name is taken.{" "}
        <a href={`/${slug}`} className="underline underline-offset-2">
          view their page
        </a>
      </p>
    </div>
  );
}
