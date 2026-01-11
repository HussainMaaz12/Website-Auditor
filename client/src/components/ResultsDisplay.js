import React, { useState, useRef, useEffect } from 'react';
import './ResultsDisplay.css';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { gsap } from 'gsap';
import feather from 'feather-icons';

const getImpactColor = (impact) => {
  switch (impact) {
    case 'critical': return 'impact-critical';
    case 'serious': return 'impact-serious';
    case 'moderate': return 'impact-moderate';
    default: return 'impact-minor';
  }
};

const ResultsDisplay = ({ results }) => {
  const [expandedId, setExpandedId] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const reportRef = useRef(null);
  const fabRef = useRef(null);
  const countRefs = useRef({});
  const animatedOnce = useRef(false); 

  useEffect(() => {
    if (!results?.results) return;

    
    if (!animatedOnce.current) {
      animatedOnce.current = true;

      
      gsap.from('.summary-card', {
        y: 40,
        startAt: { opacity: 1 },
        
        duration: 0.8,
        stagger: 0.15,
        ease: 'power3.out',
        onComplete: () => gsap.set('.summary-card', { clearProps: 'transform' })
      });

      // Animate the FAB
      if (fabRef.current) {
        gsap.from(fabRef.current, {
          y: 80,
          opacity: 1,
          duration: 0.8,
          ease: 'back.out(1.7)',
          delay: 0.3,
          onComplete: () => gsap.set(fabRef.current, { clearProps: 'transform' })
        });
      }
    }

    // Animate counters
    const { violations, passes, incomplete } = results.results;
    const animateCounter = (ref, target) => {
      if (!ref) return;
      const startVal = { val: 0 };
      gsap.to(startVal, {
        val: target,
        duration: 1.2,
        ease: 'power2.out',
        onUpdate: () => {
          ref.innerText = Math.floor(startVal.val);
        },
      });
    };

    animateCounter(countRefs.current.violations, violations.length);
    animateCounter(countRefs.current.passes, passes.length);
    animateCounter(countRefs.current.incomplete, incomplete.length);
  }, [results]);

  useEffect(() => {
    feather.replace();
  }, [expandedId, results]);

  if (!results || !results.results) {
    return (
      <div className="results-display-container">
        <p>No results to display.</p>
        <button ref={fabRef} className="fab-download" disabled>
          <i dangerouslySetInnerHTML={{ __html: feather.icons.download.toSvg() }} />
          Download PDF
        </button>
      </div>
    );
  }

  const { violations } = results.results;

  const handleToggle = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    const input = reportRef.current;
    if (!input) return setIsDownloading(false);

    try {
      input.classList.add('pdf-export-mode');
      const canvas = await html2canvas(input, { scale: 2 });
      input.classList.remove('pdf-export-mode');

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

      const safeName = (results?.url ?? 'report')
        .replace(/https?:\/\//, '')
        .split('/')[0]
        .replace(/[^a-z0-9.-_]/gi, '_');

      pdf.save(`accessibility-report-${safeName}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="results-display-container">
      <div ref={reportRef} className="pdf-content">
        <header className="results-summary">
          <div className="summary-cards">
            <div className="summary-card violations">
              <span ref={(el) => (countRefs.current.violations = el)} className="count">0</span>
              <span className="label">Violations</span>
            </div>
            <div className="summary-card passes">
              <span ref={(el) => (countRefs.current.passes = el)} className="count">0</span>
              <span className="label">Passed Checks</span>
            </div>
            <div className="summary-card incomplete">
              <span ref={(el) => (countRefs.current.incomplete = el)} className="count">0</span>
              <span className="label">Incomplete</span>
            </div>
          </div>
        </header>

        <div className="violations-list">
          {violations.length > 0 ? (
            violations.map((violation, index) => (
              <div
                key={violation.id || `${index}-${violation.help}`}
                className="violation-item"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div
                  className="violation-header"
                  onClick={() => handleToggle(violation.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') handleToggle(violation.id);
                  }}
                  aria-expanded={expandedId === violation.id}
                >
                  <div className="violation-info">
                    <span className={`impact-badge ${getImpactColor(violation.impact)}`}>
                      {violation.impact}
                    </span>
                    <p className="violation-description">{violation.help}</p>
                  </div>
                  <span
                    className={`toggle-icon ${expandedId === violation.id ? 'expanded' : ''}`}
                    dangerouslySetInnerHTML={{ __html: feather.icons['chevron-down'].toSvg() }}
                  />
                </div>
                {expandedId === violation.id && (
                  <div className="violation-details">
                    <p><strong>Description:</strong> {violation.description}</p>
                    <p><strong>Help:</strong> <a href={violation.helpUrl} target="_blank" rel="noopener noreferrer">Learn more</a></p>
                    <p><strong>Affected Nodes ({(violation.nodes || []).length}):</strong></p>
                    <ul className="node-list">
                      {(violation.nodes || []).map((node, idx) => (
                        <li key={idx}><code>{node.html}</code></li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="no-violations-message">
              <h2>Congratulations!</h2>
              <p>No accessibility violations were found.</p>
            </div>
          )}
        </div>
      </div>
            
      <button
        ref={fabRef}
        className="fab-download"
        onClick={handleDownloadPDF}
        disabled={isDownloading}
        title="Download PDF Report"
        style={{ opacity: 1, visibility: 'visible', transition: 'none' }}
      >
        <i dangerouslySetInnerHTML={{ __html: feather.icons.download.toSvg() }} />
        {isDownloading ? 'Preparing...' : 'Download PDF'}
      </button>
    </div>
  );
};

export default ResultsDisplay;
