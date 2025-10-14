import React from 'react';
import './HistoryPanel.css';
import feather from 'feather-icons';

const HistoryPanel = ({ history, onHistoryClick }) => {
    return (
        <aside className="history-panel">
            <h2>Recent Audits</h2>
            {history.length > 0 ? (
                <ul className="history-list">
                    {history.map((item, index) => (
                        <li key={index} className="history-item" onClick={() => onHistoryClick(item.url)}>
                            <span className="history-url">{item.url}</span>
                            <span className="history-violations">{item.violations} violations</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="empty-history">
                    <i dangerouslySetInnerHTML={{ __html: feather.icons.clock.toSvg() }} />
                    <p>Your recent audits will appear here.</p>
                </div>
            )}
        </aside>
    );
};

export default HistoryPanel;