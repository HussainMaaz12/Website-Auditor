import React from 'react';
import feather from 'feather-icons';
import './HowItWorks.css';

const HowItWorks = () => {
    return (
        <div className="how-it-works-container">
            <h2 className="how-it-works-title">How it works</h2>
            <div className="steps-wrapper">
                <div className="step-card">
                    <div className="step-number-bg">1</div>
                    <div className="step-icon" dangerouslySetInnerHTML={{ __html: feather.icons.globe.toSvg({ width: 32, height: 32 }) }} />
                    <div className="step-content">
                        <h3>Paste a URL</h3>
                        <p>Enter any public website address you want to check.</p>
                    </div>
                </div>
                
                <div className="step-card">
                    <div className="step-number-bg">2</div>
                    <div className="step-icon" dangerouslySetInnerHTML={{ __html: feather.icons.crosshair.toSvg({ width: 32, height: 32 }) }} />
                    <div className="step-content">
                        <h3>We scan with axe-core</h3>
                        <p>Our headless browser runs an industry-standard accessibility audit.</p>
                    </div>
                </div>
                
                <div className="step-card">
                    <div className="step-number-bg">3</div>
                    <div className="step-icon" dangerouslySetInnerHTML={{ __html: feather.icons['check-square'].toSvg({ width: 32, height: 32 }) }} />
                    <div className="step-content">
                        <h3>Get a detailed report</h3>
                        <p>Review the issues, see affected code, and export to PDF.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HowItWorks;
