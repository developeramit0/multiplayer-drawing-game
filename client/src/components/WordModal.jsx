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
        padding: '16px'
      }}
    >
      <div 
        className="card pop-in"
        style={{
          maxWidth: '520px',
          width: '100%',
          padding: '28px',
          textAlign: 'center',
          background: '#ffffff',
          borderRadius: '16px'
        }}
      >
        <div style={{ display: 'inline-flex', padding: '12px', background: '#eff6ff', borderRadius: '50%', marginBottom: '12px' }}>
          <Sparkles size={32} color="#3b82f6" />
        </div>

        <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#1e3a8a', marginBottom: '8px' }}>
          It's Your Turn to Draw!
        </h2>
        <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '20px' }}>
          Choose one secret word from the list below before the timer runs out:
        </p>

        {/* Word Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          {words.map((word, index) => (
            <button
              key={index}
              onClick={() => onSelect(word)}
              className="btn btn-primary"
              style={{
                padding: '16px 20px',
                fontSize: '20px',
                fontWeight: 700,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                borderRadius: '12px',
                background: index === 0 ? '#3b82f6' : index === 1 ? '#06b6d4' : '#8b5cf6',
                boxShadow: '0 4px 14px rgba(0,0,0,0.1)'
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
          fontSize: '14px',
          background: '#fef3c7',
          padding: '6px 14px',
          borderRadius: '20px'
        }}>
          <Clock size={16} />
          <span>Auto-selecting in {timeout}s...</span>
        </div>
      </div>
    </div>
  );
}
