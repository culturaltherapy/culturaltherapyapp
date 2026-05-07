import * as React from "react";

const icons = {
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>
  ),
  bell: (
    <>
      <path d="M6 8a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </>
  ),
  shield: <path d="M12 3 4 6v6c0 5 4 8 8 9 4-1 8-4 8-9V6l-8-3Z" />,
  heart: <path d="M12 21s-7-4.5-9.3-9.2C1.4 8.7 3.5 5 7 5c2 0 3.5 1 5 3 1.5-2 3-3 5-3 3.5 0 5.6 3.7 4.3 6.8C19 16.5 12 21 12 21Z" />,
  message: <path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12Z" />,
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2 20c.8-3.7 3.7-6 7-6s6.2 2.3 7 6" />
      <circle cx="17" cy="9" r="3" />
      <path d="M14.5 13.5c2.5-.5 5 .8 6.5 4" />
    </>
  ),
  home: <path d="m3 11 9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1Z" />,
  book: <path d="M5 4a2 2 0 0 1 2-2h11v18H7a2 2 0 0 0-2 2V4Zm0 0v16h12" />,
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </>
  ),
  list: (
    <>
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <circle cx="4" cy="6" r="1" />
      <circle cx="4" cy="12" r="1" />
      <circle cx="4" cy="18" r="1" />
    </>
  ),
  plus: (
    <>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </>
  ),
  arrow: <path d="M5 12h14M13 5l7 7-7 7" />,
  arrowLeft: <path d="M19 12H5M11 19l-7-7 7-7" />,
  check: <path d="M5 12l5 5L20 7" />,
  x: <path d="M6 6l12 12M6 18 18 6" />,
  filter: <path d="M4 5h16M7 12h10M10 19h4" />,
  mic: (
    <>
      <rect x="9" y="3" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </>
  ),
  play: <path d="M8 5v14l11-7L8 5Z" />,
  camera: (
    <>
      <path d="M3 8h4l2-3h6l2 3h4v11H3V8Z" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  )
} as const;

export type IconName = keyof typeof icons;

export function Icon({
  name,
  size = 20,
  className,
  strokeWidth = 1.6
}: {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {icons[name]}
    </svg>
  );
}
