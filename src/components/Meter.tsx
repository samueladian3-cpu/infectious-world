interface MeterProps {
  label: string;
  value: number;
  tone: 'red' | 'cyan';
  rateLabel: string;
  hint: string;
}

export function Meter({ label, value, tone, rateLabel, hint }: MeterProps) {
  const pct = Math.min(100, Math.max(0, value));
  const danger = pct >= 80;
  return (
    <div className={`meter meter-${tone}${danger ? ' meter-danger' : ''}`}>
      <div className="meter-top">
        <span className="meter-label">{label}</span>
        <span className="meter-value">{pct.toFixed(1)}%</span>
      </div>
      <div
        className="meter-track"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
        aria-valuetext={`${pct.toFixed(1)} persen${danger ? ', mendekati batas' : ''}`}
      >
        <div className="meter-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="meter-sub">
        <span>{rateLabel}</span>
        <span>{danger ? '⚠ ' : ''}{hint}</span>
      </div>
    </div>
  );
}
