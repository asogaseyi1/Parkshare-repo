import React from 'react';

type LogoProps = {
  /** Hide the wordmark and render the badge only. */
  markOnly?: boolean;
  size?: number;
  /** Render the wordmark in white — for use on the brand gradient panels. */
  inverse?: boolean;
  className?: string;
};

/**
 * ParkShare mark: a map-pin silhouette carrying the "P" of a parking sign.
 * Each instance needs its own gradient id so multiple logos can coexist.
 */
let uid = 0;

const Logo: React.FC<LogoProps> = ({ markOnly = false, size = 32, inverse = false, className }) => {
  const gradientId = React.useMemo(() => `ps-logo-${++uid}`, []);

  return (
    <span
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.55rem' }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        role="img"
        aria-label="ParkShare"
        style={{ flex: 'none' }}
      >
        <defs>
          <linearGradient id={gradientId} x1="4" y1="2" x2="36" y2="38" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#837eff" />
            <stop offset="0.55" stopColor="#5b45eb" />
            <stop offset="1" stopColor="#2dd4bf" />
          </linearGradient>
        </defs>
        <path
          d="M20 2.5c7.18 0 13 5.6 13 12.5 0 8.4-9.62 18.1-12.2 20.6a1.15 1.15 0 0 1-1.6 0C16.62 33.1 7 23.4 7 15 7 8.1 12.82 2.5 20 2.5Z"
          fill={`url(#${gradientId})`}
        />
        <path
          d="M16.6 22.6V8.9h5.1a4.45 4.45 0 0 1 0 8.9h-2.2v4.8Zm2.9-7.2h2a1.95 1.95 0 0 0 0-3.9h-2Z"
          fill="#fff"
        />
      </svg>
      {!markOnly && (
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: `${Math.max(size * 0.5, 15)}px`,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: inverse ? '#fff' : 'var(--text)',
          }}
        >
          Park<span style={{ opacity: inverse ? 0.75 : 0.55 }}>Share</span>
        </span>
      )}
    </span>
  );
};

export default Logo;
