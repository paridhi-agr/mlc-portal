export function ScoreRing({ score, maxScore }) {
  const circ = 138.2;
  const offset = circ - (circ * score / maxScore);
  const color = score >= 80 ? '#f97316' : score >= 60 ? '#f59e0b' : '#ef4444';

  function getPercentage(score, maxScore) {
    if (score == null || maxScore == null || maxScore === 0) return null
    return Math.round((score / maxScore) * 100)
  }

  const percentage = getPercentage(score, maxScore);

  return (
    <div style={{ position: 'relative', width: 52, height: 52, flexShrink: 0 }}>
      <svg width="52" height="52" viewBox="0 0 52 52" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="26" cy="26" r="22" fill="none" stroke="#fed7aa" strokeWidth="4" />
        <circle cx="26" cy="26" r="22" fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={circ} strokeDashoffset={offset.toFixed(1)} strokeLinecap="round" />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 600, color: '#92400e'
      }}>
        {percentage}%
      </div>
      <span style={{
        position: 'relative', inset: 0, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 600, color: '#92400e'
      }}>
          {score}/{maxScore}
      </span>
    </div>
  );
}