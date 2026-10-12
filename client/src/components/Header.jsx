import React, { useState } from 'react';
import { Volume2, VolumeX, Copy, Check, Share2, Clock, Palette } from 'lucide-react';
import { sounds } from '../utils/sound.js';

export default function Header({ 
  round, 
  maxRounds, 
  timeLeft, 
  status, 
  isDrawer, 
  word, 
  blanks, 
  roomId, 
  drawerName 
}) {
  const [copied, setCopied] = useState(false);
  const [muted, setMuted] = useState(sounds.isMuted());

  const handleCopyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleToggleSound = () => {
    const nextMuted = sounds.toggleMute();
    setMuted(nextMuted);
  };

  // Timer alert colors: green when > 20s, yellow 10-20s, red <= 10s
  const timerColor = timeLeft <= 10 ? '#ef4444' : timeLeft <= 20 ? '#f59e0b' : '#10b981';

  return (
    <header className="card" style={{ padding: '12px 20px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
      {/* Brand & Round */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Palette size={28} color="#3b82f6" />
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1e3a8a', letterSpacing: '-0.5px' }}>
            Skribbl<span style={{ color: '#3b82f6' }}>.io</span>
          </h1>
        </div>

        {status !== 'LOBBY' && (
          <div style={{ background: '#eff6ff', padding: '6px 14px', borderRadius: '20px', fontWeight: 700, fontSize: '14px', color: '#1e40af', border: '1px solid #bfdbfe' }}>
            Round {round} / {maxRounds}
          </div>
        )}
      </div>

      {/* Center: Timer & Word / Blanks */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1, justifyContent: 'center' }}>
        {status === 'DRAWING' && (
          <>
            {/* Timer Badge */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              background: '#f8fafc', 
              border: `2px solid ${timerColor}`, 
              borderRadius: '24px', 
              padding: '6px 16px',
              fontWeight: 800,
              fontSize: '18px',
              color: timerColor,
              boxShadow: timeLeft <= 10 ? '0 0 10px rgba(239, 68, 68, 0.4)' : 'none',
              transition: 'all 0.2s ease'
            }}>
              <Clock size={20} color={timerColor} />
              <span>{timeLeft}s</span>
            </div>

            {/* Word or Blanks */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ 
                fontFamily: 'Fredoka, cursive',
                fontSize: '26px', 
                fontWeight: 700, 
                letterSpacing: isDrawer ? '1px' : '6px',
                color: isDrawer ? '#15803d' : '#0f172a',
                background: isDrawer ? '#f0fdf4' : '#f8fafc',
                padding: '4px 18px',
                borderRadius: '8px',
                border: isDrawer ? '1px solid #bbf7d0' : '1px solid #e2e8f0'
              }}>
                {isDrawer ? (
                  <span>Word: <strong>{word}</strong></span>
                ) : (
                  <span>{blanks || '_ _ _ _'}</span>
                )}
              </div>
              <span style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', fontWeight: 600 }}>
                {isDrawer ? 'You are drawing! Make it clear!' : `${drawerName ? `${drawerName} is drawing` : 'Guess the word!'}`}
              </span>
            </div>
          </>
        )}

        {status === 'CHOOSING_WORD' && (
          <div style={{ background: '#fef3c7', padding: '8px 18px', borderRadius: '20px', color: '#b45309', fontWeight: 700, fontSize: '15px' }}>
            {isDrawer ? 'Pick a word to draw!' : `${drawerName || 'Drawer'} is choosing a word... (${timeLeft}s)`}
          </div>
        )}
      </div>

      {/* Right: Room ID, Copy Link, Sound Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={handleCopyLink}
          className="btn btn-secondary"
          style={{ padding: '6px 12px', fontSize: '13px' }}
          title="Share invite link"
        >
          {copied ? <Check size={16} color="#10b981" /> : <Share2 size={16} />}
          <span>{copied ? 'Copied Link!' : `Room: ${roomId}`}</span>
        </button>

        <button
          onClick={handleToggleSound}
          className="btn btn-secondary"
          style={{ padding: '8px', borderRadius: '50%' }}
          title={muted ? 'Unmute sounds' : 'Mute sounds'}
        >
          {muted ? <VolumeX size={18} color="#ef4444" /> : <Volume2 size={18} color="#3b82f6" />}
        </button>
      </div>
    </header>
  );
}
