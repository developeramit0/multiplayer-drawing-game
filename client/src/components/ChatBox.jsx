import React, { useState, useEffect, useRef } from 'react';
import { Send, AlertTriangle, CheckCircle, Sparkles } from 'lucide-react';
import { socket } from '../socket.js';
import { sounds } from '../utils/sound.js';

export default function ChatBox({ messages, isDrawer, hasGuessed }) {
  const [inputText, setInputText] = useState('');
  const chatBottomRef = useRef(null);

  // Auto-scroll on new message
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;

    socket.emit('chatMessage', { text: trimmed });
    setInputText('');
  };

  const placeholderText = isDrawer
    ? "You're drawing, you can't guess!"
    : hasGuessed
      ? "You guessed it! Chat with others who know..."
      : "Type your guess here...";

  return (
    <div 
      className="card"
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%', 
        minHeight: '380px',
        overflow: 'hidden'
      }}
    >
      {/* Chat Header */}
      <div style={{ 
        padding: '12px 16px', 
        borderBottom: '1px solid #e2e8f0', 
        fontWeight: 700, 
        fontSize: '15px',
        color: '#1e293b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#f8fafc'
      }}>
        <span>Room Chat & Guesses</span>
        {hasGuessed && (
          <span style={{ 
            fontSize: '12px', 
            background: '#dcfce7', 
            color: '#15803d', 
            padding: '2px 8px', 
            borderRadius: '12px',
            fontWeight: 800
          }}>
            Word Guessed ✓
          </span>
        )}
      </div>

      {/* Message List */}
      <div 
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '12px 14px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '8px' 
        }}
      >
        {messages.map((msg) => {
          // 1. Correct guess banner
          if (msg.isCorrectGuess) {
            return (
              <div 
                key={msg.id}
                style={{
                  background: '#dcfce7',
                  border: '1px solid #86efac',
                  color: '#166534',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Sparkles size={16} color="#16a34a" />
                <span><strong>{msg.sender}</strong> guessed the word! (+{msg.points} pts)</span>
              </div>
            );
          }

          // 2. Near miss private alert
          if (msg.isNearMiss) {
            return (
              <div 
                key={msg.id}
                style={{
                  background: '#fef3c7',
                  border: '1px solid #fde68a',
                  color: '#92400e',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <AlertTriangle size={16} color="#d97706" />
                <span>{msg.text}</span>
              </div>
            );
          }

          // 3. System alert / warning
          if (msg.isSystem) {
            return (
              <div 
                key={msg.id}
                style={{
                  fontSize: '12px',
                  color: msg.isWarning ? '#dc2626' : '#64748b',
                  fontStyle: 'italic',
                  textAlign: 'center',
                  padding: '3px 8px',
                  background: msg.isWarning ? '#fef2f2' : '#f1f5f9',
                  borderRadius: '6px'
                }}
              >
                {msg.text}
              </div>
            );
          }

          // 4. Guessed pool chat
          if (msg.isGuessedChat) {
            return (
              <div 
                key={msg.id}
                style={{
                  fontSize: '13px',
                  background: '#f0fdf4',
                  borderLeft: '3px solid #22c55e',
                  padding: '4px 8px',
                  borderRadius: '0 6px 6px 0'
                }}
              >
                <strong style={{ color: '#15803d' }}>{msg.sender}: </strong>
                <span style={{ color: '#14532d' }}>{msg.text}</span>
              </div>
            );
          }

          // 5. Normal chat message
          return (
            <div key={msg.id} style={{ fontSize: '14px', wordBreak: 'break-word', lineHeight: '1.4' }}>
              <strong style={{ color: '#3b82f6' }}>{msg.sender}: </strong>
              <span style={{ color: '#334155' }}>{msg.text}</span>
            </div>
          );
        })}
        <div ref={chatBottomRef} />
      </div>

      {/* Chat Input */}
      <form 
        onSubmit={handleSubmit}
        style={{ 
          padding: '10px 12px', 
          borderTop: '1px solid #e2e8f0', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          background: '#ffffff'
        }}
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value.slice(0, 100))}
          placeholder={placeholderText}
          disabled={isDrawer}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '8px',
            border: '1px solid #cbd5e1',
            outline: 'none',
            fontSize: '14px',
            background: isDrawer ? '#f1f5f9' : '#ffffff'
          }}
        />

        <button
          type="submit"
          disabled={isDrawer || !inputText.trim()}
          className="btn btn-primary"
          style={{ padding: '10px 14px', borderRadius: '8px' }}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
