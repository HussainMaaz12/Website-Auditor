import React, { useState, useRef, useEffect } from 'react';
import './ResultsDisplay.css';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { gsap } from 'gsap';
import feather from 'feather-icons';
import AccessibilityScore from './AccessibilityScore';

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
  const [linkCopied, setLinkCopied] = useState(false);
  const [copiedViolationId, setCopiedViolationId] = useState(null);
  const reportRef = useRef(null);
  const fabGroupRef = useRef(null);
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

      if (fabGroupRef.current) {
        gsap.from(fabGroupRef.current, {
          y: 80,
          opacity: 1,
          duration: 0.8,
          ease: 'back.out(1.7)',
          delay: 0.3,
          onComplete: () => gsap.set(fabGroupRef.current, { clearProps: 'transform' })
        });
      }
    }

    const { violations, passes, incomplete } = results.results;
    const animateCounter = (ref, target) => {
      if (!ref) return;
      const startVal = { val: 0 };
      gsap.to(startVal, {
        val: target,
        duration: 1.2,
        ease: 'power2.out',
        onUpdate: () => {
          if (ref) ref.innerText = Math.floor(startVal.val);
        },
      });
    };

    animateCounter(countRefs.current.violations, violations.length);
    animateCounter(countRefs.current.passes, passes.length);
    animateCounter(countRefs.current.incomplete, incomplete.length);
  }, [results]);

  useEffect(() => {
    feather.replace();
  }, [expandedId, results, linkCopied, copiedViolationId]);

  if (!results || !results.results) {
    return (
      <div className="results-display-container">
        <p>No results to display.</p>
      </div>
    );
  }

  const { violations } = results.results;

  const handleToggle = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const copyLink = async () => {
    const url = `${window.location.origin}/audit/${results._id}`;
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link', err);
    }
  };

  const copyViolation = async (e, violation) => {
    e.stopPropagation(); // prevent toggle
    const text = `[${violation.impact.toUpperCase()}] Violation: ${violation.help} \nDescription: ${violation.description}\nAffected nodes: ${(violation.nodes || []).length}\nMore info: ${violation.helpUrl}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedViolationId(violation.id);
      setTimeout(() => setCopiedViolationId(null), 2000);
    } catch (err) {
      console.error('Failed to copy violation', err);
    }
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
        <AccessibilityScore violations={violations} />
        
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
                  
                  <div className="violation-actions">
                    <button 
                      className="copy-violation-btn" 
                      onClick={(e) => copyViolation(e, violation)}
                      title="Copy issue details"
                    >
                      {copiedViolationId === violation.id ? (
                        <span className="copied-text">Copied!</span>
                      ) : (
                        <i dangerouslySetInnerHTML={{ __html: feather.icons.copy.toSvg() }} />
                      )}
                    </button>
                    <span
                      className={`toggle-icon ${expandedId === violation.id ? 'expanded' : ''}`}
                      dangerouslySetInnerHTML={{ __html: feather.icons['chevron-down'].toSvg() }}
                    />
                  </div>
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
            
      <div className="fab-group" ref={fabGroupRef} style={{ opacity: 1, visibility: 'visible', transition: 'none' }}>
        <button
          className="fab-btn fab-copy"
          onClick={copyLink}
          title="Copy public link"
        >
          {linkCopied ? (
            <>
              <i dangerouslySetInnerHTML={{ __html: feather.icons.check.toSvg() }} />
              Copied!
            </>
          ) : (
            <>
              <i dangerouslySetInnerHTML={{ __html: feather.icons.link.toSvg() }} />
              Copy Link
            </>
          )}
        </button>
        <button
          className="fab-btn fab-download"
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          title="Download PDF Report"
        >
          <i dangerouslySetInnerHTML={{ __html: feather.icons.download.toSvg() }} />
          {isDownloading ? 'Preparing...' : 'Download PDF'}
        </button>
      </div>
    </div>
  );
};

export default ResultsDisplay;
