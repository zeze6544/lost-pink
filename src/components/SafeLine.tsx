import { splitLineLinks } from "@/lib/links";

export function SafeLine({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const parts = splitLineLinks(text);
  return (
    <p className={className}>
      {parts.map((part, i) =>
        part.href ? (
          <a
            key={i}
            href={part.href}
            rel="noopener noreferrer nofollow"
            target="_blank"
            className="underline decoration-current/30 underline-offset-4 hover:decoration-current/60"
          >
            {part.text}
          </a>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </p>
  );
}
