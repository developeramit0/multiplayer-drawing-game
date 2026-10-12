import React, { useState, useEffect } from 'react';
import { 
  Palette, 
  Users, 
  Play, 
  Copy, 
  Check, 
  Settings, 
  PlusCircle, 
  LogIn, 
  Share2,
  Crown
} from 'lucide-react';
import { socket, saveStoredPlayerName, saveStoredAvatar } from '../socket.js';

const AVATARS = ['🦊', '🐼', '🦁', '🐸', '🐨', '🦄', '🐙', '🐯'];

const PRESET_OPTIONS = [
  { id: 'classic', label: 'Classic (Balanced)' },
  { id: 'animals', label: 'Animals & Wildlife' },
  { id: 'food', label: 'Food & Beverages' },
  { id: 'objects', label: 'Household Objects' },
  { id: 'tech', label: 'Computers & Technology' }
];

export default function Lobby({ 
  isInRoom, 
  roomId, 
  isHost, 
  players = [], 
  settings, 
  onCreateRoom, 
  onJoinRoom, 
  onStartGame, 
  onUpdateSettings,
  playerName,
  setPlayerName,
  avatar,
  setAvatar
}) {
  const [tab, setTab] = useState('join'); // 'create' | 'join'
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [copied, setCopied] = useState(false);

  // Host settings state
  const [rounds, setRounds] = useState(settings?.rounds || 3);
  const [drawTime, setDrawTime] = useState(settings?.drawTime || 60);
  const [wordPreset, setWordPreset] = useState(settings?.wordPreset || 'classic');
  const [customWords, setCustomWords] = useState(settings?.customWords || '');

  // Detect URL room query param ?room=XYZ
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setRoomCodeInput(roomParam.toUpperCase());
      setTab('join');
    } else {
      setTab('create');
    }
  }, []);

  // Sync settings when updated from server
  useEffect(() => {
    if (settings) {
      if (settings.rounds) setRounds(settings.rounds);
      if (settings.drawTime) setDrawTime(settings.drawTime);
      if (settings.wordPreset) setWordPreset(settings.wordPreset);
      if (settings.customWords !== undefined) setCustomWords(settings.customWords);
    }
  }, [settings]);

  const handleCopyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSettingsChange = (newSettings) => {
    if (!isHost) return;
    onUpdateSettings({
      rounds,
      drawTime,
      wordPreset,
      customWords,
      ...newSettings
    });
  };

  // If already inside a created room lobby
  if (isInRoom) {
    return (
      <div style={{ maxWidth: '850px', margin: '0 auto', width: '100%' }} className="pop-in">
        <div className="card" style={{ padding: 'clamp(16px, 3vw, 28px)', background: '#ffffff', borderRadius: '16px' }}>
          {/* Header */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            borderBottom: '1px solid #e2e8f0', 
            paddingBottom: '16px', 
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#1e3a8a' }}>Game Lobby</h2>
              <p style={{ color: '#64748b', fontSize: '13px' }}>Invite your friends and configure match rules!</p>
            </div>

            {/* Room Code Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ 
                background: '#eff6ff', 
                border: '2px solid #3b82f6', 
                padding: '6px 14px', 
                borderRadius: '10px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '10px', color: '#1d4ed8', fontWeight: 800 }}>ROOM CODE</div>
                <div style={{ fontFamily: 'Fredoka, cursive', fontSize: '20px', fontWeight: 800, color: '#1e3a8a', letterSpacing: '2px' }}>
                  {roomId}
                </div>
              </div>

              <button
                onClick={handleCopyLink}
                className="btn btn-primary"
                style={{ padding: '10px 14px' }}
                title="Copy shareable link"
              >
                {copied ? <Check size={16} /> : <Share2 size={16} />}
                <span>{copied ? 'Copied!' : 'Share Link'}</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            {/* Players Joined List */}
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontWeight: 800, color: '#1e293b', fontSize: '15px' }}>
                  Players Ready ({players.length})
                </span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Min: 2 players</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '220px', overflowY: 'auto' }}>
                {players.map((p) => (
                  <div 
                    key={p.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#ffffff',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '20px' }}>{AVATARS[p.avatar || 0]}</span>
                      <span style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>{p.name}</span>
                    </div>

                    {p.isHost && (
                      <span style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '3px', 
                        background: '#fef3c7', 
                        color: '#b45309', 
                        padding: '3px 6px', 
                        borderRadius: '6px', 
                        fontSize: '11px', 
                        fontWeight: 700 
                      }}>
                        <Crown size={12} /> Host
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Room Settings */}
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                <Settings size={16} color="#3b82f6" />
                <span style={{ fontWeight: 800, color: '#1e293b', fontSize: '15px' }}>Game Settings</span>
                {!isHost && <span style={{ fontSize: '11px', color: '#64748b', marginLeft: 'auto' }}>Host controlled</span>}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Rounds */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '3px' }}>
                    Number of Rounds
                  </label>
                  <select
                    value={rounds}
                    disabled={!isHost}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setRounds(val);
                      handleSettingsChange({ rounds: val });
                    }}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  >
                    <option value={2}>2 Rounds</option>
                    <option value={3}>3 Rounds (Standard)</option>
                    <option value={5}>5 Rounds</option>
                    <option value={8}>8 Rounds (Marathon)</option>
                  </select>
                </div>

                {/* Draw Time */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '3px' }}>
                    Draw Time (Seconds)
                  </label>
                  <select
                    value={drawTime}
                    disabled={!isHost}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setDrawTime(val);
                      handleSettingsChange({ drawTime: val });
                    }}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  >
                    <option value={30}>30s (Rapid)</option>
                    <option value={45}>45s</option>
                    <option value={60}>60s (Recommended)</option>
                    <option value={80}>80s (Chill)</option>
                    <option value={100}>100s</option>
                  </select>
                </div>

                {/* Word List Preset */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '3px' }}>
                    Word List Category
                  </label>
                  <select
                    value={wordPreset}
                    disabled={!isHost}
                    onChange={(e) => {
                      setWordPreset(e.target.value);
                      handleSettingsChange({ wordPreset: e.target.value });
                    }}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                  >
                    {PRESET_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Custom Words */}
                {isHost && (
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '3px' }}>
                      Custom Words (Comma-separated, optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. taj mahal, cricket, python"
                      value={customWords}
                      onChange={(e) => {
                        setCustomWords(e.target.value);
                        handleSettingsChange({ customWords: e.target.value });
                      }}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Start Game Action */}
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
            {isHost ? (
              <button
                onClick={onStartGame}
                className="btn btn-success"
                style={{ padding: '12px 36px', fontSize: '16px', borderRadius: '10px' }}
              >
                <Play size={20} fill="white" />
                <span>Start Game</span>
              </button>
            ) : (
              <div style={{ 
                background: '#eff6ff', 
                color: '#1d4ed8', 
                padding: '10px 20px', 
                borderRadius: '8px', 
                fontWeight: 700,
                fontSize: '14px',
                textAlign: 'center' 
              }}>
                Waiting for the host to start the game...
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Not in a room: Create / Join landing screen
  return (
    <div style={{ maxWidth: '440px', margin: '20px auto 0', width: '100%' }} className="pop-in">
      <div className="card" style={{ padding: 'clamp(20px, 4vw, 30px)', background: '#ffffff', borderRadius: '16px' }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'inline-flex', padding: '12px', background: '#eff6ff', borderRadius: '50%', marginBottom: '10px' }}>
            <Palette size={34} color="#3b82f6" />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1e3a8a', letterSpacing: '-0.5px' }}>
            Doodle<span style={{ color: '#3b82f6' }}>Clash</span>
          </h1>
          <p style={{ color: '#64748b', fontSize: '13px', marginTop: '2px' }}>
            Real-time Multiplayer Drawing & Guessing
          </p>
        </div>

        {/* Player Profile Setup */}
        <div style={{ marginBottom: '18px' }}>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
            Choose Your Avatar
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px', marginBottom: '14px' }}>
            {AVATARS.map((av, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setAvatar(idx);
                  saveStoredAvatar(idx);
                }}
                style={{
                  fontSize: '22px',
                  background: avatar === idx ? '#eff6ff' : '#f8fafc',
                  border: avatar === idx ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '5px',
                  cursor: 'pointer',
                  transform: avatar === idx ? 'scale(1.15)' : 'scale(1)',
                  transition: 'all 0.15s ease'
                }}
              >
                {av}
              </button>
            ))}
          </div>

          <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '5px' }}>
            Your Nickname
          </label>
          <input
            type="text"
            placeholder="Enter nickname..."
            value={playerName}
            onChange={(e) => {
              const val = e.target.value.slice(0, 20);
              setPlayerName(val);
              saveStoredPlayerName(val);
            }}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1.5px solid #cbd5e1',
              fontSize: '15px',
              fontWeight: 600,
              outline: 'none'
            }}
          />
        </div>

        {/* Tab Selector: Create Room vs Join Room */}
        <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: '3px', marginBottom: '16px' }}>
          <button
            onClick={() => setTab('create')}
            style={{
              flex: 1,
              padding: '9px',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              background: tab === 'create' ? '#ffffff' : 'transparent',
              color: tab === 'create' ? '#1e3a8a' : '#64748b',
              boxShadow: tab === 'create' ? '0 2px 5px rgba(0,0,0,0.06)' : 'none'
            }}
          >
            Create Room
          </button>
          <button
            onClick={() => setTab('join')}
            style={{
              flex: 1,
              padding: '9px',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              background: tab === 'join' ? '#ffffff' : 'transparent',
              color: tab === 'join' ? '#1e3a8a' : '#64748b',
              boxShadow: tab === 'join' ? '0 2px 5px rgba(0,0,0,0.06)' : 'none'
            }}
          >
            Join Room
          </button>
        </div>

        {tab === 'create' ? (
          <div>
            <button
              onClick={() => onCreateRoom({ rounds, drawTime, wordPreset, customWords })}
              disabled={!playerName.trim()}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '15px' }}
            >
              <PlusCircle size={18} />
              <span>Create Private Room</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input
              type="text"
              placeholder="Enter 6-character room code..."
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase().slice(0, 6))}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1.5px solid #cbd5e1',
                fontSize: '15px',
                fontWeight: 700,
                textAlign: 'center',
                letterSpacing: '2px',
                textTransform: 'uppercase'
              }}
            />
            <button
              onClick={() => onJoinRoom(roomCodeInput)}
              disabled={!playerName.trim() || !roomCodeInput.trim()}
              className="btn btn-success"
              style={{ width: '100%', padding: '12px', fontSize: '15px' }}
            >
              <LogIn size={18} />
              <span>Join Room</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
