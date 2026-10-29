import type { CSSProperties } from 'react';
import type { ShieldEventId } from '../game/types';
import { EV_ICON, IC, type IcName } from '../ui/meta';

interface IcoProps {
  name: IcName;
  size?: number;
  stroke?: number;
  className?: string;
  style?: CSSProperties;
}

/** Ikon garis (viewBox 24) dari path di IC. */
export function Ico({ name, size = 22, stroke = 2.4, className, style }: IcoProps) {
  return (
    <svg
      className={className}
      style={style}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={IC[name]} />
    </svg>
  );
}

/** Ikon event Behavior Shield (viewBox 48). */
export function EvIcon({ id, size = 34, stroke = 3 }: { id: ShieldEventId; size?: number | string; stroke?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="#2A1E16" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {EV_ICON[id].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

/** Penanda kecil berisi (viewBox 16). */
export function Dot({ path, color, size = 16 }: { path: string; color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" className="dot-ico">
      <path d={path} fill={color} />
    </svg>
  );
}

export const PlayIcon = ({ size = 26 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M8 4.5v15l12-7.5z" />
  </svg>
);

/** Pita motif tenun. */
export const Weave = ({ className = '' }: { className?: string }) => <div className={`weave ${className}`} aria-hidden="true" />;

/** Cincin hitung mundur (stroke-dasharray). */
export function Ring({ r, fraction, size, track, fill, ink, width }: { r: number; fraction: number; size: number; track: string; fill: string; ink: string; width: number }) {
  const c = 2 * Math.PI * r;
  const mid = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx={mid} cy={mid} r={r} fill={fill} stroke={track} strokeWidth={2.5} />
      <circle
        cx={mid}
        cy={mid}
        r={r}
        fill="none"
        stroke={ink}
        strokeWidth={width}
        strokeDasharray={`${c * Math.max(0, Math.min(1, fraction))} ${c}`}
        transform={`rotate(-90 ${mid} ${mid})`}
        strokeLinecap="round"
        className="ring-arc"
      />
    </svg>
  );
}

