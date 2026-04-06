export function ScoreRing({ score }) {
    const circ = 138.2;
    const offset = circ - (circ * score / 100);
    const color = score >= 80 ? '#f97316' : score >= 60 ? '#f59e0b' : '#ef4444';
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
          {score}
        </div>
      </div>
    );
  }