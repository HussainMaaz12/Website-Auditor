import React, { useState, useEffect } from 'react';
import ResultsDisplay from './ResultsDisplay';
import HistoryPanel from './HistoryPanel';
import './AuditorPage.css';
import feather from 'feather-icons';

const AuditorPage = () => {
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);
    const [history, setHistory] = useState([]);

    // Load history from localStorage when the component first loads
    useEffect(() => {
        try {
            const savedHistory = JSON.parse(localStorage.getItem('auditHistory')) || [];
            setHistory(savedHistory);
        } catch (e) {
            console.error("Failed to parse history from localStorage", e);
            setHistory([]);
        }
    }, []);

    // Add or remove the 'loading' class from the body
    useEffect(() => {
        if (isLoading) {
            document.body.classList.add('loading-cursor');
        } else {
            document.body.classList.remove('loading-cursor');
        }
    }, [isLoading]);

    const handleAuditClick = async () => {
        if (!url.trim() || isLoading) return; // Prevent empty or duplicate submissions

        setResults(null);
        setError(null);
        setIsLoading(true);

        try {
            const response = await fetch('/api/audit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Something went wrong with the audit.');
            }
            
            setResults(data);

            // Add successful audit to history
            const newHistoryItem = {
                url: data.url,
                violations: data.results.violations.length,
                timestamp: new Date().toISOString(),
            };
            
            // Add to the start of the array and keep the last 10 items
            const updatedHistory = [newHistoryItem, ...history].slice(0, 10); 
            setHistory(updatedHistory);
            localStorage.setItem('auditHistory', JSON.stringify(updatedHistory));

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };
    
    // Function to handle the 'Enter' key press
    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            handleAuditClick();
        }
    };
    
    const loadFromHistory = (historicUrl) => {
        setUrl(historicUrl);
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
                            onKeyDown={handleKeyDown} // Listen for key presses
                            disabled={isLoading}
                        />
                        <button 
                            className="audit-button" 
                            onClick={handleAuditClick}
                            disabled={isLoading || !url.trim()}
                        >
                            {isLoading ? (
                                <i className="button-spinner" dangerouslySetInnerHTML={{ __html: feather.icons.loader.toSvg() }} />
                            ) : (
                                'Start Audit'
                            )}
                        </button>
                    </div>

                    {error && <div className="error-message">{error}</div>}
                    
                    {results && <ResultsDisplay results={results} />}
                </main>
            </div>
            
            <HistoryPanel history={history} onHistoryClick={loadFromHistory} />
        </div>
    );
};

export default AuditorPage;

