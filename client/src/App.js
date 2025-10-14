import React from 'react';
import AuditorPage from './components/AuditorPage';
import './App.css';

function App() {
  return (
   
    <div className="app-wrapper">
      <AuditorPage />
      <div className="wave-container">
        <div className="wave wave1"></div>
        <div className="wave wave2"></div>
        <div className="wave wave3"></div>
      </div>
    </div>
  );
}

export default App;

