export function getPercentage(score, maxScore) {
    if (score == null || maxScore == null || maxScore === 0) return null
    return Math.round((score / maxScore) * 100)
  }

export function computeBatchAverage(assignments) {
    const graded = assignments.filter(a => a.score != null);
  
    if (graded.length === 0) return 0;
  
    const percentages = graded.map(a =>
      a.score / a.maxScore
    );
  
    const avg = percentages.reduce((a, b) => a + b, 0) / percentages.length;
  
    return Math.round(avg * 100);
  }