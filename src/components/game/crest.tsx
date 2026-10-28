export function Crest({ className = "h-24 w-24" }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 80" className={className} aria-hidden="true">
      <circle cx="40" cy="40" r="34" fill="none" stroke="var(--color-accent)" strokeWidth="2.5" />
      <path d="M40 10 47 33 70 40 47 47 40 70 33 47 10 40 33 33Z" fill="var(--color-accent)" />
      <circle cx="40" cy="40" r="5.5" fill="var(--color-ink)" />
    </svg>
  );
}
