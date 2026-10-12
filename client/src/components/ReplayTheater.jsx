import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, FastForward, Film, ArrowLeft, Palette } from 'lucide-react';
import { performFloodFill } from '../utils/floodFill.js';

export default function ReplayTheater({ replays = [], onClose }) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1); // 1x, 2x, 4x
  const [progress, setProgress] = useState(0); // 0 to 1

  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const currentActionIndexRef = useRef(0);
  const lastTimeRef = useRef(0);
  const currentPlayTimeRef = useRef(0);

  const activeReplay = replays[selectedIdx] || null;

  // Clear canvas
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  // Draw a single action
  const renderAction = useCallback((action) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (action.type === 'clear') {
      clearCanvas();
      return;
    }

    if (action.type === 'fill') {
      performFloodFill(
        ctx, 
        action.x * canvas.width, 
        action.y * canvas.height, 
        action.color
      );
      return;
    }

    if (action.type === 'stroke' && action.points && action.points.length > 0) {
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = action.size;
      ctx.strokeStyle = action.isEraser ? '#ffffff' : action.color;

      ctx.beginPath();
      const firstPt = action.points[0];
      ctx.moveTo(firstPt.x * canvas.width, firstPt.y * canvas.height);

      for (let i = 1; i < action.points.length; i++) {
        const pt = action.points[i];
        ctx.lineTo(pt.x * canvas.width, pt.y * canvas.height);
      }
      ctx.stroke();
      ctx.restore();
    }
  }, [clearCanvas]);

  // Reset & prepare replay when selected replay changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = 900;
    canvas.height = 600;

    clearCanvas();
    setIsPlaying(false);
    setProgress(0);
    currentActionIndexRef.current = 0;
    currentPlayTimeRef.current = 0;

    // Draw all actions immediately initially so user sees the completed drawing
    if (activeReplay && activeReplay.actions) {
      for (const act of activeReplay.actions) {
        renderAction(act);
      }
      setProgress(1);
      currentActionIndexRef.current = activeReplay.actions.length;
    }
  }, [selectedIdx, activeReplay, clearCanvas, renderAction]);

  // Frame animation loop
  const animateReplay = useCallback((timestamp) => {
    if (!activeReplay || !activeReplay.actions || activeReplay.actions.length === 0) {
      setIsPlaying(false);
      return;
    }

    if (!lastTimeRef.current) lastTimeRef.current = timestamp;
    const delta = (timestamp - lastTimeRef.current) * speed;
    lastTimeRef.current = timestamp;

    currentPlayTimeRef.current += delta;
    const actions = activeReplay.actions;
    const totalDuration = (activeReplay.duration || 30) * 1000;

    while (
      currentActionIndexRef.current < actions.length &&
      actions[currentActionIndexRef.current].timeOffset <= currentPlayTimeRef.current
    ) {
      renderAction(actions[currentActionIndexRef.current]);
      currentActionIndexRef.current++;
    }

    const currentProg = Math.min(1, currentActionIndexRef.current / actions.length);
    setProgress(currentProg);

    if (currentActionIndexRef.current < actions.length) {
      animationFrameRef.current = requestAnimationFrame(animateReplay);
    } else {
      setIsPlaying(false);
      lastTimeRef.current = 0;
    }
  }, [activeReplay, speed, renderAction]);

  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = 0;
      animationFrameRef.current = requestAnimationFrame(animateReplay);
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, animateReplay]);

  const handlePlayPause = () => {
    if (!activeReplay || !activeReplay.actions) return;

    if (progress >= 1) {
      // Restart from beginning
      clearCanvas();
      currentActionIndexRef.current = 0;
      currentPlayTimeRef.current = 0;
      setProgress(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleRestart = () => {
    clearCanvas();
    currentActionIndexRef.current = 0;
    currentPlayTimeRef.current = 0;
    setProgress(0);
    setIsPlaying(true);
  };

  const handleSpeedToggle = () => {
    setSpeed((prev) => (prev === 1 ? 2 : prev === 2 ? 4 : 1));
  };

  const handleScrub = (e) => {
    if (!activeReplay || !activeReplay.actions) return;
    const targetProgress = parseFloat(e.target.value);
    setIsPlaying(false);

    clearCanvas();
    const targetIndex = Math.floor(targetProgress * activeReplay.actions.length);
    for (let i = 0; i < targetIndex; i++) {
      renderAction(activeReplay.actions[i]);
    }
    currentActionIndexRef.current = targetIndex;
    currentPlayTimeRef.current = activeReplay.actions[targetIndex]?.timeOffset || 0;
    setProgress(targetProgress);
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        backdropFilter: 'blur(8px)',
        zIndex: 60,
        display: 'flex',
        flexDirection: 'column',
        padding: '20px',
        overflow: 'hidden'
      }}
    >
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <button
          onClick={onClose}
          className="btn btn-secondary"
          style={{ padding: '8px 16px', fontSize: '14px' }}
        >
          <ArrowLeft size={18} />
          <span>Back to Game Over</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
          <Film size={24} color="#60a5fa" />
          <h2 style={{ fontSize: '22px', fontWeight: 800 }}>Drawing Replay Theater</h2>
        </div>

        <div style={{ color: '#94a3b8', fontSize: '14px' }}>
          {replays.length} Drawings Saved
        </div>
      </div>

      {/* Main Content: Sidebar + Canvas Player */}
      <div style={{ display: 'flex', gap: '20px', flex: 1, minHeight: 0 }}>
        {/* Drawing Selector Sidebar */}
        <div 
          className="card"
          style={{ 
            width: '280px', 
            display: 'flex', 
            flexDirection: 'column', 
            overflow: 'hidden',
            background: '#ffffff'
          }}
        >
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', fontWeight: 700, fontSize: '15px' }}>
            Match Drawings
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {replays.length === 0 ? (
              <div style={{ color: '#64748b', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
                No drawings recorded.
              </div>
            ) : (
              replays.map((rep, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedIdx(idx)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: selectedIdx === idx ? '#eff6ff' : '#f8fafc',
                    border: selectedIdx === idx ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, fontSize: '15px', color: '#1e3a8a', textTransform: 'capitalize' }}>
                      {rep.word}
                    </span>
                    <span style={{ fontSize: '11px', background: '#dbeafe', color: '#1d4ed8', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                      R{rep.round}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                    Drawn by <strong>{rep.drawer.name}</strong> • {rep.actions?.length || 0} strokes
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Canvas Player Box */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div 
            className="card"
            style={{ 
              flex: 1, 
              background: '#ffffff', 
              position: 'relative', 
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <canvas 
              ref={canvasRef} 
              style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} 
            />

            {/* Word Overlay Tag */}
            {activeReplay && (
              <div style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                background: 'rgba(15, 23, 42, 0.8)',
                color: 'white',
                padding: '6px 14px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '14px',
                backdropFilter: 'blur(4px)'
              }}>
                Drawing: <strong style={{ color: '#60a5fa' }}>{activeReplay.word.toUpperCase()}</strong> by {activeReplay.drawer.name}
              </div>
            )}
          </div>

          {/* Player Controls Bar */}
          <div 
            className="card"
            style={{ 
              padding: '12px 20px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '16px',
              background: '#ffffff'
            }}
          >
            <button
              onClick={handlePlayPause}
              className="btn btn-primary"
              style={{ padding: '8px 16px', fontSize: '14px' }}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>

            <button
              onClick={handleRestart}
              className="btn btn-secondary"
              style={{ padding: '8px 12px' }}
              title="Replay from start"
            >
              <RotateCcw size={16} />
            </button>

            {/* Scrubber slider */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="range"
                min="0"
                max="1"
                step="0.005"
                value={progress}
                onChange={handleScrub}
                style={{ width: '100%', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748b', minWidth: '45px' }}>
                {Math.round(progress * 100)}%
              </span>
            </div>

            {/* Speed toggle */}
            <button
              onClick={handleSpeedToggle}
              className="btn btn-secondary"
              style={{ padding: '8px 14px', fontSize: '13px', fontWeight: 800 }}
              title="Playback speed"
            >
              <FastForward size={16} />
              <span>{speed}x</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
