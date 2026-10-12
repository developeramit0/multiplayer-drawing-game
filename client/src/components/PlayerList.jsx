import React from 'react';
import { Crown, Pencil, CheckCircle2, WifiOff } from 'lucide-react';

const AVATARS = ['🦊', '🐼', '🦁', '🐸', '🐨', '🦄', '🐙', '🐯'];

export default function PlayerList({ 
  players = [], 
  currentDrawerId, 
  myPlayerId, 
  guessedPlayerIds = [] 
}) {
  return (
    <div 
      className="card"
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'hidden',
        height: '100%',
        minHeight: '380px'
      }}
    >
      <div style={{ 
        padding: '12px 16px', 
        borderBottom: '1px solid #e2e8f0', 
        fontWeight: 700, 
        fontSize: '15px',
        color: '#1e293b',
        background: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <span>Leaderboard</span>
        <span style={{ fontSize: '12px', color: '#64748b' }}>{players.length} Players</span>
      </div>

      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        padding: '8px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '6px' 
      }}>
        {players.map((p, index) => {
          const isDrawer = p.id === currentDrawerId;
          const isMe = p.id === myPlayerId;
          const hasGuessed = guessedPlayerIds.includes(p.id);

          return (
            <div 
              key={p.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: '8px',
                background: isMe ? '#eff6ff' : hasGuessed ? '#f0fdf4' : '#ffffff',
                border: isMe 
                  ? '1.5px solid #3b82f6' 
                  : hasGuessed 
                    ? '1px solid #86efac' 
                    : '1px solid #f1f5f9',
                opacity: p.isDisconnected ? 0.6 : 1,
                transition: 'all 0.2s ease'
              }}
            >
              {/* Left: Rank, Avatar, Name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ 
                  fontWeight: 800, 
                  fontSize: '13px', 
                  color: index === 0 ? '#eab308' : index === 1 ? '#94a3b8' : index === 2 ? '#b45309' : '#64748b',
                  minWidth: '18px'
                }}>
                  #{index + 1}
                </span>

                <div style={{ fontSize: '22px', lineHeight: 1 }}>
                  {AVATARS[p.avatar || 0] || '🦊'}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ 
                      fontWeight: 700, 
                      fontSize: '14px', 
                      color: '#0f172a',
                      maxWidth: '110px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {p.name} {isMe && '(You)'}
                    </span>

                    {p.isHost && (
                      <Crown size={14} color="#f59e0b" fill="#f59e0b" title="Room Host" />
                    )}

                    {isDrawer && (
                      <Pencil size={14} color="#3b82f6" title="Currently Drawing" />
                    )}

                    {hasGuessed && (
                      <CheckCircle2 size={14} color="#16a34a" title="Guessed correctly" />
                    )}
                  </div>

                  {p.isDisconnected && (
                    <span style={{ 
                      fontSize: '10px', 
                      color: '#ef4444', 
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px'
                    }}>
                      <WifiOff size={10} /> Disconnected (30s)
                    </span>
                  )}
                </div>
              </div>

              {/* Right: Score */}
              <div style={{ textAlign: 'right' }}>
                <span style={{ 
                  fontFamily: 'Fredoka, cursive',
                  fontWeight: 700, 
                  fontSize: '15px', 
                  color: '#1e3a8a' 
                }}>
                  {p.score || 0} pts
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
