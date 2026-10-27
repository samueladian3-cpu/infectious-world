export function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const fmtRate = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2).replace('.', ',')}/dtk`;
