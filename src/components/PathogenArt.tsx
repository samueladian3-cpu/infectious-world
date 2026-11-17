import type { ReactNode } from 'react';
import type { PathogenId } from '../game/types';
import { PATHOGEN_COLOR } from '../ui/meta';

const INK = '#2A1E16';
const SW = 3;


const ring = (n: number, r: number, cx = 60, cy = 60, phase = 0) =>
  Array.from({ length: n }, (_, i) => {
    const a = phase + (i / n) * Math.PI * 2;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r, a] as const;
  });

function Spikes({ n, r0, r1, head, fill, phase = 0 }: { n: number; r0: number; r1: number; head: number; fill: string; phase?: number }) {
  return (
    <g>
      {ring(n, 1, 60, 60, phase).map(([, , a], i) => {
        const x0 = 60 + Math.cos(a) * r0;
        const y0 = 60 + Math.sin(a) * r0;
        const x1 = 60 + Math.cos(a) * r1;
        const y1 = 60 + Math.sin(a) * r1;
        return (
          <g key={i}>
            <line x1={x0} y1={y0} x2={x1} y2={y1} stroke={INK} strokeWidth={SW} strokeLinecap="round" />
            <circle cx={x1} cy={y1} r={head} fill={fill} stroke={INK} strokeWidth={2.4} />
          </g>
        );
      })}
    </g>
  );
}

const ART: Record<PathogenId, (c: string) => ReactNode> = {
  rhinovirus: (c) => {
    const pts = ring(6, 38, 60, 60, Math.PI / 6);
    const poly = pts.map(([x, y]) => `${x},${y}`).join(' ');
    return (
      <>
        {pts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={5} fill="#F2B33D" stroke={INK} strokeWidth={2.4} />
        ))}
        <polygon points={poly} fill={c} stroke={INK} strokeWidth={SW} strokeLinejoin="round" />
        {pts.map(([x, y], i) => (
          <line key={i} x1={60} y1={60} x2={x} y2={y} stroke={INK} strokeWidth={2} opacity={0.55} />
        ))}
        <polygon points={ring(3, 16, 60, 60, -Math.PI / 2).map(([x, y]) => `${x},${y}`).join(' ')} fill="#FFF8EC" opacity={0.35} />
      </>
    );
  },
  influenza: (c) => (
    <>
      <Spikes n={14} r0={34} r1={46} head={4.5} fill="#F2B33D" />
      <circle cx={60} cy={60} r={34} fill={c} stroke={INK} strokeWidth={SW} />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const a = (i / 8) * Math.PI * 2;
        return <rect key={i} x={57} y={44} width={6} height={14} rx={3} fill="#FFF3D6" stroke={INK} strokeWidth={1.8} transform={`rotate(${(a * 180) / Math.PI} 60 60)`} />;
      })}
      <circle cx={60} cy={60} r={6} fill="#FFF3D6" stroke={INK} strokeWidth={2} />
    </>
  ),
  pneumococcus: (c) => (
    <>
      <ellipse cx={60} cy={60} rx={52} ry={36} fill="none" stroke={INK} strokeWidth={2.4} strokeDasharray="5 6" opacity={0.6} />
      <ellipse cx={40} cy={60} rx={21} ry={27} fill={c} stroke={INK} strokeWidth={SW} />
      <ellipse cx={80} cy={60} rx={21} ry={27} fill={c} stroke={INK} strokeWidth={SW} />
      <ellipse cx={35} cy={50} rx={6} ry={8} fill="#FFF8EC" opacity={0.35} />
      <ellipse cx={75} cy={50} rx={6} ry={8} fill="#FFF8EC" opacity={0.35} />
    </>
  ),
  tb: (c) => (
    <>
      {[
        [26, 40, 20],
        [32, 62, 8],
        [40, 82, -6],
        [60, 30, 30],
        [64, 54, 14],
        [70, 78, 2],
      ].map(([x, y, r], i) => (
        <g key={i} transform={`rotate(${r} ${x + 24} ${y})`}>
          <rect x={x} y={y - 7} width={50} height={14} rx={7} fill="#FFF3D6" stroke={INK} strokeWidth={SW} />
          <rect x={x + 4} y={y - 3.5} width={42} height={7} rx={3.5} fill={c} />
        </g>
      ))}
    </>
  ),
  hiv: (c) => (
    <>
      <Spikes n={12} r0={36} r1={46} head={5.5} fill="#9FD3A9" phase={0.2} />
      <circle cx={60} cy={60} r={36} fill={c} stroke={INK} strokeWidth={SW} />
      <circle cx={60} cy={60} r={27} fill="none" stroke="#FFF8EC" strokeWidth={2} opacity={0.4} />
      <path d="M52 42 L70 44 L66 80 L56 80 Z" fill="#F2B33D" stroke={INK} strokeWidth={2.6} strokeLinejoin="round" />
      <path d="M58 52 q4 4 0 8 q-4 4 0 8 q4 4 0 6" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" />
    </>
  ),
  dengue: (c) => (
    <>
      <circle cx={60} cy={60} r={42} fill={c} stroke={INK} strokeWidth={SW} />
      {ring(6, 22).map(([x, y], i) => (
        <polygon key={i} points={ring(6, 9, x, y).map(([px, py]) => `${px},${py}`).join(' ')} fill="#FFF3D6" stroke={INK} strokeWidth={1.8} opacity={0.85} />
      ))}
      <polygon points={ring(6, 9).map(([px, py]) => `${px},${py}`).join(' ')} fill="#FFF3D6" stroke={INK} strokeWidth={1.8} />
      <circle cx={60} cy={60} r={42} fill="none" stroke={INK} strokeWidth={SW} />
    </>
  ),
  ecoli: (c) => (
    <>
      {[
        'M28 48 q-10 -6 -14 -16 q-4 -8 -12 -10',
        'M30 72 q-12 6 -14 16 q-2 10 -12 12',
        'M92 50 q12 -8 14 -18 q2 -8 10 -10',
        'M90 72 q12 8 12 18 q0 10 10 14',
      ].map((d) => (
        <path key={d} d={d} fill="none" stroke={INK} strokeWidth={2.6} strokeLinecap="round" />
      ))}
      <rect x={22} y={40} width={76} height={40} rx={20} fill={c} stroke={INK} strokeWidth={SW} />
      {[34, 46, 58, 70, 82].map((x) => (
        <g key={x}>
          <line x1={x} y1={40} x2={x - 2} y2={34} stroke={INK} strokeWidth={1.8} strokeLinecap="round" />
          <line x1={x} y1={80} x2={x + 2} y2={86} stroke={INK} strokeWidth={1.8} strokeLinecap="round" />
        </g>
      ))}
      <rect x={32} y={48} width={30} height={8} rx={4} fill="#FFF8EC" opacity={0.35} />
    </>
  ),
  rotavirus: (c) => (
    <>
      {ring(18, 42).map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={5} fill={c} stroke={INK} strokeWidth={2} />
      ))}
      <circle cx={60} cy={60} r={40} fill={c} stroke={INK} strokeWidth={SW} />
      <circle cx={60} cy={60} r={14} fill="#FFF3D6" stroke={INK} strokeWidth={2.6} />
      {ring(9, 1).map(([, , a], i) => (
        <line key={i} x1={60 + Math.cos(a) * 14} y1={60 + Math.sin(a) * 14} x2={60 + Math.cos(a) * 37} y2={60 + Math.sin(a) * 37} stroke={INK} strokeWidth={2.6} strokeLinecap="round" />
      ))}
    </>
  ),
  plasmodium: (c) => (
    <>
      <circle cx={60} cy={60} r={44} fill="#E8968A" stroke={INK} strokeWidth={SW} />
      <circle cx={60} cy={60} r={26} fill="#F0B2A8" />
      <circle cx={52} cy={56} r={13} fill="none" stroke={c} strokeWidth={5} />
      <circle cx={62} cy={48} r={5} fill={c} stroke={INK} strokeWidth={1.8} />
      <circle cx={80} cy={76} r={8} fill="none" stroke={c} strokeWidth={4} />
      <circle cx={85} cy={71} r={3.5} fill={c} />
    </>
  ),
  entamoeba: (c) => (
    <>
      <path
        d="M30 52 C 20 36, 40 18, 56 26 C 66 14, 92 18, 92 38 C 108 44, 104 68, 90 74 C 94 92, 70 104, 58 92 C 44 104, 18 94, 26 76 C 12 70, 16 54, 30 52 Z"
        fill={c}
        stroke={INK}
        strokeWidth={SW}
        strokeLinejoin="round"
      />
      <circle cx={58} cy={58} r={12} fill="#FFF3D6" stroke={INK} strokeWidth={2.4} />
      <circle cx={58} cy={58} r={3.5} fill={INK} />
      <circle cx={80} cy={46} r={6} fill="#E8968A" stroke={INK} strokeWidth={1.8} />
      <circle cx={40} cy={78} r={5} fill="#E8968A" stroke={INK} strokeWidth={1.8} />
      <circle cx={78} cy={78} r={4} fill="#FFF8EC" opacity={0.5} />
    </>
  ),
};

interface Props {
  id: PathogenId;
  size?: number | string;
  /** Animasi melayang pelan (dimatikan oleh preferensi gerak). */
  float?: boolean;
  locked?: boolean;
  className?: string;
  title?: string;
}

/** Ilustrasi patogen bergaya "chunky": bentuk dan warna berbeda per jenis. Bukan gambar mikroskop. */
export function PathogenArt({ id, size = 96, float = false, locked = false, className = '', title }: Props) {
  return (
    <svg
      className={`pathogen-art${float ? ' is-floating' : ''}${locked ? ' is-locked' : ''} ${className}`}
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <ellipse cx={60} cy={112} rx={34} ry={5} fill={INK} opacity={0.18} />
      {ART[id](PATHOGEN_COLOR[id])}
    </svg>
  );
}
