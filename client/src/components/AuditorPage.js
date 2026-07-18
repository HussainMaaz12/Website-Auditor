import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ResultsDisplay from './ResultsDisplay';
import HistoryPanel from './HistoryPanel';
import HowItWorks from './HowItWorks';
import './AuditorPage.css';
import feather from 'feather-icons';
import { calculateScore } from '../utils/scoreCalculator';

const API_URL = process.env.REACT_APP_API_URL || '';

const AuditorPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);
    const [history, setHistory] = useState([]);
    const eventSourceRef = useRef(null);

    useEffect(() => {
        try {
            const savedHistory = JSON.parse(localStorage.getItem('auditHistory')) || [];
            setHistory(savedHistory);
        } catch (e) {
            console.error("Failed to parse history from localStorage", e);
            setHistory([]);
        }
    }, []);

    useEffect(() => {
        if (id && !results && !isLoading && !error) {
            fetchAuditResults(id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    useEffect(() => {
        if (isLoading) {
            document.body.classList.add('loading-cursor');
        } else {
            document.body.classList.remove('loading-cursor');
        }
    }, [isLoading]);

    useEffect(() => {
        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
        };
    }, []);

    useEffect(() => {
        feather.replace();
    }, [error, results, history]);

    const fetchAuditResults = async (auditId) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_URL}/api/audit/${auditId}`);
            const data = await response.json();

            if (data.status === 'completed' && data.results) {
                setResults(data);
                setUrl(data.url);
                
                if (id !== auditId) {
                    navigate(`/audit/${auditId}`, { replace: true });
                }

                const scoreData = calculateScore(data.results.violations);
                const newHistoryItem = {
                    auditId: data._id || auditId,
                    url: data.url,
                    violations: data.results.violations.length,
                    score: scoreData.score,
                    timestamp: new Date().toISOString(),
                };
                
                setHistory(prev => {
                    const filtered = prev.filter(item => item.auditId !== newHistoryItem.auditId);
                    const updatedHistory = [newHistoryItem, ...filtered].slice(0, 50);
                    localStorage.setItem('auditHistory', JSON.stringify(updatedHistory));
                    return updatedHistory;
                });
            } else if (data.status === 'failed') {
                const errorMsg = data.results?.error || 'Audit failed unexpectedly.';
                setError(errorMsg);
            }
        } catch (err) {
            setError('Failed to fetch audit results. The audit may not exist.');
        } finally {
            setIsLoading(false);
        }
    };

    const startSSEStream = (auditId) => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }

        const es = new EventSource(`${API_URL}/api/audit/${auditId}/stream`);
        eventSourceRef.current = es;

        es.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.status === 'completed') {
                    es.close();
                    eventSourceRef.current = null;
                    fetchAuditResults(auditId);
                } else if (data.status === 'failed') {
                    es.close();
                    eventSourceRef.current = null;
                    setError(data.error || 'Audit failed.');
                    setIsLoading(false);
                }
            } catch (err) {
                console.error('SSE parse error:', err);
            }
        };

        es.onerror = () => {
            es.close();
            eventSourceRef.current = null;
            startPolling(auditId);
        };
    };

    const startPolling = (auditId) => {
        const pollInterval = setInterval(async () => {
            try {
                const response = await fetch(`${API_URL}/api/audit/${auditId}`);
                const data = await response.json();

                if (data.status === 'completed' || data.status === 'failed') {
                    clearInterval(pollInterval);
                    if (data.status === 'completed') {
                        fetchAuditResults(auditId);
                    } else {
                        setError(data.results?.error || 'Audit failed.');
                        setIsLoading(false);
                    }
                }
            } catch (err) {
                clearInterval(pollInterval);
                setError('Lost connection to server.');
                setIsLoading(false);
            }
        }, 3000);
    };

    const handleAuditClick = async (overrideUrl = null) => {
        const targetUrl = typeof overrideUrl === 'string' ? overrideUrl : url;
        if (!targetUrl.trim() || isLoading) return;
        
        if (typeof overrideUrl === 'string') {
            setUrl(overrideUrl);
        }

        navigate('/'); 
        setResults(null);
        setError(null);
        setIsLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/audit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: targetUrl }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Something went wrong with the audit.');
            }

            startSSEStream(data.auditId);
        } catch (err) {
            setError(err.message);
            setIsLoading(false);
        }
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            handleAuditClick();
        }
    };
    
    const loadFromHistory = (historicUrl, existingAuditId = null) => {
        if (existingAuditId) {
            navigate(`/audit/${existingAuditId}`);
        } else {
            handleAuditClick(historicUrl);
        }
    };

    const deleteHistoryItem = (auditIdToDelete) => {
        setHistory(prev => {
            const updated = prev.filter(item => item.auditId !== auditIdToDelete);
            localStorage.setItem('auditHistory', JSON.stringify(updated));
            return updated;
        });
    };

    return (
        <div className="page-layout">
            <div className="auditor-container">
                <header className="auditor-header">
                    <h1>Web Accessibility Auditor</h1>
                    <p>Enter a URL to automatically scan for accessibility issues.</p>
                </header>
                
                <main className="auditor-main">
                    <div className="input-group">
                        <input 
                            type="text" 
                            className="url-input" 
                            placeholder="e.g., https://www.wikipedia.org"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={isLoading}
                        />
                        <button 
                            className="audit-button" 
                            onClick={() => handleAuditClick()}
                            disabled={isLoading || !url.trim()}
                        >
                            {isLoading ? (
                                <>
                                    <i className="button-spinner" dangerouslySetInnerHTML={{ __html: feather.icons.loader.toSvg() }} />
                                    <span>Auditing...</span>
                                </>
                            ) : (
                                'Start Audit'
                            )}
                        </button>
                    </div>
                    
                    <div className="quick-start-chips">
                        <span className="chip-label">Quick start:</span>
                        <button className="glass-chip" onClick={() => handleAuditClick('https://www.wikipedia.org')}>wikipedia.org</button>
                        <button className="glass-chip" onClick={() => handleAuditClick('https://github.com')}>github.com</button>
                        <button className="glass-chip" onClick={() => handleAuditClick('https://stripe.com')}>stripe.com</button>
                    </div>

                    {error && (
                        <div className="error-card">
                            <i className="error-icon" dangerouslySetInnerHTML={{ __html: feather.icons['alert-triangle'].toSvg() }} />
                            <div className="error-content">
                                <h3>Audit Failed</h3>
                                <p>{error}</p>
                            </div>
                            <button className="retry-button" onClick={() => handleAuditClick()}>Try Again</button>
                        </div>
                    )}
                    
                    {!results && !isLoading && !error && <HowItWorks />}
                    
                    {results && !error && <ResultsDisplay results={results} />}
                </main>
            </div>
            
            <HistoryPanel 
                history={history} 
                onHistoryClick={loadFromHistory} 
                onHistoryDelete={deleteHistoryItem} 
                onHistoryRerun={handleAuditClick} 
            />
        </div>
    );
};

export default AuditorPage;
