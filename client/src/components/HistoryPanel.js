import React, { useState, useEffect } from 'react';
import './HistoryPanel.css';
import feather from 'feather-icons';

const HistoryPanel = ({ history, onHistoryClick, onHistoryDelete, onHistoryRerun }) => {
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    useEffect(() => {
        feather.replace();
    });

    return (
        <aside className="history-panel">
            <h2>Recent Audits</h2>
            {history.length > 0 ? (
                <ul className="history-list">
                    {history.map((item, index) => {
                        const date = new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                        
                        // Calculate trend
                        let trendDisplay = null;
                        if (item.score !== undefined) {
                            const previousItem = history.slice(index + 1).find(h => h.url === item.url && h.score !== undefined);
                            if (previousItem) {
                                const diff = item.score - previousItem.score;
                                if (diff > 0) {
                                    trendDisplay = <span className="trend positive" title="Score improved">↑ +{diff}</span>;
                                } else if (diff < 0) {
                                    trendDisplay = <span className="trend negative" title="Score dropped">↓ {diff}</span>;
                                } else {
                                    trendDisplay = <span className="trend neutral" title="Score unchanged">-</span>;
                                }
                            }
                        }

                        return (
                            <li key={item.auditId || index} className="history-item">
                                <div className="history-item-clickable" onClick={() => onHistoryClick(item.url, item.auditId)}>
                                    <div className="history-item-content">
                                        <span className="history-url">{item.url}</span>
                                        <span className="history-time">{date}</span>
                                    </div>
                                    <div className="history-metrics">
                                        {trendDisplay}
                                        <div className={`history-status ${item.score >= 90 ? 'pass' : 'fail'}`}>
                                            {item.score !== undefined ? `${item.score}/100` : `${item.violations} Issues`}
                                        </div>
                                    </div>
                                </div>
                                <div className="history-actions">
                                    <button 
                                        className="action-btn rerun-btn" 
                                        onClick={() => onHistoryRerun(item.url)}
                                        title="Re-run audit"
                                    >
                                        <i dangerouslySetInnerHTML={{ __html: feather.icons['refresh-cw'].toSvg() }} />
                                    </button>
                                    
                                    {confirmDeleteId === item.auditId ? (
                                        <button 
                                            className="action-btn confirm-delete-btn" 
                                            onClick={() => {
                                                onHistoryDelete(item.auditId);
                                                setConfirmDeleteId(null);
                                            }}
                                            onMouseLeave={() => setConfirmDeleteId(null)}
                                            title="Confirm Delete"
                                        >
                                            <i dangerouslySetInnerHTML={{ __html: feather.icons['check'].toSvg() }} />
                                        </button>
                                    ) : (
                                        <button 
                                            className="action-btn delete-btn" 
                                            onClick={() => setConfirmDeleteId(item.auditId)}
                                            title="Delete from history"
                                        >
                                            <i dangerouslySetInnerHTML={{ __html: feather.icons['trash-2'].toSvg() }} />
                                        </button>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <div className="empty-history">
                    <i dangerouslySetInnerHTML={{ __html: feather.icons.clock.toSvg() }} />
                    <p>Your recent audits will appear here.</p>
                    <button className="example-audit-button" onClick={() => onHistoryClick('https://www.wikipedia.org')}>
                        Try an example audit
                    </button>
                </div>
            )}
        </aside>
    );
};

export default HistoryPanel;