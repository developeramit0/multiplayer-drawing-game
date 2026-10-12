import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Pencil, 
  PaintBucket, 
  Eraser, 
  RotateCcw, 
  Trash2, 
  Minus, 
  CircleDot 
} from 'lucide-react';
import { socket } from '../socket.js';
import { performFloodFill } from '../utils/floodFill.js';

const COLOR_PALETTE = [
  '#000000', '#ffffff', '#64748b', '#ef4444', 
  '#f97316', '#f59e0b', '#eab308', '#22c55e', 
  '#10b981', '#06b6d4', '#3b82f6', '#6366f1', 
  '#a855f7', '#ec4899', '#78350f', '#94a3b8'
];

const BRUSH_SIZES = [
  { label: 'S', size: 3 },
  { label: 'M', size: 7 },
  { label: 'L', size: 14 },
  { label: 'XL', size: 26 }
];

export default function Canvas({ 
  isDrawer, 
  initialHistory = [], 
  roomId 
}) {
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const currentPointsRef = useRef([]);
  const strokeHistoryRef = useRef([]);

  // Drawing tools state
  const [tool, setTool] = useState('pen'); // 'pen' | 'eraser' | 'fill'
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(7);

  // Clear canvas helper
  const clearLocalCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  // Execute a single action on canvas
  const renderAction = useCallback((action) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (action.type === 'clear') {
      clearLocalCanvas();
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
  }, [clearLocalCanvas]);

  // Replay entire history (for mid-round join or undo)
  const replayHistory = useCallback((actions) => {
    clearLocalCanvas();
    strokeHistoryRef.current = [...actions];
    for (const action of actions) {
      renderAction(action);
    }
  }, [clearLocalCanvas, renderAction]);

  // Initialize canvas resolution & replay initial history
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Fixed internal resolution for consistent pixel coordinate sync
    canvas.width = 900;
    canvas.height = 600;

    clearLocalCanvas();

    if (initialHistory && initialHistory.length > 0) {
      replayHistory(initialHistory);
    }
  }, [clearLocalCanvas, replayHistory, initialHistory]);

  // Listen to remote draw events
  useEffect(() => {
    const handleRemoteDrawAction = (action) => {
      if (action.type === 'undo') {
        replayHistory(action.history || []);
      } else {
        strokeHistoryRef.current.push(action);
        renderAction(action);
      }
    };

    socket.on('drawAction', handleRemoteDrawAction);
    return () => {
      socket.off('drawAction', handleRemoteDrawAction);
    };
  }, [renderAction, replayHistory]);

  // Convert mouse/touch event to normalized [0, 1] coordinates
  const getNormalizedCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    return { x, y };
  };

  // Drawing event handlers
  const handlePointerDown = (e) => {
    if (!isDrawer) return;
    const coords = getNormalizedCoords(e);

    // Flood fill
    if (tool === 'fill') {
      const fillAction = {
        type: 'fill',
        x: coords.x,
        y: coords.y,
        color
      };
      strokeHistoryRef.current.push(fillAction);
      renderAction(fillAction);
      socket.emit('drawAction', fillAction);
      return;
    }

    // Pen or Eraser
    isDrawingRef.current = true;
    currentPointsRef.current = [coords];

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = brushSize;
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.beginPath();
    ctx.moveTo(coords.x * canvas.width, coords.y * canvas.height);
  };

  const handlePointerMove = (e) => {
    if (!isDrawer || !isDrawingRef.current) return;
    const coords = getNormalizedCoords(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Draw segment locally immediately for zero-lag responsiveness
    ctx.lineTo(coords.x * canvas.width, coords.y * canvas.height);
    ctx.stroke();

    currentPointsRef.current.push(coords);

    // Stream points in micro-batches (every 3 points) to remote players
    if (currentPointsRef.current.length >= 3) {
      const chunkAction = {
        type: 'stroke',
        points: [...currentPointsRef.current],
        color,
        size: brushSize,
        isEraser: tool === 'eraser'
      };
      socket.emit('drawAction', chunkAction);
      strokeHistoryRef.current.push(chunkAction);
      // Keep last point as starting anchor for next segment
      currentPointsRef.current = [coords];
    }
  };

  const handlePointerUp = () => {
    if (!isDrawer || !isDrawingRef.current) return;
    isDrawingRef.current = false;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.closePath();
    ctx.restore();

    // Flush any remaining points
    if (currentPointsRef.current.length > 1) {
      const finalAction = {
        type: 'stroke',
        points: [...currentPointsRef.current],
        color,
        size: brushSize,
        isEraser: tool === 'eraser'
      };
      socket.emit('drawAction', finalAction);
      strokeHistoryRef.current.push(finalAction);
    }
    currentPointsRef.current = [];
  };

  // Undo button
  const handleUndo = () => {
    if (!isDrawer) return;
    socket.emit('drawAction', { type: 'undo' });
  };

  // Clear button
  const handleClear = () => {
    if (!isDrawer) return;
    const clearAction = { type: 'clear' };
    strokeHistoryRef.current = [];
    clearLocalCanvas();
    socket.emit('drawAction', clearAction);
  };

  const cursorClass = !isDrawer 
    ? 'cursor-default' 
    : tool === 'fill' 
      ? 'cursor-fill' 
      : tool === 'eraser' 
        ? 'cursor-eraser' 
        : 'cursor-pen';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: 0 }}>
      {/* Canvas Box */}
      <div 
        className="card"
        style={{ 
          position: 'relative', 
          width: '100%', 
          aspectRatio: '900 / 600', 
          maxHeight: '65vh',
          background: '#ffffff', 
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'inset 0 0 10px rgba(0,0,0,0.05)'
        }}
      >
        <canvas
          ref={canvasRef}
          className={cursorClass}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
          style={{
            width: '100%',
            height: '100%',
            touchAction: 'none',
            display: 'block'
          }}
        />

        {!isDrawer && (
          <div style={{
            position: 'absolute',
            bottom: '12px',
            right: '12px',
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            color: 'white',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 600,
            pointerEvents: 'none'
          }}>
            Spectating Canvas
          </div>
        )}
      </div>

      {/* Drawer Toolbar (Visible only when you are drawing) */}
      {isDrawer && (
        <div 
          className="card"
          style={{ 
            padding: '10px 16px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            gap: '12px', 
            flexWrap: 'wrap',
            background: '#ffffff'
          }}
        >
          {/* Tool selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => setTool('pen')}
              className={`btn ${tool === 'pen' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 12px', fontSize: '14px' }}
              title="Pen tool"
            >
              <Pencil size={18} />
              <span>Pen</span>
            </button>

            <button
              onClick={() => setTool('fill')}
              className={`btn ${tool === 'fill' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 12px', fontSize: '14px' }}
              title="Bucket Fill (Flood Fill)"
            >
              <PaintBucket size={18} />
              <span>Fill</span>
            </button>

            <button
              onClick={() => setTool('eraser')}
              className={`btn ${tool === 'eraser' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 12px', fontSize: '14px' }}
              title="Eraser"
            >
              <Eraser size={18} />
              <span>Eraser</span>
            </button>
          </div>

          {/* Brush Sizes */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {BRUSH_SIZES.map((b) => (
              <button
                key={b.size}
                onClick={() => setBrushSize(b.size)}
                className={`btn ${brushSize === b.size ? 'btn-primary' : 'btn-secondary'}`}
                style={{ 
                  padding: '6px 10px', 
                  fontSize: '12px',
                  borderRadius: '8px'
                }}
                title={`Brush Size: ${b.label}`}
              >
                <div style={{ 
                  width: `${Math.min(18, b.size + 4)}px`, 
                  height: `${Math.min(18, b.size + 4)}px`, 
                  borderRadius: '50%', 
                  background: brushSize === b.size ? 'white' : '#475569' 
                }} />
              </button>
            ))}
          </div>

          {/* Color Palette */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
            {COLOR_PALETTE.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setColor(c);
                  if (tool === 'eraser') setTool('pen');
                }}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: c,
                  border: color === c ? '3px solid #3b82f6' : '1px solid #cbd5e1',
                  boxShadow: color === c ? '0 0 8px rgba(59, 130, 246, 0.6)' : 'none',
                  cursor: 'pointer',
                  transform: color === c ? 'scale(1.2)' : 'scale(1)',
                  transition: 'transform 0.1s ease'
                }}
                title={c}
              />
            ))}

            {/* Custom Color Picker */}
            <input
              type="color"
              value={color}
              onChange={(e) => {
                setColor(e.target.value);
                if (tool === 'eraser') setTool('pen');
              }}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                border: 'none',
                cursor: 'pointer',
                padding: '0',
                background: 'transparent'
              }}
              title="Custom color"
            />
          </div>

          {/* Action buttons: Undo & Clear */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={handleUndo}
              className="btn btn-secondary"
              style={{ padding: '8px 12px', fontSize: '14px' }}
              title="Undo last stroke"
            >
              <RotateCcw size={16} />
              <span>Undo</span>
            </button>

            <button
              onClick={handleClear}
              className="btn btn-danger"
              style={{ padding: '8px 12px', fontSize: '14px' }}
              title="Clear Canvas"
            >
              <Trash2 size={16} />
              <span>Clear</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
