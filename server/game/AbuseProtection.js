/**
 * Rate limiter using sliding window
 */
export class RateLimiter {
  constructor(maxTokens = 5, windowMs = 2000) {
    this.maxTokens = maxTokens;
    this.windowMs = windowMs;
    this.buckets = new Map(); // socketId -> [timestamps]
  }

  isAllowed(clientId) {
    const now = Date.now();
    let timestamps = this.buckets.get(clientId) || [];
    
    // Remove timestamps outside window
    timestamps = timestamps.filter(t => now - t < this.windowMs);

    if (timestamps.length >= this.maxTokens) {
      this.buckets.set(clientId, timestamps);
      return false;
    }

    timestamps.push(now);
    this.buckets.set(clientId, timestamps);
    return true;
  }

  remove(clientId) {
    this.buckets.delete(clientId);
  }
}

/**
 * Chat abuse protection & sanitization
 */
export const ChatLimiter = new RateLimiter(3, 2000); // 3 messages per 2 sec

export function sanitizeChatMessage(message) {
  if (typeof message !== 'string') return null;
  const trimmed = message.trim();
  if (!trimmed || trimmed.length === 0) return null;
  
  // Enforce max length of 100 characters
  const truncated = trimmed.slice(0, 100);

  // Strip script tags / dangerous characters
  return truncated
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Drawing rate limiter: max 60 stroke batches per second
 */
export const StrokeLimiter = new RateLimiter(60, 1000);

/**
 * Validate and clamp drawing stroke packets
 */
export function validateStrokeAction(action) {
  if (!action || typeof action !== 'object') return null;

  if (action.type === 'clear' || action.type === 'undo') {
    return { type: action.type };
  }

  if (action.type === 'fill') {
    const x = Math.max(0, Math.min(1, Number(action.x) || 0));
    const y = Math.max(0, Math.min(1, Number(action.y) || 0));
    const color = typeof action.color === 'string' && action.color.startsWith('#')
      ? action.color.slice(0, 9)
      : '#000000';
    return { type: 'fill', x, y, color };
  }

  if (action.type === 'stroke') {
    if (!Array.isArray(action.points) || action.points.length === 0) return null;

    // Limit maximum points per single stroke chunk to 50
    const points = action.points.slice(0, 50).map(pt => ({
      x: Math.max(0, Math.min(1, Number(pt.x) || 0)),
      y: Math.max(0, Math.min(1, Number(pt.y) || 0))
    }));

    const size = Math.max(1, Math.min(50, Number(action.size) || 4));
    const color = typeof action.color === 'string' && action.color.startsWith('#')
      ? action.color.slice(0, 9)
      : '#000000';
    const isEraser = Boolean(action.isEraser);

    return {
      type: 'stroke',
      points,
      size,
      color,
      isEraser
    };
  }

  return null;
}
