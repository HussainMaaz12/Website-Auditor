export const calculateScore = (violations) => {
    if (!violations) return { score: 0, label: 'Poor', color: 'var(--accent-critical)', counts: { critical: 0, serious: 0, moderate: 0, minor: 0 } };

    let counts = { critical: 0, serious: 0, moderate: 0, minor: 0 };
    violations.forEach(v => {
        if (counts[v.impact] !== undefined) {
            counts[v.impact]++;
        } else {
            counts.minor++; // Fallback
        }
    });

    // Start at 100, deduct based on violation severity
    let computedScore = 100 - (counts.critical * 10) - (counts.serious * 7) - (counts.moderate * 4) - (counts.minor * 2);
    computedScore = Math.max(0, Math.min(100, computedScore));

    let label = 'Poor';
    let color = 'var(--accent-critical)';
    
    if (computedScore >= 90) {
        label = 'Excellent';
        color = 'var(--accent-minor)'; // Teal
    } else if (computedScore >= 70) {
        label = 'Good';
        color = '#3b82f6'; // Blue
    } else if (computedScore >= 50) {
        label = 'Needs Improvement';
        color = 'var(--accent-moderate)'; // Amber
    }

    return { score: computedScore, label, color, counts };
};
