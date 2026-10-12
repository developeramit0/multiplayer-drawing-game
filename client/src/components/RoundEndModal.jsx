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
        padding: '12px'
      }}
    >
      <div 
        className="card pop-in"
        style={{
          maxWidth: '440px',
          width: '100%',
          padding: 'clamp(18px, 4vw, 26px)',
          textAlign: 'center',
          background: '#ffffff',
          borderRadius: '16px'
        }}
      >
        <div style={{ display: 'inline-flex', padding: '10px', background: '#dcfce7', borderRadius: '50%', marginBottom: '8px' }}>
          <CheckCircle size={32} color="#16a34a" />
        </div>

        <h3 style={{ fontSize: '15px', color: '#64748b', fontWeight: 600, marginBottom: '2px' }}>
          {reason || (allGuessed ? 'All players guessed!' : "Time's Up!")}
        </h3>

        <div style={{ margin: '12px 0' }}>
          <span style={{ fontSize: '13px', color: '#64748b' }}>The secret word was:</span>
          <div style={{ 
            fontFamily: 'Fredoka, cursive',
            fontSize: 'clamp(22px, 5vw, 28px)', 
            fontWeight: 800, 
            color: '#15803d',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            marginTop: '2px'
          }}>
            {word}
          </div>
        </div>

        {drawerPoints > 0 && (
          <div style={{ 
            background: '#eff6ff', 
            padding: '8px 14px', 
            borderRadius: '8px', 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '6px',
            color: '#1d4ed8',
            fontWeight: 700,
            fontSize: '13px',
            marginBottom: '16px'
          }}>
            <Award size={16} />
            <span>{drawerName} earned +{drawerPoints} pts!</span>
          </div>
        )}

        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '6px', 
          color: '#64748b', 
          fontSize: '13px',
          fontWeight: 600,
          marginTop: '8px'
        }}>
          <Clock size={15} />
          <span>Next turn starting in {secondsLeft}s...</span>
        </div>
      </div>
    </div>
  );
}
