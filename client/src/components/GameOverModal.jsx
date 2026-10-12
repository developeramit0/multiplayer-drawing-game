import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Film, RotateCcw, Medal } from 'lucide-react';
import { sounds } from '../utils/sound.js';
import ReplayTheater from './ReplayTheater.jsx';

const AVATARS = ['🦊', '🐼', '🦁', '🐸', '🐨', '🦄', '🐙', '🐯'];

export default function GameOverModal({ scores = [], replays = [], isHost, onPlayAgain }) {
  const [showReplayTheater, setShowReplayTheater] = useState(false);

  useEffect(() => {
    // Play fanfare sound
    sounds.playWin();

    // Launch celebratory confetti burst
    const end = Date.now() + 3000;
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899'];

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, []);

  const winner = scores[0];
  const second = scores[1];
  const third = scores[2];

  if (showReplayTheater) {
    return (
      <ReplayTheater 
        replays={replays} 
        onClose={() => setShowReplayTheater(false)} 
      />
    );
  }

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(6px)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div 
        className="card pop-in"
        style={{
          maxWidth: '580px',
          width: '100%',
          padding: '32px 28px',
          textAlign: 'center',
          background: '#ffffff',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
      >
        <div style={{ display: 'inline-flex', padding: '16px', background: '#fef3c7', borderRadius: '50%', marginBottom: '16px' }}>
          <Trophy size={48} color="#d97706" />
        </div>

        <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#1e3a8a', marginBottom: '4px' }}>
          Game Over!
        </h2>
        <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '24px' }}>
          Congratulations to our champion!
        </p>

        {/* Podium */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'flex-end', 
          justifyContent: 'center', 
          gap: '12px', 
          marginBottom: '28px',
          height: '160px'
        }}>
          {/* 2nd Place */}
          {second && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <div style={{ fontSize: '28px' }}>{AVATARS[second.avatar || 0]}</div>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569', marginTop: '2px' }}>
                {second.name}
              </span>
              <div style={{
                width: '100%',
                height: '80px',
                background: '#cbd5e1',
                borderRadius: '8px 8px 0 0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#334155',
                fontWeight: 800
              }}>
                <span style={{ fontSize: '18px' }}>2nd</span>
                <span style={{ fontSize: '12px' }}>{second.score} pts</span>
              </div>
            </div>
          )}

          {/* 1st Place */}
          {winner && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1.2 }}>
              <div style={{ fontSize: '36px' }}>{AVATARS[winner.avatar || 0]}</div>
              <span style={{ fontSize: '15px', fontWeight: 800, color: '#1e3a8a', marginTop: '2px' }}>
                {winner.name} 👑
              </span>
              <div style={{
                width: '100%',
                height: '110px',
                background: 'linear-gradient(180deg, #f59e0b 0%, #d97706 100%)',
                borderRadius: '10px 10px 0 0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 800,
                boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)'
              }}>
                <span style={{ fontSize: '24px' }}>1st</span>
                <span style={{ fontSize: '14px' }}>{winner.score} pts</span>
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {third && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <div style={{ fontSize: '28px' }}>{AVATARS[third.avatar || 0]}</div>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569', marginTop: '2px' }}>
                {third.name}
              </span>
              <div style={{
                width: '100%',
                height: '60px',
                background: '#fdba74',
                borderRadius: '8px 8px 0 0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#7c2d12',
                fontWeight: 800
              }}>
                <span style={{ fontSize: '18px' }}>3rd</span>
                <span style={{ fontSize: '12px' }}>{third.score} pts</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            onClick={() => setShowReplayTheater(true)}
            className="btn btn-primary"
            style={{ 
              padding: '14px 20px', 
              fontSize: '16px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
            }}
          >
            <Film size={20} />
            <span>Watch Stroke-by-Stroke Replay Theater ({replays.length} Drawings)</span>
          </button>

          {isHost && (
            <button
              onClick={onPlayAgain}
              className="btn btn-success"
              style={{ padding: '12px 20px', fontSize: '15px' }}
            >
              <RotateCcw size={18} />
              <span>Play Again</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
