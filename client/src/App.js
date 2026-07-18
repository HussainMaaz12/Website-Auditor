import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AuditorPage from './components/AuditorPage';
import './App.css';

const StatsPagePlaceholder = () => (
  <div style={{ color: 'white', textAlign: 'center', marginTop: '100px' }}>
    <h2>Platform Stats</h2>
    <p>Stats dashboard coming soon.</p>
  </div>
);

function App() {
  return (
    <Router>
      <div className="app-wrapper">
        <Routes>
          <Route path="/" element={<AuditorPage />} />
          <Route path="/audit/:id" element={<AuditorPage />} />
          <Route path="/stats" element={<StatsPagePlaceholder />} />
        </Routes>
        <div className="wave-container">
          <div className="wave wave1"></div>
          <div className="wave wave2"></div>
          <div className="wave wave3"></div>
        </div>
      </div>
    </Router>
  );
}

export default App;
