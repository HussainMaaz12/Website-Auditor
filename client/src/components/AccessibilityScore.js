import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import './AccessibilityScore.css';

const AccessibilityScore = ({ violations }) => {
    const containerRef = useRef(null);
    const scoreTextRef = useRef(null);
    const gaugeRef = useRef(null);
    const [scoreData, setScoreData] = useState({
        score: 0,
        label: 'Calculating...',
        color: 'var(--text-light)',
        counts: { critical: 0, serious: 0, moderate: 0, minor: 0 }
    });

    useEffect(() => {
        if (!violations) return;

        let counts = { critical: 0, serious: 0, moderate: 0, minor: 0 };
        violations.forEach(v => {
            if (counts[v.impact] !== undefined) {
                counts[v.impact]++;
            } else {
                counts.minor++; 
            }
        });

        let computedScore = 100 - (counts.critical * 10) - (counts.serious * 7) - (counts.moderate * 4) - (counts.minor * 2);
        computedScore = Math.max(0, Math.min(100, computedScore));

        let label = 'Poor';
        let color = 'var(--accent-critical)';
        
        if (computedScore >= 90) {
            label = 'Excellent';
            color = 'var(--accent-minor)'; 
        } else if (computedScore >= 70) {
            label = 'Good';
            color = '#3b82f6'; 
        } else if (computedScore >= 50) {
            label = 'Needs Improvement';
            color = 'var(--accent-moderate)'; 
        }

        setScoreData({
            score: computedScore,
            label,
            color,
            counts
        });

        const radius = 90;
        const circumference = 2 * Math.PI * radius;
        const targetOffset = circumference - (computedScore / 100) * circumference;

        gsap.set(gaugeRef.current, { strokeDasharray: circumference, strokeDashoffset: circumference, stroke: color });
        
        const tl = gsap.timeline();

        tl.to(containerRef.current, { opacity: 1, duration: 0.5, ease: 'power2.out' });

        tl.to(gaugeRef.current, { 
            strokeDashoffset: targetOffset, 
            duration: 1.5, 
            ease: 'power3.out' 
        }, '-=0.2');

        const startVal = { val: 0 };
        tl.to(startVal, {
            val: computedScore,
            duration: 1.5,
            ease: 'power3.out',
            onUpdate: () => {
                if (scoreTextRef.current) {
                    scoreTextRef.current.innerText = Math.floor(startVal.val);
                }
            }
        }, '<');

    }, [violations]);

    const { score, label, color, counts } = scoreData;

    return (
        <div 
            className="accessibility-score-container" 
            ref={containerRef}
            role="meter"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={score}
            aria-label={`Accessibility Score: ${score} out of 100, ${label}`}
        >
            <div className="gauge-wrapper">
                <svg className="gauge-svg" viewBox="0 0 200 200">
                    <circle className="gauge-track" cx="100" cy="100" r="90" />
                    <circle 
                        className="gauge-progress" 
                        ref={gaugeRef}
                        cx="100" 
                        cy="100" 
                        r="90" 
                        style={{ stroke: color }}
                    />
                </svg>
                <div className="gauge-center-text">
                    <span className="gauge-score" ref={scoreTextRef}>0</span>
                    <span className="gauge-out-of">out of 100</span>
                </div>
            </div>

            <div className="score-details">
                <h3 className="score-label" style={{ color }}>{label}</h3>
                
                <div className="severity-breakdown">
                    <div className="breakdown-item">
                        <span className="breakdown-dot dot-critical"></span>
                        <span className="breakdown-label">Critical:</span>
                        <span className="breakdown-count">{counts.critical}</span>
                    </div>
                    <div className="breakdown-item">
                        <span className="breakdown-dot dot-serious"></span>
                        <span className="breakdown-label">Serious:</span>
                        <span className="breakdown-count">{counts.serious}</span>
                    </div>
                    <div className="breakdown-item">
                        <span className="breakdown-dot dot-moderate"></span>
                        <span className="breakdown-label">Moderate:</span>
                        <span className="breakdown-count">{counts.moderate}</span>
                    </div>
                    <div className="breakdown-item">
                        <span className="breakdown-dot dot-minor"></span>
                        <span className="breakdown-label">Minor:</span>
                        <span className="breakdown-count">{counts.minor}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccessibilityScore;
