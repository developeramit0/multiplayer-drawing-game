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
      <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }} className="pop-in">
        <div className="card" style={{ padding: '28px', background: '#ffffff', borderRadius: '16px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#1e3a8a' }}>Game Lobby</h2>
              <p style={{ color: '#64748b', fontSize: '14px' }}>Invite your friends and configure match rules!</p>
            </div>

            {/* Room Code Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ 
                background: '#eff6ff', 
                border: '2px solid #3b82f6', 
                padding: '8px 16px', 
                borderRadius: '10px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '11px', color: '#1d4ed8', fontWeight: 800 }}>ROOM CODE</div>
                <div style={{ fontFamily: 'Fredoka, cursive', fontSize: '22px', fontWeight: 800, color: '#1e3a8a', letterSpacing: '2px' }}>
                  {roomId}
                </div>
              </div>

              <button
                onClick={handleCopyLink}
                className="btn btn-primary"
                style={{ padding: '12px 16px' }}
                title="Copy shareable link"
              >
                {copied ? <Check size={18} /> : <Share2 size={18} />}
                <span>{copied ? 'Link Copied!' : 'Share Link'}</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {/* Players Joined List */}
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontWeight: 800, color: '#1e293b', fontSize: '16px' }}>
                  Players Ready ({players.length})
                </span>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Min: 2 players</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
                {players.map((p) => (
                  <div 
                    key={p.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#ffffff',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '24px' }}>{AVATARS[p.avatar || 0]}</span>
                      <span style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>{p.name}</span>
                    </div>

                    {p.isHost && (
                      <span style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '4px', 
                        background: '#fef3c7', 
                        color: '#b45309', 
                        padding: '4px 8px', 
                        borderRadius: '6px', 
                        fontSize: '12px', 
                        fontWeight: 700 
                      }}>
                        <Crown size={14} /> Host
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Room Settings */}
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Settings size={18} color="#3b82f6" />
                <span style={{ fontWeight: 800, color: '#1e293b', fontSize: '16px' }}>Game Settings</span>
                {!isHost && <span style={{ fontSize: '11px', color: '#64748b', marginLeft: 'auto' }}>Host controlled</span>}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Rounds */}
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
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
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  >
                    <option value={2}>2 Rounds</option>
                    <option value={3}>3 Rounds (Standard)</option>
                    <option value={5}>5 Rounds</option>
                    <option value={8}>8 Rounds (Marathon)</option>
                  </select>
                </div>

                {/* Draw Time */}
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
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
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
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
                  <label style={{ fontSize: '13px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Word List Category
                  </label>
                  <select
                    value={wordPreset}
                    disabled={!isHost}
                    onChange={(e) => {
                      setWordPreset(e.target.value);
                      handleSettingsChange({ wordPreset: e.target.value });
                    }}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                  >
                    {PRESET_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Custom Words */}
                {isHost && (
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                      Custom Words (Comma-separated, optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. taj mahal, cricket, python, samosa"
                      value={customWords}
                      onChange={(e) => {
                        setCustomWords(e.target.value);
                        handleSettingsChange({ customWords: e.target.value });
                      }}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Start Game Action */}
          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
            {isHost ? (
              <button
                onClick={onStartGame}
                className="btn btn-success"
                style={{ padding: '14px 40px', fontSize: '18px', borderRadius: '12px' }}
              >
                <Play size={22} fill="white" />
                <span>Start Game</span>
              </button>
            ) : (
              <div style={{ 
                background: '#eff6ff', 
                color: '#1d4ed8', 
                padding: '12px 24px', 
                borderRadius: '10px', 
                fontWeight: 700,
                fontSize: '15px' 
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
    <div style={{ maxWidth: '480px', margin: '40px auto 0', width: '100%' }} className="pop-in">
      <div className="card" style={{ padding: '32px 28px', background: '#ffffff', borderRadius: '20px' }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'inline-flex', padding: '16px', background: '#eff6ff', borderRadius: '50%', marginBottom: '12px' }}>
            <Palette size={40} color="#3b82f6" />
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#1e3a8a', letterSpacing: '-0.5px' }}>
            Skribbl<span style={{ color: '#3b82f6' }}>.io</span>
          </h1>
          <p style={{ color: '#64748b', fontSize: '15px', marginTop: '4px' }}>
            Real-time Multiplayer Drawing & Guessing
          </p>
        </div>

        {/* Player Profile Setup */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '13px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
            Choose Your Avatar
          </label>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '6px', marginBottom: '16px' }}>
            {AVATARS.map((av, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setAvatar(idx);
                  saveStoredAvatar(idx);
                }}
                style={{
                  fontSize: '24px',
                  background: avatar === idx ? '#eff6ff' : '#f8fafc',
                  border: avatar === idx ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '6px',
                  cursor: 'pointer',
                  transform: avatar === idx ? 'scale(1.15)' : 'scale(1)',
                  transition: 'all 0.15s ease'
                }}
              >
                {av}
              </button>
            ))}
          </div>

          <label style={{ fontSize: '13px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
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
              padding: '12px 16px',
              borderRadius: '10px',
              border: '1.5px solid #cbd5e1',
              fontSize: '16px',
              fontWeight: 600,
              outline: 'none'
            }}
          />
        </div>

        {/* Tab Selector: Create Room vs Join Room */}
        <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '10px', padding: '4px', marginBottom: '20px' }}>
          <button
            onClick={() => setTab('create')}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              background: tab === 'create' ? '#ffffff' : 'transparent',
              color: tab === 'create' ? '#1e3a8a' : '#64748b',
              boxShadow: tab === 'create' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
            }}
          >
            Create Room
          </button>
          <button
            onClick={() => setTab('join')}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              background: tab === 'join' ? '#ffffff' : 'transparent',
              color: tab === 'join' ? '#1e3a8a' : '#64748b',
              boxShadow: tab === 'join' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none'
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
              style={{ width: '100%', padding: '14px', fontSize: '16px' }}
            >
              <PlusCircle size={20} />
              <span>Create Private Room</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="text"
              placeholder="Enter 6-character room code..."
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase().slice(0, 6))}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '10px',
                border: '1.5px solid #cbd5e1',
                fontSize: '16px',
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
              style={{ width: '100%', padding: '14px', fontSize: '16px' }}
            >
              <LogIn size={20} />
              <span>Join Room</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
