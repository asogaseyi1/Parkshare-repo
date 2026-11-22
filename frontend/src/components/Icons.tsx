/**
 * Inline SVG icon set — stroked, 24px grid, inherits `currentColor`.
 * Keeping these local avoids an icon-font dependency and keeps bundles small.
 */
import React from 'react';

export type IconProps = React.SVGProps<SVGSVGElement>;

const Svg: React.FC<IconProps> = ({ children, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    {...props}
  >
    {children}
  </svg>
);

export const IconPin: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.6" />
  </Svg>
);

export const IconMap: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M9 3 3.6 5.1A1 1 0 0 0 3 6v13.2a1 1 0 0 0 1.4.9L9 18.4l6 2.6 5.4-2.1a1 1 0 0 0 .6-.9V4.8a1 1 0 0 0-1.4-.9L15 5.6 9 3Z" />
    <path d="M9 3v15.4M15 5.6V21" />
  </Svg>
);

export const IconSearch: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.6-3.6" />
  </Svg>
);

export const IconPlus: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const IconClock: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5V12l3 2" />
  </Svg>
);

export const IconCard: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <rect x="2.5" y="5" width="19" height="14" rx="2.6" />
    <path d="M2.5 10h19M6.5 15h3" />
  </Svg>
);

export const IconShield: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M12 3l7.5 3v5.4c0 4.6-3.1 8.3-7.5 9.6-4.4-1.3-7.5-5-7.5-9.6V6L12 3Z" />
    <path d="m9 12 2.2 2.2L15.4 10" />
  </Svg>
);

export const IconBolt: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M13.5 3 5.6 13.2a.6.6 0 0 0 .5 1h4.4l-1 6.8 7.9-10.2a.6.6 0 0 0-.5-1h-4.4l1-6.8Z" />
  </Svg>
);

export const IconWallet: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M3.5 7.5A2.5 2.5 0 0 1 6 5h11.5A2.5 2.5 0 0 1 20 7.5" />
    <rect x="3.5" y="7.5" width="17" height="11.5" rx="2.5" />
    <path d="M16.2 13.2h.8" />
  </Svg>
);

export const IconCar: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M5 16.5h14M6.2 16.5V19a.8.8 0 0 1-.8.8H4.3a.8.8 0 0 1-.8-.8v-2.5M20.5 16.5V19a.8.8 0 0 1-.8.8h-1.1a.8.8 0 0 1-.8-.8v-2.5" />
    <path d="M3.5 16.5v-3.8l1.8-4.9A2 2 0 0 1 7.2 6.5h9.6a2 2 0 0 1 1.9 1.3l1.8 4.9v3.8h-17Z" />
    <path d="M4 12.7h16M7.5 14.6h1.8M14.7 14.6h1.8" />
  </Svg>
);

export const IconList: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M8.5 6.5h12M8.5 12h12M8.5 17.5h12M4 6.5h.01M4 12h.01M4 17.5h.01" />
  </Svg>
);

export const IconArrowRight: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M4.5 12h15M13.5 6l6 6-6 6" />
  </Svg>
);

export const IconArrowLeft: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M19.5 12h-15M10.5 6l-6 6 6 6" />
  </Svg>
);

export const IconCheck: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Svg>
);

export const IconCheckCircle: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8.2 12.3 2.5 2.5 5.1-5.6" />
  </Svg>
);

export const IconAlert: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.8v5M12 16.2h.01" />
  </Svg>
);

export const IconInfo: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 7.8h.01" />
  </Svg>
);

export const IconSun: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4" />
  </Svg>
);

export const IconMoon: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M20 14.2A8.2 8.2 0 0 1 9.8 4a8.4 8.4 0 1 0 10.2 10.2Z" />
  </Svg>
);

export const IconLogout: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M14.5 4.5h3.3A1.7 1.7 0 0 1 19.5 6.2v11.6a1.7 1.7 0 0 1-1.7 1.7h-3.3" />
    <path d="M10 8.2 6.2 12l3.8 3.8M6.2 12h8.3" />
  </Svg>
);

export const IconMenu: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Svg>
);

export const IconClose: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);

export const IconEye: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="2.8" />
  </Svg>
);

export const IconEyeOff: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M9.6 6.2A9.6 9.6 0 0 1 12 5.8c6 0 9.5 6.2 9.5 6.2a17 17 0 0 1-2.6 3.4M6.1 7.9A16.6 16.6 0 0 0 2.5 12S6 18.2 12 18.2c1 0 2-.2 2.8-.5" />
    <path d="M10.2 10.2a2.8 2.8 0 0 0 3.8 3.9M3.5 3.5l17 17" />
  </Svg>
);

export const IconUser: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="8.5" r="3.6" />
    <path d="M4.8 20c.9-3.3 3.8-5.3 7.2-5.3s6.3 2 7.2 5.3" />
  </Svg>
);

export const IconMail: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <rect x="2.8" y="5" width="18.4" height="14" rx="2.4" />
    <path d="m3.4 7 8.6 6 8.6-6" />
  </Svg>
);

export const IconLock: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <rect x="4.5" y="10.5" width="15" height="9.5" rx="2.4" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
  </Svg>
);

export const IconPhone: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M8.2 3.8h-2A2 2 0 0 0 4.3 6c.5 7.6 6.1 13.2 13.7 13.7a2 2 0 0 0 2.2-2v-2a1.4 1.4 0 0 0-1.1-1.4l-2.6-.5a1.4 1.4 0 0 0-1.4.6l-.8 1.1a13 13 0 0 1-5.2-5.2l1.1-.8a1.4 1.4 0 0 0 .6-1.4l-.5-2.6a1.4 1.4 0 0 0-1.4-1.1Z" />
  </Svg>
);

export const IconTrend: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M3.5 17 9 11.2l3.4 3.2 5-5.4" />
    <path d="M14.5 8.6h3.4V12" />
    <path d="M3.5 20.5h17" />
  </Svg>
);

export const IconSparkle: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="M12 3.5l1.7 4.4 4.4 1.7-4.4 1.7L12 15.7l-1.7-4.4L5.9 9.6l4.4-1.7L12 3.5Z" />
    <path d="M18.5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2Z" />
  </Svg>
);

export const IconKey: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <circle cx="8.2" cy="15.8" r="4.2" />
    <path d="m11.2 12.8 8-8M16.5 7.5l2.2 2.2M14.4 9.6l2.2 2.2" />
  </Svg>
);

export const IconLayers: React.FC<IconProps> = (p) => (
  <Svg {...p}>
    <path d="m12 3.5 8.5 4.4-8.5 4.4L3.5 7.9 12 3.5Z" />
    <path d="m4.5 12 7.5 3.9 7.5-3.9M4.5 16.1l7.5 3.9 7.5-3.9" />
  </Svg>
);
