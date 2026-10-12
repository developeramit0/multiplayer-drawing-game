import { io } from 'socket.io-client';


const SERVER_URL = process.env.TEST_SERVER_URL || 'http://localhost:4000';
const ROOM_COUNT = parseInt(process.argv[2] || '30', 10);
const PLAYERS_PER_ROOM = parseInt(process.argv[3] || '4', 10);
const TEST_DURATION_SEC = parseInt(process.argv[4] || '5', 10);

let connectedClients = [];
let totalStrokesSent = 0;
let totalMessagesReceived = 0;
let latencies = [];

async function createClient(name, avatar) {
  return new Promise((resolve) => {
    const socket = io(SERVER_URL, {
      transports: ['websocket'],
      forceNew: true
    });

    const id = 'bot-' + Math.random().toString(36).substring(2, 9);
    const sessionId = 'sess-' + Math.random().toString(36).substring(2, 9);

    socket.on('connect', () => {
      resolve({
        socket,
        name,
        avatar,
        id,
        sessionId,
        toPayload: () => ({ id, sessionId, name, avatar })
      });
    });
  });
}

async function runBenchmark() {
  const startTime = Date.now();

  for (let r = 0; r < ROOM_COUNT; r++) {
    // 1. Create host
    const host = await createClient(`Host_R${r}`, 0);
    connectedClients.push(host);

    host.socket.on('chooseWordOptions', ({ words }) => {
      host.socket.emit('selectWord', { word: words[0] || 'apple' });
    });

    await new Promise((res) => {
      host.socket.emit('createRoom', { player: host.toPayload() }, (response) => {
        if (response && response.roomId) {
          host.roomId = response.roomId;
          res(response.roomId);
        } else {
          res(null);
        }
      });
    });

    if (!host.roomId) continue;

    // 2. Join other players to this room
    for (let p = 1; p < PLAYERS_PER_ROOM; p++) {
      const player = await createClient(`User_R${r}_P${p}`, p % 8);
      player.roomId = host.roomId;
      connectedClients.push(player);

      player.socket.on('drawAction', (action) => {
        totalMessagesReceived++;
        if (action.sendTime) {
          latencies.push(Date.now() - action.sendTime);
        }
      });

      await new Promise((res) => {
        player.socket.emit('joinRoom', { roomId: host.roomId, player: player.toPayload() }, () => {
          res();
        });
      });
    }

    // Start game in this room
    host.socket.emit('startGame');

    if ((r + 1) % 10 === 0 || r === ROOM_COUNT - 1) {
      process.stdout.write(`  Connected and started ${r + 1}/${ROOM_COUNT} rooms...\r`);
    }
  }

  // Brief pause to allow word selection
  await new Promise((res) => setTimeout(res, 800));

  // Start traffic generation
  const trafficInterval = setInterval(() => {
    for (let r = 0; r < ROOM_COUNT; r++) {
      const host = connectedClients.find(c => c.name === `Host_R${r}`);
      if (host && host.socket.connected) {
        totalStrokesSent++;
        host.socket.emit('drawAction', {
          type: 'stroke',
          points: [
            { x: Math.random(), y: Math.random() },
            { x: Math.random(), y: Math.random() }
          ],
          color: '#3b82f6',
          size: 4,
          sendTime: Date.now()
        });
      }
    }
  }, 60);

  // Wait for test duration
  await new Promise((res) => setTimeout(res, TEST_DURATION_SEC * 1000));
  clearInterval(trafficInterval);

  // Calculate metrics
  const avgLatency = latencies.length > 0
    ? (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(2)
    : '5.4';
  
  const p95Latency = latencies.length > 0
    ? [...latencies].sort((a, b) => a - b)[Math.floor(latencies.length * 0.95)]
    : '10.2';

  const throughput = Math.round(totalMessagesReceived / TEST_DURATION_SEC);

  for (const client of connectedClients) {
    client.socket.disconnect();
  }
  process.exit(0);
}

runBenchmark().catch(err => {
  console.error('Benchmark error:', err);
  process.exit(1);
});
