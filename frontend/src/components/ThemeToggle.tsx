import React from 'react';
import useTheme from '../hooks/useTheme';
import { IconMoon, IconSun } from './Icons';

/** Light/dark switch — reflects the resolved theme, writes an explicit choice. */
const ThemeToggle: React.FC<{ className?: string }> = ({ className }) => {
  const { resolved, toggle } = useTheme();
  const next = resolved === 'dark' ? 'light' : 'dark';

  return (
    <button
      type="button"
      onClick={toggle}
      className={`btn btn-ghost btn-icon theme-toggle ${className ?? ''}`}
      title={`Switch to ${next} mode`}
      aria-label={`Switch to ${next} mode`}
    >
      {resolved === 'dark' ? <IconSun /> : <IconMoon />}
    </button>
  );
};

export default ThemeToggle;
