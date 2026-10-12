import React from 'react';
import { Sparkles, Clock } from 'lucide-react';

export default function WordModal({ words = [], onSelect, timeout = 15 }) {
  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: '12px'
      }}
    >
      <div 
        className="card pop-in"
        style={{
          maxWidth: '460px',
          width: '100%',
          padding: 'clamp(18px, 4vw, 28px)',
          textAlign: 'center',
          background: '#ffffff',
          borderRadius: '16px'
        }}
      >
        <div style={{ display: 'inline-flex', padding: '10px', background: '#eff6ff', borderRadius: '50%', marginBottom: '8px' }}>
          <Sparkles size={28} color="#3b82f6" />
        </div>

        <h2 style={{ fontSize: 'clamp(20px, 4.5vw, 24px)', fontWeight: 800, color: '#1e3a8a', marginBottom: '6px' }}>
          It's Your Turn to Draw!
        </h2>
        <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '16px' }}>
          Choose one secret word before the timer runs out:
        </p>

        {/* Word Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
          {words.map((word, index) => (
            <button
              key={index}
              onClick={() => onSelect(word)}
              className="btn btn-primary"
              style={{
                padding: '12px 16px',
                fontSize: 'clamp(16px, 4vw, 19px)',
                fontWeight: 700,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                borderRadius: '10px',
                background: index === 0 ? '#3b82f6' : index === 1 ? '#06b6d4' : '#8b5cf6',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
              }}
            >
              {word}
            </button>
          ))}
        </div>

        <div style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '6px', 
          color: '#f59e0b', 
          fontWeight: 700, 
          fontSize: '13px',
          background: '#fef3c7',
          padding: '5px 12px',
          borderRadius: '20px'
        }}>
          <Clock size={15} />
          <span>Auto-selecting in {timeout}s...</span>
        </div>
      </div>
    </div>
  );
}
