function hexToRgba(hex) {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  const num = parseInt(c, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
    a: 255
  };
}

function colorsMatch(data, idx, target, tolerance = 32) {
  return (
    Math.abs(data[idx] - target.r) <= tolerance &&
    Math.abs(data[idx + 1] - target.g) <= tolerance &&
    Math.abs(data[idx + 2] - target.b) <= tolerance &&
    Math.abs(data[idx + 3] - target.a) <= tolerance
  );
}

export function performFloodFill(ctx, startX, startY, fillHex) {
  const canvas = ctx.canvas;
  const width = canvas.width;
  const height = canvas.height;

  startX = Math.floor(startX);
  startY = Math.floor(startY);

  if (startX < 0 || startX >= width || startY < 0 || startY >= height) return;

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  const startIndex = (startY * width + startX) * 4;
  const targetColor = {
    r: data[startIndex],
    g: data[startIndex + 1],
    b: data[startIndex + 2],
    a: data[startIndex + 3]
  };

  const fillColor = hexToRgba(fillHex);

  // If start color is already fill color, don't fill
  if (
    Math.abs(targetColor.r - fillColor.r) < 5 &&
    Math.abs(targetColor.g - fillColor.g) < 5 &&
    Math.abs(targetColor.b - fillColor.b) < 5 &&
    Math.abs(targetColor.a - fillColor.a) < 5
  ) {
    return;
  }

  // Linear queue for fast BFS
  const queue = [startX, startY];
  const visited = new Uint8Array(width * height);
  visited[startY * width + startX] = 1;

  let head = 0;

  while (head < queue.length) {
    const x = queue[head++];
    const y = queue[head++];
    const idx = (y * width + x) * 4;

    // Set pixel
    data[idx] = fillColor.r;
    data[idx + 1] = fillColor.g;
    data[idx + 2] = fillColor.b;
    data[idx + 3] = fillColor.a;

    // Check 4 neighbors
    const neighbors = [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1]
    ];

    for (let i = 0; i < 4; i++) {
      const nx = neighbors[i][0];
      const ny = neighbors[i][1];

      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nPos = ny * width + nx;
        if (!visited[nPos]) {
          const nIdx = nPos * 4;
          if (colorsMatch(data, nIdx, targetColor)) {
            visited[nPos] = 1;
            queue.push(nx, ny);
          }
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
}
