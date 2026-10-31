// Spark's own navigation icon set (rounded 1.8px strokes, 24px grid).
interface IconProps {
  size?: number;
  className?: string;
}

function Svg({ size = 24, className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function NavHomeIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 10.4 12 4l8 6.4V19a1.5 1.5 0 0 1-1.5 1.5H15v-5.2a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5.2H5.5A1.5 1.5 0 0 1 4 19z" />
    </Svg>
  );
}

export function NavSearchIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="10.8" cy="10.8" r="6.3" />
      <path d="m15.6 15.6 4.4 4.4" />
    </Svg>
  );
}

export function NavLibraryIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 4.5v15" />
      <path d="M9.5 4.5v15" />
      <path d="m14 5.2 4.6 14" />
    </Svg>
  );
}

export function NavSettingsIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 7.5h8.5" />
      <path d="M17.5 7.5H20" />
      <circle cx="15" cy="7.5" r="2.4" />
      <path d="M4 16.5h2.5" />
      <path d="M11.5 16.5H20" />
      <circle cx="9" cy="16.5" r="2.4" />
    </Svg>
  );
}
