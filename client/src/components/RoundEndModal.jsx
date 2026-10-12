import React, { useEffect, useState } from 'react';
import { Award, Clock, CheckCircle } from 'lucide-react';

export default function RoundEndModal({ 
  word, 
  drawerPoints, 
  drawerName, 
  reason, 
  allGuessed, 
  nextTurnIn = 5 
}) {
  const [secondsLeft, setSecondsLeft] = useState(nextTurnIn);

  useEffect(() => {
    setSecondsLeft(nextTurnIn);
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 1 ? prev - 1 : 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [nextTurnIn]);

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
          maxWidth: '480px',
          width: '100%',
          padding: '28px',
          textAlign: 'center',
          background: '#ffffff',
          borderRadius: '16px'
        }}
      >
        <div style={{ display: 'inline-flex', padding: '12px', background: '#dcfce7', borderRadius: '50%', marginBottom: '12px' }}>
          <CheckCircle size={36} color="#16a34a" />
        </div>

        <h3 style={{ fontSize: '18px', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>
          {reason || (allGuessed ? 'All players guessed!' : "Time's Up!")}
        </h3>

        <div style={{ margin: '16px 0' }}>
          <span style={{ fontSize: '14px', color: '#64748b' }}>The secret word was:</span>
          <div style={{ 
            fontFamily: 'Fredoka, cursive',
            fontSize: '32px', 
            fontWeight: 800, 
            color: '#15803d',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            marginTop: '4px'
          }}>
            {word}
          </div>
        </div>

        {drawerPoints > 0 && (
          <div style={{ 
            background: '#eff6ff', 
            padding: '10px 16px', 
            borderRadius: '10px', 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px',
            color: '#1d4ed8',
            fontWeight: 700,
            fontSize: '14px',
            marginBottom: '20px'
          }}>
            <Award size={18} />
            <span>{drawerName} earned +{drawerPoints} drawer bonus pts!</span>
          </div>
        )}

        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '6px', 
          color: '#64748b', 
          fontSize: '14px',
          fontWeight: 600,
          marginTop: '12px'
        }}>
          <Clock size={16} />
          <span>Next turn starting in {secondsLeft}s...</span>
        </div>
      </div>
    </div>
  );
}
