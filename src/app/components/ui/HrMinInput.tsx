/**
 * HrMinInput — Hours + Minutes picker that stores/returns decimal hours.
 * 1h 40m → 1.6667  |  0h 30m → 0.5  |  2h 0m → 2.0
 * All existing analytics and graphs receive the same decimal values — no schema change.
 */

interface HrMinInputProps {
  value: number;           // decimal hours stored in state
  onChange: (v: number) => void;
  maxHours?: number;       // default 24
  accentColor?: string;    // tailwind text-* class for the summary
  className?: string;
}

export function decToHrMin(dec: number): { h: number; m: number } {
  const safe = Math.max(0, dec);
  const h = Math.floor(safe);
  const m = Math.round((safe - h) * 60);
  // handle float rounding: 59.999 → 60 min → carry
  if (m === 60) return { h: h + 1, m: 0 };
  return { h, m };
}

export function hrMinToDec(h: number, m: number): number {
  return Math.round((h + m / 60) * 1000) / 1000;
}

export function fmtTime(dec: number): string {
  const { h, m } = decToHrMin(dec);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function HrMinInput({
  value,
  onChange,
  maxHours = 24,
  accentColor = 'text-white',
  className = '',
}: HrMinInputProps) {
  const { h, m } = decToHrMin(value);

  const setH = (raw: string) => {
    const hv = Math.min(Math.max(parseInt(raw) || 0, 0), maxHours);
    onChange(hrMinToDec(hv, m));
  };

  const setM = (raw: string) => {
    const mv = Math.min(Math.max(parseInt(raw) || 0, 0), 59);
    onChange(hrMinToDec(h, mv));
  };

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {/* Hours */}
      <div className="flex items-center gap-1">
        <input
          type="number"
          min={0}
          max={maxHours}
          value={h}
          onChange={(e) => setH(e.target.value)}
          onFocus={(e) => e.target.select()}
          className="w-14 text-center rounded-lg bg-slate-900/60 border border-white/10 text-white font-semibold py-1.5 text-sm outline-none focus:border-purple-500 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-xs text-white/40 select-none">hr</span>
      </div>

      {/* Minutes */}
      <div className="flex items-center gap-1">
        <input
          type="number"
          min={0}
          max={59}
          value={m}
          onChange={(e) => setM(e.target.value)}
          onFocus={(e) => e.target.select()}
          className="w-14 text-center rounded-lg bg-slate-900/60 border border-white/10 text-white font-semibold py-1.5 text-sm outline-none focus:border-purple-500 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-xs text-white/40 select-none">min</span>
      </div>

      {/* Live summary */}
      <span className={`text-base font-bold min-w-[2.5rem] ${accentColor}`}>
        {fmtTime(value)}
      </span>
    </div>
  );
}
