export function BoatIcon({ className = 'h-11 w-11 text-accent' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect fill="currentColor" x="26" y="10" width="4" height="16" rx="1" />
      <rect fill="currentColor" x="38" y="10" width="4" height="16" rx="1" />
      <rect fill="currentColor" x="25" y="12" width="18" height="3" rx="1" />
      <path fill="currentColor" d="M20,28 L48,28 L44,18 L24,18 Z" />
      <rect fill="currentColor" x="18" y="28" width="32" height="18" rx="2" />
      <rect fill="var(--card)" x="22" y="33" width="6" height="8" rx="1" />
      <rect fill="var(--card)" x="31" y="33" width="6" height="8" rx="1" />
      <rect fill="var(--card)" x="40" y="33" width="6" height="8" rx="1" />
      <path fill="currentColor" d="M6,46 L62,46 C61,58 55,68 48,75 L44,71 L34,79 L24,71 L20,75 C13,68 7,58 6,46 Z" />
      <path fill="none" stroke="var(--card)" strokeWidth="2" strokeLinecap="round" d="M13,54 C22,60 30,63 34,63 C38,63 46,60 55,54" />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        d="M2,84 C7,80 11,80 16,84 C21,88 25,88 30,84 C35,80 39,80 44,84 C49,88 53,88 58,84 C63,80 67,80 72,84"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.55"
        d="M2,92 C7,88 11,88 16,92 C21,96 25,96 30,92 C35,88 39,88 44,92 C49,96 53,96 58,92 C63,88 67,88 72,92"
      />
    </svg>
  );
}
