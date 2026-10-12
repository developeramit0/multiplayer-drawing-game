import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Film, RotateCcw, Home, Users, LogOut } from 'lucide-react';
import { sounds } from '../utils/sound.js';
import ReplayTheater from './ReplayTheater.jsx';

const AVATARS = ['🦊', '🐼', '🦁', '🐸', '🐨', '🦄', '🐙', '🐯'];

export default function GameOverModal({ 
  scores = [], 
  replays = [], 
  isHost, 
  onPlayAgain,
  onReturnToLobby,
  onLeaveRoom
}) {
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
        padding: '12px'
      }}
    >
      <div 
        className="card pop-in"
        style={{
          maxWidth: '520px',
          width: '100%',
          padding: 'clamp(20px, 4vw, 30px)',
          textAlign: 'center',
          background: '#ffffff',
          borderRadius: '18px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          maxHeight: '92vh',
          overflowY: 'auto'
        }}
      >
        <div style={{ display: 'inline-flex', padding: '12px', background: '#fef3c7', borderRadius: '50%', marginBottom: '10px' }}>
          <Trophy size={40} color="#d97706" />
        </div>

        <h2 style={{ fontSize: 'clamp(24px, 5vw, 30px)', fontWeight: 800, color: '#1e3a8a', marginBottom: '2px' }}>
          Game Over!
        </h2>
        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '18px' }}>
          Congratulations to our champion!
        </p>

        {/* Responsive Podium */}
        <div 
          className="podium-container"
          style={{ 
            display: 'flex', 
            alignItems: 'flex-end', 
            justifyContent: 'center', 
            gap: 'clamp(6px, 1.5vw, 10px)', 
            marginBottom: '22px',
            height: '140px'
          }}
        >
          {/* 2nd Place */}
          {second && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '24px' }}>{AVATARS[second.avatar || 0]}</div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80px' }}>
                {second.name}
              </span>
              <div style={{
                width: '100%',
                height: '70px',
                background: '#cbd5e1',
                borderRadius: '8px 8px 0 0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#334155',
                fontWeight: 800
              }}>
                <span style={{ fontSize: '16px' }}>2nd</span>
                <span style={{ fontSize: '11px' }}>{second.score} pts</span>
              </div>
            </div>
          )}

          {/* 1st Place */}
          {winner && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1.15, minWidth: 0 }}>
              <div style={{ fontSize: '30px' }}>{AVATARS[winner.avatar || 0]}</div>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#1e3a8a', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100px' }}>
                {winner.name} 👑
              </span>
              <div style={{
                width: '100%',
                height: '95px',
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
                <span style={{ fontSize: '20px' }}>1st</span>
                <span style={{ fontSize: '12px' }}>{winner.score} pts</span>
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {third && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '24px' }}>{AVATARS[third.avatar || 0]}</div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80px' }}>
                {third.name}
              </span>
              <div style={{
                width: '100%',
                height: '52px',
                background: '#fdba74',
                borderRadius: '8px 8px 0 0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#7c2d12',
                fontWeight: 800
              }}>
                <span style={{ fontSize: '16px' }}>3rd</span>
                <span style={{ fontSize: '11px' }}>{third.score} pts</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Watch Replays */}
          <button
            onClick={() => setShowReplayTheater(true)}
            className="btn btn-primary"
            style={{ 
              padding: '12px 16px', 
              fontSize: '14px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
            }}
          >
            <Film size={18} />
            <span>Watch Replay Theater ({replays.length} Drawings)</span>
          </button>

          {/* Host Controls */}
          {isHost && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={onPlayAgain}
                className="btn btn-success"
                style={{ flex: 1, minWidth: '130px', padding: '10px 14px', fontSize: '14px' }}
                title="Start a new game immediately"
              >
                <RotateCcw size={16} />
                <span>Play Again</span>
              </button>

              <button
                onClick={onReturnToLobby}
                className="btn btn-secondary"
                style={{ flex: 1, minWidth: '130px', padding: '10px 14px', fontSize: '14px', background: '#e0e7ff', color: '#3730a3' }}
                title="Back to Room Lobby to change settings or wait for players"
              >
                <Users size={16} />
                <span>Back to Lobby</span>
              </button>
            </div>
          )}

          {/* Home / Leave Room Button for all players */}
          <button
            onClick={onLeaveRoom}
            className="btn btn-secondary"
            style={{ 
              padding: '10px 14px', 
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#dc2626',
              background: '#fee2e2'
            }}
            title="Exit current room and return to home screen"
          >
            <Home size={16} />
            <span>Leave Room & Go Home</span>
          </button>
        </div>
      </div>
    </div>
  );
}
