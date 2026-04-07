export function ScoreRing({ score, maxScore }) {
  const circ = 138.2;
  const pct = (maxScore && maxScore > 0) ? score / maxScore : score / 100;
  const offset = (circ - circ * pct).toFixed(1);
  const color = pct >= 0.8 ? '#f97316' : pct >= 0.6 ? '#f59e0b' : '#ef4444';
  const percentage = (maxScore && maxScore > 0)
    ? Math.round(pct * 100)
    : score;

  return (
    <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <div style={{ position: 'relative', width: 52, height: 52 }}>
        <svg width="52" height="52" viewBox="0 0 52 52" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="26" cy="26" r="22" fill="none" stroke="#fed7aa" strokeWidth="4" />
          <circle cx="26" cy="26" r="22" fill="none" stroke={color} strokeWidth="4"
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 600, color: '#92400e',
        }}>
          {percentage}%
        </div>
      </div>
      {maxScore != null && (
        <span style={{ fontSize: 11, fontWeight: 500, color: '#92400e', whiteSpace: 'nowrap' }}>
          {score}/{maxScore}
        </span>
      )}
    </div>
  );
}